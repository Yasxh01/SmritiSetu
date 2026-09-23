from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'patient', 'caregiver', 'asha_worker', 'clinician'
    assigned_region = Column(String, nullable=True)  # e.g., 'Kamrup, Assam', 'Majuli'
    linked_patient_ids = Column(JSON, default=list)  # list of patient_ids linked to this caregiver/ASHA
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, index=True)
    name_alias = Column(String, nullable=False)
    demographics_json = Column(JSON, nullable=False)
    baseline_moca = Column(Integer, nullable=True)
    preferred_lang = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class TelemetryObservation(Base):
    __tablename__ = "telemetry_observations"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, nullable=False)
    session_id = Column(String, nullable=False)
    game_id = Column(String, nullable=False)
    completion_time_ms = Column(Integer, nullable=False)
    error_count = Column(Integer, nullable=False)
    hesitation_pause_ms = Column(Integer, nullable=False)
    melo_rating = Column(Float, nullable=True)
    fhir_observation_json = Column(JSON, nullable=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index('idx_patient_recorded_at', 'patient_id', 'recorded_at'),
    )

class MedicationAdherence(Base):
    __tablename__ = "medication_adherence"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, nullable=False)
    rxnorm_code = Column(String, nullable=False)
    medication_name = Column(String, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False)  # 'taken', 'missed', 'pending'

    __table_args__ = (
        Index('idx_med_patient_scheduled', 'patient_id', 'scheduled_at'),
    )

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    reminder_type = Column(String, nullable=False)  # 'medication', 'hydration', 'daily_routine', 'appointment'
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    recurrence = Column(String, nullable=True)  # 'daily', 'twice_daily', 'none'
    status = Column(String, default="pending")  # 'pending', 'completed', 'missed'
    caregiver_verified = Column(Boolean, default=False)
    audio_hint_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index('idx_reminder_patient_status', 'patient_id', 'status'),
    )

class AshaCheckin(Base):
    __tablename__ = "asha_checkins"
    id = Column(String, primary_key=True, index=True)
    asha_id = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=False, index=True)
    visit_date = Column(DateTime(timezone=True), default=utc_now)
    moca_score = Column(Integer, nullable=True)
    blood_pressure = Column(String, nullable=True)
    adherence_rating = Column(String, nullable=True)  # 'good', 'moderate', 'poor'
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AlertLog(Base):
    __tablename__ = "alert_logs"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    details_json = Column(JSON, nullable=False)
    sms_dispatched_to = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
