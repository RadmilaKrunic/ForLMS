import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import srCyrl from './locales/sr-Cyrl.json';
import srLatn from './locales/sr-Latn.json';

/** ELR_LMS_007: Serbian UI in Cyrillic (default) and Latin script. */
export const SUPPORTED_LOCALES = ['sr-Cyrl', 'sr-Latn'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

i18n.use(initReactI18next).init({
  resources: {
    'sr-Cyrl': { translation: srCyrl },
    'sr-Latn': { translation: srLatn },
  },
  lng: localStorage.getItem('forlms.locale') ?? 'sr-Cyrl',
  fallbackLng: 'sr-Cyrl',
  interpolation: { escapeValue: false },
});

export function setLocale(locale: SupportedLocale) {
  localStorage.setItem('forlms.locale', locale);
  i18n.changeLanguage(locale);
}

export default i18n;
