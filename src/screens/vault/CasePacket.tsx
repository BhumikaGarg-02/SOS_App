import React, { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import {
  getActiveCasePacket,
  buildCasePacket,
  sendPacketToGuardians,
  type CasePacketData,
} from '../../lib/casePacket';
import { ArrowLeft, Shield, Send, CheckCircle2, Lock } from 'lucide-react';

export const CasePacket: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);

  const [packet, setPacket] = useState<CasePacketData | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentSummary, setSentSummary] = useState<string>('');

  useEffect(() => {
    const existing = getActiveCasePacket();
    if (existing) {
      setPacket(existing);
    } else {
      buildCasePacket().then((p) => setPacket(p));
    }
  }, []);

  const handleSend = async () => {
    if (!packet || sent || sending) return;
    setSending(true);
    try {
      const res = await sendPacketToGuardians(packet);
      setSent(true);
      if (res.sentCount > 0) {
        setSentSummary(t('casePacketSentDetail', { count: res.sentCount }));
      } else {
        setSentSummary(t('casePacketQueuedDemo'));
      }
    } catch (err) {
      console.error('Failed to send case packet', err);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ' ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return iso;
    }
  };

  if (!packet) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-gray-400 text-xs">
        {t('casePacketGenerating')}
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#F4F8F8] overflow-y-auto p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-teal-100/80">
        <button
          type="button"
          onClick={() => setScreen('vault')}
          className="flex items-center gap-1 text-xs font-semibold text-[#2F6F73] hover:text-[#255a5d] p-1 -ml-1 tap-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('casePacketBackToTimeline')}</span>
        </button>
        <span className="text-[11px] font-mono text-gray-500 font-medium">
          {packet.caseId}
        </span>
      </div>

      {/* Read-only banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-xs flex items-center gap-2 mb-3.5 shadow-2xs">
        <Shield className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">{t('casePacketReadOnly')}</span>
      </div>

      {/* Packet Summary Card */}
      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 space-y-3 mb-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#16302F]">
            {t('casePacketTitle')}
          </h2>
          <span className="text-[10px] bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded-full border border-teal-100">
            {packet.patternSummary}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="text-gray-400 block text-[10px]">
              {t('casePacketIncidents')}
            </span>
            <span className="font-semibold text-gray-800 text-sm">
              {packet.incidentCount}
            </span>
          </div>
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="text-gray-400 block text-[10px]">
              {t('casePacketDateRange')}
            </span>
            <span className="font-medium text-gray-700 text-[10px] leading-tight block">
              {packet.entries.length > 0
                ? `${formatDate(packet.dateRange.from).slice(0, 11)} – ${formatDate(packet.dateRange.to).slice(0, 11)}`
                : 'None'}
            </span>
          </div>
        </div>

        {/* Chain head hash */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
            <Lock className="w-3 h-3 text-teal-700" />
            <span>{t('casePacketChainHead')}</span>
          </div>
          <div className="font-mono text-[10px] text-gray-600 break-all bg-white px-2 py-1 rounded border border-gray-200">
            {packet.chainHeadHash}
          </div>
        </div>

        {/* Send to Guardians Action */}
        <div className="pt-1">
          {sent ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('casePacketSent')}</span>
              </div>
              {sentSummary && (
                <p className="text-[11px] text-center text-gray-500 font-medium">
                  {sentSummary}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || packet.entries.length === 0}
              className="w-full h-11 bg-[#2F6F73] hover:bg-[#255a5d] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 tap-target transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending…' : t('casePacketSend')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Entries List Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {t('casePacketEntries')} ({packet.entries.length})
        </span>
        <span className="text-[10px] text-gray-400">{t('metadataOnly')}</span>
      </div>

      {/* Entries list */}
      <div className="space-y-2 mb-4">
        {packet.entries.map((entry, idx) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl border border-teal-100/70 p-3 space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800">
                #{idx + 1} {entry.title || entry.type.toUpperCase()}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  entry.severity === 'high'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : entry.severity === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {entry.severity.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>{formatDate(entry.isoTimestamp)}</span>
              <span>
                {entry.locationSource === 'gps'
                  ? `GPS ${entry.lat.toFixed(3)}, ${entry.lng.toFixed(3)}`
                  : 'GPS Unavailable'}
              </span>
            </div>

            <div className="pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-2 text-[9px] font-mono text-gray-500">
              <div>
                <span className="text-gray-400 block">Content:</span>
                <span className="truncate block" title={entry.contentHash}>
                  {entry.contentHash.slice(0, 6)}…{entry.contentHash.slice(-4)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Seal:</span>
                <span className="truncate block" title={entry.sealHash}>
                  {entry.sealHash.slice(0, 6)}…{entry.sealHash.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
