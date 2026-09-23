import asyncio
import os
import sys

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from datetime import datetime, timedelta, timezone
from server.db.session import engine, async_session
from server.db.models import Base, Patient, TelemetryObservation, MedicationAdherence
from server.services.synthetic_generator import generate_synthetic_30_day_timeline

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        # 1. Create Patient
        pat_id = "ner-pat-78902-assamese"
        pat = Patient(
            id=pat_id,
            name_alias="Aita",
            demographics_json={"age": 72, "gender": "female", "cdr": 0.5},
            baseline_moca=22,
            preferred_lang="as"
        )
        session.add(pat)
        
        # 2. Generate Synthetic 30-day timeline
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
