from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.db.session import get_db
from server.db.models import User
from server.core.security import generate_otp, verify_otp, create_access_token, get_current_user
from server.services.alert_dispatcher import AlertDispatcher
import uuid
from datetime import timedelta

router = APIRouter()
alert_dispatcher = AlertDispatcher(use_mock=True)

class OTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,13}$")

class OTPVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,13}$")
    otp: str = Field(..., min_length=4, max_length=6)
    full_name: Optional[str] = "SmritiSetu User"
    role: Optional[str] = "caregiver" # 'patient', 'caregiver', 'asha_worker', 'clinician'
    assigned_region: Optional[str] = "Kamrup, Assam"

class EdgeTokenRequest(BaseModel):
    patient_id: str
    device_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

@router.post("/request-otp")
async def request_otp(payload: OTPRequest):
    otp = generate_otp(payload.phone_number)
    # Send via AlertDispatcher (SMS)
    alert_dispatcher.dispatch_sms(
        [payload.phone_number],
        f"Your SmritiSetu login OTP is: {otp}. Valid for 5 minutes.",
        language="en"
    )
    return {
        "status": "success",
        "message": f"OTP successfully sent to {payload.phone_number}",
        "sandbox_hint": "In demo mode, you can also use OTP: 123456"
    }

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_login_otp(payload: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(payload.phone_number, payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Query or create user in DB
    result = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    user = result.scalars().first()
    
    if not user:
        user = User(
            id=f"usr-{uuid.uuid4().hex[:10]}",
            phone_number=payload.phone_number,
            full_name=payload.full_name or "SmritiSetu User",
            role=payload.role or "caregiver",
            assigned_region=payload.assigned_region,
            linked_patient_ids=[]
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    token_data = {
        "sub": user.id,
        "phone_number": user.phone_number,
        "role": user.role,
        "name": user.full_name
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "role": user.role,
            "assigned_region": user.assigned_region,
            "linked_patient_ids": user.linked_patient_ids or []
        }
    )

@router.post("/edge-token")
async def issue_edge_token(payload: EdgeTokenRequest):
    """
    Issues a persistent, 90-day token for offline tablet pairing at patient homes.
    """
    token_data = {
        "sub": payload.patient_id,
        "device_id": payload.device_id,
        "role": "patient",
        "type": "edge_offline"
    }
    token = create_access_token(token_data, expires_delta=timedelta(days=90))
    return {
        "edge_token": token,
        "patient_id": payload.patient_id,
        "device_id": payload.device_id,
        "expires_in_days": 90
    }

@router.get("/me")
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
