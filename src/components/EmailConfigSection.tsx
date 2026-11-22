import React, { useState, useEffect } from 'react';
import { useT } from '../i18n/useT';
import {
  getResolvedEmailConfig,
  saveOverrideConfig,
  clearOverrideConfig,
  sendTestEmail,
  type ResolvedEmailConfig,
} from '../services/emailAlertService';
import { Mail, Check, RotateCcw, Send, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface EmailConfigSectionProps {
  compact?: boolean;
}

export const EmailConfigSection: React.FC<EmailConfigSectionProps> = ({ compact = false }) => {
  const { t } = useT();

  const [config, setConfig] = useState<ResolvedEmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: '',
    isConfigured: false,
    isOverride: false,
  });

  const [serviceIdInput, setServiceIdInput] = useState('');
  const [templateIdInput, setTemplateIdInput] = useState('');
  const [publicKeyInput, setPublicKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadConfig = async () => {
    const res = await getResolvedEmailConfig();
    setConfig(res);
    setServiceIdInput(res.serviceId);
    setTemplateIdInput(res.templateId);
    setPublicKeyInput(res.publicKey);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!serviceIdInput.trim() || !templateIdInput.trim() || !publicKeyInput.trim()) return;

    await saveOverrideConfig({
      serviceId: serviceIdInput.trim(),
      templateId: templateIdInput.trim(),
      publicKey: publicKeyInput.trim(),
    });

    await loadConfig();
    setShowKey(false);
    setNotice(t('emailSavedNotice'));
    setTimeout(() => setNotice(null), 3000);
  };

  const handleClear = async () => {
    await clearOverrideConfig();
    await loadConfig();
    setShowKey(false);
    setNotice(t('emailClearedNotice'));
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) return;

    setIsSendingTest(true);
    setTestStatus(null);
    try {
      const res = await sendTestEmail(testEmail.trim());
      if (res.status === 'Sent') {
        setTestStatus({ ok: true, text: t('emailTestSuccess') });
      } else {
        setTestStatus({
          ok: false,
          text: t('emailTestFailed', { detail: res.detail }),
        });
      }
    } catch (e: unknown) {
      setTestStatus({
        ok: false,
        text: t('emailTestFailed', { detail: e instanceof Error ? e.message : 'Unknown error' }),
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestStatus(null), 6000);
    }
  };

  const maskedKeyPreview = (key: string) => {
    if (!key) return '';
    if (key.length <= 6) return '••••••';
    return '••••••••' + key.slice(-4);
  };

  return (
    <div
      className={`rounded-2xl border ${
        compact
          ? 'bg-white p-3.5 border-teal-100 shadow-sm space-y-3'
          : 'bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5 text-xs'
      }`}
    >
      {/* Title & Status Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs">
          <Mail className="w-3.5 h-3.5 text-[#2F6F73]" />
          <span>{t('emailConfigTitle')}</span>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            config.isOverride
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          {config.isOverride ? t('emailSavedOverride') : t('emailEnvDefault')}
        </span>
      </div>

      {notice && (
        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          {notice}
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
            {t('emailServiceId')}
          </label>
          <input
            type="text"
            value={serviceIdInput}
            onChange={(e) => setServiceIdInput(e.target.value)}
            placeholder="service_..."
            className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#2F6F73]"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
            {t('emailTemplateId')}
          </label>
          <input
            type="text"
            value={templateIdInput}
            onChange={(e) => setTemplateIdInput(e.target.value)}
            placeholder="template_..."
            className="w-full h-8 px-2.5 text-xs font-mono rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#2F6F73]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase block">
              {t('emailPublicKey')}
            </label>
            {!showKey && publicKeyInput && (
              <span className="text-[10px] text-gray-400 font-mono">
                {maskedKeyPreview(publicKeyInput)}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={publicKeyInput}
              onChange={(e) => setPublicKeyInput(e.target.value)}
              placeholder="public key..."
              className="w-full h-8 px-2.5 pr-8 text-xs font-mono rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#2F6F73]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons: Save & Clear */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-1.5 px-3 bg-[#2F6F73] hover:bg-[#255a5d] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all"
        >
          <Check className="w-3 h-3" />
          <span>{t('emailSaveConfig')}</span>
        </button>

        {config.isOverride && (
          <button
            type="button"
            onClick={handleClear}
            className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 border border-gray-200 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('emailClearConfig')}</span>
          </button>
        )}
      </div>

      {/* Test Email Row */}
      <div className="pt-2 border-t border-gray-100 space-y-1.5">
        <div className="flex gap-1.5 items-center">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t('emailTestRecipient')}
            className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#2F6F73]"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest || !testEmail.trim()}
            className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shrink-0 transition-all"
          >
            <Send className="w-3 h-3" />
            <span>{isSendingTest ? t('emailSending') : t('emailSendTest')}</span>
          </button>
        </div>

        {testStatus && (
          <p
            className={`text-[11px] font-medium p-1.5 rounded-lg border ${
              testStatus.ok
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {testStatus.text}
          </p>
        )}
      </div>

      {/* Disclosure Line */}
      <p className="text-[10px] text-gray-400 leading-tight italic pt-1">
        {t('emailDisclosure')}
      </p>
    </div>
  );
};
