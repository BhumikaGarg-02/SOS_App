import { en, type TranslationKey } from './en';
import { hi } from './hi';
import { useAppStore } from '../store/appStore';

export function useT() {
  const lang = useAppStore((state) => state.lang);
  const setLang = useAppStore((state) => state.setLang);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = lang === 'hi' ? hi : en;
    let text = dict[key] || en[key] || key;

    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      }
    }
    return text;
  };

  return { t, lang, setLang };
}
