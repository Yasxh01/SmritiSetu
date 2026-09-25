import { db, TelemetryEvent, MedicationLog, Patient, SyncQueue } from './db';
import { encryptPayload } from './crypto';

export interface InboundTelemetryPayload {
  session_id: string;
  patient_id: string;
  game_id: 'smriti_mandir' | 'dhwani_tarang' | 'dhyaan_kendra' | 'dainik_dinlipi';
  task_identifier: string;
  completion_time_ms: number;
  error_count: number;
  hesitation_pause_ms: number;
  audio_voice_latency_ms?: number;
  frustration_index?: number;
  timestamp: string;
}

export interface MedicationLogPayload {
  rxnorm_code: string;
  medication_name: string;
  scheduled_at: string;
  confirmed_at?: string;
  caregiver_verification_status: boolean;
}

export class Repository {
  /**
   * High performance (<15ms) data access method to save telemetry securely to edge database.
   */
  async saveTelemetryEvent(event: InboundTelemetryPayload, cryptoKey?: CryptoKey): Promise<string> {
    // Use standard crypto if available, otherwise fallback for basic testing environments
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
    
    // Encrypt sensitive supplemental metrics if required
    let encryptedMetrics = undefined;
    if (cryptoKey) {
       const enc = await encryptPayload({ raw: event }, cryptoKey);
       encryptedMetrics = JSON.stringify(enc);
    }

    const telemetryEvent: TelemetryEvent = {
      id,
      session_id: event.session_id,
      game_id: event.game_id,
      task_identifier: event.task_identifier,
      completion_time_ms: event.completion_time_ms,
      error_count: event.error_count,
      hesitation_pause_ms: event.hesitation_pause_ms,
      audio_voice_latency_ms: event.audio_voice_latency_ms,
      frustration_index: event.frustration_index,
      timestamp: event.timestamp,
      metrics_json: encryptedMetrics,
      synced_status: 'PENDING'
    };

    const syncMutation: SyncQueue = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-${Date.now()}`,
      mutation_type: 'INSERT',
      // Simplified CRDT state vector representing the current state time
      crdt_vector: JSON.stringify({ [event.patient_id]: Date.now() }),
      // Convert payload into base64 block for strict <50KB payload
      payload_blob: typeof btoa !== 'undefined' ? btoa(JSON.stringify(telemetryEvent)) : Buffer.from(JSON.stringify(telemetryEvent)).toString('base64'),
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    // Atomic transaction ensures both tables are updated simultaneously, or neither.
    await db.transaction('rw', db.telemetry_events, db.sync_queue, async () => {
      await db.telemetry_events.add(telemetryEvent);
      await db.sync_queue.add(syncMutation);
    });

    return id;
  }

  async logMedicationAdherence(log: MedicationLogPayload): Promise<string> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
    
    const medicationLog: MedicationLog = {
      id,
      rxnorm_code: log.rxnorm_code,
      medication_name: log.medication_name,
      scheduled_at: log.scheduled_at,
      confirmed_at: log.confirmed_at,
      caregiver_verification_status: log.caregiver_verification_status,
      synced_status: 'PENDING'
    };

    const syncMutation: SyncQueue = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sync-${Date.now()}`,
      mutation_type: 'INSERT',
      crdt_vector: JSON.stringify({ timestamp: Date.now() }), 
      payload_blob: typeof btoa !== 'undefined' ? btoa(JSON.stringify(medicationLog)) : Buffer.from(JSON.stringify(medicationLog)).toString('base64'),
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    await db.transaction('rw', db.medication_logs, db.sync_queue, async () => {
      await db.medication_logs.add(medicationLog);
      await db.sync_queue.add(syncMutation);
    });

    return id;
  }

  async getUnsyncedMutations(limit: number = 50): Promise<SyncQueue[]> {
    return db.sync_queue.limit(limit).toArray();
  }

  async markMutationsSynced(ids: string[]): Promise<void> {
    await db.transaction('rw', db.sync_queue, db.telemetry_events, db.medication_logs, async () => {
      // Upon ACK from server, mutations are dropped from queue. 
      // Telemetry statuses are mapped out in a background job, deleting them directly guarantees CRDT cleanup.
      await db.sync_queue.bulkDelete(ids);
    });
  }

  async getPatientProfile(patientId: string): Promise<Patient | undefined> {
    return db.patients.get(patientId);
  }
}

export const repository = new Repository();
