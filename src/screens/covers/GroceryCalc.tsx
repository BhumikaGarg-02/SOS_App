import React, { useState } from 'react';
import { CoverShell } from '../../components/CoverShell';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import { evaluateExpression } from '../../lib/evaluator';
import { check as checkPin } from '../../lib/pinGuard';
import { silentSOS } from '../../lib/sos';
import { arm as armDeadman, disarm as disarmDeadman } from '../../lib/deadman';
import { Delete, Trash2 } from 'lucide-react';

export const GroceryCalc: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);
  const setUnlocked = useAppStore((s) => s.setUnlocked);
  const groceryBill = useAppStore((s) => s.groceryBill);
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const clearGroceryBill = useAppStore((s) => s.clearGroceryBill);
  const startFakeCall = useAppStore((s) => s.startFakeCall);

  const [input, setInput] = useState<string>('');
  const [selectedChip, setSelectedChip] = useState<string>('Atta');

  const chips = [
    { key: 'Atta', label: t('gkChipAtta') },
    { key: 'Doodh', label: t('gkChipDoodh') },
    { key: 'Sabzi', label: t('gkChipSabzi') },
    { key: 'Dal', label: t('gkChipDal') },
    { key: 'Tel', label: t('gkChipTel') },
    { key: 'Chai', label: t('gkChipChai') },
  ];

  const handleDigit = (val: string) => {
    setInput((prev) => prev + val);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleEqual = async () => {
    const raw = input.trim();
    if (!raw) return;

    // 1. PIN Trigger: digits-only and exactly 4 characters
    if (/^\d{4}$/.test(raw)) {
      const pinResult = await checkPin(raw);
      setInput('');

      if (pinResult === 'REAL') {
        setUnlocked(true);
        setScreen('vault');
        return;
      } else if (pinResult === 'DECOY') {
        await silentSOS('decoy_pin');
        setScreen('fakeVault');
        return;
      }
      // If NONE or IGNORED, fall through to normal calculation
    }

    // 2. Dead-man trigger: normalize × to *
    const normalized = raw.replace(/×/g, '*');
    if (normalized === '15*1') {
      setInput('15');
      armDeadman('grocery');
      return;
    }
    if (normalized === '0*0') {
      setInput('0');
      disarmDeadman('grocery');
      return;
    }

    // 3. Normal evaluation
    const res = evaluateExpression(raw);
    if (res !== null) {
      setInput(String(res));
    } else {
      setInput('0');
    }
  };

  const handleAddToBill = () => {
    const amt = parseFloat(input);
    if (!isNaN(amt) && amt > 0) {
      const chipObj = chips.find((c) => c.key === selectedChip);
      addGroceryItem(chipObj ? chipObj.label : selectedChip, amt);
      setInput('');
    }
  };

  const totalBill = groceryBill.reduce((sum, item) => sum + item.amount, 0);

  // Format currency in Indian numbering system
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(totalBill);

  return (
    <CoverShell
      title={t('gkHeading')}
      bgColor="#FFF6EA"
      headerBgColor="#FFF6EA"
      headerTextColor="#3B2A1A"
      onDoubleTapHotZone={() => startFakeCall(5000)}
      onDoubleTap={() => startFakeCall(5000)}
    >
      <div className="flex-1 flex flex-col justify-between p-3 select-none overflow-hidden max-w-md mx-auto w-full">
        {/* Bill Summary / Chips Area */}
        <div className="flex flex-col space-y-2 shrink-0">
          {/* Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSelectedChip(chip.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedChip === chip.key
                    ? 'bg-[#E07A2F] text-white shadow-sm'
                    : 'bg-white/80 text-[#3B2A1A] hover:bg-white border border-[#E07A2F]/20'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Running Bill Strip */}
          <div className="bg-white/90 p-2.5 rounded-2xl border border-[#E07A2F]/20 shadow-sm flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <span className="text-[11px] text-gray-500 block">{t('gkBillSummary')}</span>
              <div className="text-sm font-semibold text-[#3B2A1A] truncate">
                {groceryBill.length > 0 ? (
                  `${groceryBill.length} items (${groceryBill
                    .slice(-3)
                    .map((b) => `${b.tag}: ₹${b.amount}`)
                    .join(', ')})`
                ) : (
                  <span className="text-gray-400 font-normal">{t('gkNoItems')}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">
                  {t('gkTotal')}
                </span>
                <span className="text-base font-bold text-[#2E7D4F]">{formattedTotal}</span>
              </div>
              {groceryBill.length > 0 && (
                <button
                  type="button"
                  onClick={clearGroceryBill}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title={t('gkClearBill')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calculator Display */}
        <div className="my-auto py-2">
          <div className="bg-white rounded-2xl p-3 border border-[#E07A2F]/30 shadow-inner text-right">
            <span className="text-xs text-gray-400 block h-4 font-mono">
              {input ? input : '0'}
            </span>
            <div className="text-3xl font-mono font-bold text-[#3B2A1A] tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              {input || '0'}
            </div>
          </div>
        </div>

        {/* 4x5 Keypad: C ⌫ ÷ × / 7 8 9 − / 4 5 6 + / 1 2 3 = / 0 . ₹ Add to Bill */}
        <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
          {/* Row 1: C ⌫ ÷ × */}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('÷')}
            className="h-12 rounded-xl bg-[#E07A2F]/20 hover:bg-[#E07A2F]/30 text-[#E07A2F] font-bold text-xl active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => handleDigit('×')}
            className="h-12 rounded-xl bg-[#E07A2F]/20 hover:bg-[#E07A2F]/30 text-[#E07A2F] font-bold text-xl active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            ×
          </button>

          {/* Row 2: 7 8 9 − */}
          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleDigit('−')}
            className="h-12 rounded-xl bg-[#E07A2F]/20 hover:bg-[#E07A2F]/30 text-[#E07A2F] font-bold text-xl active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            −
          </button>

          {/* Row 3: 4 5 6 + */}
          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleDigit('+')}
            className="h-12 rounded-xl bg-[#E07A2F]/20 hover:bg-[#E07A2F]/30 text-[#E07A2F] font-bold text-xl active:scale-95 transition-all shadow-sm flex items-center justify-center tap-target"
          >
            +
          </button>

          {/* Row 4: 1 2 3 = */}
          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            3
          </button>
          <button
            type="button"
            onClick={handleEqual}
            className="h-12 rounded-xl bg-[#E07A2F] hover:bg-[#cb6b23] text-white font-bold text-2xl active:scale-95 transition-all shadow-md flex items-center justify-center tap-target"
          >
            =
          </button>

          {/* Row 5: 0 . ₹ Add to Bill */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className="h-12 rounded-xl bg-white hover:bg-orange-50 text-gray-800 font-semibold text-lg active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center tap-target"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleAddToBill}
            className="col-span-2 h-12 rounded-xl bg-[#2E7D4F] hover:bg-[#256841] text-white font-semibold text-sm active:scale-95 transition-all shadow-md flex items-center justify-center gap-1 tap-target"
          >
            <span>₹</span> {t('gkAddToBill')}
          </button>
        </div>
      </div>
    </CoverShell>
  );
};
