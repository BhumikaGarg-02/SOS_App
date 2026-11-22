import emailjs from '@emailjs/browser';
import { getSetting, setSetting, getGuardians, getAlerts, saveAlert, getDB, type GuardianRecord, type AlertRecord } from '../lib/db';
import { useDemoLogStore } from '../store/demoLogStore';
import type { CasePacketData } from '../lib/casePacket';

export const FALLBACK_EMAILJS_SERVICE_ID = 'service_1pv39bn';
export const FALLBACK_EMAILJS_TEMPLATE_ID = 'template_m9grtgi';
export const FALLBACK_EMAILJS_PUBLIC_KEY = 'tafJzH83eobVGX7xm';

export type AlertType =
  | 'GUARDIAN_OTP'
  | 'DECOY_COERCION_SOS'
  | 'DEADMAN_TIMER_EXPIRED'
  | 'CASE_SUMMARY_PACKET';

export type EmailStatus = 'Sent' | 'Fallback' | 'Failed';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface ResolvedEmailConfig extends EmailJSConfig {
  isConfigured: boolean;
  isOverride: boolean;
}

export interface SendResult {
  ok: boolean;
  status: EmailStatus;
  detail: string;
  recipient?: string;
}

export interface AlertEmailContext {
  alertRecordId?: string;
  lat?: number;
  lng?: number;
  isApproximate?: boolean;
  packet?: CasePacketData;
  otp?: string;
}

// In-memory cooldown trackers
let lastDecoySosTimestamp = 0;
const lastOtpTimestamps = new Map<string, number>(); // key: guardian id or contact
let deadmanEmailSent = false;

export function formatISTTimestamp(date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: true,
    });
    return `${formatter.format(date)} IST`;
  } catch {
    return `${date.toLocaleString()} IST`;
  }
}

export async function getResolvedEmailConfig(): Promise<ResolvedEmailConfig> {
  try {
    const saved = await getSetting<EmailJSConfig>('emailjsConfig');
    if (saved && saved.serviceId && saved.templateId && saved.publicKey) {
      return {
        serviceId: saved.serviceId.trim(),
        templateId: saved.templateId.trim(),
        publicKey: saved.publicKey.trim(),
        isConfigured: true,
        isOverride: true,
      };
    }
  } catch {
    // ignore
  }

  const envServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim();
  const envTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim();
  const envPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim();

  const serviceId = envServiceId || FALLBACK_EMAILJS_SERVICE_ID;
  const templateId = envTemplateId || FALLBACK_EMAILJS_TEMPLATE_ID;
  const publicKey = envPublicKey || FALLBACK_EMAILJS_PUBLIC_KEY;

  const isConfigured = Boolean(serviceId && templateId && publicKey);

  return {
    serviceId,
    templateId,
    publicKey,
    isConfigured,
    isOverride: false,
  };
}

export async function saveOverrideConfig(config: EmailJSConfig): Promise<void> {
  await setSetting('emailjsConfig', {
    serviceId: config.serviceId.trim(),
    templateId: config.templateId.trim(),
    publicKey: config.publicKey.trim(),
  });
}

export async function clearOverrideConfig(): Promise<void> {
  const d = await getDB();
  await d.delete('settings', 'emailjsConfig');
}

function isEmailAddress(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
}

function logEmailAttempt(
  alertType: AlertType | 'TEST',
  recipient: string,
  status: EmailStatus,
  detail: string
): void {
  const logStore = useDemoLogStore.getState();
  const msg = `Email ${alertType} to ${recipient}: ${status} (${detail})`;
  logStore.addLog(msg, status === 'Sent' ? 'info' : 'warn');
}

/**
 * Send raw EmailJS payload with 8-second timeout.
 * Never throws. Never includes credential values in logs or returned strings.
 */
