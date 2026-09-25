# SmritiSetu NER (স্মৃতি সেতু - Cognitive Bridge)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/Frontend-TypeScript_&_React-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Build-Vite_8-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Offline-First](https://img.shields.io/badge/Storage-Dexie.js_IndexedDB-orange.svg)](https://dexie.org/)
![Pytest](https://img.shields.io/badge/Backend_Tests-38%20Passed-brightgreen.svg)
![Vitest](https://img.shields.io/badge/Frontend_Tests-23%20Passed-brightgreen.svg)
[![FHIR](https://img.shields.io/badge/Standards-HL7_FHIR_LOINC_72172--0-blue.svg)](https://loinc.org/72172-0/)
[![Render](https://img.shields.io/badge/Deploy-Render_Cloud-46E3B7.svg?logo=render&logoColor=white)](https://smritisetu-api.onrender.com)

**SmritiSetu NER** is an ultra-low-bandwidth, AI-driven digital biomarker platform engineered specifically for early screening, longitudinal trajectory monitoring, and triage of Alzheimer’s and Mild Cognitive Impairment (MCI) in rural and linguistic-minority communities of North-East India (NER).

---

## 🌐 Live Production Deployments

| Component | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [https://smriti-setu-nine.vercel.app/](https://smriti-setu-nine.vercel.app/) | React Edge Client (PWA) |
| **Cloud API Backend** | [https://smritisetu-api.onrender.com](https://smritisetu-api.onrender.com) | FastAPI REST service with persistent SQLite/PostgreSQL |
| **Interactive API Docs** | [https://smritisetu-api.onrender.com/docs](https://smritisetu-api.onrender.com/docs) | Interactive Swagger / OpenAPI 3.0 specification |
| **Clinical ML Laboratory** | [https://smritisetu-api.onrender.com/ml-lab](https://smritisetu-api.onrender.com/ml-lab) | Interactive Random Forest biomarker visualizer & simulator |
| **Health Probe** | [https://smritisetu-api.onrender.com/health](https://smritisetu-api.onrender.com/health) | Uptime, database, and telemetry pipeline health check |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EDGE CLIENT (Browser / PWA)                     │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Cultural Game Center  │  │  Caregiver & ASHA Field Portals      │  │
│  │  - Smriti Mandir (Vis) │  │  - Reminders Manager (<15ms record)  │  │
│  │  - Dhwani Tarang (Aud) │  │  - Triage Matrix & Check-in Modal    │  │
│  │  - Dainik Dinlipi(Rout)│  │  - Emergency SOS & Telephony Preview │  │
│  │  - Dhyaan Kendra(Focus)│  │  - 4D mElo Live Reactive Store       │  │
│  └──────────┬─────────────┘  └──────────────────┬───────────────────┘  │
│             │                                   │                      │
│  ┌──────────▼───────────────────────────────────▼───────────────────┐  │
│  │          Encrypted Dexie.js (AES-GCM 256-bit IndexedDB)          │  │
│  │          CRDT Vector Clocks & Last-Write-Wins (LWW) Engine       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │  50 KB Throttled Deflate Sync
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CLOUD BACKEND (FastAPI / Render)                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  API Gateway & Dynamic CORS Regex (Vercel / Netlify / Preview)   │  │
│  └──────┬───────────────────────────┬────────────────────────┬──────┘  │
│         │                           │                        │         │
│  ┌──────▼──────────────┐   ┌────────▼──────────────┐   ┌─────▼──────┐  │
│  │ Dynamic Difficulty  │   │  Longitudinal CHI     │   │ Clinical   │  │
│  │ Adjustment (DDA)    │   │  Analytics Engine     │   │ ML Model   │  │
│  │ & 4D mElo Vector    │   │  - 30-Day Trendline   │   │ - Random   │  │
│  │ - Anxiety Relief    │   │  - Day-21 Drop Alerts │   │   Forest   │  │
│  │ - Tile Scaling      │   │  - Motor Latency Spike│   │ - 92.5% AUC│  │
│  └─────────────────────┘   └───────────────────────┘   └────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Interoperability: HL7 FHIR v1.0 Export (LOINC 72172-0 Mapping)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 4D Cultural Cognitive Games Suite

The platform replaces alien Western neuropsychological tests (e.g., standard MMSE) with culturally resonant daily cognitive exercises tailored for Assamese, Bodo, and Bengali communities:

| Game | Domain & Target Skill | Cultural Metaphor & Mechanism |
| :--- | :--- | :--- |
| **Smriti Mandir (স্মৃতি মন্দিৰ)** | Visual-Spatial Memory (`visualMemory`) | Memorize and recall sacred Kamakhya Temple artifacts (Jor, Xorai, Dhol, Jaapi, Diya). Dynamically scales from 3×3 to 4×4 grids. |
| **Dhwani Tarang (ধ্বনি তৰংগ)** | Auditory Rhythm Recall (`auditoryRhythm`) | Listen to regional Bihu dhol beats and taal sequences, replicating rhythm patterns with millisecond motor-latency tracking. |
| **Dainik Dinlipi (দৈনিক দিনলিপি)** | Routine Recall (`routineRecall`) | Chronologically sequence daily circadian activities (morning tea, namghar prayer, meal, evening walk) to assess temporal orientation. |
| **Dhyaan Kendra (ধ্যান কেন্দ্ৰ)** | Sustained Focus (`sustainedFocus`) | Maintain vigilance by attending to flickering oil diyas, resisting distractors while timing impulse responses. |

### Dynamic Difficulty Adjustment (DDA) & 4D mElo
- **Live 4D mElo Vector**: Each patient holds rating vectors across `[visualMemory, auditoryRhythm, sustainedFocus, routineRecall]`, updated reactively after each round via `meloStore.ts`.
- **Anxiety-Relief Guard**: If a player exhibits prolonged cognitive paralysis (hesitation pause > 15s or 6+ consecutive errors), the interface smoothly displays a calming mindfulness intervention (*"Take a Gentle Breath"*) without wiping the board or penalizing score.

---

## 👥 Caregiver & ASHA Field Portals

### 1. Village Cohort Surveillance (ASHA Grassroots Portal)
- **Clinical Triage Queue**: Classifies village elderly into **Critical Decline** (requires immediate home visit), **Warning / Latency Spike** (follow-up needed), and **Stable** (consistent adherence).
- **Mathematical Consistency**: Real-time summary counts dynamically derived from cohort status to guarantee zero discrepancies.
- **In-Person Field Visit Modal**: Allows ASHA workers to record bedside MoCA evaluations, blood pressure, and medication compliance.

### 2. Caregiver Reminders & Medication Adherence
- **Sub-15ms Local Confirmation**: Caregiver check-offs are recorded immediately to encrypted local Dexie storage with an audible success chord.
- **One-Click Demo Reset**: Built-in reset button (`POST /api/v1/reminders/reset-all`) allows instant resetting of reminder schedules to `pending` for repeatable live demos and rehearsals.
- **Emergency SOS & Telephony**: One-touch SOS dispatching localized SMS notifications with live GPS coordinates to family members and ASHA personnel.

---

## 🔬 Clinical Machine Learning & Biomarkers

- **Biomarker Features**: Evaluates motor reaction latency (ms), hesitation pauses (ms), pattern completion speed, and error rates.
- **Random Forest Classifier**: Trained on clinical cognitive degradation trajectories, delivering **92.5% AUC-ROC** sensitivity for detecting MCI transitions.
- **ML Lab UI**: Visual exploration of feature importances, confusion matrix, and interactive patient scenario simulator accessible at [`/ml-lab`](https://smritisetu-api.onrender.com/ml-lab).

---

## 🛠️ Quickstart & Local Development

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (Python 3.11 recommended)

### 1. Edge Client Setup (Frontend)
```bash
git clone https://github.com/Yasxh01/SmritiSetu.git
cd SmritiSetu

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
# -> Opens at http://localhost:5173
```

### 2. Cloud Server Setup (Backend)
```bash
# Install Python dependencies
pip install -r server/requirements.txt
# or:
pip install fastapi uvicorn pydantic-settings sqlalchemy pytest pytest-asyncio aiosqlite httpx scikit-learn

# Initialize and seed database
python -m server.init_db

# Start FastAPI backend with hot reload
uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
# -> Swagger docs available at http://127.0.0.1:8000/docs
```

### 3. One-Click Launcher (Windows)
```powershell
# Double-click or run from PowerShell:
.\run_all.bat
# or:
.\run_all.ps1
```

---

## 🧪 Comprehensive Test Suite

### Frontend Vitest Suite (23 Tests)
```bash
npm test
```
Tests edge IndexedDB operations, 50 KB strict sync compression thresholds, CRDT Vector Clocks, and speech biomarkers:
```
 ✓ tests/ml/melo.test.ts (5 tests)
 ✓ tests/ml/speech_clinical.test.ts (7 tests)
 ✓ tests/ml/integration_bridge.test.ts (2 tests)
 ✓ tests/edge/db.test.ts (3 tests)
 ✓ tests/sync/crdt_sync.test.ts (6 tests)
Test Files  5 passed (5) | Tests  23 passed (23)
```

### Backend Pytest Suite (38 Tests)
```bash
python -m pytest
```
Tests DDA engine, mElo mathematics, anomaly detection rules, HL7 FHIR export, and ASHA triage:
```
============================= 38 passed in 6.8s ==============================
```

---

## 🚀 Frontend Deployment Guide (Vercel / Netlify)

The frontend is fully configured for production deployment:

1. **Push to GitHub**: Connect repository `Yasxh01/SmritiSetu` to **Vercel** or **Netlify**.
2. **Framework Preset**: Select **Vite**.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variable**:
   ```env
   VITE_API_URL=https://smritisetu-api.onrender.com
   ```
   *(Note: Baked in automatically via `.env.production` if left blank)*.
6. **SPA Rewrites**: Pre-configured via [`vercel.json`](./vercel.json) to eliminate 404s on page refresh.

---

## 📄 License & Ethical Compliance

Designed and built under DISHA (Digital Information Security in Healthcare Act) guidelines and HL7 FHIR standards for indigenous and rural clinical screening in North-East India.
