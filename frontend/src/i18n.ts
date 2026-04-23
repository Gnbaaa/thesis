import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mn from './locales/mn.json';

void i18n.use(initReactI18next).init({
  resources: { mn: { translation: mn } },
  lng: 'mn',
  fallbackLng: 'mn',
  interpolation: { escapeValue: false },
});

export { i18n };
