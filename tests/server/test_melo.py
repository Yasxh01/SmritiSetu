import pytest
import numpy as np
from server.ml.melo import compute_expected_probability, update_vectors_normalized, check_anxiety_relief_trigger, evaluate_session_telemetry
from server.ml.clinical_mapping import translate_to_clinical_telemetry
from server.ml.bridge import process_sync_batch

def test_bounded_expected_probability():
    E1 = compute_expected_probability(np.zeros(4), np.zeros(4))
    assert E1 == 0.5
    
    E2 = compute_expected_probability(np.ones(4)*100, np.ones(4)*100)
    assert 0.99 < E2 < 1.0
    
    E3 = compute_expected_probability(np.ones(4)*-100, np.ones(4)*100)
    assert 0.0 < E3 < 0.01

def test_normalized_vector_stability():
    theta = np.ones(4)
    d = np.ones(4)
    
    for i in range(100):
        theta, d = update_vectors_normalized(theta, d, i % 2 == 0)
        
    norm_theta = np.linalg.norm(theta)
    norm_d = np.linalg.norm(d)
    
    assert norm_theta < 100
    assert norm_d < 100

def test_anxiety_relief_trigger():
    assert check_anxiety_relief_trigger(0.5, 1000, 1000, 100) == True
    assert check_anxiety_relief_trigger(0.8, 1500, 1000, 100) == True
    assert check_anxiety_relief_trigger(0.8, 1000, 1000, 100) == False

def test_correct_tier_mapping_and_evaluate_session():
    state = {
        "rating": 699,
        "skill_vector": [1.0, 1.0, 1.0, 1.0],
        "baseline_latency": { "mean": 1000.0, "std": 100.0 },
        "rolling_accuracy": 0.8
    }
    telemetry = {
        "session_id": "s1",
        "game_id": "g1",
        "completion_time_ms": 1000,
        "error_count": 0,
        "hesitation_pause_ms": 0,
        "audio_voice_latency_ms": 0
    }
    
    res1 = evaluate_session_telemetry(state, telemetry)
    assert res1["tier"] == "Medium"
    assert res1["mElo_rating"] == 709
    assert res1["anxiety_relief_triggered"] == False
    
    telemetry["completion_time_ms"] = 2000
    res2 = evaluate_session_telemetry(state, telemetry)
    assert res2["anxiety_relief_triggered"] == True
    assert res2["tier"] == "Easy"
    assert res2["difficulty_vector"][0] >= 0.10

def test_cross_language_determinism():
    theta = np.array([1.0, 1.0, 1.0, 1.0])
    d = np.array([1.0, 1.0, 1.0, 1.0])
    new_theta, new_d = update_vectors_normalized(theta, d, True, 0.1)
    
    expected_theta = np.array([1.0004496, 1.0, 1.0004496, 1.0])
    assert np.allclose(new_theta, expected_theta, atol=1e-4)

def test_clinical_mapping_who_icf():
    telemetry = {
        "game_id": "smriti_mandir",
        "completion_time_ms": 1500,
        "error_count": 0,
        "hesitation_pause_ms": 100
    }
    result = translate_to_clinical_telemetry(telemetry, 720.0)
    assert result["resourceType"] == "Observation"
    assert result["code"]["coding"][0]["code"] == "72172-0"
    assert result["component"][0]["code"]["coding"][0]["code"] == "b1560"

def test_batch_sync_bridge():
    batches = [
        {
            "patient_id": "p1",
            "session_id": "s1",
            "game_id": "smriti_mandir",
            "completion_time_ms": 1200,
            "error_count": 0,
            "hesitation_pause_ms": 50
        }
    ]
    db = {}
    res = process_sync_batch(batches, db)
    assert len(res) == 1
    assert res[0]["patient_id"] == "p1"
    assert "melo_handoff" in res[0]
    assert "clinical_observation" in res[0]
