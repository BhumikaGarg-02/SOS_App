import { getSetting, setSetting } from './db';

// Helper: hex encoding / decoding
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// 1. sha256Hex
export async function sha256Hex(data: Uint8Array | ArrayBuffer | string): Promise<string> {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// 2. canonicalJSON (recursively sorted keys)
export function canonicalJSON(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJSON(item)).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((k) => {
    const val = (obj as Record<string, unknown>)[k];
    return `${JSON.stringify(k)}:${canonicalJSON(val)}`;
  });
  return '{' + pairs.join(',') + '}';
}

// 3. hashPin (PBKDF2-SHA256, 210,000 iterations, 16-byte salt)
export async function hashPin(
  pin: string,
  saltInput?: Uint8Array | string
): Promise<{ hash: string; salt: string }> {
  let saltBytes: Uint8Array;
  if (!saltInput) {
    saltBytes = crypto.getRandomValues(new Uint8Array(16));
  } else if (typeof saltInput === 'string') {
    saltBytes = hexToBytes(saltInput);
  } else {
    saltBytes = saltInput;
  }

  const enc = new TextEncoder();
  const pinKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 210000,
      hash: 'SHA-256',
    },
    pinKey,
    256
  );

  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(saltBytes),
  };
}

// 4. verifyPin
export async function verifyPin(
  pin: string,
  expectedHash: string,
  saltHex: string
): Promise<boolean> {
  const result = await hashPin(pin, saltHex);
  return result.hash === expectedHash;
}

// Module-level session key (in memory only, dropped on lock)
let sessionVaultKey: CryptoKey | null = null;

export function setSessionKey(key: CryptoKey | null): void {
  sessionVaultKey = key;
}

export function getSessionKey(): CryptoKey | null {
  return sessionVaultKey;
}

export function clearSessionKey(): void {
  sessionVaultKey = null;
}

// 5. deriveVaultKey(pin)
export async function deriveVaultKey(pin: string): Promise<CryptoKey> {
  // Check or initialize a separate stored kdfSalt
  let kdfSaltHex = await getSetting<string>('kdfSalt');
  if (!kdfSaltHex) {
    const randomSalt = crypto.getRandomValues(new Uint8Array(16));
    kdfSaltHex = bytesToHex(randomSalt);
    await setSetting('kdfSalt', kdfSaltHex);
  }
  const saltBytes = hexToBytes(kdfSaltHex);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 210000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );

  setSessionKey(aesKey);
  return aesKey;
}

// 7. encryptBytes
export async function encryptBytes(
  key: CryptoKey,
  bytes: Uint8Array | ArrayBuffer
): Promise<{ iv: string; cipher: ArrayBuffer }> {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  const cipher = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    data as unknown as BufferSource
  );

  return {
    iv: bytesToHex(ivBytes),
    cipher,
  };
}

// 8. decryptBytes
export async function decryptBytes(
  key: CryptoKey,
  ivHex: string,
  cipher: ArrayBuffer | Uint8Array
): Promise<ArrayBuffer> {
  const ivBytes = hexToBytes(ivHex);
  const data = cipher instanceof ArrayBuffer ? cipher : cipher.buffer;

  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    data as unknown as BufferSource
  );
}
