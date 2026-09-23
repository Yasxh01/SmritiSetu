import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
from server.db.session import engine
from server.db.models import Base, Patient
from datetime import datetime, timezone

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_reminders_lifecycle(client):
    pat_id = "pat-rem-test"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # 1. Create a Medication Reminder
    med_payload = {
        "patient_id": pat_id,
        "reminder_type": "medication",
        "title": "Donepezil 5mg",
        "description": "Post-breakfast memory medicine",
        "scheduled_at": now_iso,
        "recurrence": "daily"
    }
    res_med = await client.post(f"{settings.API_V1_STR}/reminders", json=med_payload)
    assert res_med.status_code == 201
    med_data = res_med.json()
    assert med_data["title"] == "Donepezil 5mg"
    assert med_data["status"] == "pending"
    rem_id = med_data["id"]
    
    # 2. Create a Hydration Reminder
    hyd_payload = {
        "patient_id": pat_id,
        "reminder_type": "hydration",
        "title": "Drink Warm Water (কুহুমীয়া পানী)",
        "scheduled_at": now_iso,
        "recurrence": "daily"
    }
    res_hyd = await client.post(f"{settings.API_V1_STR}/reminders", json=hyd_payload)
    assert res_hyd.status_code == 201
    
    # 3. List reminders
    res_list = await client.get(f"{settings.API_V1_STR}/reminders?patient_id={pat_id}")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 2
    
    # 4. Confirm the medication reminder
    res_confirm = await client.post(
        f"{settings.API_V1_STR}/reminders/{rem_id}/confirm",
        json={"caregiver_verified": True, "rxnorm_code": "310323"}
    )
    assert res_confirm.status_code == 200
    conf_data = res_confirm.json()
    assert conf_data["status"] == "completed"
    assert conf_data["caregiver_verified"] is True

@pytest.mark.asyncio
async def test_asha_cohort_and_checkin(client):
    # 1. Seed two patients into DB
    async with engine.begin() as conn:
        from server.db.session import async_session
    
    async with async_session() as s:
        p1 = Patient(
            id="pat-asha-1",
            name_alias="Bonti Aita",
            demographics_json={"age": 74},
            baseline_moca=20,
            preferred_lang="as"
        )
        p2 = Patient(
            id="pat-asha-2",
            name_alias="Bhaben Koka",
            demographics_json={"age": 80},
            baseline_moca=16,
            preferred_lang="as"
        )
        s.add_all([p1, p2])
        await s.commit()

    # 2. Query ASHA cohort dashboard
    res_cohort = await client.get(f"{settings.API_V1_STR}/asha/cohort")
    assert res_cohort.status_code == 200
    cohort = res_cohort.json()
    assert cohort["total_patients"] == 2
    assert len(cohort["patients"]) == 2

    # 3. Record field visit checkin by ASHA worker
    checkin_payload = {
        "asha_id": "asha-kamrup-04",
        "patient_id": "pat-asha-1",
        "moca_score": 21,
        "blood_pressure": "125/82",
        "adherence_rating": "good",
        "notes": "Patient calm, responded warmly to Assamese Tokari music activity."
    }
    res_checkin = await client.post(f"{settings.API_V1_STR}/asha/checkin", json=checkin_payload)
    assert res_checkin.status_code == 201
    assert res_checkin.json()["status"] == "success"
    
    # 4. List checkins
    res_logs = await client.get(f"{settings.API_V1_STR}/asha/checkins?patient_id=pat-asha-1")
    assert res_logs.status_code == 200
    assert len(res_logs.json()) == 1
    assert res_logs.json()[0]["blood_pressure"] == "125/82"
