# SmritiSetu NER - Concrete Data Models & API Contracts

This document contains explicit, machine-validatable JSON Schema (Draft-07) definitions and SQL DDL scripts for the SmritiSetu NER distributed system.

## 1. Inbound Frontend Telemetry Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Inbound Frontend Telemetry Payload",
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "format": "uuid"
    },
    "patient_id": {
      "type": "string"
    },
    "game_id": {
      "type": "string",
      "enum": ["smriti_mandir", "dhwani_tarang", "dhyaan_kendra", "dainik_dinlipi"]
    },
    "task_identifier": {
      "type": "string"
    },
    "completion_time_ms": {
      "type": "integer",
      "minimum": 0
    },
    "error_count": {
      "type": "integer",
      "minimum": 0
    },
    "hesitation_pause_ms": {
      "type": "integer",
      "minimum": 0
    },
    "audio_voice_latency_ms": {
      "type": "integer",
      "minimum": 0
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "session_id",
    "patient_id",
    "game_id",
    "task_identifier",
    "completion_time_ms",
    "error_count",
    "hesitation_pause_ms",
    "timestamp"
  ],
  "additionalProperties": false
}
```

## 2. ML mElo Difficulty Vector Handoff Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ML mElo Difficulty Vector Handoff",
  "type": "object",
  "properties": {
    "patient_id": {
      "type": "string"
    },
    "mElo_rating": {
      "type": "number",
      "minimum": 0,
      "default": 600
    },
    "tier": {
      "type": "string",
      "enum": ["Easy", "Medium", "Hard"]
    },
    "skill_vector": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4,
      "description": "[visual_memory, executive_planning, auditory_processing, semantic_fluency]"
    },
    "difficulty_vector": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4
    },
    "anxiety_relief_triggered": {
      "type": "boolean",
      "description": "True when S_t < 0.65 or T_resp > mu_T + 2*sigma_T"
    },
    "recommended_task_id": {
      "type": "string"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "patient_id",
    "mElo_rating",
    "tier",
    "anxiety_relief_triggered",
    "updated_at"
  ],
  "additionalProperties": false
}
```

## 3. HL7 FHIR v1.0 Schemas

### Patient Profile Resource

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HL7 FHIR Patient Resource",
  "type": "object",
  "properties": {
    "resourceType": {
      "type": "string",
      "const": "Patient"
    },
    "id": {
      "type": "string"
    },
    "identifier": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "system": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    },
    "name": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "use": { "type": "string" },
          "text": { "type": "string" },
          "family": { "type": "string" },
          "given": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "other", "unknown"]
    },
    "birthDate": {
      "type": "string",
      "format": "date"
    },
    "communication": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "language": {
            "type": "object",
            "properties": {
              "coding": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "system": { "type": "string" },
                    "code": { "type": "string" },
                    "display": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "extension": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "valueInteger": { "type": "integer", "description": "baseline_moca" },
          "valueString": { "type": "string", "description": "cdr_stage" }
        }
      }
    }
  },
  "required": ["resourceType", "id", "name"]
}
```

### Cognitive Observation Resource

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HL7 FHIR Cognitive Observation Resource",
  "type": "object",
  "properties": {
    "resourceType": {
      "type": "string",
      "const": "Observation"
    },
    "id": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": ["registered", "preliminary", "final", "amended", "cancelled", "entered-in-error", "unknown"]
    },
    "code": {
      "type": "object",
      "properties": {
        "coding": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "system": { "type": "string", "const": "http://loinc.org" },
              "code": { "type": "string", "const": "72172-0" },
              "display": { "type": "string", "const": "Cognitive assessment score" }
            }
          }
        }
      }
    },
    "subject": {
      "type": "object",
      "properties": {
        "reference": { "type": "string" }
      }
    },
    "valueQuantity": {
      "type": "object",
      "properties": {
        "value": { "type": "number" },
        "unit": { "type": "string", "const": "mElo" }
      }
    },
    "component": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": {
            "type": "object",
            "properties": {
              "coding": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "system": { "type": "string", "const": "http://hl7.org/fhir/icf" },
                    "code": { "type": "string", "enum": ["b1440", "b1560", "b1641", "b1670"] },
                    "display": { "type": "string" }
                  }
                }
              }
            }
          },
          "valueQuantity": {
            "type": "object",
            "properties": {
              "value": { "type": "number" }
            }
          }
        }
      }
    }
  },
  "required": ["resourceType", "status", "code", "subject", "valueQuantity"]
}
```

