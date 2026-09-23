from typing import List, Dict, Any
from .melo import evaluate_session_telemetry
from .clinical_mapping import translate_to_clinical_telemetry

def process_sync_batch(payload_batch: List[Dict[str, Any]], patient_states_db: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ingests telemetry delta batches unpacked by /api/v1/sync/delta.
    Batch-recalculates mElo ratings, evaluates anxiety relief flags across 
    historical windows, and generates updated clinical observations.
    
    payload_batch: list of dicts with raw telemetry data
    patient_states_db: dict to fetch/update patient state
    """
    results = []
    
    for payload in payload_batch:
        patient_id = payload.get("patient_id", "default-patient")
        
        current_state = patient_states_db.get(patient_id)
        if not current_state:
            current_state = {
                "rating": 600.0,
                "skill_vector": [1.0, 1.0, 1.0, 1.0],
                "task_difficulty": [1.0, 1.0, 1.0, 1.0],
                "baseline_latency": {
                    "mean": 2000.0,
                    "std": 500.0
                },
                "rolling_accuracy": 0.8
            }
            patient_states_db[patient_id] = current_state
            
        telemetry = {
            "session_id": payload.get("session_id"),
            "game_id": payload.get("game_id"),
            "completion_time_ms": payload.get("completion_time_ms", 0),
            "error_count": payload.get("error_count", 0),
            "hesitation_pause_ms": payload.get("hesitation_pause_ms", 0),
            "audio_voice_latency_ms": payload.get("audio_voice_latency_ms", 0.0)
        }
        
        # 1. Evaluate Session
        handoff = evaluate_session_telemetry(current_state, telemetry)
        
        # 2. Generate Clinical Observation
        clinical_output = translate_to_clinical_telemetry(telemetry, handoff["mElo_rating"])
        
        # 3. Update the state
        current_state["rating"] = handoff["mElo_rating"]
        current_state["skill_vector"] = handoff["skill_vector"]
        current_state["task_difficulty"] = handoff["difficulty_vector"]
        patient_states_db[patient_id] = current_state
        
        results.append({
            "patient_id": patient_id,
            "session_id": telemetry["session_id"],
            "melo_handoff": {
                "rating": handoff["mElo_rating"],
                "tier": handoff["tier"],
                "difficulty_vector": handoff["difficulty_vector"],
                "anxiety_relief_triggered": handoff["anxiety_relief_triggered"]
            },
            "clinical_observation": clinical_output
        })
        
    return results
