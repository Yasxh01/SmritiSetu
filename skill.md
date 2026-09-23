# SmritiSetu NER - Technical Stack & Tooling Reference (skill.md)

## Backend Infrastructure
*   **Language**: Python 3.11+ (Strict type hinting enabled).
*   **Framework**: FastAPI for high-performance, asynchronous REST and WebSocket APIs.
*   **Validation**: Pydantic v2 for robust data serialization and schema validation.
*   **ORM / DB Connectivity**: SQLAlchemy 2.0 with `asyncpg` for asynchronous PostgreSQL interactions. Alembic for database migrations.
*   **Caching Client**: `redis-py` for session management and fast access caching.

## Database & Storage
*   **Primary Cloud DB**: PostgreSQL 16. Heavily utilized for time-series partitioning of gameplay telemetry.
*   **In-Memory Store**: Redis 7.

## Edge Storage & Sync
*   **Browser/Local Storage**: Dexie.js (wrapper for IndexedDB) OR `sql.js` / WASM SQLite.
*   **Local Security**: AES-256 encryption via the native Web Crypto API.
*   **Synchronization**: CRDT (Conflict-Free Replicated Data Type) utilities. E.g., `yjs` or a custom vector-clock JSON compaction engine optimized for `<50 KB` payloads.

## Integration / Telephony
*   **SMS/Alerting**: Twilio API SDK or Msg91 API SDK for dispatching critical alerts to ASHA community workers and family members.

## Testing & QA
*   **Framework**: Pytest for comprehensive unit and integration testing.
*   **HTTP Client**: `httpx` for async API endpoint testing.
*   **Data Generation**: Faker library configured for synthetic patient profile and clinical timeline generation.
