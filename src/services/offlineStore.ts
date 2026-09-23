import Dexie, { type Table } from 'dexie';

export interface LocalTelemetryEvent {
  id: string;
  patient_id: string;
  session_id: string;
  game_id: string;
  completion_time_ms: number;
  error_count: number;
  hesitation_pause_ms: number;
  timestamp: string;
  synced: boolean;
}

export interface LocalMedicationLog {
  id: string;
  patient_id: string;
  title: string;
  scheduled_at: string;
  confirmed_at: string;
  status: 'taken' | 'missed';
  synced: boolean;
}

class SmritiDexieDB extends Dexie {
  telemetry!: Table<LocalTelemetryEvent, string>;
  medications!: Table<LocalMedicationLog, string>;

  constructor() {
    super('SmritiSetuLocalDB');
    this.version(1).stores({
      telemetry: 'id, patient_id, session_id, game_id, synced, timestamp',
      medications: 'id, patient_id, scheduled_at, synced',
    });
  }
}

export const localDb = new SmritiDexieDB();

export const offlineService = {
  async recordTelemetry(data: Omit<LocalTelemetryEvent, 'id' | 'synced'>): Promise<string> {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: LocalTelemetryEvent = {
      ...data,
      id,
      synced: false,
    };
    await localDb.telemetry.add(record);
    return id;
  },

  async recordMedication(data: Omit<LocalMedicationLog, 'id' | 'synced'>): Promise<string> {
    const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record: LocalMedicationLog = {
      ...data,
      id,
      synced: false,
    };
    await localDb.medications.add(record);
    return id;
  },

  async getPendingCount(): Promise<number> {
    const unSyncedTelemetry = await localDb.telemetry.where('synced').equals(0).count();
    const unSyncedMeds = await localDb.medications.where('synced').equals(0).count();
    return unSyncedTelemetry + unSyncedMeds;
  },

  async markAllSynced(): Promise<void> {
    await localDb.telemetry.toCollection().modify({ synced: true });
    await localDb.medications.toCollection().modify({ synced: true });
  },
};
