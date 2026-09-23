from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

SKILL_INDEX = {
    "smriti_mandir": 0,    # visual_memory
    "dainik_dinlipi": 1,   # executive_planning
    "dhwani_tarang": 2,    # auditory_processing
    "dhyaan_kendra": 3     # semantic_fluency
}

DEFAULT_SKILL_VECTOR = [600.0, 600.0, 600.0, 600.0]
DEFAULT_DIFFICULTY_VECTOR = [1.0, 1.0, 1.0, 1.0]

def compute_expected_score(skill_rating: float, task_difficulty: float) -> float:
    """
    Computes Elo expected score: E = 1 / (1 + 10^((D - R) / 400))
    """
    exponent = (task_difficulty - skill_rating) / 400.0
    # Clamping exponent to prevent overflow
    exponent = max(-10.0, min(10.0, exponent))
    return 1.0 / (1.0 + (10.0 ** exponent))

def determine_tier(rating: float) -> str:
    if rating < 700.0:
        return "Easy"
    elif rating <= 1100.0:
        return "Medium"
    else:
        return "Hard"

def update_melo_vector(
    current_skill_vector: List[float],
    game_id: str,
    performance_score: float, # 0.0 to 1.0
    task_difficulty_rating: float = 600.0,
    k_factor: float = 32.0
) -> List[float]:
    """
    Updates the 4-dimensional skill vector:
    [visual_memory, executive_planning, auditory_processing, semantic_fluency]
    """
    idx = SKILL_INDEX.get(game_id, 0)
    updated_vector = list(current_skill_vector)
    
    current_rating = updated_vector[idx]
    expected = compute_expected_score(current_rating, task_difficulty_rating)
    delta = k_factor * (performance_score - expected)
    new_rating = max(100.0, current_rating + delta)
    updated_vector[idx] = round(new_rating, 2)
    
    return updated_vector

def evaluate_adaptive_difficulty(
    patient_id: str,
    game_id: str,
    completion_time_ms: int,
    error_count: int,
    hesitation_pause_ms: int,
    baseline_mean_latency: float = 1200.0,
    baseline_std_latency: float = 150.0,
    current_skill_vector: Optional[List[float]] = None
) -> Dict[str, Any]:
    """
    Calculates adaptive difficulty handoff matching schema.md.
    Evaluates anxiety-relief conditions and returns next task recommendations.
    """
    if not current_skill_vector or len(current_skill_vector) != 4:
        current_skill_vector = list(DEFAULT_SKILL_VECTOR)
        
    # Performance score: accuracy penalized by errors
    # 0 errors = 1.0, 1 error = 0.7, 2 errors = 0.4, 3+ = 0.1
    score = max(0.0, 1.0 - (error_count * 0.3))
    
    # Anxiety-relief triggers:
    # 1. Success rate S < 0.65
    # 2. Response latency > mu + 2*sigma
    latency_threshold = baseline_mean_latency + (2.0 * baseline_std_latency)
    anxiety_triggered = bool(score < 0.65 or completion_time_ms > latency_threshold or hesitation_pause_ms > 2000)
    
    # Update Elo vector
    skill_vector = update_melo_vector(current_skill_vector, game_id, score)
    overall_rating = sum(skill_vector) / 4.0
    
    if anxiety_triggered:
        # Fallback tier and lower target difficulty
        tier = "Easy"
        recommended_task = f"{game_id}_calm_step_1"
        difficulty_vector = [max(0.5, round(s / 800.0 * 0.7, 2)) for s in skill_vector]
    else:
        tier = determine_tier(overall_rating)
        difficulty_vector = [round(s / 600.0, 2) for s in skill_vector]
        recommended_task = f"{game_id}_{tier.lower()}_challenge"
        
    return {
        "patient_id": patient_id,
        "mElo_rating": round(overall_rating, 1),
        "tier": tier,
        "skill_vector": skill_vector,
        "difficulty_vector": difficulty_vector,
        "anxiety_relief_triggered": anxiety_triggered,
        "recommended_task_id": recommended_task,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
