from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from server.ml import melo
from server.ml import clinical_mapping

router = APIRouter()

class MeloRequest(BaseModel):
    patient_skill_vector: List[float]
    task_difficulty_vector: List[float]
    error_count: int
    response_latency_ms: float
    baseline_mean_ms: float
    baseline_std_ms: float
    current_elo: int

@router.post("/evaluate-melo")
async def evaluate_melo(req: MeloRequest):
    current_state = {
        'skill_vector': req.patient_skill_vector,
        'task_difficulty': req.task_difficulty_vector,
        'baseline_latency': {
            'mean': req.baseline_mean_ms,
            'std': req.baseline_std_ms
        },
        'rolling_accuracy': 1.0 if req.error_count == 0 else max(0.0, 1.0 - req.error_count * 0.2),
        'rating': float(req.current_elo)
    }
    telemetry = {
        'completion_time_ms': req.response_latency_ms,
        'error_count': req.error_count
    }
    result = melo.evaluate_session_telemetry(current_state, telemetry)
    return {
        "mElo_rating": result["mElo_rating"],
        "skill_vector": result["skill_vector"],
        "difficulty_vector": result["difficulty_vector"],
        "tier": result["tier"],
        "anxiety_relief_triggered": result["anxiety_relief_triggered"]
    }

class ClinicalRequest(BaseModel):
    game_id: str
    completion_time_ms: float
    error_count: int
    hesitation_pause_ms: float
    audio_voice_latency_ms: float = 0.0

@router.post("/translate-clinical")
async def translate_clinical(req: ClinicalRequest):
    telemetry = {
        'game_id': req.game_id,
        'completion_time_ms': req.completion_time_ms,
        'error_count': req.error_count,
        'hesitation_pause_ms': req.hesitation_pause_ms,
        'audio_voice_latency_ms': req.audio_voice_latency_ms
    }
    melo_score = 800.0
    result = clinical_mapping.translate_to_clinical_telemetry(telemetry, melo_score)
    return result

@router.get("/speech-profiles")
async def get_speech_profiles():
    return {
        "as-IN": {
            "name": "Assamese",
            "voices": ["Sita", "Amit"],
            "presets": {
                "elderly": {
                    "rate": 0.85,
                    "pitch": 0.95
                }
            }
        },
        "brx-IN": {
            "name": "Bodo",
            "voices": ["Bikram", "Maya"],
            "presets": {
                "elderly": {
                    "rate": 0.85,
                    "pitch": 0.95
                }
            }
        }
    }

class SimulateRequest(BaseModel):
    skill_vector: List[float]
    difficulty_vector: List[float]
    current_elo: int
    response_latency_ms: float
    error_count: int
    game_id: str

@router.post("/simulate")
async def simulate_lab(req: SimulateRequest):
    current_state = {
        'skill_vector': req.skill_vector,
        'task_difficulty': req.difficulty_vector,
        'baseline_latency': {
            'mean': 2000.0,
            'std': 500.0
        },
        'rolling_accuracy': 1.0 if req.error_count == 0 else max(0.0, 1.0 - req.error_count * 0.2),
        'rating': float(req.current_elo)
    }
    telemetry = {
        'completion_time_ms': req.response_latency_ms,
        'error_count': req.error_count,
        'game_id': req.game_id,
        'hesitation_pause_ms': 150.0
    }
    
    import numpy as np
    theta = np.array(req.skill_vector, dtype=float)
    d = np.array(req.difficulty_vector, dtype=float)
    expected_prob = melo.compute_expected_probability(theta, d)
    
    melo_result = melo.evaluate_session_telemetry(current_state, telemetry)
    fhir_observation = clinical_mapping.translate_to_clinical_telemetry(telemetry, melo_result["mElo_rating"])
    
    return {
        "melo_rating": int(melo_result["mElo_rating"]),
        "tier": melo_result["tier"],
        "anxiety_relief_triggered": melo_result["anxiety_relief_triggered"],
        "expected_probability": expected_prob,
        "fhir_observation": fhir_observation
    }
