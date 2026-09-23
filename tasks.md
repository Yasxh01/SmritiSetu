# SmritiSetu NER - Sequential Implementation Checklist (tasks.md)

## Step 1: Local Edge Store & Encryption
- [ ] Initialize Dexie.js / WASM-SQLite edge schema (`patients`, `telemetry_events`, `medication_logs`).
- [ ] Implement AES-256 encryption/decryption wrapper utilizing the Web Crypto API for secure local storage.
- [ ] Write and execute offline read/write latency tests ensuring sub-15ms performance.
- [ ] Implement the `sync_queue` table to stage pending mutations.

## Step 2: CRDT Delta Sync Engine
- [ ] Write the delta bundle generator to extract pending mutations from the `sync_queue`.
- [ ] Implement payload compression and compaction logic.
- [ ] Verify payload size constraints (simulate high-frequency events and assert `<50 KB` output).
- [ ] Develop the background sync worker: implement `navigator.onLine` listeners, exponential backoff, and idempotent transmission logic.

## Step 3: FastAPI Backend & PostgreSQL Core
- [ ] Stand up the foundational Python FastAPI service.
- [ ] Configure `docker-compose.yml` for PostgreSQL 16 and Redis 7.
- [ ] Define SQLAlchemy time-series tables and Alembic migrations.
- [ ] Implement Pydantic models for HL7 FHIR v1.0 validation (`Patient`, `Observation`, `MedicationStatement`).
- [ ] Expose `POST /api/v1/sync/delta` for CRDT ingestion.

## Step 4: CHI Analytics & Anomaly Dispatcher
- [ ] Implement the rolling 30-day Cognitive Health Index (CHI) calculation math.
- [ ] Build the synthetic patient timeline generator for testing.
- [ ] Write the "Day 21 decline anomaly" rule detector test case (>15% drop over 3 days).
- [ ] Integrate Twilio/Msg91 SMS alerting logic for the Anomaly & SOS Dispatcher.

## Step 5: Contract Verification & Integration
- [ ] Test the backend against Frontend session mocks.
- [ ] Test integration with ML mElo vector payloads.
- [ ] Verify offline isolation (simulate network drop during gameplay).
- [ ] Verify auto-flush mechanisms on network reconnection.
