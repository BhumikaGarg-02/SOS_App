import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { fakeVaultSeed, type DecoyNote } from '../data/fakeVaultSeed';

export interface GuardianRecord {
  id: string;
  name: string;
  relation: string;
  contact: string;
  verified: boolean;
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  meta: Record<string, unknown>;
  contentHash: string;
  sealHash: string;
  prevSealHash: string;
  cipher: ArrayBuffer | Uint8Array | string;
  iv: string;
  mime: string;
}

export interface AlertRecord {
  id: string;
  kind: 'decoy_pin' | 'deadman_expired' | 'manual';
  tsISO: string;
  lat: number;
  lng: number;
  recipients: string[];
  payloadSummary: string;
  simulated: true;
}

interface ChuppiDB extends DBSchema {
  settings: {
    key: string;
    value: unknown;
  };
  guardians: {
    key: string;
    value: GuardianRecord;
  };
  evidence: {
    key: string;
    value: EvidenceRecord;
  };
  alerts: {
    key: string;
    value: AlertRecord;
  };
  decoy: {
    key: string;
    value: DecoyNote;
    indexes: { 'by-folder': string };
  };
}

const DB_NAME = 'chuppi_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChuppiDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ChuppiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChuppiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('guardians')) {
          db.createObjectStore('guardians', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('evidence')) {
          db.createObjectStore('evidence', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('decoy')) {
          const decoyStore = db.createObjectStore('decoy', { keyPath: 'id' });
          decoyStore.createIndex('by-folder', 'folder');
        }
      },
    });
  }
  return dbPromise;
}

// Settings helpers
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('settings', key)) as T | undefined;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

// Guardians helpers
export async function getGuardians(): Promise<GuardianRecord[]> {
  const db = await getDB();
  return db.getAll('guardians');
}

export async function saveGuardian(guardian: GuardianRecord): Promise<void> {
  const db = await getDB();
  await db.put('guardians', guardian);
}

export async function deleteGuardian(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('guardians', id);
}

// Alerts helpers
export async function getAlerts(): Promise<AlertRecord[]> {
  const db = await getDB();
  return db.getAll('alerts');
}

export async function saveAlert(alert: AlertRecord): Promise<void> {
  const db = await getDB();
  await db.put('alerts', alert);
}

// Evidence helpers (used in Phase 2)
export async function getEvidence(): Promise<EvidenceRecord[]> {
  const db = await getDB();
  return db.getAll('evidence');
}

export async function saveEvidence(evidence: EvidenceRecord): Promise<void> {
  const db = await getDB();
  await db.put('evidence', evidence);
}

// Decoy helpers
export async function getDecoyNotes(): Promise<DecoyNote[]> {
  const db = await getDB();
  const notes = await db.getAll('decoy');
  if (notes.length === 0) {
    await seedDecoyIfEmpty();
    return db.getAll('decoy');
  }
  return notes;
}

export async function saveDecoyNote(note: DecoyNote): Promise<void> {
  const db = await getDB();
  await db.put('decoy', note);
}

export async function deleteDecoyNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('decoy', id);
}

export async function seedDecoyIfEmpty(): Promise<void> {
  const db = await getDB();
  const count = await db.count('decoy');
  if (count === 0) {
    const tx = db.transaction('decoy', 'readwrite');
    for (const note of fakeVaultSeed) {
      await tx.store.put(note);
    }
    await tx.done;
  }
}

// Reset everything
export async function resetDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['settings', 'guardians', 'evidence', 'alerts', 'decoy'], 'readwrite');
  await tx.objectStore('settings').clear();
  await tx.objectStore('guardians').clear();
  await tx.objectStore('evidence').clear();
  await tx.objectStore('alerts').clear();
  await tx.objectStore('decoy').clear();
  await tx.done;
}
