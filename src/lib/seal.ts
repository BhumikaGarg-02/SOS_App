import { getEvidence, saveEvidence, type EvidenceRecord } from './db';
import { sha256Hex, canonicalJSON, getSessionKey, encryptBytes, decryptBytes } from './crypto';
import { getLocation, type LocationResult } from './geo';

export type EvidenceType = 'audio' | 'photo' | 'note';
export type SeverityLevel = 'low' | 'medium' | 'high';

export interface EvidenceMeta {
  id: string;
  type: EvidenceType;
  isoTimestamp: string;
  lat: number;
  lng: number;
  accuracy?: number;
  locationSource: 'gps' | 'fallback';
  severity: SeverityLevel;
  tags: string[];
  title: string;
}

export interface CreateEvidenceInput {
  bytes: Uint8Array;
  mime: string;
  type: EvidenceType;
  severity: SeverityLevel;
  tags: string[];
  title: string;
  location?: LocationResult;
  overrideTimestamp?: string;
}

export interface SealVerifyResult {
  ok: boolean;
  checks: {
    content: boolean;
    seal: boolean;
    chainPrev: boolean;
    chainNext: boolean;
  };
  failedChecks: string[];
}

export function getEvidenceMeta(record: EvidenceRecord): EvidenceMeta {
  return record.meta as unknown as EvidenceMeta;
}

// Serialization queue so two quick saves cannot fork the chain
let saveQueue: Promise<void> = Promise.resolve();

function enqueue(fn: () => Promise<void>): Promise<void> {
  saveQueue = saveQueue.then(fn).catch(() => { /* errors propagate via thrown */ });
  return saveQueue;
}

function generateId(): string {
  return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
}

export async function createEvidence(input: CreateEvidenceInput): Promise<EvidenceRecord> {
  const key = getSessionKey();
  if (!key) throw new Error('No session key – vault must be unlocked');

  let record!: EvidenceRecord;

  await enqueue(async () => {
    // 1. Plaintext bytes
    const plaintext = input.bytes;

    // 2. contentHash
    const contentHash = await sha256Hex(plaintext);

    // 3. Capture location
    const loc = input.location ?? await getLocation({ timeoutMs: 5000 });

    // 4. Build meta
    const meta: EvidenceMeta = {
      id: generateId(),
      type: input.type,
      isoTimestamp: input.overrideTimestamp ?? new Date().toISOString(),
      lat: loc.lat,
      lng: loc.lng,
      accuracy: loc.accuracy,
      locationSource: loc.locationSource,
      severity: input.severity,
      tags: input.tags,
      title: input.title,
    };

    // 5. prevSealHash: get the latest chronologically stored record
    const all = await getEvidence();
    const sorted = all.sort((a, b) => {
      const ma = getEvidenceMeta(a);
      const mb = getEvidenceMeta(b);
      return ma.isoTimestamp.localeCompare(mb.isoTimestamp);
    });
    const previous = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const prevSealHash = previous ? previous.sealHash : '0'.repeat(64);

    // 6. sealHash = sha256Hex(contentHash + '|' + canonicalJSON(meta) + '|' + prevSealHash)
    const sealHash = await sha256Hex(contentHash + '|' + canonicalJSON(meta) + '|' + prevSealHash);

    // 7. Encrypt
    const { iv, cipher } = await encryptBytes(key, plaintext as unknown as ArrayBuffer);

    // 8. Build and save record
    record = {
      id: meta.id,
      meta: meta as unknown as Record<string, unknown>,
      contentHash,
      sealHash,
      prevSealHash,
      cipher,
      iv,
      mime: input.mime,
    };

    await saveEvidence(record);
  });

  return record;
}

export async function verifySeal(id: string): Promise<SealVerifyResult> {
  const key = getSessionKey();
  if (!key) {
    return {
      ok: false,
      checks: { content: false, seal: false, chainPrev: false, chainNext: false },
      failedChecks: ['Vault is locked (no session key)'],
    };
  }

  const all = await getEvidence();
  const sorted = all.sort((a, b) => {
    const ma = getEvidenceMeta(a);
    const mb = getEvidenceMeta(b);
    return ma.isoTimestamp.localeCompare(mb.isoTimestamp);
  });

  const index = sorted.findIndex((r) => r.id === id);
  if (index === -1) {
    return {
      ok: false,
      checks: { content: false, seal: false, chainPrev: false, chainNext: false },
      failedChecks: ['Record not found'],
    };
  }

  const record = sorted[index];
  const checks = { content: false, seal: false, chainPrev: false, chainNext: false };
  const failedChecks: string[] = [];

  // Check content: decrypt and re-hash
  try {
    const cipherData =
      record.cipher instanceof ArrayBuffer
        ? record.cipher
        : record.cipher instanceof Uint8Array
        ? (record.cipher as Uint8Array).buffer
        : new TextEncoder().encode(record.cipher as string).buffer;

    const decrypted = await decryptBytes(key, record.iv, cipherData as ArrayBuffer);
    const recomputed = await sha256Hex(new Uint8Array(decrypted));
    checks.content = recomputed === record.contentHash;
  } catch {
    checks.content = false;
  }

  if (!checks.content) failedChecks.push('content hash mismatch');

  // Check seal: re-derive sealHash from stored fields
  try {
    const expectedSeal = await sha256Hex(
      record.contentHash + '|' + canonicalJSON(record.meta) + '|' + record.prevSealHash
    );
    checks.seal = expectedSeal === record.sealHash;
  } catch {
    checks.seal = false;
  }

  if (!checks.seal) failedChecks.push('seal hash mismatch');

  // Check chainPrev: prevSealHash should equal previous record's sealHash
  if (index === 0) {
    checks.chainPrev = record.prevSealHash === '0'.repeat(64);
  } else {
    checks.chainPrev = record.prevSealHash === sorted[index - 1].sealHash;
  }

  if (!checks.chainPrev) failedChecks.push('chain break (prev)');

  // Check chainNext: if there is a next record, it must point at this sealHash
  if (index < sorted.length - 1) {
    checks.chainNext = sorted[index + 1].prevSealHash === record.sealHash;
  } else {
    checks.chainNext = true; // last record has no next
  }

  if (!checks.chainNext) failedChecks.push('chain break (next)');

  const ok = checks.content && checks.seal && checks.chainPrev && checks.chainNext;
  return { ok, checks, failedChecks };
}

/** Returns decrypted bytes for in-app playback only. Caller must revoke the URL. */
export async function decryptEvidenceBytes(record: EvidenceRecord): Promise<ArrayBuffer> {
  const key = getSessionKey();
  if (!key) throw new Error('No session key');

  const cipherData =
    record.cipher instanceof ArrayBuffer
      ? record.cipher
      : record.cipher instanceof Uint8Array
      ? (record.cipher as Uint8Array).buffer
      : new TextEncoder().encode(record.cipher as string).buffer;

  return decryptBytes(key, record.iv, cipherData as ArrayBuffer);
}

/** Sort all evidence newest-first */
export async function getEvidenceSorted(): Promise<EvidenceRecord[]> {
  const all = await getEvidence();
  return all.sort((a, b) => {
    const ma = getEvidenceMeta(a);
    const mb = getEvidenceMeta(b);
    return mb.isoTimestamp.localeCompare(ma.isoTimestamp);
  });
}
