from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from server.db.session import get_db
from server.db.models import Reminder, MedicationAdherence
import uuid

router = APIRouter()

class ReminderCreate(BaseModel):
    patient_id: str
    reminder_type: str = Field(..., description="'medication', 'hydration', 'daily_routine', 'appointment'")
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    recurrence: Optional[str] = "daily" # 'daily', 'twice_daily', 'none'
    audio_hint_url: Optional[str] = None

class ReminderConfirmRequest(BaseModel):
    caregiver_verified: bool = False
    rxnorm_code: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    patient_id: str
    reminder_type: str
    title: str
    description: Optional[str]
    scheduled_at: datetime
    confirmed_at: Optional[datetime]
    recurrence: Optional[str]
    status: str
    caregiver_verified: bool
    audio_hint_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

@router.get("", response_model=List[ReminderResponse])
async def list_reminders(
    patient_id: str = Query(...),
    reminder_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Lists scheduled reminders (meds, hydration, routines, appointments) for a patient.
    """
    conditions = [Reminder.patient_id == patient_id]
    if reminder_type:
        conditions.append(Reminder.reminder_type == reminder_type)
    if status_filter:
        conditions.append(Reminder.status == status_filter)
        
    query = select(Reminder).where(and_(*conditions)).order_by(Reminder.scheduled_at.asc())
    result = await db.execute(query)
    reminders = result.scalars().all()
    return reminders

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(payload: ReminderCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates a new reminder for medication, water intake, daily routine, or medical visit.
    """
    reminder_id = f"rem-{uuid.uuid4().hex[:8]}"
    reminder = Reminder(
        id=reminder_id,
        patient_id=payload.patient_id,
        reminder_type=payload.reminder_type,
        title=payload.title,
        description=payload.description,
        scheduled_at=payload.scheduled_at,
        recurrence=payload.recurrence,
        status="pending",
        caregiver_verified=False,
        audio_hint_url=payload.audio_hint_url
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.post("/reset-all", response_model=List[ReminderResponse])
async def reset_all_reminders(
    patient_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Resets all reminders for the patient back to pending status for demo presentation.
    """
    result = await db.execute(select(Reminder).where(Reminder.patient_id == patient_id))
    reminders = result.scalars().all()
    for rem in reminders:
        rem.status = "pending"
        rem.confirmed_at = None
        rem.caregiver_verified = False
    await db.commit()
    for rem in reminders:
        await db.refresh(rem)
    return reminders

@router.post("/{reminder_id}/toggle", response_model=ReminderResponse)
async def toggle_reminder(
    reminder_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles a reminder between pending and completed for seamless interactive demo.
    """
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalars().first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    if reminder.status == "completed":
        reminder.status = "pending"
        reminder.confirmed_at = None
        reminder.caregiver_verified = False
    else:
        now = datetime.now(timezone.utc)
        reminder.status = "completed"
        reminder.confirmed_at = now
        reminder.caregiver_verified = True
        
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/confirm", response_model=ReminderResponse)
async def confirm_reminder(
    reminder_id: str,
    payload: ReminderConfirmRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Patient or caregiver confirms completion of reminder.
    If it's a medication, automatically creates an adherence log for clinical tracking.
    """
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalars().first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    now = datetime.now(timezone.utc)
    reminder.status = "completed"
    reminder.confirmed_at = now
    reminder.caregiver_verified = payload.caregiver_verified
    
    if reminder.reminder_type == "medication":
        adherence = MedicationAdherence(
            id=f"adh-{uuid.uuid4().hex[:8]}",
            patient_id=reminder.patient_id,
            rxnorm_code=payload.rxnorm_code or "310323",
            medication_name=reminder.title,
            scheduled_at=reminder.scheduled_at,
            confirmed_at=now,
            status="taken"
        )
        db.add(adherence)
        
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalars().first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    await db.delete(reminder)
    await db.commit()
    return {"status": "success", "message": f"Reminder {reminder_id} deleted"}
