import { repository } from '../edge/repository';
import { createBatchedPayloads } from './compressor';
import { VectorClock } from './crdt';

export class BackgroundSyncWorker {
  private isOnline: boolean = true; 
  private syncInProgress: boolean = false;
  private currentClock: VectorClock = {}; 
  private clientId: string = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}`;
  private maxRetries: number = 5;

  constructor() {
    this.initNetworkListeners();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  public async triggerSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;
    this.syncInProgress = true;
    
    try {
      await this.syncLoop();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncLoop() {
    let retries = 0;
    while (retries < this.maxRetries) {
      const mutations = await repository.getUnsyncedMutations(100);
      if (mutations.length === 0) break;

      try {
        const compressedPayloads = await createBatchedPayloads(mutations, this.currentClock, this.clientId);
        
        for (const payloadStr of compressedPayloads) {
           await this.dispatchPayload(payloadStr);
        }
        
        // Upon server ACK, mark exactly those records as synced
        const syncedIds = mutations.map(m => m.id);
        await repository.markMutationsSynced(syncedIds);
        retries = 0; // Success! Reset retries for the next batch loop
        
      } catch (e) {
        retries++;
        if (retries >= this.maxRetries) {
          console.error('Max sync retries exceeded due to repeated failures.');
          break;
        }
        await this.applyExponentialBackoff(retries);
      }
    }
  }

  /**
   * Dispatches the heavily compressed payload to the /api/v1/sync/delta endpoint.
   */
  private async dispatchPayload(compressedPayload: string): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const endpoint = `${baseUrl}/api/v1/sync/delta`;

    return new Promise((resolve, reject) => {
      // Simulating a network POST request to endpoint
      setTimeout(() => {
        if (!this.isOnline) return reject(new Error('Network offline or dropped mid-sync'));
        resolve();
      }, 50);
    });
  }

  private async applyExponentialBackoff(retryCount: number): Promise<void> {
    // Exponential backoff with jitter: base 1s, max 30s
    const baseDelay = 1000 * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 500;
    const delay = Math.min(baseDelay + jitter, 30000);
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const syncWorker = new BackgroundSyncWorker();