async function sendRawEmail(
  toEmail: string,
  toName: string,
  subject: string,
  alertType: AlertType,
  timestamp: string,
  messageBody: string,
  gpsLink: string
): Promise<SendResult> {
  // Check online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const res: SendResult = {
      ok: false,
      status: 'Fallback',
      detail: 'device offline',
      recipient: toEmail,
    };
    logEmailAttempt(alertType, toEmail, res.status, res.detail);
    return res;
  }

  const config = await getResolvedEmailConfig();
  if (!config.isConfigured) {
    const res: SendResult = {
      ok: false,
      status: 'Fallback',
      detail: 'not configured',
      recipient: toEmail,
    };
    logEmailAttempt(alertType, toEmail, res.status, res.detail);
    return res;
  }

  const templateParams: Record<string, unknown> = {
    to_email: toEmail,
    to_name: toName,
    subject,
    alert_type: alertType,
    timestamp,
    message_body: messageBody,
    gps_link: gpsLink,
  };

  const timeoutPromise = new Promise<SendResult>((resolve) => {
    setTimeout(() => {
      resolve({
        ok: false,
        status: 'Failed',
        detail: 'request timed out (8s)',
        recipient: toEmail,
      });
    }, 8000);
  });

  const sendPromise = (async (): Promise<SendResult> => {
    try {
      const response = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        {
          publicKey: config.publicKey,
        }
      );

      if (response.status === 200 || response.text === 'OK') {
        return {
          ok: true,
          status: 'Sent',
          detail: 'Sent successfully',
          recipient: toEmail,
        };
      } else {
        return {
          ok: false,
          status: 'Failed',
          detail: `status ${response.status} ${response.text || ''}`.trim(),
          recipient: toEmail,
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = /quota|rate limit|limit reached|exceeded/i.test(errMsg);
      return {
        ok: false,
        status: isQuota ? 'Fallback' : 'Failed',
        detail: isQuota ? 'quota or rate limit reached' : (errMsg.slice(0, 80) || 'send rejected'),
        recipient: toEmail,
      };
    }
  })();

  const result = await Promise.race([sendPromise, timeoutPromise]);
  logEmailAttempt(alertType, toEmail, result.status, result.detail);
  return result;
}

// -------------------------------------------------------------
// Message Builders
// -------------------------------------------------------------

function buildOtpBody(otp: string): { subject: string; body: string } {
  const subject = 'Your Buddy verification code';
  const en = `Someone has listed you as a trusted contact in the Buddy app. Your 4-digit verification code is ${otp}. If you do not know this person, please ignore this email.`;
  const hi = `आपका सत्यापन कोड ${otp} है। यदि आप इस व्यक्ति को नहीं जानते तो इस ईमेल को अनदेखा करें।`;
  return { subject, body: `${en}\n\n${hi}` };
}

function buildDecoySosBody(
  timestamp: string,
  gpsLink: string,
  isApproximate: boolean
): { subject: string; body: string } {
  const subject = 'Urgent: silent alert from a person who listed you as a trusted contact';
  const approxText = isApproximate ? ' (approximate location)' : '';
  const en = `A silent alert was triggered at ${timestamp}. The person may be under pressure and unable to speak freely. Please check on them discreetly and safely. Latest location: ${gpsLink}${approxText}. If you believe they are in danger, contact local emergency services (112) or the Women Helpline (181).`;
  const hi = 'एक गुप्त अलर्ट भेजा गया है। हो सकता है वे दबाव में हों। कृपया सावधानी से उनसे संपर्क करें; खतरा लगे तो 112 या 181 पर कॉल करें।';
  return { subject, body: `${en}\n\n${hi}` };
}

function buildDeadmanBody(
  timestamp: string,
  gpsLink: string,
  isApproximate: boolean
): { subject: string; body: string } {
  const subject = 'Urgent: safety timer expired for a person who listed you as a trusted contact';
  const approxText = isApproximate ? ' (approximate location)' : '';
  const en = `A safety timer was not cancelled and expired at ${timestamp}. Please check on them discreetly and safely. Latest location: ${gpsLink}${approxText}. If you believe they are in danger, contact 112 or 181.`;
  const hi = 'एक सुरक्षा टाइमर बंद नहीं किया गया। कृपया सावधानी से उनका हालचाल पूछें; खतरा लगे तो 112 या 181 पर कॉल करें।';
  return { subject, body: `${en}\n\n${hi}` };
}

