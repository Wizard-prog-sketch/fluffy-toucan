// Language data only — no Anthropic SDK imports. Safe to import in client components.

export const LANGUAGES = [
  { value: "English", label: "English", group: "Base", rtl: false },
  // East Asian
  { value: "Chinese-Simplified", label: "Chinese — Simplified (普通话)", group: "East Asian", rtl: false },
  { value: "Chinese-Traditional", label: "Chinese — Traditional (繁體中文)", group: "East Asian", rtl: false },
  { value: "Japanese", label: "Japanese (日本語)", group: "East Asian", rtl: false },
  { value: "Korean", label: "Korean (한국어)", group: "East Asian", rtl: false },
  // Southeast Asian
  { value: "Indonesian", label: "Indonesian (Bahasa Indonesia)", group: "Southeast Asian", rtl: false },
  { value: "Filipino", label: "Filipino / Tagalog", group: "Southeast Asian", rtl: false },
  { value: "Thai", label: "Thai (ภาษาไทย)", group: "Southeast Asian", rtl: false },
  { value: "Vietnamese", label: "Vietnamese (Tiếng Việt)", group: "Southeast Asian", rtl: false },
  { value: "Malay", label: "Malay (Bahasa Melayu)", group: "Southeast Asian", rtl: false },
  // South Asian
  { value: "Hindi", label: "Hindi (हिंदी)", group: "South Asian", rtl: false },
  { value: "Tamil", label: "Tamil (தமிழ்)", group: "South Asian", rtl: false },
  { value: "Telugu", label: "Telugu (తెలుగు)", group: "South Asian", rtl: false },
  { value: "Bengali", label: "Bengali (বাংলা)", group: "South Asian", rtl: false },
  { value: "Malayalam", label: "Malayalam (മലയാളം)", group: "South Asian", rtl: false },
  { value: "Marathi", label: "Marathi (मराठी)", group: "South Asian", rtl: false },
  { value: "Kannada", label: "Kannada (ಕನ್ನಡ)", group: "South Asian", rtl: false },
  { value: "Urdu", label: "Urdu (اردو)", group: "South Asian", rtl: true },
  { value: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)", group: "South Asian", rtl: false },
  { value: "Odia", label: "Odia / Oriya (ଓଡ଼ିଆ)", group: "South Asian", rtl: false },
  { value: "Gujarati", label: "Gujarati (ગુજરાતી)", group: "South Asian", rtl: false },
  // Western European
  { value: "Spanish", label: "Spanish (Español)", group: "Western European", rtl: false },
  { value: "Portuguese-Brazilian", label: "Portuguese — Brazilian (Português Brasileiro)", group: "Western European", rtl: false },
  { value: "French", label: "French (Français)", group: "Western European", rtl: false },
  { value: "German", label: "German (Deutsch)", group: "Western European", rtl: false },
  { value: "Italian", label: "Italian (Italiano)", group: "Western European", rtl: false },
  { value: "Dutch", label: "Dutch (Nederlands)", group: "Western European", rtl: false },
  // Eastern European
  { value: "Russian", label: "Russian (Русский)", group: "Eastern European", rtl: false },
  { value: "Polish", label: "Polish (Polski)", group: "Eastern European", rtl: false },
  { value: "Romanian", label: "Romanian (Română)", group: "Eastern European", rtl: false },
  { value: "Croatian", label: "Croatian (Hrvatski)", group: "Eastern European", rtl: false },
  { value: "Hungarian", label: "Hungarian (Magyar)", group: "Eastern European", rtl: false },
  { value: "Czech", label: "Czech (Čeština)", group: "Eastern European", rtl: false },
  { value: "Serbian", label: "Serbian (Srpski)", group: "Eastern European", rtl: false },
  { value: "Ukrainian", label: "Ukrainian (Українська)", group: "Eastern European", rtl: false },
  { value: "Slovak", label: "Slovak (Slovenčina)", group: "Eastern European", rtl: false },
  { value: "Greek", label: "Greek (Ελληνικά)", group: "Eastern European", rtl: false },
  // Middle Eastern
  { value: "Arabic", label: "Arabic (العربية)", group: "Middle Eastern", rtl: true },
  { value: "Persian", label: "Persian / Farsi (فارسی)", group: "Middle Eastern", rtl: true },
  { value: "Hebrew", label: "Hebrew (עברית)", group: "Middle Eastern", rtl: true },
  { value: "Turkish", label: "Turkish (Türkçe)", group: "Middle Eastern", rtl: false },
] as const;

export type LanguageValue = typeof LANGUAGES[number]["value"];

export function getLanguageMeta(value: string) {
  return LANGUAGES.find((l) => l.value === value) ?? { value, label: value, group: "Other", rtl: false };
}

export const LANGUAGE_GROUPS = [
  "Base",
  "East Asian",
  "Southeast Asian",
  "South Asian",
  "Western European",
  "Eastern European",
  "Middle Eastern",
] as const;
