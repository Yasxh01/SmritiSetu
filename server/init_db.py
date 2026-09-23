import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from server.db.session import engine, async_session
from server.db.models import Base, Patient, Reminder, User

async def init_db():
    # 1. Create all tables if not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed initial data
    async with async_session() as session:
        # Check if patients exist
        res = await session.execute(select(Patient))
        if not res.scalars().first():
            p1 = Patient(
                id="ner-pat-78902-assamese",
                name_alias="Bonti Aita (বন্টি আইতা)",
                demographics_json={
                    "age": 74,
                    "gender": "Female",
                    "region": "Kamrup, Assam",
                    "dialect": "Assamese",
                    "mci_diagnosed_date": "2024-03-12",
                    "primary_caregiver": "Ratul Das (Son)"
                },
                baseline_moca=22,
                preferred_lang="as"
            )
            p2 = Patient(
                id="ner-pat-78903-assamese",
                name_alias="Prabhat Kalita (প্ৰভাত কলিতা)",
                demographics_json={"age": 78, "gender": "Male", "region": "Barpeta, Assam"},
                baseline_moca=24,
                preferred_lang="as"
            )
            p3 = Patient(
                id="ner-pat-78904-bodo",
                name_alias="Jonali Boro (जोनालि बर')",
                demographics_json={"age": 71, "gender": "Female", "region": "Kokrajhar, BTR"},
                baseline_moca=20,
                preferred_lang="brx"
            )
            p4 = Patient(
                id="ner-pat-78905-bengali",
                name_alias="Hemlata Barman (হেমলতা বর্মন)",
                demographics_json={"age": 82, "gender": "Female", "region": "Silchar, Cachar"},
                baseline_moca=25,
                preferred_lang="bn"
            )
            session.add_all([p1, p2, p3, p4])

        # Check if reminders exist
        rem_res = await session.execute(select(Reminder))
        if not rem_res.scalars().first():
            now = datetime.now(timezone.utc)
            r1 = Reminder(
                id="rem-1",
                patient_id="ner-pat-78902-assamese",
                reminder_type="medication",
                title="Donepezil 5mg (মৰমৰ ঔষধ - Morning Memory Pill)",
                description="Take with half glass warm water after breakfast",
                scheduled_at=now.replace(hour=8, minute=30, second=0, microsecond=0),
                recurrence="daily",
                status="pending",
                caregiver_verified=False
            )
            r2 = Reminder(
                id="rem-2",
                patient_id="ner-pat-78902-assamese",
                reminder_type="hydration",
                title="Drink Warm Water (এক গিলাচ কুহুমীয়া পানী খাওক)",
                description="Regular hydration preserves cognitive alertness",
                scheduled_at=now.replace(hour=10, minute=0, second=0, microsecond=0),
                recurrence="daily",
                status="pending",
                caregiver_verified=False
            )
            r3 = Reminder(
                id="rem-3",
                patient_id="ner-pat-78902-assamese",
                reminder_type="daily_routine",
                title="Evening Namghar Prayer / Music (নামঘৰ প্ৰাৰ্থনা)",
                description="Calming auditory engagement and routine maintenance",
                scheduled_at=now.replace(hour=18, minute=0, second=0, microsecond=0),
                recurrence="daily",
                status="pending",
                caregiver_verified=False
            )
            session.add_all([r1, r2, r3])

        await session.commit()
    print("Database tables initialized and seeded successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