function buildCasePacketBody(packet: CasePacketData): { subject: string; body: string } {
  const subject = 'Incident summary shared with you';

  // Format up to 20 newest entries
  const sorted = [...packet.entries].reverse(); // newest first
  const top20 = sorted.slice(0, 20);
  const lines = top20.map((e) => {
    const loc = e.locationSource === 'gps' ? `GPS ${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}` : 'Approx/Unavailable';
    const cHash16 = e.contentHash.slice(0, 16);
    const sHash16 = e.sealHash.slice(0, 16);
    return `${e.isoTimestamp} | ${e.type} | ${e.severity} | ${loc} | CH:${cHash16} | SH:${sHash16}`;
  });

  if (sorted.length > 20) {
    lines.push(`+${sorted.length - 20} more`);
  }

  const enHeader = [
    `Case ID: ${packet.caseId}`,
    `Date Range: ${packet.dateRange.from.slice(0, 10)} to ${packet.dateRange.to.slice(0, 10)}`,
    `Incident Count: ${packet.incidentCount}`,
    `Pattern: ${packet.patternSummary}`,
    '',
    'Entries:',
    ...lines,
    '',
    `Chain Head Hash: ${packet.chainHeadHash}`,
    '',
    'No photos or audio are included. The SHA-256 seals can be used later to verify the originals.',
  ].join('\n');

  const hi = 'इस ईमेल में घटनाओं का केवल सारांश और SHA-256 सील हैं; कोई फ़ोटो या ऑडियो नहीं भेजा गया है।';

  return { subject, body: `${enHeader}\n\n${hi}` };
}

// -------------------------------------------------------------
// Public Send Functions
// -------------------------------------------------------------

/**
 * Send OTP email to the guardian currently being verified.
 * Cooldown: 30 seconds per guardian.
 */
export async function sendGuardianOtpEmail(
  guardian: GuardianRecord | { id: string; name: string; contact: string },
  otp: string
): Promise<SendResult> {
  const recipient = guardian.contact.trim();

  if (!isEmailAddress(recipient)) {
    const res: SendResult = {
      ok: false,
      status: 'Fallback',
      detail: 'no email on file',
      recipient,
    };
    logEmailAttempt('GUARDIAN_OTP', guardian.name || recipient, res.status, res.detail);
    return res;
  }

  const now = Date.now();
  const lastSent = lastOtpTimestamps.get(guardian.id || recipient) || 0;
  if (now - lastSent < 30000) {
    const res: SendResult = {
      ok: false,
      status: 'Fallback',
      detail: 'suppressed (cooldown)',
      recipient,
    };
    logEmailAttempt('GUARDIAN_OTP', recipient, res.status, res.detail);
    return res;
  }

  lastOtpTimestamps.set(guardian.id || recipient, now);

  const timestamp = formatISTTimestamp();
  const { subject, body } = buildOtpBody(otp);

  return sendRawEmail(recipient, guardian.name || 'Guardian', subject, 'GUARDIAN_OTP', timestamp, body, 'N/A');
}

/**
 * Send alert email to all verified guardians for a given alert type.
 * Returns array of results for each guardian.
 */
