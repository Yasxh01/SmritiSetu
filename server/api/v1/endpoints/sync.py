from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from server.schemas.sync import CRDTSyncRequest, CRDTSyncResponse
from server.core.config import settings
from server.db.session import get_db
from server.db.models import TelemetryObservation, MedicationAdherence, Reminder
from server.services.chi_service import compute_patient_chi_analytics
import base64
import zlib
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/delta", response_model=CRDTSyncResponse)
async def sync_delta(request: CRDTSyncRequest, db: AsyncSession = Depends(get_db)):
    if len(request.compressed_payload) > settings.MAX_DELTA_PAYLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"Payload exceeds {settings.MAX_DELTA_PAYLOAD_BYTES} bytes")

    try:
        compressed_bytes = base64.b64decode(request.compressed_payload)
        try:
            decompressed_bytes = zlib.decompress(compressed_bytes)
            mutations = json.loads(decompressed_bytes.decode('utf-8'))
        except Exception:
            mutations = json.loads(compressed_bytes.decode('utf-8'))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to decompress payload")

    applied = []
    synced_patient_ids = set()
    
    mutation_list = mutations.get("mutations") if isinstance(mutations, dict) else mutations

    if not isinstance(mutation_list, list):
        raise HTTPException(status_code=400, detail="Invalid payload format")

    for m in mutation_list:
        if m.get("mutation_type") == "INSERT":
            try:
                payload_str = base64.b64decode(m["payload_blob"]).decode('utf-8')
                data = json.loads(payload_str)
                patient_id = data.get("patient_id", "unknown")
                synced_patient_ids.add(patient_id)
                
                if "game_id" in data:
                    timestamp_str = data["timestamp"]
                    if timestamp_str.endswith("Z"):
                        timestamp_str = timestamp_str[:-1] + "+00:00"
                    
                    # Idempotency check: check if observation already ingested
                    existing = await db.get(TelemetryObservation, data["id"])
                    if not existing:
                        obs = TelemetryObservation(
                            id=data["id"],
                            patient_id=patient_id,
                            session_id=data["session_id"],
                            game_id=data["game_id"],
                            completion_time_ms=data["completion_time_ms"],
                            error_count=data["error_count"],
                            hesitation_pause_ms=data["hesitation_pause_ms"],
                            recorded_at=datetime.fromisoformat(timestamp_str)
                        )
                        db.add(obs)
                elif "rxnorm_code" in data:
                    scheduled_at_str = data["scheduled_at"]
                    if scheduled_at_str.endswith("Z"):
                        scheduled_at_str = scheduled_at_str[:-1] + "+00:00"
                        
                    existing_med = await db.get(MedicationAdherence, data["id"])
                    if not existing_med:
                        adherence = MedicationAdherence(
                            id=data["id"],
                            patient_id=patient_id,
                            rxnorm_code=data["rxnorm_code"],
                            medication_name=data["medication_name"],
                            scheduled_at=datetime.fromisoformat(scheduled_at_str),
                            status=data.get("synced_status", "pending")
                        )
                        db.add(adherence)
                
                applied.append(m["id"])
            except Exception as e:
                logger.warning(f"Error applying mutation {m.get('id')}: {e}")

    await db.commit()

    # Trigger post-sync analytics & anomaly evaluation for synced patients
    for p_id in synced_patient_ids:
        if p_id != "unknown":
            try:
                await compute_patient_chi_analytics(p_id, db)
            except Exception as err:
                logger.error(f"Error executing post-sync analytics for {p_id}: {err}")

    # Fetch downstream reminders for edge replication
    downstream: List[Dict[str, Any]] = []
    for p_id in synced_patient_ids:
        if p_id != "unknown":
            rem_res = await db.execute(
                select(Reminder)
                .where(and_(Reminder.patient_id == p_id, Reminder.status == "pending"))
                .limit(10)
            )
            rems = rem_res.scalars().all()
            for r in rems:
                downstream.append({
                    "type": "REMINDER",
                    "id": r.id,
                    "title": r.title,
                    "reminder_type": r.reminder_type,
                    "scheduled_at": r.scheduled_at.isoformat()
                })

    return CRDTSyncResponse(
        server_timestamp=datetime.now(timezone.utc),
        sync_status="ACK",
        server_vector_clock=request.vector_clock,
        applied_mutations=applied,
        downstream_mutations=downstream if downstream else None
    )

@router.get("/pull")
async def pull_downstream_state(
    patient_id: str = Query(...),
    since_timestamp: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Explicit delta pull endpoint allowing offline edge clients to retrieve
    caregiver reminders, scheduled tasks, and physician updates since their last sync.
    """
    conditions = [Reminder.patient_id == patient_id]
    if since_timestamp:
        conditions.append(Reminder.created_at >= since_timestamp)
        
    result = await db.execute(
        select(Reminder).where(and_(*conditions)).order_by(Reminder.scheduled_at.asc())
    )
    reminders = result.scalars().all()
    
    return {
        "patient_id": patient_id,
        "server_timestamp": datetime.now(timezone.utc).isoformat(),
        "reminders": [
            {
                "id": r.id,
                "title": r.title,
                "reminder_type": r.reminder_type,
                "scheduled_at": r.scheduled_at.isoformat(),
                "status": r.status,
                "audio_hint_url": r.audio_hint_url
            }
            for r in reminders
        ]
    }
