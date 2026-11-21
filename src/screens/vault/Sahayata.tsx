import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Copy,
  Check,
  Shield,
  HeartHandshake,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useT } from '../../i18n/useT';
import { legalCards, DISCLAIMER_EN, DISCLAIMER_HI } from '../../data/legalContent';

export const Sahayata: React.FC = () => {
  const { lang, t } = useT();
  const [openCardId, setOpenCardId] = useState<string>('helplines');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const isHi = lang === 'hi';
  const disclaimer = isHi ? DISCLAIMER_HI : DISCLAIMER_EN;

  const handleCopy = (number: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  const toggleCard = (id: string) => {
    setOpenCardId((prev) => (prev === id ? '' : id));
  };

  const getCardIcon = (id: string) => {
    switch (id) {
      case 'helplines':
        return <Phone className="w-4 h-4 text-[#2F6F73]" />;
      case 'pwdva':
        return <Shield className="w-4 h-4 text-[#2F6F73]" />;
      case 'posh':
        return <HeartHandshake className="w-4 h-4 text-[#2F6F73]" />;
      case 'evidence':
        return <FileCheck className="w-4 h-4 text-[#2F6F73]" />;
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Shield className="w-4 h-4 text-[#2F6F73]" />;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col p-4 overflow-y-auto select-none bg-[#F4F8F8] space-y-3"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-[#2F6F73]" />
          <h2 className="text-base font-bold text-[#16302F]">
            {t('tabSahayata')}
          </h2>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {isHi
            ? 'कानूनी अधिकार, हेल्पलाइन और डिजिटल साक्ष्य मार्गदर्शिका (100% ऑफ़लाइन उपलब्ध)।'
            : 'Legal rights, verified helplines, and digital evidence guide (100% offline).'}
        </p>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-2.5 pb-4">
        {legalCards.map((card) => {
          const isOpen = openCardId === card.id;
          const title = isHi ? card.titleHi : card.titleEn;
          const badge = isHi ? card.badgeHi : card.badgeEn;
          const points = isHi ? card.pointsHi : card.pointsEn;
          const footnote = isHi ? card.footnoteHi : card.footnoteEn;

          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden transition-all"
            >
              {/* Card Header (Accordion Toggle) */}
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                className="w-full flex items-center justify-between p-3.5 text-left bg-white hover:bg-neutral-50/80 transition-colors tap-target"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5 flex-1 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                    {getCardIcon(card.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#16302F] block leading-snug">
                      {title}
                    </span>
                    {badge && (
                      <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100 inline-block mt-0.5">
                        {badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-neutral-400 shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#2F6F73]" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Card Body */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-neutral-100 bg-[#FAFCFC]">
                  {/* Helplines (if present) */}
                  {card.helplines && card.helplines.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      {card.helplines.map((item) => (
                        <div
                          key={item.number}
                          className="bg-white p-3 rounded-xl border border-teal-100 shadow-2xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-semibold text-[#16302F] block">
                                {isHi ? item.nameHi : item.nameEn}
                              </span>
                              <span className="text-[11px] text-neutral-500 leading-tight block mt-0.5">
                                {isHi ? item.descHi : item.descEn}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-neutral-50 rounded-lg p-2 border border-neutral-200/80">
                            <span className="text-sm font-mono font-bold text-[#2F6F73] tracking-wide">
                              {item.number}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {/* Tap to copy */}
                              <button
                                type="button"
                                onClick={() => handleCopy(item.number)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white border border-neutral-300 hover:bg-neutral-50 rounded text-neutral-700 tap-target"
                              >
                                {copiedNumber === item.number ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">
                                      {isHi ? 'कॉपी हो गया' : 'Copied'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-500" />
                                    <span>{isHi ? 'कॉपी करें' : 'Copy'}</span>
                                  </>
                                )}
                              </button>

                              {/* User-tapped Call link (never auto-dial, never 112/100) */}
                              {item.telLink && (
                                <a
                                  href={item.telLink}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#2F6F73] hover:bg-[#255a5d] text-white rounded shadow-2xs tap-target"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{isHi ? 'कॉल' : 'Call'}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet points */}
                  <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed pl-1 pt-1">
                    {points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#2F6F73] font-bold text-xs leading-tight mt-0.5">
                          •
                        </span>
                        <span className="flex-1">{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Optional Footnote */}
                  {footnote && (
                    <p className="text-[11px] italic text-neutral-500 pt-1 border-t border-neutral-100">
                      * {footnote}
                    </p>
                  )}

                  {/* Mandatory line on every card */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-neutral-400 tracking-wide">
                      {disclaimer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
