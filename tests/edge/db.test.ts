import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { deriveEncryptionKey, encryptPayload, decryptPayload } from '../../src/edge/crypto';
import { db } from '../../src/edge/db';
import { repository, InboundTelemetryPayload } from '../../src/edge/repository';

// Note: Test framework assertions (e.g. Vitest/Jest `expect`, `describe`, `it`) are assumed to be loaded globally.

describe('Crypto Module', () => {
  it('should encrypt and decrypt a payload within <5ms', async () => {
    // Ensure WebCrypto polyfill works depending on test env. Node 19+ has it globally.
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const key = await deriveEncryptionKey('super_secret_passphrase', salt);
    
    const payload = { test: 'data', value: 123 };
    
    const startEnc = performance.now();
    const encrypted = await encryptPayload(payload, key);
    const encTime = performance.now() - startEnc;
    
    expect(encrypted.cipherText).toBeDefined();
    // Benchmark requirement: <5ms
    expect(encTime).toBeLessThan(5);

    const startDec = performance.now();
    const decrypted = await decryptPayload(encrypted, key);
    const decTime = performance.now() - startDec;
    
    expect(decrypted).toEqual(payload);
    // Benchmark requirement: <5ms
    expect(decTime).toBeLessThan(5);
  });
});

describe('Database and Repository', () => {
  afterEach(async () => {
    await db.telemetry_events.clear();
    await db.sync_queue.clear();
  });

  it('should insert simulated telemetry events from all 4 NER games and verify write latency', async () => {
    const games: Array<'smriti_mandir' | 'dhwani_tarang' | 'dhyaan_kendra' | 'dainik_dinlipi'> = [
      'smriti_mandir', 'dhwani_tarang', 'dhyaan_kendra', 'dainik_dinlipi'
    ];
    
    for (const game of games) {
      const payload: InboundTelemetryPayload = {
        session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
        patient_id: 'pat-123',
        game_id: game,
        task_identifier: `task_${game}_01`,
        completion_time_ms: 1200,
        error_count: 0,
        hesitation_pause_ms: 50,
        timestamp: new Date().toISOString()
      };
      
      const start = performance.now();
      const id = await repository.saveTelemetryEvent(payload);
      const duration = performance.now() - start;
      
      expect(id).toBeDefined();
      // Benchmark constraint: <15ms execution time to prevent UI thread lag.
      expect(duration).toBeLessThan(15);
    }
    
    const events = await db.telemetry_events.toArray();
    expect(events.length).toBe(4);
  });
  
  it('should query unsynced records and atomically transition them via the sync queue', async () => {
    const payload: InboundTelemetryPayload = {
      session_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      patient_id: 'pat-123',
      game_id: 'smriti_mandir',
      task_identifier: 'task_1',
      completion_time_ms: 1000,
      error_count: 0,
      hesitation_pause_ms: 10,
      timestamp: new Date().toISOString()
    };
    
    await repository.saveTelemetryEvent(payload);
    
    // Assert CRDT mutation queue was populated
    const unsynced = await repository.getUnsyncedMutations();
    expect(unsynced.length).toBe(1);
    expect(unsynced[0].mutation_type).toBe('INSERT');
    
    // Test Sync ACK loop logic
    await repository.markMutationsSynced([unsynced[0].id]);
    
    // Ensure cleanup of queue
    const afterSync = await repository.getUnsyncedMutations();
    expect(afterSync.length).toBe(0);
  });
});
