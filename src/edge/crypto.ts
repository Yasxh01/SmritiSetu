export async function deriveEncryptionKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // @ts-ignore
  if (typeof btoa !== 'undefined') return btoa(binary);
  return Buffer.from(binary, 'binary').toString('base64'); // Fallback for Node environments without btoa
}

function base64ToBuffer(b64: string): ArrayBuffer {
  // @ts-ignore
  let binary;
  if (typeof atob !== 'undefined') {
    binary = atob(b64);
  } else {
    binary = Buffer.from(b64, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptPayload(data: object | string, key: CryptoKey): Promise<{ cipherText: string, iv: string, salt: string }> {
  const enc = new TextEncoder();
  const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    enc.encode(payloadStr)
  );

  return {
    cipherText: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: "" // To be populated by caller if they maintained a unique salt for this payload
  };
}

export async function decryptPayload(encryptedPackage: { cipherText: string, iv: string, salt?: string }, key: CryptoKey): Promise<object | string> {
  const dec = new TextDecoder();
  const ivBuffer = base64ToBuffer(encryptedPackage.iv);
  const cipherBuffer = base64ToBuffer(encryptedPackage.cipherText);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer)
    },
    key,
    cipherBuffer
  );

  const decryptedStr = dec.decode(decryptedBuffer);
  try {
    return JSON.parse(decryptedStr);
  } catch (e) {
    return decryptedStr;
  }
}
