# SmritiSetu NER - Backend Engineering Execution Roles (agent.md)

To efficiently deliver Track 3 (Local-First Edge Database, CRDT Sync, Cloud Infrastructure, and Caregiver Dispatchers), the workload is distributed across specialized AI engineering agents:

## `EdgeDatabaseAgent`
*   **Responsibility**: The local data persistence maestro.
*   **Tasks**: 
    *   Writes the local encrypted IndexedDB (Dexie.js) or WASM-SQLite abstraction layer.
    *   Implements AES-256 Web Crypto API wrappers for secure on-device storage.
    *   Builds caching wrappers for immediate UI reads.
    *   Handles local schema versioning and migration routines.

## `SyncProtocolAgent`
*   **Responsibility**: The low-bandwidth network specialist.
*   **Tasks**: 
    *   Implements the CRDT (Conflict-Free Replicated Data Type) delta packaging mechanism.
    *   Develops and tunes compression algorithms to strictly meet the `<50 KB` payload constraint.
    *   Builds the network-aware background sync worker (handling `navigator.onLine`, pings, and exponential backoff).
    *   Ensures deterministic conflict resolution and idempotency.

## `CloudFastAPIAgent`
*   **Responsibility**: The high-performance cloud architect.
*   **Tasks**: 
    *   Sets up the FastAPI application and REST/WebSocket routers.
    *   Defines Pydantic v2 request/response validation models.
    *   Configures PostgreSQL async connection pools (via asyncpg/SQLAlchemy).
    *   Implements the Redis caching layer for active sessions and rate limiting.
    *   Optimizes time-series schema indexing.

## `ClinicalAnalyticsAgent`
*   **Responsibility**: The clinical intelligence and alerting orchestrator.
*   **Tasks**: 
    *   Implements the math and logic for the 30-day rolling Cognitive Health Index (CHI) algorithm.
    *   Builds the "Day 21 decline anomaly" rule detector (detecting >15% drops).
    *   Integrates SMS alert notification relays via Twilio/Msg91 SDKs for ASHA workers.
    *   Translates proprietary telemetry into HL7 FHIR standard resources.
