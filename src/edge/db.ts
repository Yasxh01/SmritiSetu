import Dexie, { Table } from 'dexie';

export interface Patient {
  id: string;
  name_alias: string;
  demographics_json: string; // Will store encrypted
  baseline_moca: number;
  preferred_lang: string;
  created_at: string;
  updated_at: string;
}

export interface TelemetryEvent {
  id: string;
  session_id: string;
  game_id: 'smriti_mandir' | 'dhwani_tarang' | 'dhyaan_kendra' | 'dainik_dinlipi';
  task_identifier: string;
  completion_time_ms: number;
  error_count: number;
  hesitation_pause_ms: number;
  audio_voice_latency_ms?: number;
  frustration_index?: number;
  metrics_json?: string; // Encrypted metrics
  timestamp: string;
  synced_status: 'PENDING' | 'IN_FLIGHT' | 'SYNCED';
}

export interface MedicationLog {
  id: string;
  rxnorm_code: string;
  medication_name: string;
  scheduled_at: string;
  confirmed_at?: string;
  caregiver_verification_status: boolean;
  synced_status: 'PENDING' | 'IN_FLIGHT' | 'SYNCED';
}

export interface SyncQueue {
  id: string;
  mutation_type: 'INSERT' | 'UPDATE' | 'DELETE';
  crdt_vector: string;
  payload_blob: string; // Base64 or stringified JSON payload strictly <50KB
  retry_count: number;
  created_at: string;
}

export class SmritiSetuDatabase extends Dexie {
  patients!: Table<Patient, string>;
  telemetry_events!: Table<TelemetryEvent, string>;
  medication_logs!: Table<MedicationLog, string>;
  sync_queue!: Table<SyncQueue, string>;

  constructor(dbName = 'SmritiSetuEdgeDB') {
    super(dbName);
    this.version(1).stores({
      patients: 'id, preferred_lang, baseline_moca',
      telemetry_events: 'id, session_id, game_id, synced_status, timestamp, [game_id+synced_status]',
      medication_logs: 'id, rxnorm_code, scheduled_at, synced_status',
      sync_queue: 'id, mutation_type, retry_count, created_at'
    });
  }

  // Pre-populate helper for testing & development
  async prepopulateTestPatients() {
    if ((await this.patients.count()) === 0) {
      await this.patients.add({
        id: 'pat-100',
        name_alias: 'Dida (Test)',
        demographics_json: '{}', // Normally encrypted
        baseline_moca: 24,
        preferred_lang: 'as',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
}

export const db = new SmritiSetuDatabase();
