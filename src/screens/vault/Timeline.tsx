import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import { getEvidenceSorted, getEvidenceMeta } from '../../lib/seal';
import { buildCasePacket, setActiveCasePacket } from '../../lib/casePacket';
import { EvidenceCard } from './EvidenceCard';
import type { EvidenceRecord } from '../../lib/db';
import { FileSpreadsheet, Filter } from 'lucide-react';

export const Timeline: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);

  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'photo' | 'note'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getEvidenceSorted();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load evidence', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('chuppi-evidence-updated', handleUpdate);
    return () => window.removeEventListener('chuppi-evidence-updated', handleUpdate);
  }, [loadData]);

  // Handle selection for case packet
  const handleToggleAddToCase = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  }, []);

  const handleGeneratePacket = async () => {
    const packet = await buildCasePacket(
      selectedIds.length > 0 ? selectedIds : undefined
    );
    setActiveCasePacket(packet);
    setScreen('casePacket');
  };

  // Computations for summary metrics
  const {
    thisWeekCount,
    last30Count,
    patternText,
    severityCounts,
    mostCommonTag,
    sparklineData,
  } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    let thisWeek = 0;
    let last30 = 0;
    const sev = { low: 0, medium: 0, high: 0 };
    const tagFreq: Record<string, number> = {};

    // 8 weeks sparkline: index 0 = 7 weeks ago, index 7 = current week
    const weeklyBuckets = new Array(8).fill(0);

    for (const r of records) {
      const meta = getEvidenceMeta(r);
      const ts = new Date(meta.isoTimestamp).getTime();
      const age = now - ts;

      if (age >= 0 && age < oneWeek) {
        thisWeek++;
      }
      if (age >= 0 && age < thirtyDays) {
        last30++;
      }

      if (meta.severity === 'low') sev.low++;
      else if (meta.severity === 'medium') sev.medium++;
      else if (meta.severity === 'high') sev.high++;

      for (const tag of meta.tags || []) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }

      const weekIndex = Math.floor(age / oneWeek);
      if (weekIndex >= 0 && weekIndex < 8) {
        weeklyBuckets[7 - weekIndex]++;
      }
    }

    let maxTag = '';
    let maxTagCount = 0;
    for (const [tag, count] of Object.entries(tagFreq)) {
      if (count > maxTagCount) {
        maxTagCount = count;
        maxTag = tag;
      }
    }

    let pattern = t('timelinePatternNone');
    if (thisWeek >= 3) pattern = t('timelinePatternOngoing');
    else if (thisWeek === 2) pattern = t('timelinePatternRecurring');
    else if (thisWeek === 1) pattern = t('timelinePatternIsolated');

    return {
      thisWeekCount: thisWeek,
      last30Count: last30,
      patternText: pattern,
      severityCounts: sev,
      mostCommonTag: maxTag,
      sparklineData: weeklyBuckets,
    };
  }, [records, t]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const meta = getEvidenceMeta(r);
      if (typeFilter !== 'all' && meta.type !== typeFilter) return false;
      if (severityFilter !== 'all' && meta.severity !== severityFilter) return false;
      return true;
    });
  }, [records, typeFilter, severityFilter]);

  // Group filtered records by day
  const groupedByDay = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const groups: { label: string; items: EvidenceRecord[] }[] = [];
    const map = new Map<string, EvidenceRecord[]>();

    for (const r of filteredRecords) {
      const meta = getEvidenceMeta(r);
      const d = new Date(meta.isoTimestamp);
      const dayKey = d.toDateString();

      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(r);
    }

    for (const [dayKey, items] of map.entries()) {
      let label = dayKey;
      if (dayKey === todayStr) {
        label = t('timelineGroupToday');
      } else if (dayKey === yesterdayStr) {
        label = t('timelineGroupYesterday');
      } else {
        const d = new Date(dayKey);
        label = d.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      groups.push({ label, items });
    }

    return groups;
  }, [filteredRecords, t]);

  const totalSev =
    severityCounts.low + severityCounts.medium + severityCounts.high;
  const maxWeekly = Math.max(1, ...sparklineData);

  return (
    <div
      className="flex-1 flex flex-col p-4 overflow-y-auto select-none bg-[#F4F8F8]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header & Case Packet Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-bold text-[#16302F]">
          {t('timelineTitle')}
        </h2>
        <button
          type="button"
          onClick={handleGeneratePacket}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F6F73] hover:bg-[#255a5d] text-white text-xs font-semibold rounded-xl shadow-sm transition-all tap-target"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{t('timelineGenerate')}</span>
          {selectedIds.length > 0 && (
            <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[10px]">
              {selectedIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Summary Strip Card */}
      <div className="bg-white rounded-2xl border border-teal-100/80 shadow-sm p-3.5 mb-3.5 space-y-3">
        {/* Top metrics row */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              {patternText}
            </span>
            <div className="text-xs font-medium text-gray-700">
              {t('timelineThisWeek', { count: thisWeekCount })} •{' '}
              {t('timelineLast30', { count: last30Count })}
            </div>
          </div>

          {/* 8-week Sparkline SVG */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 mb-1">8-wk trend</span>
            <svg
              width="140"
              height="28"
              viewBox="0 0 140 28"
              className="overflow-visible"
            >
              {sparklineData.map((val, idx) => {
                const barWidth = 12;
                const gap = 5;
                const x = idx * (barWidth + gap);
                const height = val > 0 ? Math.max(4, (val / maxWeekly) * 24) : 2;
                const y = 28 - height;
                const isCurrent = idx === 7;
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx="2"
                    fill={isCurrent ? '#2F6F73' : val > 0 ? '#8BB3B5' : '#E2E8F0'}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Severity distribution bar & most common tag */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 text-[11px]">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>Low: {severityCounts.low}</span>
              <span>Med: {severityCounts.medium}</span>
              <span>High: {severityCounts.high}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full flex overflow-hidden">
              {totalSev > 0 ? (
                <>
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(severityCounts.low / totalSev) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${(severityCounts.medium / totalSev) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${(severityCounts.high / totalSev) * 100}%` }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
          </div>

          {mostCommonTag && (
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-gray-400 block">Top Tag</span>
              <span className="font-semibold text-gray-700 bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-100 text-[10px]">
                {mostCommonTag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none text-xs">
        <div className="flex items-center text-gray-400 pl-1 pr-0.5">
          <Filter className="w-3.5 h-3.5" />
        </div>

        {/* Type Filter Chips */}
        {(['all', 'audio', 'photo', 'note'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTypeFilter(mode)}
            className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-all border ${
              typeFilter === mode
                ? 'bg-[#2F6F73] text-white border-[#2F6F73] shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200'
            }`}
          >
            {mode === 'all'
              ? t('timelineFilterAll')
              : mode === 'audio'
              ? t('recordTabVoice')
              : mode === 'photo'
              ? t('recordTabPhoto')
              : t('recordTabNote')}
          </button>
        ))}

        <div className="h-4 w-px bg-gray-200 mx-1 shrink-0" />

        {/* Severity Filter Chips */}
        {(['all', 'low', 'medium', 'high'] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-all border ${
              severityFilter === sev
                ? 'bg-[#2F6F73] text-white border-[#2F6F73] shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200'
            }`}
          >
            {sev === 'all'
              ? t('timelineFilterAll')
              : sev === 'low'
              ? t('severityLow')
              : sev === 'medium'
              ? t('severityMedium')
              : t('severityHigh')}
          </button>
        ))}
      </div>

      {/* Vertical Timeline / Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8 text-gray-400 text-xs">
          {t('timelineLoading')}
        </div>
      ) : records.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-teal-100 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed max-w-[260px]">
            {t('evidenceNoRecords')}
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-gray-400">
          {t('timelineNoMatch')}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map((group) => (
            <div key={group.label} className="space-y-2.5">
              {/* Day header */}
              <div className="sticky top-0 z-10 py-1 bg-[#F4F8F8]/95 backdrop-blur-xs flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-0.5 rounded-full border border-teal-100 shadow-2xs">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-teal-100/80" />
                <span className="text-[10px] text-gray-400">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cards in day */}
              <div className="space-y-2.5 pl-1">
                {group.items.map((record) => (
                  <EvidenceCard
                    key={record.id}
                    record={record}
                    selected={selectedIds.includes(record.id)}
                    onAddToCase={handleToggleAddToCase}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
