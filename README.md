# SmritiSetu NER (স্মৃতি সেতু)

An ultra-low-bandwidth, AI-driven digital biomarker platform designed to monitor and detect early cognitive decline (Alzheimer's/Dementia) in aging populations across rural North-East India (NER).

## Architecture

- **Edge Layer (Client)**: Offline-first architecture. Uses AES-GCM (256-bit) encrypted `Dexie.js` (IndexedDB/SQLite). CRDT-based Vector Clocks ensure no data is lost and provide highly available multi-client resolution using Last-Write-Wins (LWW) resolution.
- **Sync Engine**: Asynchronous network-aware background worker leveraging deflate compression to ensure sync payloads NEVER exceed a strict 50 KB rural limit, accommodating throttled 2G/3G network constraints.
- **Cloud Backend**: High-performance asynchronous FastAPI server backed by PostgreSQL, ensuring rapid ingestion and transaction safety.
- **Analytics Pipeline**: Calculates a composite Longitudinal Cognitive Health Index (CHI: 0-100), running rule-engine anomalies for "Day 21 Rapid Cognitive Drops" and motor latency degradation.
- **Interoperability**: Strict HL7 FHIR v1.0 standard mapping using LOINC code 72172-0 to integrate securely with regional Hospital Information Systems (HIS).

## Tech Stack

- **Client/Edge**: TypeScript, Vite, Dexie.js (IndexedDB), Web Crypto API, Vitest
- **Cloud/Backend**: Python 3.10+, FastAPI, SQLAlchemy (asyncpg), Pydantic v2
- **Testing**: Pytest, Pytest-Asyncio, HTTPX

## Getting Started

### 1. Edge Layer Configuration (TypeScript)
To execute tests covering edge ingestion and the CRDT compression pipeline:
```bash
npm install
npm run test tests/edge/db.test.ts
npm run test tests/sync/crdt_sync.test.ts
```

### 2. Cloud Backend Configuration (Python)
Ensure Python 3.10+ is installed in your environment.
```bash
# Install required backend ecosystem
pip install fastapi uvicorn pydantic-settings sqlalchemy pytest pytest-asyncio aiosqlite httpx

# Start the cloud REST server
uvicorn server.main:app --reload
```

### 3. Run Backend Test Suites
Run the server-side test matrix ensuring 50 KB strict limits, CHI math, and anomaly dispatch paths pass effectively:
```bash
python -m pytest tests/server/test_api_sync.py -v
python -m pytest tests/server/test_analytics_anomaly.py -v
python -m pytest tests/integration/test_runbook.py -v -o asyncio_default_test_loop_scope=function
```

### 4. One-Click Full-Stack Launcher (Windows)
To start everything with a single click (seed database, launch FastAPI backend, launch React frontend, and open browser):
```powershell
.\run_all.bat
# or in PowerShell
.\run_all.ps1
```

### 5. Hackathon Live Demo Runbook
Execute the end-to-end simulation script built for the final pitch presentation:

```bash
# Seed the synthetic Assamese patient database trajectory
python -m server.scripts.seed_demo_data

# Run the live interactive terminal pitch (Showcases Edge writes -> Delta Sync -> Cloud FHIR -> SMS Dispatch)
python -m server.scripts.demo_runner
```

## Documentation & Specifications

Detailed architectural documents and data contracts are organized in the [`docs/`](./docs) folder:
- [System Architecture & Edge Engine](./docs/ARCHITECTURE.md)
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Data Models & Schema Contracts](./docs/SCHEMA.md)

