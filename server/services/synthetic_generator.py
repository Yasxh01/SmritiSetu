import random
from typing import Dict, Any

def generate_synthetic_30_day_timeline(patient_id: str) -> Dict[str, Any]:
    """
    Generates realistic 30-day longitudinal FHIR synthetic patient datasets.
    """
    timeline = []
    baseline_mean_latency = 1200.0
    baseline_std_latency = 150.0
    
    for day in range(1, 31):
        if 1 <= day <= 20:
            # Days 1-20: Stable cognitive baseline (CHI ~70-75)
            memory_score = random.uniform(70, 80)
            executive_score = random.uniform(70, 80)
            latency_ms = random.gauss(baseline_mean_latency, baseline_std_latency)
            adherence = True
        elif 21 <= day <= 23:
            # Days 21-23: Simulated rapid memory drop and latency spike
            memory_score = random.uniform(30, 45)
            executive_score = random.uniform(40, 55)
            latency_ms = baseline_mean_latency + (3 * baseline_std_latency) + random.uniform(0, 500)
            adherence = random.choice([True, False])
        else:
            # Days 24-30: Stabilization/intervention post-alert
            memory_score = random.uniform(65, 75)
            executive_score = random.uniform(65, 75)
            latency_ms = baseline_mean_latency + baseline_std_latency
            adherence = True
            
        timeline.append({
            "day": day,
            "patient_id": patient_id,
            "memory_score": memory_score,
            "executive_score": executive_score,
            "latency_ms": latency_ms,
            "adherence": adherence
        })
        
    return {
        "patient_id": patient_id,
        "baseline_mean_latency": baseline_mean_latency,
        "baseline_std_latency": baseline_std_latency,
        "timeline": timeline
    }