export async function sendAlertEmail(
  alertType: 'DECOY_COERCION_SOS' | 'DEADMAN_TIMER_EXPIRED' | 'CASE_SUMMARY_PACKET',
  ctx: AlertEmailContext = {}
): Promise<SendResult[]> {
  const now = Date.now();

  // Cooldown check for Decoy SOS (120s)
  if (alertType === 'DECOY_COERCION_SOS') {
    if (now - lastDecoySosTimestamp < 120000) {
      logEmailAttempt('DECOY_COERCION_SOS', 'all guardians', 'Fallback', 'suppressed (cooldown)');
      return [
        {
          ok: false,
          status: 'Fallback',
          detail: 'suppressed (cooldown)',
        },
      ];
    }
    lastDecoySosTimestamp = now;
  }

  // Dead-man sent guard
  if (alertType === 'DEADMAN_TIMER_EXPIRED') {
    if (deadmanEmailSent) {
      logEmailAttempt('DEADMAN_TIMER_EXPIRED', 'all guardians', 'Fallback', 'already sent for this expiry');
      return [
        {
          ok: false,
          status: 'Fallback',
          detail: 'already sent for this expiry',
        },
      ];
    }
    deadmanEmailSent = true;
  }

  const allGuardians = await getGuardians();
  const verifiedGuardians = allGuardians.filter((g) => g.verified);

  if (verifiedGuardians.length === 0) {
    logEmailAttempt(alertType, 'no verified guardians', 'Fallback', 'no verified guardians');
    return [
      {
        ok: false,
        status: 'Fallback',
        detail: 'no verified guardians',
      },
    ];
  }

  const timestamp = formatISTTimestamp();
  const lat = ctx.lat ?? 28.6139;
  const lng = ctx.lng ?? 77.209;
  const isApprox = Boolean(ctx.isApproximate);
  const gpsLink =
    alertType === 'CASE_SUMMARY_PACKET'
      ? 'N/A'
      : `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

  let subject = '';
  let messageBody = '';

  if (alertType === 'DECOY_COERCION_SOS') {
    const built = buildDecoySosBody(timestamp, gpsLink, isApprox);
    subject = built.subject;
    messageBody = built.body;
  } else if (alertType === 'DEADMAN_TIMER_EXPIRED') {
    const built = buildDeadmanBody(timestamp, gpsLink, isApprox);
    subject = built.subject;
    messageBody = built.body;
  } else if (alertType === 'CASE_SUMMARY_PACKET' && ctx.packet) {
    const built = buildCasePacketBody(ctx.packet);
    subject = built.subject;
    messageBody = built.body;
  }

  const results: SendResult[] = [];

  for (const guardian of verifiedGuardians) {
    const contact = guardian.contact.trim();
    if (!isEmailAddress(contact)) {
      const res: SendResult = {
        ok: false,
        status: 'Fallback',
        detail: 'no email on file',
        recipient: contact,
      };
      logEmailAttempt(alertType, `${guardian.name} (${contact})`, res.status, res.detail);
      results.push(res);
      continue;
    }

    const res = await sendRawEmail(contact, guardian.name, subject, alertType, timestamp, messageBody, gpsLink);
    results.push(res);
  }

  // If this was an SOS alert with a stored record id, update stored record with email status
  if (ctx.alertRecordId) {
    try {
      const alerts = await getAlerts();
      const target = alerts.find((a) => a.id === ctx.alertRecordId);
      if (target) {
        const hasSent = results.some((r) => r.status === 'Sent');
        const hasOffline = results.some((r) => r.detail === 'device offline');
        const summaryStatus: EmailStatus = hasSent
          ? 'Sent'
          : results.every((r) => r.status === 'Fallback')
          ? 'Fallback'
          : 'Failed';

        const updated: AlertRecord = {
          ...target,
          emailStatus: summaryStatus,
          emailDetail: results.map((r) => `${r.recipient || ''}: ${r.status}`).join('; '),
          retryPending: hasOffline,
        };
        await saveAlert(updated);
      }
    } catch (e) {
      console.warn('Failed to update alert record email status:', e);
    }
  }

  return results;
}

/** Reset deadman sent flag when rearmed */
export function resetDeadmanEmailFlag(): void {
  deadmanEmailSent = false;
}

/**
 * Send test email to an arbitrary recipient.
 */
export async function sendTestEmail(toEmail: string, toName = 'Tester'): Promise<SendResult> {
  const timestamp = formatISTTimestamp();
  const subject = 'Buddy Test Email';
  const en = 'This is a test email from the Buddy app confirming your EmailJS configuration is working.';
  const hi = 'यह बडी ऐप से भेजा गया परीक्षण ईमेल है जो पुष्टि करता है कि आपका ईमेल कॉन्फ़िगरेशन काम कर रहा है।';
  const body = `${en}\n\n${hi}`;

  return sendRawEmail(toEmail.trim(), toName, subject, 'GUARDIAN_OTP', timestamp, body, 'N/A');
}

/**
 * Offline retry for alerts that ended as Fallback due to offline.
 */
export async function retryPendingAlerts(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  try {
    const alerts = await getAlerts();
    const pending = alerts.filter((a) => a.retryPending === true);

    for (const alert of pending) {
      const alertType =
        alert.kind === 'deadman_expired' ? 'DEADMAN_TIMER_EXPIRED' : 'DECOY_COERCION_SOS';

      useDemoLogStore
        .getState()
        .addLog(`Retrying pending offline alert ${alert.id}...`, 'info');

      // Attempt send
      const results = await sendAlertEmail(alertType, {
        lat: alert.lat,
        lng: alert.lng,
      });

      const hasSent = results.some((r) => r.status === 'Sent');
      const updated: AlertRecord = {
        ...alert,
        retryPending: !hasSent,
        emailStatus: hasSent ? 'Sent' : 'Fallback',
        emailDetail: results.map((r) => `${r.recipient || ''}: ${r.status}`).join('; '),
      };
      await saveAlert(updated);

      useDemoLogStore
        .getState()
        .addLog(
          `Offline retry for ${alert.id} complete: ${updated.emailStatus}`,
          hasSent ? 'info' : 'warn'
        );
    }
  } catch (err) {
    console.error('Error during retryPendingAlerts:', err);
  }
}

let retryListenersInitialized = false;
export function initEmailAlertService(): void {
  if (retryListenersInitialized || typeof window === 'undefined') return;
  retryListenersInitialized = true;

  window.addEventListener('online', () => {
    retryPendingAlerts();
  });

  // Run on start
  setTimeout(() => {
    retryPendingAlerts();
  }, 2000);
}
