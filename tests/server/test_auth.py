import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
from server.db.session import engine
from server.db.models import Base

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
async def test_request_otp(client):
    payload = {"phone_number": "+919876543210"}
    response = await client.post(f"{settings.API_V1_STR}/auth/request-otp", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "OTP successfully sent" in data["message"]

@pytest.mark.asyncio
async def test_verify_otp_success_and_jwt(client):
    phone = "+919876543210"
    # 1. Request OTP
    await client.post(f"{settings.API_V1_STR}/auth/request-otp", json={"phone_number": phone})
    
    # 2. Verify with valid sandbox OTP
    verify_payload = {
        "phone_number": phone,
        "otp": "123456",
        "full_name": "Rongmon Barua",
        "role": "caregiver",
        "assigned_region": "Kamrup, Assam"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/verify-otp", json=verify_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["full_name"] == "Rongmon Barua"
    assert data["user"]["role"] == "caregiver"
    
    # 3. Use Token on /auth/me
    token = data["access_token"]
    me_res = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["phone_number"] == phone
    assert me_data["role"] == "caregiver"

@pytest.mark.asyncio
async def test_verify_otp_invalid(client):
    verify_payload = {
        "phone_number": "+919876543210",
        "otp": "000000"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/verify-otp", json=verify_payload)
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]

@pytest.mark.asyncio
async def test_edge_token_pairing(client):
    payload = {
        "patient_id": "ner-pat-78902-assamese",
        "device_id": "samsung-tab-rural-01"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/edge-token", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "edge_token" in data
    assert data["patient_id"] == "ner-pat-78902-assamese"
    assert data["expires_in_days"] == 90
