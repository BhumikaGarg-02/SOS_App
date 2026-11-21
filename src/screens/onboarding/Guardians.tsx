import React, { useState } from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { useDemoLogStore } from '../../store/demoLogStore';
import { useDemoFlagsStore } from '../../store/demoFlagsStore';
import { saveGuardian, type GuardianRecord } from '../../lib/db';
import { CheckCircle2, UserPlus, Users, Trash2 } from 'lucide-react';

interface GuardiansProps {
  onNext: () => void;
  onBack: () => void;
}

interface GuardianItemState {
  id: string;
  name: string;
  relation: string;
  contact: string;
  verified: boolean;
  otpCode?: string;
  enteredOtp?: string;
  wrongTries: number;
  otpSent: boolean;
  error?: string;
}

export const Guardians: React.FC<GuardiansProps> = ({ onNext, onBack }) => {
  const { t } = useT();
  const addLog = useDemoLogStore((s) => s.addLog);
  const setLastOtpHint = useDemoFlagsStore((s) => s.setLastOtpHint);

  const [guardians, setGuardians] = useState<GuardianItemState[]>([
    {
      id: 'g-1',
      name: '',
      relation: 'Mother',
      contact: '',
      verified: false,
      wrongTries: 0,
      otpSent: false,
    },
    {
      id: 'g-2',
      name: '',
      relation: 'Sister',
      contact: '',
      verified: false,
      wrongTries: 0,
      otpSent: false,
    },
  ]);

  const relations = [
    { value: 'Mother', label: t('relMother') },
    { value: 'Father', label: t('relFather') },
    { value: 'Sister', label: t('relSister') },
    { value: 'Brother', label: t('relBrother') },
    { value: 'Friend', label: t('relFriend') },
    { value: 'NGO Counselor', label: t('relCounselor') },
    { value: 'Other', label: t('relOther') },
  ];

  const validateContact = (c: string) => {
    const isMobile = /^[6-9]\d{9}$/.test(c.trim());
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim());
    return isMobile || isEmail;
  };

  const handleSendOtp = (idx: number) => {
    const g = guardians[idx];
    if (!g.name.trim() || !validateContact(g.contact)) {
      updateGuardian(idx, { error: 'Please enter a valid name and 10-digit mobile or email.' });
      return;
    }

    // Generate 4-digit code (use 1234 on first try or random 4-digit)
    const code = g.otpSent
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : '1234';

    updateGuardian(idx, {
      otpCode: code,
      otpSent: true,
      wrongTries: 0,
      error: undefined,
    });

    setLastOtpHint(code);
    addLog(`OTP sent to ${g.name}: ${code}`, 'otp');
  };

  const handleVerifyOtp = async (idx: number) => {
    const g = guardians[idx];
    if (!g.enteredOtp || !g.otpCode) return;

    if (g.enteredOtp.trim() === g.otpCode) {
      // Correct OTP
      const updated: GuardianItemState = {
        ...g,
        verified: true,
        error: undefined,
      };
      updateGuardian(idx, updated);

      const record: GuardianRecord = {
        id: g.id,
        name: g.name.trim(),
        relation: g.relation,
        contact: g.contact.trim(),
        verified: true,
        createdAt: new Date().toISOString(),
      };
      await saveGuardian(record);
      addLog(`Guardian verified: ${g.name} (${g.relation})`, 'info');
    } else {
      // Wrong OTP
      const newWrongTries = g.wrongTries + 1;
      if (newWrongTries >= 3) {
        // Regenerate OTP after 3 wrong tries
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        updateGuardian(idx, {
          otpCode: newCode,
          enteredOtp: '',
          wrongTries: 0,
          error: '3 failed attempts. New OTP has been generated.',
        });
        setLastOtpHint(newCode);
        addLog(`3 failed attempts for ${g.name}. New OTP sent: ${newCode}`, 'warn');
      } else {
        updateGuardian(idx, {
          wrongTries: newWrongTries,
          error: `${t('wrongOtp')} (${newWrongTries}/3)`,
        });
      }
    }
  };

  const updateGuardian = (idx: number, patch: Partial<GuardianItemState>) => {
    setGuardians((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const addAnotherGuardian = () => {
    if (guardians.length >= 5) return;
    setGuardians((prev) => [
      ...prev,
      {
        id: 'g-' + (prev.length + 1),
        name: '',
        relation: 'Friend',
        contact: '',
        verified: false,
        wrongTries: 0,
        otpSent: false,
      },
    ]);
  };

  const removeGuardian = (idx: number) => {
    if (guardians.length <= 2) return;
    setGuardians((prev) => prev.filter((_, i) => i !== idx));
  };

  const verifiedCount = guardians.filter((g) => g.verified).length;
  const canContinue = verifiedCount >= 2;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF9] text-[#1C1917] justify-between p-4 sm:p-5 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          {t('back')}
        </button>
        <LangToggle />
      </div>

      {/* Main Form */}
      <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">{t('guardiansTitle')}</h2>
            <p className="text-xs text-gray-500">{t('guardiansSubtitle')}</p>
          </div>
        </div>

        {/* Guardian Cards */}
        <div className="space-y-3">
          {guardians.map((g, idx) => (
            <div
              key={g.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                g.verified
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">
                  Guardian #{idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {g.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {t('verified')}
                    </span>
                  )}
                  {guardians.length > 2 && !g.verified && (
                    <button
                      type="button"
                      onClick={() => removeGuardian(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {!g.verified ? (
                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      placeholder={t('guardianName')}
                      value={g.name}
                      onChange={(e) => updateGuardian(idx, { name: e.target.value, error: undefined })}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={g.relation}
                      onChange={(e) => updateGuardian(idx, { relation: e.target.value })}
                      className="h-10 px-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    >
                      {relations.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder={t('guardianContact')}
                      value={g.contact}
                      onChange={(e) => updateGuardian(idx, { contact: e.target.value, error: undefined })}
                      className="h-10 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* OTP Trigger / Verification */}
                  {!g.otpSent ? (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(idx)}
                      className="w-full h-9 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all"
                    >
                      {t('sendOtp')}
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center pt-1">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder={t('otpPlaceholder')}
                        value={g.enteredOtp || ''}
                        onChange={(e) =>
                          updateGuardian(idx, {
                            enteredOtp: e.target.value.replace(/\D/g, ''),
                            error: undefined,
                          })
                        }
                        className="flex-1 h-9 px-3 text-center tracking-widest font-mono text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp(idx)}
                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      >
                        {t('verifyOtp')}
                      </button>
                    </div>
                  )}

                  {g.error && (
                    <p className="text-[11px] text-red-500 font-medium">{g.error}</p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-700 space-y-0.5">
                  <div className="font-semibold text-gray-900">{g.name}</div>
                  <div className="text-gray-500">{g.relation} • {g.contact}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Another Guardian (up to 5) */}
        {guardians.length < 5 && (
          <button
            type="button"
            onClick={addAnotherGuardian}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4 text-gray-500" />
            {t('addGuardian')} ({guardians.length}/5)
          </button>
        )}
      </div>

      {/* Footer / Continue button */}
      <div className="pt-2 pb-2 shrink-0 space-y-2">
        {!canContinue && (
          <p className="text-[11px] text-center text-amber-600 font-medium">
            {t('minGuardiansReq')} ({verifiedCount}/2 verified)
          </p>
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-2xl shadow-sm transition-all tap-target flex items-center justify-center text-base"
        >
          {t('continue')}
        </button>
      </div>
    </div>
  );
};
