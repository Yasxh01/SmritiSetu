import numpy as np
from typing import Dict, Any, Tuple

def compute_expected_probability(theta: np.ndarray, d: np.ndarray) -> float:
    dot_product = float(np.dot(theta, d))
    # Clamp to avoid overflow
    dot_product = max(-35.0, min(35.0, dot_product))
    return float(1.0 / (1.0 + np.exp(-dot_product)))

def update_vectors_normalized(theta: np.ndarray, d: np.ndarray, success: bool, eta: float = 0.1) -> Tuple[np.ndarray, np.ndarray]:
    E = compute_expected_probability(theta, d)
    S = 1.0 if success else 0.0
    diff = S - E
    
    norm_factor = float(np.sum(theta**2) + np.sum(d**2))
    if norm_factor == 0:
        norm_factor = 1.0
        
    omega = np.array([
        [0, 1, 0, 0],
        [-1, 0, 0, 0],
        [0, 0, 0, 1],
        [0, 0, -1, 0]
    ])
    
    omega_theta = np.dot(omega, theta)
    omega_d = np.dot(omega, d)
    
    new_theta = theta + (eta * diff * (d + omega_d)) / norm_factor
    new_d = d - (eta * diff * (theta + omega_theta)) / norm_factor
    
    return new_theta, new_d

def check_anxiety_relief_trigger(rolling_accuracy: float, response_latency_ms: float, baseline_mean: float, baseline_std: float) -> bool:
    if rolling_accuracy < 0.65:
        return True
    if response_latency_ms > (baseline_mean + 2 * baseline_std):
        return True
    return False

def get_tier(rating: float) -> str:
    if rating < 700:
        return "Easy"
    if rating < 900:
        return "Medium"
    return "Hard"

def drop_tier(tier: str) -> str:
    if tier == "Hard":
        return "Medium"
    if tier == "Medium":
        return "Easy"
    return "Easy"

def evaluate_session_telemetry(current_state: Dict[str, Any], telemetry: Dict[str, Any]) -> Dict[str, Any]:
    mean = current_state['baseline_latency']['mean']
    std = current_state['baseline_latency']['std']
    
    latency = telemetry.get('completion_time_ms', 0)
    is_latency_acceptable = latency <= (mean + 2 * std)
    success = (telemetry.get('error_count', 1) == 0 and is_latency_acceptable)
    
    anxiety_triggered = check_anxiety_relief_trigger(
        current_state.get('rolling_accuracy', 0.8),
        latency,
        mean,
        std
    )
    
    theta = np.array(current_state.get('skill_vector', [1.0, 1.0, 1.0, 1.0]), dtype=float)
    d = np.array(current_state.get('task_difficulty', [1.0, 1.0, 1.0, 1.0]), dtype=float)
    
    new_theta, new_d = update_vectors_normalized(theta, d, success, 0.1)
    
    new_rating = current_state['rating'] + (10.0 if success else -10.0)
    new_rating = float(np.clip(new_rating, 100.0, 1500.0))
    tier = get_tier(new_rating)
    
    if anxiety_triggered:
        tier = drop_tier(tier)
        # Force negative difficulty step-down (\lambda_slope < 0) with clamping (NFR-ML-02)
        new_d = np.clip(new_d - np.abs(new_d) * 0.1 - 0.1, 0.10, 5.00)
    else:
        new_d = np.clip(new_d, 0.10, 5.00)
        
    return {
        "mElo_rating": float(new_rating),
        "skill_vector": new_theta.tolist(),
        "tier": tier,
        "difficulty_vector": new_d.tolist(),
        "anxiety_relief_triggered": anxiety_triggered
    }
