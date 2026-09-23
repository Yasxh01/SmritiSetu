import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app

@pytest.mark.asyncio
async def test_ml_evaluate_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "patient_skill_vector": [1.0, 1.0, 1.0, 1.0],
            "task_difficulty_vector": [1.0, 1.0, 1.0, 1.0],
            "error_count": 0,
            "response_latency_ms": 1100.0,
            "baseline_mean_ms": 1200.0,
            "baseline_std_ms": 200.0,
            "current_elo": 600
        }
        res = await ac.post("/api/v1/ml/evaluate-melo", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "mElo_rating" in data
        assert "difficulty_vector" in data
        assert "tier" in data
        assert data["anxiety_relief_triggered"] is False

@pytest.mark.asyncio
async def test_ml_translate_clinical_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "game_id": "Dainik Dinlipi",
            "completion_time_ms": 1500.0,
            "error_count": 1,
            "hesitation_pause_ms": 500.0
        }
        res = await ac.post("/api/v1/ml/translate-clinical", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["resourceType"] == "Observation"
        assert data["component"][0]["code"]["coding"][0]["code"] == "b1440"

@pytest.mark.asyncio
async def test_ml_speech_profiles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/ml/speech-profiles")
        assert res.status_code == 200
        data = res.json()
        assert "as-IN" in data
        assert "brx-IN" in data

@pytest.mark.asyncio
async def test_ml_simulate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "skill_vector": [1.0, 1.0, 1.0, 1.0],
            "difficulty_vector": [1.0, 1.0, 1.0, 1.0],
            "current_elo": 650,
            "response_latency_ms": 1400.0,
            "error_count": 0,
            "game_id": "Smriti Mandir"
        }
        res = await ac.post("/api/v1/ml/simulate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "expected_probability" in data
        assert "fhir_observation" in data

@pytest.mark.asyncio
async def test_ml_lab_page():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/ml-lab")
        assert res.status_code == 200
        assert "SmritiSetu NER" in res.text
