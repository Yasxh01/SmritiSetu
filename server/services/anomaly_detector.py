from typing import List
from dataclasses import dataclass

@dataclass
class AnomalyIncident:
    patient_id: str
    anomaly_type: str
    severity: str  # 'WARNING' | 'CRITICAL'
    metric_delta: float
    evidence_summary: str

def detect_rapid_cognitive_drop(patient_id: str, daily_chi_scores: List[float]) -> List[AnomalyIncident]:
    """
    Day 21 Rapid Decline Anomaly:
    Fires when rolling CHI declines by >15% within a 72-hour rolling window.
    """
    incidents = []
    if len(daily_chi_scores) < 3:
        return incidents
    
    for i in range(2, len(daily_chi_scores)):
        window = daily_chi_scores[i-2:i+1]
        start_chi = window[0]
        end_chi = window[-1]
        
        if start_chi > 0:
            drop_percentage = ((start_chi - end_chi) / start_chi) * 100
            if drop_percentage > 15.0:
                incidents.append(
                    AnomalyIncident(
                        patient_id=patient_id,
                        anomaly_type="RAPID_COGNITIVE_DECLINE",
                        severity="CRITICAL",
                        metric_delta=-drop_percentage,
                        evidence_summary=f"CHI dropped {drop_percentage:.1f}% from {start_chi:.1f} to {end_chi:.1f} in 72 hours."
                    )
                )
    return incidents

def detect_latency_spike(patient_id: str, latencies: List[float], baseline_mean: float, baseline_std: float) -> List[AnomalyIncident]:
    """
    Fires when rolling 7-day reaction time mean exceeds baseline by >2 sigma_T.
    """
    incidents = []
    if len(latencies) < 7:
        return incidents
    
    for i in range(6, len(latencies)):
        window = latencies[i-6:i+1]
        mean_latency = sum(window) / 7.0
        
        if baseline_std > 0 and mean_latency > baseline_mean + (2 * baseline_std):
            incidents.append(
                AnomalyIncident(
                    patient_id=patient_id,
                    anomaly_type="LATENCY_SPIKE",
                    severity="WARNING",
                    metric_delta=mean_latency - baseline_mean,
                    evidence_summary=f"7-day latency mean ({mean_latency:.1f}ms) exceeds baseline by >2σ."
                )
            )
    return incidents

def detect_non_adherence(patient_id: str, daily_adherence: List[bool]) -> List[AnomalyIncident]:
    """
    Fires when consecutive scheduled doses are missed over 24 hours.
    Assuming daily_adherence is a list of bools indicating dose taken.
    """
    incidents = []
    for i in range(1, len(daily_adherence)):
        if not daily_adherence[i-1] and not daily_adherence[i]:
            incidents.append(
                AnomalyIncident(
                    patient_id=patient_id,
                    anomaly_type="MEDICATION_NON_ADHERENCE",
                    severity="WARNING",
                    metric_delta=0.0,
                    evidence_summary="Consecutive scheduled doses missed over 24 hours."
                )
            )
    return incidents
