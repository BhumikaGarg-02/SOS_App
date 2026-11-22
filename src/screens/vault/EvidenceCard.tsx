import React, { useEffect, useRef, useState } from 'react';
import { Mic, Camera, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useT } from '../../i18n/useT';
import { verifySeal, decryptEvidenceBytes, getEvidenceMeta } from '../../lib/seal';
import { registerPanicCleanup } from '../../lib/panic';
import { useDemoLogStore } from '../../store/demoLogStore';
import { useVerificationStore } from '../../store/verificationStore';
import type { EvidenceRecord } from '../../lib/db';

interface EvidenceCardProps {
  record: EvidenceRecord;
  selected: boolean;
  onAddToCase: (id: string, checked: boolean) => void;
}

const severityStyle: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  high: 'bg-red-100 text-red-800 border-red-300',
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ record, selected, onAddToCase }) => {
  const { t } = useT();
  const addLog = useDemoLogStore((s) => s.addLog);
  const meta = getEvidenceMeta(record);

  const verifyResult = useVerificationStore((s) => s.results[record.id]);
  const isVerifying = useVerificationStore((s) => Boolean(s.verifying[record.id]));
  const setResult = useVerificationStore((s) => s.setResult);
  const setVerifying = useVerificationStore((s) => s.setVerifying);

  const [objectUrl, setObjectUrl] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [decryptError, setDecryptError] = useState(false);

  const urlRef = useRef<string>('');

  // Revoke on unmount and panic-lock
  useEffect(() => {
    const unregister = registerPanicCleanup(() => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = '';
      setObjectUrl('');
    });
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      unregister();
    };
  }, []);

  // Decrypt content when record mounts or changes
  useEffect(() => {
    let cancelled = false;

    const decryptContent = async () => {
      setDecryptError(false);
      try {
        const ab = await decryptEvidenceBytes(record);
        if (cancelled) return;

        if (meta.type === 'note') {
          setNoteText(new TextDecoder().decode(ab));
        } else {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          const blob = new Blob([ab], { type: record.mime });
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          setObjectUrl(url);
        }
      } catch {
        if (!cancelled) {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = '';
          setObjectUrl('');
          setNoteText('');
          setDecryptError(true);
        }
      }
    };

    decryptContent();

    return () => {
      cancelled = true;
    };
  }, [record.id, record.cipher, record.iv, meta.type, record.mime]);

  const handleVerify = async () => {
    setVerifying(record.id, true);
    try {
      const result = await verifySeal(record.id);
      setResult(record.id, result);
      addLog(
        result.ok
          ? `Seal verified OK: ${record.id.slice(0, 8)}`
          : `Seal FAILED for ${record.id.slice(0, 8)}: ${result.failedChecks.join(', ')}`,
        result.ok ? 'info' : 'warn'
      );
    } catch {
      setResult(record.id, {
        ok: false,
        checks: { content: false, seal: false, chainPrev: false, chainNext: false },
        failedChecks: ['content hash mismatch'],
      });
    }
  };

  const shortHash = record.sealHash.slice(0, 4) + '…' + record.sealHash.slice(-3);

  const dateStr = (() => {
    const d = new Date(meta.isoTimestamp);
    return (
      d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  })();

  const locationStr =
    meta.locationSource === 'gps'
      ? t('evidenceLocationApprox')
      : t('evidenceLocationUnavailable');

  const TypeIcon =
    meta.type === 'audio' ? Mic : meta.type === 'photo' ? Camera : FileText;

  const isPassing =
    verifyResult?.ok &&
    verifyResult.checks.content &&
    verifyResult.checks.seal &&
    verifyResult.checks.chainPrev &&
    verifyResult.checks.chainNext;

  return (
    <div
      className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 space-y-3"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <TypeIcon className="w-5 h-5 text-[#2F6F73]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#16302F] truncate">
            {meta.title ||
              (meta.type === 'audio'
                ? 'Voice Recording'
                : meta.type === 'photo'
                ? 'Photo'
                : 'Note')}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{dateStr}</p>
          <p className="text-[11px] text-gray-400">{locationStr}</p>
        </div>
        {/* Severity chip */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${severityStyle[meta.severity] ?? ''}`}
        >
          {meta.severity.charAt(0).toUpperCase() + meta.severity.slice(1)}
        </span>
      </div>

      {/* Tags */}
      {meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Media content */}
      {decryptError ? (
        <p className="text-xs text-red-500 italic">{t('decryptErrorNotice')}</p>
      ) : meta.type === 'note' ? (
        noteText ? (
          <p className="text-xs text-gray-700 bg-gray-50 rounded-xl p-2 border border-gray-100 whitespace-pre-wrap line-clamp-4">
            {noteText}
          </p>
        ) : null
      ) : meta.type === 'audio' ? (
        objectUrl ? (
          <audio
            controls
            controlsList="nodownload nofullscreen noremoteplayback"
            src={objectUrl}
            className="w-full h-9 rounded-lg"
          />
        ) : null
      ) : meta.type === 'photo' ? (
        objectUrl ? (
          <img
            src={objectUrl}
            alt="Evidence photo"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full max-h-40 rounded-xl object-contain border border-teal-100"
          />
        ) : null
      ) : null}

      {/* Hash + verify button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-gray-400 select-none">{shortHash}</span>
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-teal-200 text-[#2F6F73] hover:bg-teal-50 disabled:opacity-50 transition-colors"
        >
          {isVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
          {t('evidenceVerify')}
        </button>
      </div>

      {/* Verify result badge */}
      {verifyResult && (
        isPassing ? (
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: '#DCFCE7', color: '#16A34A' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#16A34A' }} />
            <span className="text-xs font-semibold">{t('evidenceVerifyPassing')}</span>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">{t('evidenceVerifyTampered')}</p>
              {verifyResult.failedChecks && verifyResult.failedChecks.length > 0 && (
                <p className="text-[10px] text-red-700 mt-0.5">{verifyResult.failedChecks.join(' • ')}</p>
              )}
            </div>
          </div>
        )
      )}

      {/* Add to Case Packet checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onAddToCase(record.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#2F6F73] focus:ring-[#2F6F73]"
        />
        <span className="text-xs text-gray-600">{t('evidenceAddToCase')}</span>
      </label>
    </div>
  );
};
