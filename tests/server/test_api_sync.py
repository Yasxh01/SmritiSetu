import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
import base64
import json
import zlib
from datetime import datetime, timezone

from server.db.session import engine
from server.db.models import Base

import pytest_asyncio

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
async def test_sync_delta_success(client):
    mutations = {
        "mutations": [
            {
                "id": "mut-1",
                "mutation_type": "INSERT",
                "payload_blob": base64.b64encode(json.dumps({
                    "id": "event-1",
                    "patient_id": "pat-123",
                    "session_id": "sess-1",
                    "game_id": "smriti_mandir",
                    "completion_time_ms": 1200,
                    "error_count": 0,
                    "hesitation_pause_ms": 50,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }).encode()).decode()
            }
        ]
    }
    
    compressed = base64.b64encode(zlib.compress(json.dumps(mutations).encode())).decode()

    payload = {
        "client_id": "client-1",
        "client_timestamp": datetime.now(timezone.utc).isoformat(),
        "vector_clock": {"client-1": 1},
        "compressed_payload": compressed,
        "mutations_count": 1
    }

    response = await client.post(f"{settings.API_V1_STR}/sync/delta", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["sync_status"] == "ACK"
    assert "mut-1" in data["applied_mutations"]

@pytest.mark.asyncio
async def test_sync_delta_oversized(client):
    large_payload = "a" * (settings.MAX_DELTA_PAYLOAD_BYTES + 1)
    
    payload = {
        "client_id": "client-1",
        "client_timestamp": datetime.now(timezone.utc).isoformat(),
        "vector_clock": {"client-1": 1},
        "compressed_payload": large_payload,
        "mutations_count": 1
    }

    response = await client.post(f"{settings.API_V1_STR}/sync/delta", json=payload)
    assert response.status_code == 413

@pytest.mark.asyncio
async def test_get_chi(client):
    response = await client.get(f"{settings.API_V1_STR}/patients/pat-123/chi")
    assert response.status_code == 200
    data = response.json()
    assert "chi_score_current" in data
    assert "chi_trendline_30d" in data

def test_fhir_serialization():
    from server.schemas.fhir import FHIRObservation, FHIRCodeableConcept, FHIRCoding, FHIRReference, FHIRQuantity
    
    obs = FHIRObservation(
        id="obs-1",
        status="final",
        code=FHIRCodeableConcept(coding=[FHIRCoding(system="http://loinc.org", code="72172-0", display="Cognitive status")]),
        subject=FHIRReference(reference="Patient/pat-123"),
        valueQuantity=FHIRQuantity(value=85.0, unit="score")
    )
    
    dumped = obs.model_dump()
    assert dumped["resourceType"] == "Observation"
    assert dumped["code"]["coding"][0]["code"] == "72172-0"
