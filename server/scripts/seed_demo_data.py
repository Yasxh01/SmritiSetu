import asyncio
import os
import sys

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from server.db.session import engine, async_session
from server.db.models import Base, Patient, TelemetryObservation, MedicationAdherence
from server.services.synthetic_generator import generate_synthetic_30_day_timeline
from server.init_db import init_db

async def seed_data():
    await init_db()
        
    async with async_session() as session:
        pat_id = "ner-pat-78902-assamese"
        
        # 1. Check/Create Patient
        existing_pat = await session.execute(select(Patient).where(Patient.id == pat_id))
        if not existing_pat.scalars().first():
            pat = Patient(
                id=pat_id,
                name_alias="Bonti Aita (বন্টি আইতা)",
                demographics_json={"age": 74, "gender": "Female", "region": "Kamrup, Assam", "cdr": 0.5},
                baseline_moca=22,
                preferred_lang="as"
            )
            session.add(pat)
        
        # 2. Generate Synthetic 30-day timeline if not already generated
        existing_obs = await session.execute(select(TelemetryObservation).where(TelemetryObservation.patient_id == pat_id))
        if not existing_obs.scalars().first():
            dataset = generate_synthetic_30_day_timeline(pat_id)
            base_date = datetime.now(timezone.utc) - timedelta(days=30)
        
        for i, data in enumerate(dataset["timeline"]):
            obs_date = base_date + timedelta(days=i)
            obs = TelemetryObservation(
                id=f"obs-{i}",
                patient_id=pat_id,
                session_id=f"sess-{i}",
                game_id="smriti_mandir",
                completion_time_ms=data["latency_ms"],
                error_count=0,
                hesitation_pause_ms=0,
                melo_rating=None,
                recorded_at=obs_date
            )
            session.add(obs)
            
            # Adherence
            adherence = MedicationAdherence(
                id=f"med-{i}",
                patient_id=pat_id,
                rxnorm_code="310323",
                medication_name="Donepezil 5mg",
                scheduled_at=obs_date,
                status="taken" if data["adherence"] else "missed"
            )
            session.add(adherence)
            
        await session.commit()
        print("Database seeded with synthetic patient 'ner-pat-78902-assamese' and 30-day timeline.")

if __name__ == "__main__":
    asyncio.run(seed_data())
