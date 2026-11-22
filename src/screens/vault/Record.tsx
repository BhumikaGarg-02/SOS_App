import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useT } from '../../i18n/useT';
import { getSessionKey } from '../../lib/crypto';
import { startAudioRecording, capturePhoto, type AudioRecorderControls } from '../../lib/recorder';
import { createEvidence, type SeverityLevel } from '../../lib/seal';
import { getLocation } from '../../lib/geo';
import { registerPanicCleanup } from '../../lib/panic';
import { ensureAudioUnlocked } from '../../lib/ringtone';
import { useAppStore } from '../../store/appStore';
import { Mic, Square, Camera, FileText, CheckCircle2, PhoneCall } from 'lucide-react';

type RecordMode = 'voice' | 'photo' | 'note';

export const Record: React.FC = () => {
  const { t } = useT();
  const [mode, setMode] = useState<RecordMode>('voice');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'captured' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedHash, setSavedHash] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);

  // Fake Call state
  const fakeCallerName = useAppStore((s) => s.fakeCallerName) || 'Maa';
  const setFakeCallerName = useAppStore((s) => s.setFakeCallerName);
  const fakeCallPending = useAppStore((s) => s.fakeCallPending);
  const fakeCallEndsAt = useAppStore((s) => s.fakeCallEndsAt);
  const startFakeCall = useAppStore((s) => s.startFakeCall);
  const cancelFakeCall = useAppStore((s) => s.cancelFakeCall);
  const [countdownSecs, setCountdownSecs] = useState<number>(5);

  const [activePreset, setActivePreset] = useState<'Maa' | 'Didi' | 'Office Manager' | 'Custom'>(() => {
    if (fakeCallerName === 'Maa' || fakeCallerName === 'Didi' || fakeCallerName === 'Office Manager') {
      return fakeCallerName;
    }
    return 'Custom';
  });
  const [customCallerInput, setCustomCallerInput] = useState(
    fakeCallerName === 'Maa' || fakeCallerName === 'Didi' || fakeCallerName === 'Office Manager' ? '' : fakeCallerName
  );

  const handleSelectCallerChip = (preset: 'Maa' | 'Didi' | 'Office Manager' | 'Custom') => {
    setActivePreset(preset);
    if (preset !== 'Custom') {
      setFakeCallerName(preset);
    } else {
      if (customCallerInput.trim()) {
        setFakeCallerName(customCallerInput.trim());
      }
    }
  };

  const handleCustomCallerChange = (val: string) => {
    setCustomCallerInput(val);
    setFakeCallerName(val.trim() || 'Maa');
  };

  useEffect(() => {
    if (!fakeCallPending || !fakeCallEndsAt) return;
    const updateCountdown = () => {
      const rem = Math.max(0, Math.ceil((fakeCallEndsAt - Date.now()) / 1000));
      setCountdownSecs(rem);
    };
    updateCountdown();
    const iv = setInterval(updateCountdown, 250);
    return () => clearInterval(iv);
  }, [fakeCallPending, fakeCallEndsAt]);

  // Audio refs
  const controlsRef = useRef<AudioRecorderControls | null>(null);
  const audioResultRef = useRef<Blob | null>(null);
  const audioMimeRef = useRef<string>('audio/webm');
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Photo
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Note
  const [noteText, setNoteText] = useState('');

  // Revoke photo URL on unmount or lock
  useEffect(() => {
    const unregister = registerPanicCleanup(() => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      controlsRef.current?.stop();
    });
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      unregister();
    };
  }, [photoUrl]);

  const clearState = useCallback(() => {
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    controlsRef.current?.stop();
    controlsRef.current = null;
    audioResultRef.current = null;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoBlob(null);
    setPhotoUrl('');
    setNoteText('');
    setElapsed(0);
    setLevel(0);
    setStatus('idle');
    setErrorMsg('');
    setSavedHash('');
    setTitle('');
  }, [photoUrl]);

  // Switch mode resets
  const handleModeSwitch = (m: RecordMode) => {
    clearState();
    setMode(m);
  };

  const handleStartRecording = async () => {
    if (!getSessionKey()) {
      setErrorMsg(t('recordNoSession'));
      setStatus('error');
      return;
    }
    setStatus('recording');
    setErrorMsg('');
    try {
      const { controls, result } = await startAudioRecording();
      controlsRef.current = controls;

      levelTimerRef.current = setInterval(() => {
        setLevel(controls.getLevel());
        setElapsed(controls.getElapsedMs());
      }, 100);

      result.then((r) => {
        if (levelTimerRef.current) clearInterval(levelTimerRef.current);
        audioResultRef.current = r.blob;
        audioMimeRef.current = r.mime;
        setStatus('captured');
      });
    } catch {
      setStatus('error');
      setErrorMsg(t('recordPermissionDenied'));
    }
  };

  const handleStopRecording = () => {
    controlsRef.current?.stop();
  };

  const handleCapturephoto = async () => {
    if (!getSessionKey()) {
      setErrorMsg(t('recordNoSession'));
      setStatus('error');
      return;
    }
    setStatus('saving'); // show capturing spinner
    try {
      const { blob, mime: _mime } = await capturePhoto();
      const url = URL.createObjectURL(blob);
      setPhotoBlob(blob);
      setPhotoUrl(url);
      setStatus('captured');
    } catch {
      setStatus('error');
      setErrorMsg(t('recordPermissionDenied'));
    }
  };

  const handleSave = async () => {
    const key = getSessionKey();
    if (!key) {
      setErrorMsg(t('recordNoSession'));
      setStatus('error');
      return;
    }
    setStatus('saving');
    try {
      const loc = await getLocation({ timeoutMs: 5000 });
      let bytes: Uint8Array;
      let mime: string;
      let type: 'audio' | 'photo' | 'note';

      if (mode === 'voice' && audioResultRef.current) {
        const ab = await audioResultRef.current.arrayBuffer();
        bytes = new Uint8Array(ab);
        mime = audioMimeRef.current;
        type = 'audio';
      } else if (mode === 'photo' && photoBlob) {
        const ab = await photoBlob.arrayBuffer();
        bytes = new Uint8Array(ab);
        mime = 'image/jpeg';
        type = 'photo';
      } else if (mode === 'note' && noteText.trim()) {
        bytes = new TextEncoder().encode(noteText);
        mime = 'text/plain';
        type = 'note';
      } else {
        setStatus('idle');
        return;
      }

      const record = await createEvidence({
        bytes,
        mime,
        type,
        severity,
        tags,
        title: title.trim(),
        location: loc,
      });

      setSavedHash(record.sealHash.slice(0, 4) + '…' + record.sealHash.slice(-3));
      setStatus('saved');
      // Reset form after 2s
      setTimeout(() => {
        clearState();
        setMode(mode);
      }, 2500);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const severities: { key: SeverityLevel; label: string; color: string }[] = [
    { key: 'low', label: t('severityLow'), color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { key: 'medium', label: t('severityMedium'), color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { key: 'high', label: t('severityHigh'), color: 'bg-red-100 text-red-800 border-red-300' },
  ];

  const tagList = [
    { key: 'Verbal', label: t('tagVerbal') },
    { key: 'Physical', label: t('tagPhysical') },
    { key: 'Digital', label: t('tagDigital') },
    { key: 'Financial', label: t('tagFinancial') },
    { key: 'Threat', label: t('tagThreat') },
  ];

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const canSave =
    (mode === 'voice' && status === 'captured' && audioResultRef.current !== null) ||
    (mode === 'photo' && photoBlob !== null) ||
    (mode === 'note' && noteText.trim().length > 0);

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto select-none bg-[#F4F8F8]" onContextMenu={(e) => e.preventDefault()}>
      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-2xl border border-teal-100 shadow-sm mb-4 shrink-0">
        {(['voice', 'photo', 'note'] as RecordMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeSwitch(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all tap-target flex items-center justify-center gap-1.5 ${
              mode === m ? 'bg-[#2F6F73] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {m === 'voice' && <Mic className="w-3.5 h-3.5" />}
            {m === 'photo' && <Camera className="w-3.5 h-3.5" />}
            {m === 'note' && <FileText className="w-3.5 h-3.5" />}
            {m === 'voice' ? t('recordTabVoice') : m === 'photo' ? t('recordTabPhoto') : t('recordTabNote')}
          </button>
        ))}
      </div>

      {/* Voice Mode */}
      {mode === 'voice' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {/* Level bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2F6F73] rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, level * 400)}%` }}
            />
          </div>

          {/* Timer */}
          <div className="text-3xl font-mono font-bold text-[#16302F] tabular-nums">
            {formatTime(elapsed)}
          </div>

          {/* Big record / stop button */}
          {status === 'idle' && (
            <button
              type="button"
              onClick={handleStartRecording}
              className="w-20 h-20 rounded-full bg-[#2F6F73] hover:bg-[#255a5d] text-white shadow-lg flex items-center justify-center active:scale-95 transition-all tap-target"
            >
              <Mic className="w-9 h-9" />
            </button>
          )}
          {status === 'recording' && (
            <button
              type="button"
              onClick={handleStopRecording}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all tap-target animate-pulse"
            >
              <Square className="w-8 h-8 fill-white" />
            </button>
          )}
          {status === 'captured' && (
            <div className="text-sm text-emerald-700 font-semibold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              {t('recordCapturedReady')}
            </div>
          )}

          <p className="text-xs text-gray-400">{t('recordStart')}</p>
        </div>
      )}

      {/* Photo Mode */}
      {mode === 'photo' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {!photoUrl ? (
            <>
              <div className="w-48 h-36 bg-gray-200 rounded-2xl flex items-center justify-center border border-gray-200">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={handleCapturephoto}
                disabled={status === 'saving'}
                className="px-6 py-3 bg-[#2F6F73] hover:bg-[#255a5d] text-white font-semibold rounded-2xl shadow-md tap-target disabled:opacity-60 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {t('recordCapture')}
              </button>
            </>
          ) : (
            <>
              <img
                src={photoUrl}
                alt="Captured"
                draggable={false}
                className="max-h-48 rounded-2xl border border-teal-100 shadow-sm object-contain"
                onContextMenu={(e) => e.preventDefault()}
              />
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(photoUrl); setPhotoBlob(null); setPhotoUrl(''); setStatus('idle'); }}
                className="text-xs text-gray-500 underline"
              >
                {t('recordRetake')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Note Mode */}
      {mode === 'note' && (
        <div className="flex-1 flex flex-col space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('recordNotePlaceholder')}
            className="flex-1 w-full p-3 text-sm text-gray-800 bg-white border border-teal-100 rounded-2xl resize-none focus:outline-none focus:border-[#2F6F73] shadow-sm min-h-[140px]"
          />
        </div>
      )}

      {/* Common Controls: Title, Severity, Tags, Save */}
      <div className="mt-4 space-y-3 shrink-0">
        {/* Optional title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('recordTitle')}
          className="w-full h-10 px-3 text-sm bg-white border border-teal-100 rounded-xl focus:outline-none focus:border-[#2F6F73]"
        />

        {/* Severity chips */}
        <div>
          <span className="text-xs font-semibold text-gray-500 block mb-1.5">{t('severityLabel')}</span>
          <div className="flex gap-2">
            {severities.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSeverity(s.key)}
                className={`flex-1 h-9 rounded-xl text-xs font-semibold border transition-all tap-target ${
                  severity === s.key ? s.color + ' shadow-sm ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag chips */}
        <div>
          <span className="text-xs font-semibold text-gray-500 block mb-1.5">{t('tagsLabel')}</span>
          <div className="flex flex-wrap gap-1.5">
            {tagList.map((tg) => (
              <button
                key={tg.key}
                type="button"
                onClick={() => toggleTag(tg.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  tags.includes(tg.key)
                    ? 'bg-[#2F6F73] text-white border-[#2F6F73]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#2F6F73]'
                }`}
              >
                {tg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error / saved / saving message */}
        {status === 'error' && errorMsg && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {errorMsg}
          </div>
        )}
        {status === 'saved' && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('recordSaved')} — {savedHash}</span>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || status === 'saving' || status === 'saved'}
          className="w-full h-12 bg-[#2F6F73] hover:bg-[#255a5d] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-2xl shadow-md tap-target transition-all flex items-center justify-center gap-2 text-sm"
        >
          {status === 'saving' ? t('recordSaving') : t('recordSave')}
        </button>

        {/* Fake Call Escape Container */}
        <div className="bg-white rounded-2xl border border-teal-100/90 p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#2F6F73]" />
              {t('fakeCallButton')}
            </span>
            {fakeCallPending && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                {t('fakeCallCounting', { count: countdownSecs })}
              </span>
            )}
          </div>

          {/* Quick-select preset chips: Maa, Didi, Office Manager, Custom */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { val: 'Maa' as const, label: t('presetMaa') },
              { val: 'Didi' as const, label: t('presetDidi') },
              { val: 'Office Manager' as const, label: t('presetOfficeManager') },
              { val: 'Custom' as const, label: t('presetCustom') },
            ].map((chip) => {
              const isSelected = activePreset === chip.val;
              return (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => handleSelectCallerChip(chip.val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap tap-target ${
                    isSelected
                      ? 'bg-[#2F6F73] text-white border-[#2F6F73] shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Small text input when Custom is tapped */}
          {activePreset === 'Custom' && (
            <input
              type="text"
              value={customCallerInput}
              onChange={(e) => handleCustomCallerChange(e.target.value)}
              placeholder={t('customCallerPlaceholder')}
              className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6F73] focus:outline-none"
            />
          )}

          {/* Action Row */}
          {fakeCallPending ? (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Calling: <strong className="font-semibold">{fakeCallerName || 'Maa'}</strong></span>
                <span className="font-mono font-bold text-amber-700">{countdownSecs}s</span>
              </div>
              <button
                type="button"
                onClick={cancelFakeCall}
                className="px-3 py-2 text-xs font-semibold bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl tap-target transition-colors shadow-2xs"
              >
                {t('cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                ensureAudioUnlocked();
                startFakeCall(5000);
              }}
              className="w-full h-11 bg-white hover:bg-teal-50/50 text-[#2F6F73] font-semibold rounded-xl border border-teal-200 shadow-xs tap-target transition-all flex items-center justify-center gap-2 text-xs active:scale-98"
            >
              <PhoneCall className="w-4 h-4 text-[#2F6F73]" />
              <span>{t('fakeCallButton')} (5s)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
