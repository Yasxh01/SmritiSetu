from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.db.models import TelemetryObservation, MedicationAdherence, AlertLog, Patient
from server.services.chi_calculator import calculate_chi, normalize_latency, compute_rolling_metrics
from server.services.anomaly_detector import detect_rapid_cognitive_drop, detect_latency_spike, detect_non_adherence
from server.services.alert_dispatcher import AlertDispatcher
import statistics
import uuid

alert_dispatcher = AlertDispatcher(use_mock=True)

def to_utc(dt: Optional[datetime]) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

async def compute_patient_chi_analytics(patient_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Dynamically computes longitudinal 30-day Cognitive Health Index (CHI) from database records.
    Detects anomalies and triggers automated caregiver/ASHA alerts.
    """
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=30)
    
    # 1. Fetch patient profile for baseline
    pat_res = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = pat_res.scalars().first()
    
    # 2. Fetch observations for patient
    obs_res = await db.execute(
        select(TelemetryObservation)
        .where(TelemetryObservation.patient_id == patient_id)
        .order_by(TelemetryObservation.recorded_at.asc())
    )
    all_raw_observations = obs_res.scalars().all()
    observations = [o for o in all_raw_observations if to_utc(o.recorded_at) >= start_date - timedelta(hours=1)]
    
    # 3. Fetch medication adherence records
    med_res = await db.execute(
        select(MedicationAdherence)
        .where(MedicationAdherence.patient_id == patient_id)
        .order_by(MedicationAdherence.scheduled_at.asc())
    )
    all_raw_medications = med_res.scalars().all()
    medications = [m for m in all_raw_medications if to_utc(m.scheduled_at) >= start_date - timedelta(hours=1)]
    
    # If no recorded observations, return default healthy/baseline response
    if not observations:
        default_trend = [80] * 30
        return {
            "patient_id": patient_id,
            "chi_score_current": 80.0,
            "chi_trendline_30d": default_trend,
            "rolling_latency_ms": {"mean": 1200.0, "std_dev": 150.0},
            "anomaly_alert": None
        }
        
    # Group observations and adherence into daily buckets
    daily_buckets: Dict[int, Dict[str, Any]] = {
        d: {"memory_errors": [], "latencies": [], "hesitations": [], "med_taken": []}
        for d in range(30)
    }
    
    all_latencies = []
    
    for obs in observations:
        obs_dt = to_utc(obs.recorded_at)
        day_idx = min(29, max(0, (obs_dt - start_date).days))
        daily_buckets[day_idx]["memory_errors"].append(obs.error_count)
        daily_buckets[day_idx]["latencies"].append(obs.completion_time_ms)
        daily_buckets[day_idx]["hesitations"].append(obs.hesitation_pause_ms)
        all_latencies.append(obs.completion_time_ms)
        
    for med in medications:
        med_dt = to_utc(med.scheduled_at)
        day_idx = min(29, max(0, (med_dt - start_date).days))
        daily_buckets[day_idx]["med_taken"].append(med.status == "taken")
        
    # Baseline stats
    baseline_mean = statistics.mean(all_latencies) if all_latencies else 1200.0
    baseline_std = statistics.stdev(all_latencies) if len(all_latencies) > 1 else 150.0
    
    chi_trendline: List[int] = []
    latencies_for_anomaly = []
    
    for day in range(30):
        bucket = daily_buckets[day]
        if bucket["latencies"]:
            avg_errors = statistics.mean(bucket["memory_errors"])
            avg_latency = statistics.mean(bucket["latencies"])
            latencies_for_anomaly.append(avg_latency)
            
            # Scores (0-100)
            mem_score = max(0.0, 100.0 - (avg_errors * 25.0))
            exec_score = max(0.0, 100.0 - (avg_errors * 20.0))
            lat_score = normalize_latency(avg_latency, baseline_mean, baseline_std)
            
            meds = bucket["med_taken"]
            adh_score = (sum(meds) / len(meds) * 100.0) if meds else 100.0
            
            day_chi = calculate_chi(mem_score, exec_score, lat_score, adh_score)
            chi_trendline.append(int(round(day_chi)))
        else:
            # Carry forward previous day's CHI or start with baseline
            prev_val = chi_trendline[-1] if chi_trendline else 80
            chi_trendline.append(prev_val)
            latencies_for_anomaly.append(baseline_mean)
            
    current_chi = float(chi_trendline[-1])
    
    # 4. Evaluate anomalies
    drop_incidents = detect_rapid_cognitive_drop(patient_id, [float(c) for c in chi_trendline])
    spike_incidents = detect_latency_spike(patient_id, latencies_for_anomaly, baseline_mean, baseline_std)
    
    anomaly_payload: Optional[Dict[str, Any]] = None
    
    critical_incident = next((i for i in drop_incidents if i.severity == "CRITICAL"), None)
    if not critical_incident and drop_incidents:
        critical_incident = drop_incidents[0]
    elif not critical_incident and spike_incidents:
        critical_incident = spike_incidents[0]
        
    if critical_incident:
        anomaly_payload = {
            "anomaly_type": critical_incident.anomaly_type,
            "severity": critical_incident.severity,
            "trigger_timestamp": now.isoformat(),
            "evidence_summary": critical_incident.evidence_summary
        }
        
        # Persist alert record to DB
        try:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            alert_log = AlertLog(
                id=alert_id,
                patient_id=patient_id,
                alert_type=critical_incident.anomaly_type,
                severity=critical_incident.severity,
                details_json={
                    "evidence": critical_incident.evidence_summary,
                    "current_chi": current_chi
                },
                sms_dispatched_to=["+919876543210"]
            )
            db.add(alert_log)
            await db.commit()
        except Exception:
            pass # Avoid disrupting analytics read
        
        # Trigger SMS dispatch
        patient_name = patient.name_alias if patient else "Patient"
        lang = patient.preferred_lang if patient else "as"
        alert_dispatcher.dispatch_sms(
            ["+919876543210"],
            f"{patient_name} shows cognitive anomaly: {critical_incident.evidence_summary}",
            language=lang
        )

    return {
        "patient_id": patient_id,
        "chi_score_current": current_chi,
        "chi_trendline_30d": chi_trendline,
        "rolling_latency_ms": {
            "mean": round(baseline_mean, 1),
            "std_dev": round(baseline_std, 1)
        },
        "anomaly_alert": anomaly_payload
    }