### MedicationStatement Resource

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HL7 FHIR MedicationStatement Resource",
  "type": "object",
  "properties": {
    "resourceType": {
      "type": "string",
      "const": "MedicationStatement"
    },
    "id": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": ["active", "completed", "entered-in-error", "intended", "stopped", "on-hold", "unknown", "not-taken"]
    },
    "medicationCodeableConcept": {
      "type": "object",
      "properties": {
        "coding": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "system": { "type": "string", "const": "http://www.nlm.nih.gov/research/umls/rxnorm" },
              "code": { "type": "string" },
              "display": { "type": "string" }
            }
          }
        }
      }
    },
    "subject": {
      "type": "object",
      "properties": {
        "reference": { "type": "string" }
      }
    },
    "effectiveDateTime": {
      "type": "string",
      "format": "date-time"
    },
    "dosage": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "doseAndRate": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "doseQuantity": {
                  "type": "object",
                  "properties": {
                    "value": { "type": "number" },
                    "unit": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "extension": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "valueBoolean": { "type": "boolean", "description": "caregiver_verification_status" }
        }
      }
    }
  },
  "required": ["resourceType", "status", "medicationCodeableConcept", "subject"]
}
```

## 4. API Endpoint Schemas & CRDT Delta Payloads

### `POST /api/v1/sync/delta`

**Request Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Delta Sync Request",
  "type": "object",
  "properties": {
    "client_id": { "type": "string" },
    "client_timestamp": { "type": "string", "format": "date-time" },
    "vector_clock": {
      "type": "object",
      "additionalProperties": { "type": "integer" }
    },
    "compressed_payload": {
      "type": "string",
      "description": "base64-encoded binary/json string with max length enforcing <50 KB budget",
      "maxLength": 68266
    },
    "mutations_count": { "type": "integer", "minimum": 0 }
  },
  "required": ["client_id", "client_timestamp", "vector_clock", "compressed_payload", "mutations_count"]
}
```

**Response Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Delta Sync Response",
  "type": "object",
  "properties": {
    "server_timestamp": { "type": "string", "format": "date-time" },
    "sync_status": {
      "type": "string",
      "enum": ["ACK", "CONFLICT"]
    },
    "server_vector_clock": {
      "type": "object",
      "additionalProperties": { "type": "integer" }
    },
    "applied_mutations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["server_timestamp", "sync_status", "server_vector_clock", "applied_mutations"]
}
```

### `GET /api/v1/patients/{patient_id}/chi`

**Response Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Cognitive Health Index Response",
  "type": "object",
  "properties": {
    "patient_id": { "type": "string" },
    "chi_score_current": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "chi_trendline_30d": {
      "type": "array",
      "items": { "type": "integer" },
      "minItems": 0,
      "maxItems": 30
    },
    "rolling_latency_ms": {
      "type": "object",
      "properties": {
        "mean": { "type": "number" },
        "std_dev": { "type": "number" }
      },
      "required": ["mean", "std_dev"]
    },
    "anomaly_alert": {
      "type": ["object", "null"],
      "properties": {
        "anomaly_type": { "type": "string" },
        "severity": { "type": "string", "enum": ["Low", "Medium", "High", "Critical"] },
        "trigger_timestamp": { "type": "string", "format": "date-time" }
      },
      "required": ["anomaly_type", "severity", "trigger_timestamp"]
    }
  },
  "required": ["patient_id", "chi_score_current", "chi_trendline_30d", "rolling_latency_ms", "anomaly_alert"]
}
```

### `POST /api/v1/alerts/sos`

**Request Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SOS Alert Request",
  "type": "object",
  "properties": {
    "patient_id": { "type": "string" },
    "gps_coordinates": {
      "type": "object",
      "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
      },
      "required": ["lat", "lng"]
    },
    "trigger_source": {
      "type": "string",
      "enum": ["patient_one_touch", "anomaly_detector"]
    },
    "timestamp": { "type": "string", "format": "date-time" }
  },
  "required": ["patient_id", "gps_coordinates", "trigger_source", "timestamp"]
}
```

**Response Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SOS Alert Response",
  "type": "object",
  "properties": {
    "alert_id": { "type": "string", "format": "uuid" },
    "dispatched_recipients": {
      "type": "array",
      "items": { "type": "string" }
    },
    "delivery_status": {
      "type": "string",
      "enum": ["PENDING", "DELIVERED", "FAILED"]
    }
  },
  "required": ["alert_id", "dispatched_recipients", "delivery_status"]
}
```

## 5. Edge Database SQL DDL

```sql
-- SQLite DDL Scripts for Local-First Edge Database

CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    name_alias TEXT NOT NULL,
    demographics_json TEXT NOT NULL,
    baseline_moca INTEGER CHECK(baseline_moca >= 0 AND baseline_moca <= 30),
    preferred_lang TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE telemetry_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    game_id TEXT NOT NULL CHECK(game_id IN ('smriti_mandir', 'dhwani_tarang', 'dhyaan_kendra', 'dainik_dinlipi')),
    task_identifier TEXT NOT NULL,
    completion_time_ms INTEGER NOT NULL CHECK(completion_time_ms >= 0),
    error_count INTEGER NOT NULL CHECK(error_count >= 0),
    hesitation_pause_ms INTEGER NOT NULL CHECK(hesitation_pause_ms >= 0),
    audio_voice_latency_ms INTEGER CHECK(audio_voice_latency_ms >= 0),
    metrics_json TEXT, -- Supplemental data
    timestamp DATETIME NOT NULL,
    synced_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(synced_status IN ('PENDING', 'IN_FLIGHT', 'SYNCED'))
);

CREATE INDEX idx_telemetry_events_session_id ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_events_synced_status ON telemetry_events(synced_status);

CREATE TABLE medication_logs (
    id TEXT PRIMARY KEY,
    rxnorm_code TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    confirmed_at DATETIME,
    caregiver_verification_status BOOLEAN DEFAULT 0,
    synced_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(synced_status IN ('PENDING', 'IN_FLIGHT', 'SYNCED'))
);

CREATE INDEX idx_medication_logs_scheduled_at ON medication_logs(scheduled_at);
CREATE INDEX idx_medication_logs_synced_status ON medication_logs(synced_status);

CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    mutation_type TEXT NOT NULL CHECK(mutation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    crdt_vector TEXT NOT NULL,
    payload_blob BLOB NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);
```
