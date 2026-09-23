import { SyncQueue } from '../edge/db';
import { VectorClock, generateDeltaPayload, DeltaBundle } from './crdt';

export async function compressDeltaBundle(payload: DeltaBundle): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([jsonStr]).stream()
        .pipeThrough(new CompressionStream('deflate'));
      const response = new Response(stream);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return arrayBufferToBase64(buffer);
    } catch (e) {
      // Fallback
    }
  }

  // Fallback: simple base64 (string-compaction) for Node environments without CompressionStream
  return stringToBase64(jsonStr);
}

export async function decompressDeltaBundle(compressedBase64: string): Promise<DeltaBundle> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const buffer = base64ToArrayBuffer(compressedBase64);
      const stream = new Blob([buffer]).stream()
        .pipeThrough(new DecompressionStream('deflate'));
      const response = new Response(stream);
      const text = await response.text();
      return JSON.parse(text);
    } catch (e) {
      // Fallback
    }
  }
  
  // Fallback
  const jsonStr = base64ToString(compressedBase64);
  return JSON.parse(jsonStr);
}

export function enforcePayloadBudget(compressedBase64: string): { withinBudget: boolean; byteLength: number; maxAllowed: 51200 } {
  // Base64 byte length estimation: (length / 4) * 3
  let byteLength = (compressedBase64.length / 4) * 3;
  // Adjust for padding
  if (compressedBase64.endsWith('==')) byteLength -= 2;
  else if (compressedBase64.endsWith('=')) byteLength -= 1;

  const maxAllowed = 51200; // 50 KB

  return {
    withinBudget: byteLength <= maxAllowed,
    byteLength,
    maxAllowed
  };
}

export async function createBatchedPayloads(mutations: SyncQueue[], currentClock: VectorClock, clientId: string): Promise<string[]> {
  const payloads: string[] = [];
  let currentBatch: SyncQueue[] = [];
  
  for (const mutation of mutations) {
    currentBatch.push(mutation);
    const bundle = generateDeltaPayload(currentBatch, currentClock, clientId);
    const compressed = await compressDeltaBundle(bundle);
    const budget = enforcePayloadBudget(compressed);
    
    if (!budget.withinBudget) {
      // Revert the push and finalize batch
      currentBatch.pop();
      if (currentBatch.length === 0) {
        throw new Error("Single mutation exceeds 50 KB limit. This shouldn't happen with our schemas.");
      }
      const finalBundle = generateDeltaPayload(currentBatch, currentClock, clientId);
      payloads.push(await compressDeltaBundle(finalBundle));
      currentBatch = [mutation]; // Start next batch
    }
  }
  
  if (currentBatch.length > 0) {
    const finalBundle = generateDeltaPayload(currentBatch, currentClock, clientId);
    payloads.push(await compressDeltaBundle(finalBundle));
  }
  
  return payloads;
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // @ts-ignore
  if (typeof btoa !== 'undefined') return btoa(binary);
  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // @ts-ignore
  let binary;
  if (typeof atob !== 'undefined') {
    binary = atob(base64);
  } else {
    binary = Buffer.from(base64, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stringToBase64(str: string): string {
  const utf8 = unescape(encodeURIComponent(str));
  // @ts-ignore
  if (typeof btoa !== 'undefined') return btoa(utf8);
  return Buffer.from(utf8, 'binary').toString('base64');
}

function base64ToString(base64: string): string {
  // @ts-ignore
  let utf8;
  if (typeof atob !== 'undefined') {
    utf8 = atob(base64);
  } else {
    utf8 = Buffer.from(base64, 'base64').toString('binary');
  }
  return decodeURIComponent(escape(utf8));
}
