import { getEvidence, getGuardians, saveAlert, type EvidenceRecord, type AlertRecord } from './db';
import { sha256Hex } from './crypto';
import { useDemoLogStore } from '../store/demoLogStore';
import { getEvidenceMeta } from './seal';
import { sendAlertEmail } from '../services/emailAlertService';

export interface SendPacketResult {
  sentCount: number;
  totalVerified: number;
  summaryText: string;
}

export interface CasePacketEntry {
  id: string;
  isoTimestamp: string;
  lat: number;
  lng: number;
  locationSource: 'gps' | 'fallback';
  severity: string;
  type: string;
  title: string;
  contentHash: string;
  sealHash: string;
}

export interface CasePacketData {
  caseId: string;
  generatedAt: string;
  dateRange: { from: string; to: string };
  incidentCount: number;
  patternSummary: string;
  entries: CasePacketEntry[];
  chainHeadHash: string;
}

export async function buildCasePacket(selectedIds?: string[]): Promise<CasePacketData> {
  const all = await getEvidence();
  const sorted = all.sort((a, b) => {
    const ma = getEvidenceMeta(a);
    const mb = getEvidenceMeta(b);
    return ma.isoTimestamp.localeCompare(mb.isoTimestamp);
  });

  const toInclude: EvidenceRecord[] =
    selectedIds && selectedIds.length > 0
      ? sorted.filter((r) => selectedIds.includes(r.id))
      : sorted;

  const entries: CasePacketEntry[] = toInclude.map((r) => {
    const m = getEvidenceMeta(r);
    return {
      id: r.id,
      isoTimestamp: m.isoTimestamp,
      lat: m.lat,
      lng: m.lng,
      locationSource: m.locationSource,
      severity: m.severity,
      type: m.type,
      title: m.title,
      contentHash: r.contentHash,
      sealHash: r.sealHash,
    };
  });

  const caseId = 'CP-' + Date.now().toString(36).toUpperCase();

  // Compute pattern summary
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const incidentsThisWeek = entries.filter(
    (e) => now - new Date(e.isoTimestamp).getTime() < oneWeekMs
  ).length;

  let patternSummary = 'No incidents yet';
  if (incidentsThisWeek >= 3) patternSummary = 'Ongoing pattern';
  else if (incidentsThisWeek === 2) patternSummary = 'Recurring';
  else if (incidentsThisWeek === 1) patternSummary = 'Isolated';

  const dateRange =
    entries.length > 0
      ? {
          from: entries[0].isoTimestamp,
          to: entries[entries.length - 1].isoTimestamp,
        }
      : { from: new Date().toISOString(), to: new Date().toISOString() };

  // Chain head = sealHash of last entry in full sorted set
  const chainHeadHash =
    sorted.length > 0 ? sorted[sorted.length - 1].sealHash : '0'.repeat(64);

  return {
    caseId,
    generatedAt: new Date().toISOString(),
    dateRange,
    incidentCount: entries.length,
    patternSummary,
    entries,
    chainHeadHash,
  };
}

let activeCasePacket: CasePacketData | null = null;

export function setActiveCasePacket(packet: CasePacketData | null): void {
  activeCasePacket = packet;
}

export function getActiveCasePacket(): CasePacketData | null {
  return activeCasePacket;
}

export async function sendPacketToGuardians(packet: CasePacketData): Promise<SendPacketResult> {
  const allGuardians = await getGuardians();
  const verified = allGuardians.filter((g) => g.verified);
  const names = verified.length > 0
    ? verified.map((g) => g.name).join(', ')
    : 'Demo Guardians';

  // Compute a summary hash for the packet
  const packetHash = await sha256Hex(
    JSON.stringify({ caseId: packet.caseId, chainHead: packet.chainHeadHash })
  );

  const alertRecord: AlertRecord = {
    id: 'alert-' + Math.random().toString(36).substring(2, 9),
    kind: 'manual',
    tsISO: new Date().toISOString(),
    lat: 0,
    lng: 0,
    recipients: verified.map((g) => `${g.name} (${g.contact})`),
    payloadSummary: `Case packet ${packet.caseId} (${packet.incidentCount} entries, chain: ${packetHash.slice(0, 8)}…)`,
    simulated: true,
  };

  await saveAlert(alertRecord);

  // Email metadata and hashes to verified guardians
  const emailResults = await sendAlertEmail('CASE_SUMMARY_PACKET', { packet });
  const sentCount = emailResults.filter((r) => r.status === 'Sent').length;

  useDemoLogStore.getState().addLog(
    `Case packet queued for ${names} — ID: ${packet.caseId} (Sent: ${sentCount}/${verified.length})`,
    'info'
  );

  return {
    sentCount,
    totalVerified: verified.length,
    summaryText: sentCount > 0 ? `Sent to ${sentCount} guardian(s)` : 'Queued (demo mode)',
  };
}
