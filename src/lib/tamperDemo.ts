import { saveEvidence, getSetting, setSetting, getDB, type EvidenceRecord } from './db';
import { getEvidenceSorted } from './seal';
import { useDemoLogStore } from '../store/demoLogStore';
import { useVerificationStore } from '../store/verificationStore';
import { getSessionKey } from './crypto';

export interface TamperBackup {
  id: string;
  originalRecord: EvidenceRecord;
  backupCipherBuffer: ArrayBuffer;
}

// Module-level persistent backup Map keyed by record.id
const tamperBackupMap = new Map<string, TamperBackup>();

/** Helper to extract ArrayBuffer from cipher field (Blob, ArrayBuffer, Uint8Array, or string) */
export async function extractArrayBuffer(cipher: unknown): Promise<ArrayBuffer> {
  if (cipher instanceof ArrayBuffer) {
    return cipher.slice(0);
  }
  if (cipher instanceof Uint8Array) {
    const copy = new Uint8Array(cipher.byteLength);
    copy.set(cipher);
    return copy.buffer;
  }
  if (typeof Blob !== 'undefined' && cipher instanceof Blob) {
    return await cipher.arrayBuffer();
  }
  if (typeof cipher === 'string') {
    const encoded = new TextEncoder().encode(cipher);
    const copy = new Uint8Array(encoded.byteLength);
    copy.set(encoded);
    return copy.buffer;
  }
  return new ArrayBuffer(0);
}

/** Check if a record or any record is currently tampered */
export function isRecordTampered(id: string): boolean {
  return tamperBackupMap.has(id);
}

export function hasAnyTampered(): boolean {
  return tamperBackupMap.size > 0;
}

export function listTamperedIds(): string[] {
  return Array.from(tamperBackupMap.keys());
}

/**
 * Hydrate in-memory backups from IndexedDB settings (survives page reload)
 */
export async function initTamperBackups(): Promise<void> {
  try {
    const db = await getDB();
    const allKeys = await db.getAllKeys('settings');
    const backupKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith('tamperBackup:'));

    for (const key of backupKeys) {
      const backup = await getSetting<TamperBackup>(key as string);
      if (backup && backup.id && backup.originalRecord) {
        tamperBackupMap.set(backup.id, backup);
      }
    }
  } catch (err) {
    console.warn('Failed to load tamper backups from IndexedDB:', err);
  }
}

/**
 * Tamper the NEWEST evidence record (top of Timeline).
 */
export async function tamperNewestRecord(): Promise<{ ok: boolean; id?: string; error?: string }> {
  const logStore = useDemoLogStore.getState();

  // If vault is locked, warn in DemoControlBar log
  const sessionKey = getSessionKey();
  if (!sessionKey) {
    logStore.addLog('Vault is locked. Tampering ciphertext, but unlock with Real PIN is required to verify seal.', 'warn');
  }

  // Hydrate in case of fresh load
  if (tamperBackupMap.size === 0) {
    await initTamperBackups();
  }

  // 1. Fetch all records and sort newest first (same as top of Timeline)
  const sorted = await getEvidenceSorted();
  if (sorted.length === 0) {
    logStore.addLog('No evidence records found to tamper with', 'warn');
    return { ok: false, error: 'no_records' };
  }

  const target = sorted[0];

  // 2. Check if already tampered (prevent double-flip from un-doing tamper)
  if (tamperBackupMap.has(target.id)) {
    logStore.addLog(`Record ${target.id.slice(0, 8)} already tampered`, 'warn');
    return { ok: false, id: target.id, error: 'already_tampered' };
  }

  // Check IndexedDB settings as well
  const storedBackup = await getSetting<TamperBackup>(`tamperBackup:${target.id}`);
  if (storedBackup) {
    tamperBackupMap.set(target.id, storedBackup);
    logStore.addLog(`Record ${target.id.slice(0, 8)} already tampered`, 'warn');
    return { ok: false, id: target.id, error: 'already_tampered' };
  }

  // 3. Deep-clone ciphertext into ArrayBuffer and store backup
  const clonedBuffer = await extractArrayBuffer(target.cipher);
  const backup: TamperBackup = {
    id: target.id,
    originalRecord: { ...target, cipher: clonedBuffer.slice(0) },
    backupCipherBuffer: clonedBuffer.slice(0),
  };

  tamperBackupMap.set(target.id, backup);
  await setSetting(`tamperBackup:${target.id}`, backup);

  // 4. Flip exactly one byte (XOR with 0xFF at position 16 or last byte)
  const byteView = new Uint8Array(clonedBuffer);
  const flipIndex = byteView.length > 16 ? 16 : Math.max(0, byteView.length - 1);
  byteView[flipIndex] ^= 0xff;

  // 5. Write back without changing sealHash, contentHash, or prevSealHash
  const tamperedRecord: EvidenceRecord = {
    ...target,
    cipher: byteView.buffer,
  };
  await saveEvidence(tamperedRecord);

  // 6. Clear cached verification state and notify
  useVerificationStore.getState().clearResult(target.id);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chuppi-evidence-updated', {
        detail: { id: target.id, action: 'tamper' },
      })
    );
  }

  logStore.addLog(
    `Tampered newest record ${target.id.slice(0, 8)} (flipped byte at offset ${flipIndex}) — seal check should fail`,
    'warn'
  );

  return { ok: true, id: target.id };
}

/**
 * Restore the tampered record back to original unmodified ciphertext.
 */
export async function restoreTamperedRecord(targetId?: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const logStore = useDemoLogStore.getState();

  if (tamperBackupMap.size === 0) {
    await initTamperBackups();
  }

  if (tamperBackupMap.size === 0) {
    logStore.addLog('nothing to restore', 'warn');
    return { ok: false, error: 'nothing_to_restore' };
  }

  // Find target id or pick the first available
  const idToRestore = targetId || Array.from(tamperBackupMap.keys())[0];
  const backup = tamperBackupMap.get(idToRestore);

  if (!backup) {
    logStore.addLog('nothing to restore', 'warn');
    return { ok: false, error: 'nothing_to_restore' };
  }

  // Restore unmodified original record
  const cleanRecord: EvidenceRecord = {
    ...backup.originalRecord,
    cipher: backup.backupCipherBuffer.slice(0),
  };
  await saveEvidence(cleanRecord);

  // Delete backup from Map and settings
  tamperBackupMap.delete(idToRestore);
  try {
    const db = await getDB();
    await db.delete('settings', `tamperBackup:${idToRestore}`);
  } catch (err) {
    console.warn('Failed to delete tamper backup from settings:', err);
  }

  // Clear cached verification state and notify
  useVerificationStore.getState().clearResult(idToRestore);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chuppi-evidence-updated', {
        detail: { id: idToRestore, action: 'restore' },
      })
    );
  }

  logStore.addLog(
    `Restored record ${idToRestore.slice(0, 8)} ciphertext — seal is valid again`,
    'info'
  );

  return { ok: true, id: idToRestore };
}

/**
 * Clear all tamper backups (used when resetting database).
 */
export async function clearAllTamperBackups(): Promise<void> {
  tamperBackupMap.clear();
  useVerificationStore.getState().clearAll();
  try {
    const db = await getDB();
    const allKeys = await db.getAllKeys('settings');
    const backupKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith('tamperBackup:'));
    for (const key of backupKeys) {
      await db.delete('settings', key);
    }
  } catch (err) {
    console.warn('Failed to clear tamper backups from settings:', err);
  }
}
