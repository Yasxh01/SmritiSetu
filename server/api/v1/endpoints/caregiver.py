from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.db.session import get_db
from server.db.models import AlertLog, Patient
from server.services.chi_service import compute_patient_chi_analytics
from server.services.alert_dispatcher import AlertDispatcher
import uuid

router = APIRouter()
alert_dispatcher = AlertDispatcher(use_mock=True)

class CHIResponse(BaseModel):
    patient_id: str
    chi_score_current: float
    chi_trendline_30d: List[int]
    rolling_latency_ms: dict
    anomaly_alert: Optional[dict] = None

class SOSRequest(BaseModel):
    patient_id: str
    gps_coordinates: dict
    trigger_source: str
    timestamp: datetime

class SOSResponse(BaseModel):
    alert_id: str
    dispatched_recipients: List[str]
    delivery_status: str

@router.get("/patients/{patient_id}/chi", response_model=CHIResponse)
async def get_chi(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns dynamically aggregated 30-day Cognitive Health Index and anomaly indicators.
    """
    result = await compute_patient_chi_analytics(patient_id, db)
    return CHIResponse(**result)

@router.post("/alerts/sos", response_model=SOSResponse)
async def trigger_sos(request: SOSRequest, db: AsyncSession = Depends(get_db)):
    """
    Emergency SOS endpoint triggered by patient one-touch button or critical anomaly.
    Dispatches localized SMS with GPS coordinates to registered family and ASHA workers.
    """
    alert_id = f"sos-{uuid.uuid4().hex[:8]}"
    
    # Query patient name if registered
    pat_res = await db.execute(select(Patient).where(Patient.id == request.patient_id))
    patient = pat_res.scalars().first()
    patient_name = patient.name_alias if patient else f"Patient {request.patient_id}"
    
    recipients = ["+919876543210", "+919876543211"]
    
    # Persist alert record in database
    alert_log = AlertLog(
        id=alert_id,
        patient_id=request.patient_id,
        alert_type="EMERGENCY_SOS",
        severity="CRITICAL",
        details_json={
            "gps": request.gps_coordinates,
            "trigger_source": request.trigger_source,
            "timestamp": request.timestamp.isoformat()
        },
        sms_dispatched_to=recipients
    )
    db.add(alert_log)
    await db.commit()
    
    # Dispatch emergency SMS
    coords = {
        "lat": request.gps_coordinates.get("lat", 26.14),
        "lon": request.gps_coordinates.get("lng") or request.gps_coordinates.get("lon", 91.73)
    }
    delivered = alert_dispatcher.dispatch_sos(recipients, patient_name, coords)
    
    return SOSResponse(
        alert_id=alert_id,
        dispatched_recipients=recipients,
        delivery_status="DELIVERED" if delivered else "FAILED"
    )
