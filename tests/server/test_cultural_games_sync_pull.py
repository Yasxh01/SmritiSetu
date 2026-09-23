import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
from server.db.session import engine
from server.db.models import Base, Reminder
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
async def test_cultural_catalog_and_locales(client):
    # 1. Test game catalog
    res_cat = await client.get(f"{settings.API_V1_STR}/games/catalog")
    assert res_cat.status_code == 200
    catalog = res_cat.json()["catalog"]
    assert len(catalog) == 4
    game_ids = [g["id"] for g in catalog]
    assert "smriti_mandir" in game_ids
    assert "dhwani_tarang" in game_ids
    assert "dhyaan_kendra" in game_ids
    assert "dainik_dinlipi" in game_ids

    # 2. Test locales
    res_loc = await client.get(f"{settings.API_V1_STR}/games/locales")
    assert res_loc.status_code == 200
    locales = res_loc.json()
    assert "as" in locales
    assert "bn" in locales
    assert "brx" in locales
    assert "en" in locales
    assert "নমস্কাৰ" in locales["as"]["welcome"]
    assert "खुलुमबाय" in locales["brx"]["welcome"]

@pytest.mark.asyncio
async def test_sync_pull_downstream(client):
    # Seed a pending reminder
    from server.db.session import async_session
    async with async_session() as s:
        r = Reminder(
            id="rem-pull-01",
            patient_id="pat-sync-pull",
            reminder_type="hydration",
            title="Drink Lemon Water",
            scheduled_at=datetime.now(timezone.utc),
            status="pending"
        )
        s.add(r)
        await s.commit()

    # Pull downstream updates for this patient
    res_pull = await client.get(f"{settings.API_V1_STR}/sync/pull?patient_id=pat-sync-pull")
    assert res_pull.status_code == 200
    data = res_pull.json()
    assert data["patient_id"] == "pat-sync-pull"
    assert len(data["reminders"]) == 1
    assert data["reminders"][0]["title"] == "Drink Lemon Water"

@pytest.mark.asyncio
async def test_sos_alert_dispatch(client):
    sos_payload = {
        "patient_id": "ner-pat-78902-assamese",
        "gps_coordinates": {"lat": 26.1433, "lng": 91.7898},
        "trigger_source": "patient_one_touch",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    res_sos = await client.post(f"{settings.API_V1_STR}/alerts/sos", json=sos_payload)
    assert res_sos.status_code == 200
    data = res_sos.json()
    assert data["delivery_status"] == "DELIVERED"
    assert len(data["dispatched_recipients"]) >= 1
    assert "sos-" in data["alert_id"]
