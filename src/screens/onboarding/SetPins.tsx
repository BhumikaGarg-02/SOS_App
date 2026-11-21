import React, { useState, useEffect } from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { hashPin } from '../../lib/crypto';
import { setSetting } from '../../lib/db';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

interface SetPinsProps {
  onNext: () => void;
  onBack: () => void;
}

export const SetPins: React.FC<SetPinsProps> = ({ onNext, onBack }) => {
  const { t } = useT();
  const [realPin, setRealPin] = useState('');
  const [decoyPin, setDecoyPin] = useState('');
  const [showReal, setShowReal] = useState(false);
  const [showDecoy, setShowDecoy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Listen for evaluator Fill Demo PINs shortcut
  useEffect(() => {
    const handleFill = (e: Event) => {
      const custom = e as CustomEvent<{ real: string; decoy: string }>;
      if (custom.detail) {
        setRealPin(custom.detail.real);
        setDecoyPin(custom.detail.decoy);
        setError(null);
      }
    };
    window.addEventListener('chuppi:fill-demo-pins', handleFill);
    return () => window.removeEventListener('chuppi:fill-demo-pins', handleFill);
  }, []);

  const handleContinue = async () => {
    setError(null);

    if (!/^\d{4}$/.test(realPin) || !/^\d{4}$/.test(decoyPin)) {
      setError(t('pinLengthError'));
      return;
    }

    if (realPin === decoyPin) {
      setError(t('pinSameError'));
      return;
    }

    setSaving(true);
    try {
      // Hash with PBKDF2-SHA256 (210,000 iterations, random 16-byte salt)
      const realRes = await hashPin(realPin);
      const decoyRes = await hashPin(decoyPin);

      // Store hashes and salts in IndexedDB settings (never store or log raw PINs!)
      await setSetting('realPinHash', realRes.hash);
      await setSetting('realPinSalt', realRes.salt);
      await setSetting('decoyPinHash', decoyRes.hash);
      await setSetting('decoyPinSalt', decoyRes.salt);

      onNext();
    } catch (err) {
      console.error(err);
      setError('Error generating secure key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid =
    /^\d{4}$/.test(realPin) && /^\d{4}$/.test(decoyPin) && realPin !== decoyPin;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF9] text-[#1C1917] justify-between p-6 select-none overflow-y-auto">
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
      <div className="space-y-5 my-auto max-w-sm mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold">{t('setPinsTitle')}</h2>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
          {t('pinsHelper')}
        </p>

        {/* Real PIN */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 block">
            {t('realPinLabel')}
          </label>
          <div className="relative">
            <input
              type={showReal ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={realPin}
              onChange={(e) => {
                setRealPin(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              className="w-full h-12 px-4 pr-12 text-center text-lg font-mono tracking-widest rounded-2xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowReal(!showReal)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
            >
              {showReal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Decoy PIN */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 block">
            {t('decoyPinLabel')}
          </label>
          <div className="relative">
            <input
              type={showDecoy ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={decoyPin}
              onChange={(e) => {
                setDecoyPin(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              className="w-full h-12 px-4 pr-12 text-center text-lg font-mono tracking-widest rounded-2xl border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowDecoy(!showDecoy)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
            >
              {showDecoy ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-center">
            {error}
          </p>
        )}
      </div>

      {/* Continue */}
      <div className="pb-4 pt-4">
        <button
          type="button"
          disabled={!isFormValid || saving}
          onClick={handleContinue}
          className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-2xl shadow-sm transition-all tap-target flex items-center justify-center text-base"
        >
          {saving ? 'Securing...' : t('continue')}
        </button>
      </div>
    </div>
  );
};
