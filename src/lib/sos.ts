import { getGuardians, saveAlert, type AlertRecord } from './db';
import { useDemoLogStore } from '../store/demoLogStore';
import { getLocation } from './geo';
import { sendAlertEmail } from '../services/emailAlertService';

export async function silentSOS(reason: 'decoy_pin' | 'manual' = 'decoy_pin'): Promise<void> {
  const pos = await getLocation({ timeoutMs: 3000 });
  const allGuardians = await getGuardians();
  const verifiedGuardians = allGuardians.filter((g) => g.verified);
  const guardianNames =
    verifiedGuardians.length > 0
      ? verifiedGuardians.map((g) => g.name).join(', ')
      : 'Demo Guardians';

  const alertRecord: AlertRecord = {
    id: 'alert-' + Math.random().toString(36).substring(2, 9),
    kind: reason,
    tsISO: new Date().toISOString(),
    lat: pos.lat,
    lng: pos.lng,
    recipients: verifiedGuardians.map((g) => `${g.name} (${g.contact})`),
    payloadSummary: `Silent SOS trigger (${reason})`,
    simulated: true,
  };

  await saveAlert(alertRecord);

  useDemoLogStore
    .getState()
    .addLog(`SOS sent to ${guardianNames} (${pos.lat}, ${pos.lng})`, 'sos');

  // Background fire-and-forget email alert (never delays UI transition)
  void sendAlertEmail('DECOY_COERCION_SOS', {
    alertRecordId: alertRecord.id,
    lat: pos.lat,
    lng: pos.lng,
    isApproximate: pos.locationSource === 'fallback',
  });
}

export async function dispatchGuardianAlert(
  reason: 'deadman_expired' | 'manual' = 'deadman_expired'
): Promise<void> {
  const pos = await getLocation({ timeoutMs: 3000 });
  const allGuardians = await getGuardians();
  const verifiedGuardians = allGuardians.filter((g) => g.verified);
  const guardianNames =
    verifiedGuardians.length > 0
      ? verifiedGuardians.map((g) => g.name).join(', ')
      : 'Demo Guardians';

  const caseId = 'case-' + Math.random().toString(36).substring(2, 8);

  const alertRecord: AlertRecord = {
    id: 'alert-' + Math.random().toString(36).substring(2, 9),
    kind: reason,
    tsISO: new Date().toISOString(),
    lat: pos.lat,
    lng: pos.lng,
    recipients: verifiedGuardians.map((g) => `${g.name} (${g.contact})`),
    payloadSummary: `Guardian alert (${reason}) with GPS & vault link`,
    simulated: true,
  };

  await saveAlert(alertRecord);

  useDemoLogStore
    .getState()
    .addLog(
      `Alert sent to: ${guardianNames} with GPS (${pos.lat}, ${pos.lng}) + encrypted vault link chuppi://vault/${caseId} (simulated)`,
      'sos'
    );

  // Background fire-and-forget email alert
  void sendAlertEmail('DEADMAN_TIMER_EXPIRED', {
    alertRecordId: alertRecord.id,
    lat: pos.lat,
    lng: pos.lng,
    isApproximate: pos.locationSource === 'fallback',
  });
}
