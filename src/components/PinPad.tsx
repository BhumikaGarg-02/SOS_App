import React from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
  onDigit,
  onBackspace,
  onSubmit,
  submitLabel = 'OK',
  disabled = false,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto select-none">
      {digits.map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(d)}
          className="h-14 rounded-2xl bg-white/80 hover:bg-white active:bg-gray-100 text-gray-800 text-xl font-semibold shadow-sm border border-gray-100 transition-all tap-target flex items-center justify-center disabled:opacity-50"
        >
          {d}
        </button>
      ))}

      {/* Bottom row: Empty/Submit, 0, Backspace */}
      {onSubmit ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="h-14 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary text-base font-semibold transition-all tap-target flex items-center justify-center disabled:opacity-50"
        >
          {submitLabel}
        </button>
      ) : (
        <div className="h-14" />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('0')}
        className="h-14 rounded-2xl bg-white/80 hover:bg-white active:bg-gray-100 text-gray-800 text-xl font-semibold shadow-sm border border-gray-100 transition-all tap-target flex items-center justify-center disabled:opacity-50"
      >
        0
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        className="h-14 rounded-2xl bg-white/80 hover:bg-white active:bg-gray-100 text-gray-700 text-xl font-semibold shadow-sm border border-gray-100 transition-all tap-target flex items-center justify-center disabled:opacity-50"
        aria-label="Backspace"
      >
        <Delete className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};
