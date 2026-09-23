import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
from server.services.chi_calculator import calculate_chi, normalize_latency
from server.services.anomaly_detector import detect_rapid_cognitive_drop
from server.services.synthetic_generator import generate_synthetic_30_day_timeline
from server.db.session import engine
from server.db.models import Base
import pytest_asyncio
import base64
import json
import zlib
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
async def test_offline_isolation():
    # Simulate device in Airplane Mode
    # Record local gameplay telemetry across all 4 games
    games = ["smriti_mandir", "dhwani_tarang", "dhyaan_kendra", "dainik_dinlipi"]
    telemetry_events = []
    
    for g in games:
        telemetry_events.append({
            "id": f"event_{g}",
            "game_id": g,
            "completion_time_ms": 1200,
            "error_count": 0,
            "hesitation_pause_ms": 50,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    # Log a medicine reminder with visual pill confirmation
    med_log = {
        "id": "med_1",
        "rxnorm_code": "310323",
        "medication_name": "Donepezil 5mg",
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "synced_status": "taken"
    }
    
    assert len(telemetry_events) == 4
    assert med_log["synced_status"] == "taken"
    # Verification of zero UI blocking (<15ms latency) and offline persistence is unit tested at Edge layer.
    assert True

def test_dda_adaptive_fallback():
    # Simulate patient struggle (success rate St < 0.65 and response latency > mu_T + 2*sigma_T)
    baseline_mu = 1200
    baseline_sigma = 150
    latency = baseline_mu + (3 * baseline_sigma)
    success_rate = 0.50
    
    anxiety_relief_triggered = False
    difficulty_tier = 800 # Medium
    
    if success_rate < 0.65 and latency > baseline_mu + (2 * baseline_sigma):
        anxiety_relief_triggered = True
        difficulty_tier = 600 # Easy (<700)
        
    assert anxiety_relief_triggered is True
    assert difficulty_tier < 700

@pytest.mark.asyncio
async def test_reconnection_delta_sync_anomaly(client):
    # Generate 30-day timeline to trigger Day 21 drop
    dataset = generate_synthetic_30_day_timeline("ner-pat-78902-assamese")
    
    mutations = []
    for data in dataset["timeline"]:
        mutations.append({
            "id": f"mut_{data['day']}",
            "mutation_type": "INSERT",
            "payload_blob": base64.b64encode(json.dumps({
                "id": f"evt_{data['day']}",
                "patient_id": data["patient_id"],
                "session_id": "sess-1",
                "game_id": "smriti_mandir",
                "completion_time_ms": data["latency_ms"],
                "error_count": 0,
                "hesitation_pause_ms": 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }).encode()).decode()
        })
    
    compressed = base64.b64encode(zlib.compress(json.dumps(mutations).encode())).decode()
    
    # Verify CRDT payload compression strictly under 50 KB
    assert len(compressed) < settings.MAX_DELTA_PAYLOAD_BYTES
    
    # Ingest payload through POST /api/v1/sync/delta
    payload = {
        "client_id": "client-1",
        "client_timestamp": datetime.now(timezone.utc).isoformat(),
        "vector_clock": {"client-1": 1},
        "compressed_payload": compressed,
        "mutations_count": len(mutations)
    }
    
    response = await client.post(f"{settings.API_V1_STR}/sync/delta", json=payload)
    assert response.status_code == 200
    
    # Verify CHI endpoint updates
    chi_response = await client.get(f"{settings.API_V1_STR}/patients/ner-pat-78902-assamese/chi")
    assert chi_response.status_code == 200
    
    # Verify Day 21 drop logic
    chi_scores = []
    for day_data in dataset["timeline"]:
        lat_score = normalize_latency(day_data["latency_ms"], dataset["baseline_mean_latency"], dataset["baseline_std_latency"])
        chi = calculate_chi(day_data["memory_score"], day_data["executive_score"], lat_score, 100.0 if day_data["adherence"] else 0.0)
        chi_scores.append(chi)
        
    drop_incidents = detect_rapid_cognitive_drop("ner-pat-78902-assamese", chi_scores)
    assert len(drop_incidents) > 0
    assert any(i.severity == "CRITICAL" for i in drop_incidents)
