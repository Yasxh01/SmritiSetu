# SmritiSetu NER - Product Requirements Document (PRD)

## 1. Functional Requirements

*   **`FR-BE-01`**: **Edge Database CRUD**
    *   The edge storage layer must support immediate, zero-network persistence of game sessions, telemetry, and pill confirmations. The UI must never block waiting for network confirmation.
*   **`FR-BE-02`**: **CRDT Delta Queue**
    *   The sync engine must create highly compressed payloads strictly under `<50 KB`. It must employ deterministic conflict resolution strategies, utilizing Last-Write-Wins (LWW) or Vector Clocks for concurrent edge-cloud modifications.
*   **`FR-BE-03`**: **Sync Ingestion API**
    *   The backend must expose a robust endpoint (`POST /api/v1/sync/delta`). This API will ingest delta bundles, apply them to the master state, and return a sync confirmation vector alongside updated caregiver flags or care plans.
*   **`FR-BE-04`**: **HL7 FHIR Telemetry Serializer**
    *   An integration layer must validate all inbound telemetry and medication JSON against standard clinical schemas (FHIR v1.0), translating proprietary game metrics into standardized clinical observations.
*   **`FR-BE-05`**: **Cognitive Analytics Worker**
    *   A background process must asynchronously compute rolling 30-day CHI trajectory arrays and analyze response latency variance for every synced session.
*   **`FR-BE-06`**: **Emergency Anomaly & SOS Dispatcher**
    *   The system must monitor CHI trends and SOS triggers, instantly relaying SMS alerts (via Twilio/Msg91) containing the patient's GPS coordinates and anomaly details to nearby ASHA workers and registered caregivers.

## 2. Non-Functional & Compliance Requirements

*   **Data Integrity**: 100% offline data integrity guarantee. Zero data loss during unexpected network drops or device power cycles.
*   **Latency SLAs**:
    *   Sub-15ms local edge database query and write time.
    *   Sub-200ms cloud ingestion API latency (excluding network transit).
*   **Security & Compliance**:
    *   **DISHA (Digital Information Security in Healthcare Act, India)** and **HIPAA** compliance.
    *   **Data at Rest**: AES-256 encryption applied to the local SQLite/IndexedDB databases and the cloud PostgreSQL instance.
    *   **Data in Transit**: Mandatory TLS 1.3 for all client-server communications.
    *   **De-identification**: Full anonymization and de-identification pipelines required before any data is exported to the analytics or research engine.
