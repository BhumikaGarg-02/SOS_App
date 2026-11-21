import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  Clock,
  MapPin,
  Lock,
  Flame,
  HelpCircle,
  Database,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useDemoLogStore } from '../store/demoLogStore';
import { useDemoFlagsStore } from '../store/demoFlagsStore';
import { isArmed, remaining, arm, disarm, forceExpire } from '../lib/deadman';
import { silentSOS } from '../lib/sos';
import { lockNow } from '../lib/panic';
import { resetDatabase, getEvidence, saveEvidence, type EvidenceRecord } from '../lib/db';
import { getLimiterStatus } from '../lib/pinGuard';
import { getSessionKey } from '../lib/crypto';
import { createEvidence } from '../lib/seal';
import type { GpsMode } from '../lib/geo';

let tamperedRecordBackup: {
  id: string;
  cipher: ArrayBuffer | Uint8Array | string;
} | null = null;

export const DemoControlBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remTime, setRemTime] = useState<number>(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [limiterInfo, setLimiterInfo] = useState({
    isCoolingDown: false,
    attemptsCount: 0,
    remainingCooldownMs: 0,
  });

  const screen = useAppStore((s) => s.screen);
  const cover = useAppStore((s) => s.cover);
  const lang = useAppStore((s) => s.lang);
  const timerMode = useAppStore((s) => s.timerMode);
  const setTimerMode = useAppStore((s) => s.setTimerMode);
  const deadmanEndsAt = useAppStore((s) => s.deadmanEndsAt);
  const startFakeCall = useAppStore((s) => s.startFakeCall);

  const autoLockDisabled = useDemoFlagsStore((s) => s.autoLockDisabled);
  const setAutoLockDisabled = useDemoFlagsStore((s) => s.setAutoLockDisabled);
  const fallbackGps = useDemoFlagsStore((s) => s.fallbackGps);
  const setFallbackGps = useDemoFlagsStore((s) => s.setFallbackGps);
  const lastOtpHint = useDemoFlagsStore((s) => s.lastOtpHint);
  const gpsMode = useDemoFlagsStore((s) => s.gpsMode);
  const setGpsMode = useDemoFlagsStore((s) => s.setGpsMode);

  const logs = useDemoLogStore((s) => s.logs);
  const clearLogs = useDemoLogStore((s) => s.clearLogs);

  // Absent from DOM when URL has ?demo=0
  const isDemoDisabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '0';

  useEffect(() => {
    const timer = setInterval(() => {
      setRemTime(remaining());
      setLimiterInfo(getLimiterStatus());
    }, 500);
    return () => clearInterval(timer);
  }, [deadmanEndsAt]);

  if (isDemoDisabled) {
    return null;
  }

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetApp = async () => {
    if (window.confirm('Reset all app data, keys, and return to Onboarding?')) {
      localStorage.clear();
      await resetDatabase();
      window.location.reload();
    }
  };

  const handleFillDemoPins = () => {
    window.dispatchEvent(
      new CustomEvent('chuppi:fill-demo-pins', {
        detail: { real: '1947', decoy: '0000' },
      })
    );
    useDemoLogStore
      .getState()
      .addLog('Filled demo PINs: Real PIN: 1947, Decoy PIN: 0000', 'info');
  };

  const handleSeedEvidence = async () => {
    const key = getSessionKey();
    if (!key) {
      useDemoLogStore
        .getState()
        .addLog('Vault must be unlocked (Real PIN) to seed demo evidence', 'warn');
      return;
    }

    setIsSeeding(true);
    try {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      const seedItems = [
        {
          daysAgo: 21,
          type: 'note' as const,
          mime: 'text/plain',
          title: 'Night altercation and yelling',
          content:
            'Raised voice over household bills. Threatened to withhold money for groceries.',
          severity: 'high' as const,
          tags: ['Verbal', 'Threat', 'Financial'],
        },
        {
          daysAgo: 18,
          type: 'photo' as const,
          mime: 'image/jpeg',
          title: 'Bruise on wrist photo',
          content: new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9,
          ]),
          severity: 'medium' as const,
          tags: ['Physical'],
        },
        {
          daysAgo: 14,
          type: 'note' as const,
          mime: 'text/plain',
          title: 'Bank card taken away',
          content:
            'ATM debit card confiscated without permission so I could not purchase medicines.',
          severity: 'low' as const,
          tags: ['Financial'],
        },
        {
          daysAgo: 11,
          type: 'audio' as const,
          mime: 'audio/webm',
          title: 'Corridor argument recording',
          content: new Uint8Array([
            0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
            0x01,
          ]),
          severity: 'high' as const,
          tags: ['Verbal', 'Threat'],
        },
        {
          daysAgo: 8,
          type: 'note' as const,
          mime: 'text/plain',
          title: 'Phone snooping incident',
          content:
            'Demanded to see private WhatsApp chat history with college friends.',
          severity: 'medium' as const,
          tags: ['Digital'],
        },
        {
          daysAgo: 5,
          type: 'note' as const,
          mime: 'text/plain',
          title: 'Threat regarding family contact',
          content:
            'Warned not to call parents or inform anyone about domestic disputes.',
          severity: 'high' as const,
          tags: ['Threat', 'Verbal'],
        },
        {
          daysAgo: 3,
          type: 'photo' as const,
          mime: 'image/jpeg',
          title: 'Broken mug on floor',
          content: new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9,
          ]),
          severity: 'low' as const,
          tags: ['Physical'],
        },
        {
          daysAgo: 1,
          type: 'audio' as const,
          mime: 'audio/webm',
          title: 'Threat at doorway recording',
          content: new Uint8Array([
            0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
            0x01,
          ]),
          severity: 'high' as const,
          tags: ['Verbal', 'Threat'],
        },
      ];

      for (const item of seedItems) {
        const bytes =
          typeof item.content === 'string'
            ? new TextEncoder().encode(item.content)
            : item.content;
        const overrideTimestamp = new Date(
          now - item.daysAgo * dayMs
        ).toISOString();

        await createEvidence({
          bytes,
          mime: item.mime,
          type: item.type,
          severity: item.severity,
          tags: item.tags,
          title: item.title,
          overrideTimestamp,
        });
      }

      useDemoLogStore
        .getState()
        .addLog('Seeded 8 demo evidence records across past 3 weeks', 'info');
    } catch (err) {
      console.error(err);
      useDemoLogStore
        .getState()
        .addLog(
          'Failed to seed demo evidence: ' +
            (err instanceof Error ? err.message : String(err)),
          'warn'
        );
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTamper = async () => {
    const records = await getEvidence();
    if (records.length === 0) {
      useDemoLogStore
        .getState()
        .addLog('No evidence records found to tamper with', 'warn');
      return;
    }

    const target = records[Math.floor(records.length / 2)] || records[0];
    tamperedRecordBackup = { id: target.id, cipher: target.cipher };

    let raw: Uint8Array;
    if (target.cipher instanceof ArrayBuffer) {
      raw = new Uint8Array(target.cipher.slice(0));
    } else if (target.cipher instanceof Uint8Array) {
      raw = new Uint8Array(target.cipher);
    } else {
      raw = new TextEncoder().encode(target.cipher as string);
    }
    raw[0] ^= 0xff;

    const tampered: EvidenceRecord = {
      ...target,
      cipher: raw.buffer as ArrayBuffer,
    };
    await saveEvidence(tampered);

    useDemoLogStore
      .getState()
      .addLog(
        `Tampered record ${target.id} (flipped byte in ciphertext) — seal check should fail`,
        'warn'
      );
  };

  const handleRestore = async () => {
    if (!tamperedRecordBackup) {
      useDemoLogStore
        .getState()
        .addLog('No tampered record to restore', 'warn');
      return;
    }

    const records = await getEvidence();
    const target = records.find((r) => r.id === tamperedRecordBackup!.id);
    if (!target) {
      useDemoLogStore
        .getState()
        .addLog('Tampered record not found in database', 'warn');
      tamperedRecordBackup = null;
      return;
    }

    const restored: EvidenceRecord = {
      ...target,
      cipher: tamperedRecordBackup.cipher,
    };
    await saveEvidence(restored);

    useDemoLogStore
      .getState()
      .addLog(
        `Restored record ${tamperedRecordBackup.id} ciphertext — seal is valid again`,
        'info'
      );
    tamperedRecordBackup = null;
  };

  const armed = isArmed();
  const formatCountdown = (ms: number) => {
    const totalSecs = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="hidden lg:flex flex-col w-[320px] max-h-[min(860px,94vh)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-xs text-gray-800 z-40 select-none">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-3.5 py-2.5 bg-gray-900 text-white font-medium flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs tracking-wide">
            Demo Controls (Evaluator Only)
          </span>
        </div>
        <button type="button" className="text-gray-400 hover:text-white">
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-gray-100">
          {/* Live Status */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Live System Status
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Screen:</span>
                <span className="font-mono font-semibold text-gray-700">{screen}</span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Active Cover:</span>
                <span className="font-mono font-semibold text-gray-700">{cover}</span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Language:</span>
                <span className="font-semibold text-gray-700">
                  {lang === 'hi' ? 'Hindi (हिंदी)' : 'English'}
                </span>
              </div>
              <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                <span className="text-gray-400 block text-[10px]">OTP Hint:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {lastOtpHint || '1234'}
                </span>
              </div>
            </div>

            {/* Timer Status Card */}
            <div
              className={`p-2 rounded-lg border flex items-center justify-between ${
                armed
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock
                  className={`w-3.5 h-3.5 ${
                    armed ? 'text-amber-600 animate-pulse' : 'text-gray-400'
                  }`}
                />
                <div>
                  <div className="font-semibold text-[11px]">
                    {armed ? `ARMED (${formatCountdown(remTime)})` : 'DISARMED'}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Mode: {timerMode === 'demo' ? '15s Viva Demo' : '15m Real'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTimerMode(timerMode === 'demo' ? 'real' : 'demo')}
                className="px-2 py-0.5 text-[10px] font-medium bg-white rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Switch
              </button>
            </div>

            {/* PIN Limiter Status */}
            <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded border border-gray-100 text-[10px]">
              <span className="text-gray-500">PIN Limiter:</span>
              <span
                className={`font-semibold ${
                  limiterInfo.isCoolingDown
                    ? 'text-red-600 animate-pulse'
                    : 'text-emerald-600'
                }`}
              >
                {limiterInfo.isCoolingDown
                  ? `COOLDOWN (${Math.ceil(
                      limiterInfo.remainingCooldownMs / 1000
                    )}s)`
                  : `READY (${limiterInfo.attemptsCount}/5 wrong)`}
              </span>
            </div>
          </div>

          {/* Presenting Override Switch */}
          <div className="pt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="presenting-toggle"
                className="font-semibold text-gray-700 cursor-pointer"
              >
                Disable auto-lock (presenting)
              </label>
              <input
                id="presenting-toggle"
                type="checkbox"
                checked={autoLockDisabled}
                onChange={(e) => setAutoLockDisabled(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {autoLockDisabled && (
              <div className="bg-amber-100 border border-amber-300 text-amber-900 px-2 py-1 rounded text-[11px] font-medium">
                Auto-lock is OFF. Manual lock still works.
              </div>
            )}
            <p className="text-[10px] text-gray-500 leading-tight">
              Turn on before screen-sharing or switching windows; turn off to
              demonstrate Panic-Flip.
            </p>
          </div>

          {/* GPS Simulation Mode Selector */}
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              GPS Mode Override
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['real', 'denied', 'fallback'] as const).map((m: GpsMode) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setGpsMode(m);
                    useDemoLogStore
                      .getState()
                      .addLog(`GPS Mode switched to: ${m}`, 'info');
                  }}
                  className={`py-1 px-1 rounded text-[10px] font-semibold border transition-all ${
                    gpsMode === m
                      ? 'bg-[#2F6F73] text-white border-[#2F6F73] shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {m === 'real' ? 'Real' : m === 'denied' ? 'Force Denied' : 'Force Fallback'}
                </button>
              ))}
            </div>
          </div>

          {/* Phase 2: Evidence Engine Controls */}
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Evidence Engine (P2 Actions)
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={handleSeedEvidence}
                disabled={isSeeding}
                className="py-1.5 px-1 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded border border-teal-200 font-semibold text-[10px] flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Database className="w-2.5 h-2.5" />
                <span>{isSeeding ? 'Seeding…' : 'Seed 8 P2'}</span>
              </button>
              <button
                type="button"
                onClick={handleTamper}
                className="py-1.5 px-1 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 font-semibold text-[10px] flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Tamper</span>
              </button>
              <button
                type="button"
                onClick={handleRestore}
                className="py-1.5 px-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-semibold text-[10px] flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Restore</span>
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Evaluator Actions
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => arm('demobar')}
                className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-medium flex items-center justify-center gap-1"
              >
                <Clock className="w-3 h-3" /> Arm timer
              </button>
              <button
                type="button"
                onClick={() => disarm('demobar')}
                className="px-2 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded border border-gray-200 font-medium flex items-center justify-center gap-1"
              >
                Disarm timer
              </button>
              <button
                type="button"
                onClick={() => forceExpire()}
                className="px-2 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded border border-orange-200 font-medium flex items-center justify-center gap-1"
              >
                <Flame className="w-3 h-3" /> Force expire
              </button>
              <button
                type="button"
                onClick={() => silentSOS('decoy_pin')}
                className="px-2 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 font-medium flex items-center justify-center gap-1"
              >
                <ShieldAlert className="w-3 h-3" /> Decoy SOS
              </button>
              <button
                type="button"
                onClick={() => lockNow('Demo Bar Flip Test')}
                className="px-2 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 font-medium flex items-center justify-center gap-1"
              >
                <Lock className="w-3 h-3" /> Run Flip Test
              </button>
              <button
                type="button"
                onClick={handleFillDemoPins}
                className="px-2 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 font-medium flex items-center justify-center gap-1"
              >
                Fill demo PINs
              </button>
              <button
                type="button"
                onClick={() => startFakeCall(0)}
                className="col-span-2 px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 font-medium flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="w-3 h-3 text-rose-600" /> Trigger fake call now
              </button>
            </div>

            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const lat = prompt(
                    'Enter fallback latitude:',
                    String(fallbackGps.lat)
                  );
                  const lng = prompt(
                    'Enter fallback longitude:',
                    String(fallbackGps.lng)
                  );
                  if (lat && lng) {
                    setFallbackGps({
                      lat: parseFloat(lat),
                      lng: parseFloat(lng),
                    });
                  }
                }}
                className="flex-1 py-1 px-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded text-gray-700 flex items-center justify-center gap-1 text-[10px]"
              >
                <MapPin className="w-3 h-3 text-gray-400" /> Set fallback GPS
              </button>
              <button
                type="button"
                onClick={handleResetApp}
                className="py-1 px-2 bg-red-100 border border-red-300 hover:bg-red-200 text-red-800 rounded font-semibold flex items-center justify-center gap-1 text-[10px]"
              >
                <RotateCcw className="w-3 h-3" /> Reset App
              </button>
            </div>
          </div>

          {/* Trigger Cheat-Sheet */}
          <div className="pt-2 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              <HelpCircle className="w-3 h-3" /> Cover Triggers Cheat-Sheet
            </div>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 space-y-1.5 text-[10px] text-gray-600 leading-snug">
              <div>
                <strong className="text-gk-primary font-semibold block">
                  Ghar-Kharcha:
                </strong>
                • PIN:{' '}
                <code className="bg-white px-1 py-0.5 rounded border">1947=</code>{' '}
                Vault,{' '}
                <code className="bg-white px-1 py-0.5 rounded border">0000=</code>{' '}
                Fake Vault+SOS
                <br />• Dead-man:{' '}
                <code className="bg-white px-1 py-0.5 rounded border">15*1=</code>{' '}
                arms,{' '}
                <code className="bg-white px-1 py-0.5 rounded border">0*0=</code>{' '}
                disarms
              </div>
              <div>
                <strong className="text-cgpa-primary font-semibold block">
                  CGPA Buddy:
                </strong>
                • PIN in Roll Code + Calculate
                <br />• Dead-man: Attend 0 & Total 15 arms; 100 & 100 disarms
              </div>
              <div>
                <strong className="text-cycle-primary font-semibold block">
                  My Cycle:
                </strong>
                • PIN: Tap ring centre dial (4 digits)
                <br />• Dead-man: Water count 15 arms; 8 disarms
              </div>
              <div>
                <strong className="text-gray-700 font-semibold block">
                  CoverShell:
                </strong>
                • 3-sec long press on title toggles dead-man timer
              </div>
            </div>
          </div>

          {/* Live Scrolling Event Log */}
          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Event Log ({logs.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium flex items-center gap-0.5 text-gray-700"
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={clearLogs}
                  className="px-1.5 py-0.5 text-gray-400 hover:text-gray-600 text-[10px]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="h-36 overflow-y-auto bg-gray-950 text-gray-300 font-mono text-[10px] p-2 rounded-lg space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="leading-tight break-words">
                  <span className="text-gray-500 mr-1">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === 'sos'
                        ? 'text-red-400 font-bold'
                        : log.type === 'panic'
                        ? 'text-amber-400 font-semibold'
                        : log.type === 'timer'
                        ? 'text-cyan-400'
                        : log.type === 'warn'
                        ? 'text-yellow-300'
                        : 'text-gray-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
