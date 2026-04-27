import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

export const SUPPORTED_LANGUAGES = [
  // Indian (P0-P1)
  { code: 'en', label: 'English',    nativeLabel: 'English',       flag: '🇬🇧', region: 'indian' },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिंदी',           flag: '🇮🇳', region: 'indian' },
  { code: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்',           flag: '🇮🇳', region: 'indian' },
  { code: 'te', label: 'Telugu',     nativeLabel: 'తెలుగు',          flag: '🇮🇳', region: 'indian' },
  { code: 'bn', label: 'Bengali',    nativeLabel: 'বাংলা',           flag: '🇮🇳', region: 'indian' },
  { code: 'mr', label: 'Marathi',    nativeLabel: 'मराठी',           flag: '🇮🇳', region: 'indian' },
  { code: 'gu', label: 'Gujarati',   nativeLabel: 'ગુજરાતી',         flag: '🇮🇳', region: 'indian' },
  { code: 'kn', label: 'Kannada',    nativeLabel: 'ಕನ್ನಡ',           flag: '🇮🇳', region: 'indian' },
  { code: 'ml', label: 'Malayalam',  nativeLabel: 'മലയാളം',          flag: '🇮🇳', region: 'indian' },
  { code: 'pa', label: 'Punjabi',    nativeLabel: 'ਪੰਜਾਬੀ',          flag: '🇮🇳', region: 'indian' },
  // International (P2)
  { code: 'es', label: 'Spanish',    nativeLabel: 'Español',         flag: '🇪🇸', region: 'international' },
  { code: 'fr', label: 'French',     nativeLabel: 'Français',        flag: '🇫🇷', region: 'international' },
  { code: 'de', label: 'German',     nativeLabel: 'Deutsch',         flag: '🇩🇪', region: 'international' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português',       flag: '🇵🇹', region: 'international' },
  { code: 'ja', label: 'Japanese',   nativeLabel: '日本語',            flag: '🇯🇵', region: 'international' },
  { code: 'zh', label: 'Chinese',    nativeLabel: '中文',             flag: '🇨🇳', region: 'international' },
  { code: 'ko', label: 'Korean',     nativeLabel: '한국어',            flag: '🇰🇷', region: 'international' },
  { code: 'ru', label: 'Russian',    nativeLabel: 'Русский',         flag: '🇷🇺', region: 'international' },
  { code: 'tr', label: 'Turkish',    nativeLabel: 'Türkçe',          flag: '🇹🇷', region: 'international' },
]

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      queryStringParams: { v: '2' },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'wesafe-language',
    },
    react: {
      useSuspense: false,
    },
  })

// Apply RTL direction for Arabic
i18n.on('languageChanged', (lng) => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === lng)
  document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
})

export default i18n
