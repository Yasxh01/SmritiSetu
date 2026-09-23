from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.db.session import get_db
from server.db.models import Patient, AshaCheckin, AlertLog
from server.services.chi_service import compute_patient_chi_analytics
import uuid

router = APIRouter()

class AshaCheckinCreate(BaseModel):
    asha_id: str
    patient_id: str
    moca_score: Optional[int] = Field(None, ge=0, le=30)
    blood_pressure: Optional[str] = None
    adherence_rating: Optional[str] = "good"  # 'good', 'moderate', 'poor'
    notes: Optional[str] = None

class PatientTriageSummary(BaseModel):
    patient_id: str
    name_alias: str
    preferred_lang: str
    baseline_moca: Optional[int]
    current_chi: float
    triage_status: str  # 'CRITICAL_DROP', 'WARNING', 'STABLE'
    active_anomaly: Optional[str]
    last_synced: Optional[str]

class CohortResponse(BaseModel):
    total_patients: int
    critical_count: int
    warning_count: int
    stable_count: int
    patients: List[PatientTriageSummary]

@router.get("/cohort", response_model=CohortResponse)
async def get_asha_cohort(
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    ASHA Community Worker Population Dashboard.
    Provides village-level triage of dementia patients to identify those needing urgent home visits.
    """
    query = select(Patient)
    result = await db.execute(query)
    patients = result.scalars().all()
    
    triage_list: List[PatientTriageSummary] = []
    critical_count = 0
    warning_count = 0
    stable_count = 0
    
    for pat in patients:
        chi_info = await compute_patient_chi_analytics(pat.id, db)
        current_chi = chi_info["chi_score_current"]
        anomaly = chi_info.get("anomaly_alert")
        
        if anomaly and anomaly.get("severity") == "CRITICAL":
            triage_status = "CRITICAL_DROP"
            critical_count += 1
            anomaly_type = anomaly.get("anomaly_type")
        elif current_chi < 65.0 or (anomaly and anomaly.get("severity") == "WARNING"):
            triage_status = "WARNING"
            warning_count += 1
            anomaly_type = anomaly.get("anomaly_type") if anomaly else "LOW_CHI"
        else:
            triage_status = "STABLE"
            stable_count += 1
            anomaly_type = None
            
        triage_list.append(
            PatientTriageSummary(
                patient_id=pat.id,
                name_alias=pat.name_alias,
                preferred_lang=pat.preferred_lang,
                baseline_moca=pat.baseline_moca,
                current_chi=round(current_chi, 1),
                triage_status=triage_status,
                active_anomaly=anomaly_type,
                last_synced=datetime.now(timezone.utc).isoformat()
            )
        )
        
    return CohortResponse(
        total_patients=len(patients),
        critical_count=critical_count,
        warning_count=warning_count,
        stable_count=stable_count,
        patients=triage_list
    )

@router.post("/checkin", status_code=status.HTTP_201_CREATED)
async def record_asha_checkin(payload: AshaCheckinCreate, db: AsyncSession = Depends(get_db)):
    """
    Records an in-person field visit by an ASHA worker at a patient's home.
    """
    checkin_id = f"chk-{uuid.uuid4().hex[:8]}"
    checkin = AshaCheckin(
        id=checkin_id,
        asha_id=payload.asha_id,
        patient_id=payload.patient_id,
        moca_score=payload.moca_score,
        blood_pressure=payload.blood_pressure,
        adherence_rating=payload.adherence_rating,
        notes=payload.notes
    )
    db.add(checkin)
    
    # If MoCA is updated, update patient's baseline
    if payload.moca_score is not None:
        pat_res = await db.execute(select(Patient).where(Patient.id == payload.patient_id))
        patient = pat_res.scalars().first()
        if patient:
            patient.baseline_moca = payload.moca_score
            
    await db.commit()
    await db.refresh(checkin)
    
    return {
        "status": "success",
        "checkin_id": checkin_id,
        "message": f"Field check-in recorded for patient {payload.patient_id}"
    }

@router.get("/checkins")
async def list_patient_checkins(patient_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AshaCheckin)
        .where(AshaCheckin.patient_id == patient_id)
        .order_by(AshaCheckin.visit_date.desc())
    )
    checkins = result.scalars().all()
    return checkins
