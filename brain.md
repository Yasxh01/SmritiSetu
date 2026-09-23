# SmritiSetu NER - Backend & Edge Data Architecture (brain.md)

## 1. Local-First Edge Database Layer
The foundation of SmritiSetu NER's offline capabilities rests on a robust local-first storage architecture.
- **Storage Engine**: Client-side AES-256 encrypted SQLite or IndexedDB (leveraging Dexie.js or WASM-SQLite) ensuring zero-trust local security.
- **Performance Constraints**: Guaranteed <15ms read/write latency to ensure seamless gameplay and UI responsiveness without network blocking.
- **Local Persistence Schema**: 
  - **Patient Profiles**: Baseline demographics and medical history.
  - **Gameplay Telemetry Sessions**: High-frequency granular interaction events.
  - **Medication Logs**: Time-stamped adherence tracking.
  - **Pending Sync Mutation Queues**: Staging area for outbound CRDT deltas.

## 2. Ultra-Low-Bandwidth Asynchronous Delta-Sync
Designed specifically for intermittent 2G/3G networks prevalent in rural North Eastern Region (NER).
- **State Replication**: Utilizes Conflict-Free Replicated Data Types (CRDT). State-based and delta-mutations ensure eventual consistency across edge and cloud without merge conflicts.
- **Strict Payload Budget**: 
  - Aggressive compression and binary/JSON compaction algorithms.
  - Hard constraint: Guaranteeing `<50 KB` bundles for telemetry transmissions.
- **Background Sync Worker Mechanics**:
  - Network state detection via `navigator.onLine` and lightweight pings.
  - Exponential backoff retry strategies for failed transmissions.
  - Atomic transaction commits to prevent partial state corruption.
  - Unique Idempotency Keys to prevent duplicate processing on the server.

## 3. Cloud Infrastructure Architecture
A highly scalable, async-first cloud backend.
- **API Gateway**: Python FastAPI for high-throughput REST and WebSocket connections.
- **Primary Datastore**: PostgreSQL schema optimized for time-series clinical events. Utilizes TimescaleDB or heavily optimized B-Tree indexing specifically on the composite key `(patient_id, timestamp)`.
- **Caching & Rate Limiting**: Redis cache layer handling active patient sessions, real-time Cognitive Health Index (CHI) caching, and API rate limiting to prevent abuse.

## 4. Clinical Interoperability & Analytics Engine
Bridging gamified telemetry with standardized clinical informatics.
- **Standard Mapping**: Strict adherence to HL7 FHIR v1.0 standard mapping.
  - `Patient` resource for demographics.
  - `Observation` resource (using LOINC code `72172-0` for cognitive assessments).
  - `CarePlan` and `MedicationStatement` for regimen tracking.
- **Cognitive Health Index (CHI)**: A proprietary rolling 30-day CHI aggregation formula (scoring 0–100). This dynamically combines working memory performance, response latencies, and executive task scores from the gameplay telemetry.
- **Anomaly Dispatcher**: 
  - Automated rule engine for rapid cognitive drop detection (e.g., >15% drop over 3 days, historically tracked as the "Day 21 decline anomaly").
  - SMS Relay integration (Twilio / Msg91) to instantly notify registered family caregivers and ASHA (Accredited Social Health Activist) community workers.
