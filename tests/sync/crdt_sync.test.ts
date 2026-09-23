import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { compareVectorClocks, resolveConflict, generateDeltaPayload, VectorClock } from '../../src/sync/crdt';
import { compressDeltaBundle, decompressDeltaBundle, enforcePayloadBudget, createBatchedPayloads } from '../../src/sync/compressor';
import { syncWorker } from '../../src/sync/worker';
import { repository } from '../../src/edge/repository';
import { db, SyncQueue } from '../../src/edge/db';

function safeBtoa(str: string): string {
  // @ts-ignore
  if (typeof btoa !== 'undefined') return btoa(str);
  return Buffer.from(str, 'binary').toString('base64');
}

describe('CRDT Module', () => {
  it('should correctly order vector clocks', () => {
    const v1: VectorClock = { A: 1, B: 2 };
    const v2: VectorClock = { A: 1, B: 3 };
    const v3: VectorClock = { A: 2, B: 1 };

    expect(compareVectorClocks(v1, v2)).toBe('BEFORE');
    expect(compareVectorClocks(v2, v1)).toBe('AFTER');
    expect(compareVectorClocks(v1, v1)).toBe('EQUAL');
    expect(compareVectorClocks(v1, v3)).toBe('CONCURRENT');
  });

  it('should resolve concurrent branches deterministically using LWW (Last-Write-Wins)', () => {
    const itemA = { id: '1', timestamp: '2023-10-27T10:00:00Z', val: 'old' };
    const itemB = { id: '1', timestamp: '2023-10-27T10:05:00Z', val: 'new' };

    const resolved = resolveConflict(itemA, itemB);
    expect(resolved.val).toBe('new');
    
    const resolvedReversed = resolveConflict(itemB, itemA);
    expect(resolvedReversed.val).toBe('new');
  });
});

describe('Compressor Module', () => {
  it('should compress and decompress preserving exact telemetry objects', async () => {
    const mutations: SyncQueue[] = [
      {
        id: 'mut1',
        mutation_type: 'INSERT',
        crdt_vector: '{"A":1}',
        payload_blob: safeBtoa(JSON.stringify({ test: 'data' })),
        retry_count: 0,
        created_at: new Date().toISOString()
      }
    ];
    const original = generateDeltaPayload(mutations, { A: 1 }, 'client-1');

    const compressed = await compressDeltaBundle(original);
    const decompressed = await decompressDeltaBundle(compressed);

    expect(decompressed).toEqual(original);
  });

  it('should guarantee a 1,000-event stress test batches strictly under 50 KB ceiling', async () => {
    const mutations: SyncQueue[] = [];
    for (let i = 0; i < 1000; i++) {
      mutations.push({
        id: `mut_${i}`,
        mutation_type: 'INSERT',
        crdt_vector: '{"A":1}',
        payload_blob: safeBtoa(JSON.stringify({ some_large_string: Array.from({length: 200}, () => Math.random().toString(36).charAt(2)).join('') })), // ~200 random chars each
        retry_count: 0,
        created_at: new Date().toISOString()
      });
    }

    const batchedPayloads = await createBatchedPayloads(mutations, { A: 1 }, 'client-1');

    expect(batchedPayloads.length).toBeGreaterThan(1); // Should have triggered chunking logic
    for (const batch of batchedPayloads) {
      const check = enforcePayloadBudget(batch);
      expect(check.withinBudget).toBe(true);
      expect(check.byteLength).toBeLessThanOrEqual(51200);
    }
  });
});

describe('Worker Module', () => {
  beforeEach(async () => {
    await db.telemetry_events.clear();
    await db.sync_queue.clear();
  });

  it('should package unsynced records and mark them as synced upon success', async () => {
    await repository.saveTelemetryEvent({
      session_id: 'sess-1',
      patient_id: 'pat-1',
      game_id: 'smriti_mandir',
      task_identifier: 'task_1',
      completion_time_ms: 500,
      error_count: 0,
      hesitation_pause_ms: 0,
      timestamp: new Date().toISOString()
    });

    const unsyncedBefore = await repository.getUnsyncedMutations();
    expect(unsyncedBefore.length).toBe(1);

    await syncWorker.triggerSync();

    const unsyncedAfter = await repository.getUnsyncedMutations();
    expect(unsyncedAfter.length).toBe(0);
  });
  
  it('should handle simulated offline drop, retry backoff, and successful online reconnection sync', async () => {
    let attempts = 0;
    // @ts-ignore
    const originalDispatch = syncWorker.dispatchPayload.bind(syncWorker);
    
    // @ts-ignore
    syncWorker.dispatchPayload = async (payload) => {
      attempts++;
      if (attempts === 1) {
        throw new Error('Simulated network drop');
      }
      return originalDispatch(payload);
    };
    
    // @ts-ignore - short-circuit the backoff for fast test execution
    syncWorker.applyExponentialBackoff = async () => {};

    await repository.saveTelemetryEvent({
      session_id: 'sess-2',
      patient_id: 'pat-2',
      game_id: 'dhwani_tarang',
      task_identifier: 'task_2',
      completion_time_ms: 100,
      error_count: 0,
      hesitation_pause_ms: 0,
      timestamp: new Date().toISOString()
    });
    
    await syncWorker.triggerSync();
    
    expect(attempts).toBe(2); // One failure, one retry success
    
    const unsyncedAfter = await repository.getUnsyncedMutations();
    expect(unsyncedAfter.length).toBe(0); // Resolved on retry
    
    // Restore Original Behavior
    // @ts-ignore
    syncWorker.dispatchPayload = originalDispatch;
  });
});
