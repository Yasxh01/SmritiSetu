from typing import List, Dict, Any
import statistics

def calculate_chi(
    memory_score: float,
    executive_score: float,
    latency_score: float,
    adherence_score: float
) -> float:
    """
    Computes the Longitudinal Cognitive Health Index (CHI: 0-100).
    Formula: CHI = 0.35*S_memory + 0.30*S_executive + 0.20*S_latency + 0.15*S_adherence
    """
    chi = (0.35 * memory_score) + (0.30 * executive_score) + (0.20 * latency_score) + (0.15 * adherence_score)
    return max(0.0, min(100.0, chi))

def normalize_latency(latency_ms: float, baseline_mean: float, baseline_std: float) -> float:
    """
    Normalizes response latency against the baseline.
    Penalizes values where T_resp > mu_T + 2*sigma_T.
    Returns a score 0-100.
    """
    if baseline_std == 0:
        baseline_std = 1.0 # avoid division by zero
    
    z_score = (latency_ms - baseline_mean) / baseline_std
    
    if z_score <= 1.0:
        return 100.0
    elif z_score > 2.0:
        # Heavily penalize beyond 2 standard deviations
        penalty = min(100.0, (z_score - 2.0) * 20)
        return max(0.0, 70.0 - penalty)
    else:
        # Linear degradation between 1 and 2 standard deviations
        return 100.0 - ((z_score - 1.0) * 30.0)

def compute_rolling_metrics(chi_scores: List[float], window: int = 30) -> Dict[str, Any]:
    """
    Computes rolling metrics for CHI over a specified window.
    """
    if not chi_scores:
        return {"current_chi": 0.0, "mean": 0.0, "trend": "stable"}
    
    window_scores = chi_scores[-window:]
    current_chi = window_scores[-1]
    mean_chi = statistics.mean(window_scores)
    
    trend = "stable"
    if len(window_scores) >= 3:
        if current_chi < window_scores[-3] - 5:
            trend = "declining"
        elif current_chi > window_scores[-3] + 5:
            trend = "improving"
            
    return {
        "current_chi": round(current_chi, 2),
        "mean_chi": round(mean_chi, 2),
        "trend": trend,
        "history": [round(s, 2) for s in window_scores]
    }
