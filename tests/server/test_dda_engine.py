import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app
from server.core.config import settings
from server.services.dda_engine import (
    compute_expected_score,
    update_melo_vector,
    determine_tier,
    evaluate_adaptive_difficulty
)

def test_expected_score_logic():
    # Equal rating and difficulty -> 0.50 expected score
    assert round(compute_expected_score(600.0, 600.0), 2) == 0.50
    # Higher rating than task difficulty -> > 0.50
    assert compute_expected_score(800.0, 600.0) > 0.50
    # Lower rating than task difficulty -> < 0.50
    assert compute_expected_score(400.0, 600.0) < 0.50

def test_tier_classification():
    assert determine_tier(550.0) == "Easy"
    assert determine_tier(700.0) == "Medium"
    assert determine_tier(1050.0) == "Medium"
    assert determine_tier(1200.0) == "Hard"

def test_update_melo_vector():
    initial = [600.0, 600.0, 600.0, 600.0]
    # Perfect score in smriti_mandir (visual_memory, index 0)
    updated = update_melo_vector(initial, "smriti_mandir", performance_score=1.0)
    assert updated[0] > initial[0]
    assert updated[1] == initial[1]

def test_anxiety_relief_on_latency_spike():
    result = evaluate_adaptive_difficulty(
        patient_id="pat-test-1",
        game_id="smriti_mandir",
        completion_time_ms=1800,  # > 1200 + 2*150 = 1500ms
        error_count=0,
        hesitation_pause_ms=50
    )
    assert result["anxiety_relief_triggered"] is True
    assert result["tier"] == "Easy"
    assert "calm" in result["recommended_task_id"]

def test_anxiety_relief_on_low_accuracy():
    result = evaluate_adaptive_difficulty(
        patient_id="pat-test-1",
        game_id="smriti_mandir",
        completion_time_ms=1100,
        error_count=3, # score = 0.1 < 0.65
        hesitation_pause_ms=50
    )
    assert result["anxiety_relief_triggered"] is True
    assert result["tier"] == "Easy"

@pytest.mark.asyncio
async def test_game_session_eval_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "patient_id": "ner-pat-78902-assamese",
            "game_id": "dhwani_tarang",
            "completion_time_ms": 1150,
            "error_count": 0,
            "hesitation_pause_ms": 100,
            "current_skill_vector": [650.0, 650.0, 650.0, 650.0]
        }
        res = await client.post(f"{settings.API_V1_STR}/games/evaluate-session", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["patient_id"] == "ner-pat-78902-assamese"
        assert "skill_vector" in data
        assert len(data["skill_vector"]) == 4
        assert data["anxiety_relief_triggered"] is False
