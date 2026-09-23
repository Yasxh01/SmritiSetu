import { SyncQueue } from '../edge/db';

export type VectorClock = Record<string, number>;

export function compareVectorClocks(v1: VectorClock, v2: VectorClock): 'EQUAL' | 'BEFORE' | 'AFTER' | 'CONCURRENT' {
  let isBefore = false;
  let isAfter = false;

  const allClients = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  for (const client of allClients) {
    const count1 = v1[client] || 0;
    const count2 = v2[client] || 0;

    if (count1 < count2) {
      isBefore = true;
    } else if (count1 > count2) {
      isAfter = true;
    }
  }

  if (isBefore && isAfter) return 'CONCURRENT';
  if (isBefore) return 'BEFORE';
  if (isAfter) return 'AFTER';
  return 'EQUAL';
}

export function resolveConflict<T extends { timestamp: string }>(itemA: T, itemB: T): T {
  // Last-Write-Wins (LWW) resolution tie-breaker using exact ISO string timestamps
  const timeA = new Date(itemA.timestamp).getTime();
  const timeB = new Date(itemB.timestamp).getTime();
  return timeA > timeB ? itemA : itemB;
}

export interface DeltaBundle {
  client_id: string;
  client_timestamp: string;
  vector_clock: VectorClock;
  mutations: SyncQueue[];
}

export function generateDeltaPayload(mutations: SyncQueue[], currentClock: VectorClock, clientId: string): DeltaBundle {
  return {
    client_id: clientId,
    client_timestamp: new Date().toISOString(),
    vector_clock: currentClock,
    mutations
  };
}
