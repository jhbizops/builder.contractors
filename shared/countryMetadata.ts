export type EnglishProficiency = "high" | "medium" | "low";

export interface CountryMetadata {
  readonly name: string;
  readonly code: string;
  readonly languages: readonly string[];
  readonly currency: string;
  readonly proficiency: EnglishProficiency;
  readonly localize: boolean;
}

type LowEnglishCountry =
  | "Brazil"
  | "China"
  | "Egypt"
  | "Indonesia"
  | "Japan"
  | "Kuwait"
  | "Oman"
  | "Panama"
  | "Qatar"
  | "Saudi Arabia"
  | "Slovenia"
  | "Thailand"
  | "Turkey"
  | "United Arab Emirates";

const lowEnglishCountries = new Set<LowEnglishCountry>([
  "Brazil",
  "China",
  "Egypt",
  "Indonesia",
  "Japan",
  "Kuwait",
  "Oman",
  "Panama",
  "Qatar",
  "Saudi Arabia",
  "Slovenia",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
]);

const countryEntries: readonly CountryMetadata[] = [
  { name: "Albania", code: "AL", languages: ["sq", "en"], currency: "ALL", proficiency: "medium", localize: true },
  { name: "Andorra", code: "AD", languages: ["ca", "es", "fr", "pt"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Antigua and Barbuda", code: "AG", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "Argentina", code: "AR", languages: ["es", "en"], currency: "ARS", proficiency: "medium", localize: true },
  { name: "Armenia", code: "AM", languages: ["hy", "ru", "en"], currency: "AMD", proficiency: "medium", localize: true },
  { name: "Australia", code: "AU", languages: ["en"], currency: "AUD", proficiency: "high", localize: true },
  { name: "Austria", code: "AT", languages: ["de", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Bahamas", code: "BS", languages: ["en"], currency: "BSD", proficiency: "high", localize: true },
  { name: "Bahrain", code: "BH", languages: ["ar", "en"], currency: "BHD", proficiency: "medium", localize: true },
  { name: "Barbados", code: "BB", languages: ["en"], currency: "BBD", proficiency: "high", localize: true },
  { name: "Belgium", code: "BE", languages: ["nl", "fr", "de", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Belize", code: "BZ", languages: ["en", "es"], currency: "BZD", proficiency: "high", localize: true },
  { name: "Brazil", code: "BR", languages: ["pt-BR", "en"], currency: "BRL", proficiency: "medium", localize: true },
  { name: "Brunei", code: "BN", languages: ["ms", "en"], currency: "BND", proficiency: "high", localize: true },
  { name: "Bulgaria", code: "BG", languages: ["bg", "en"], currency: "BGN", proficiency: "medium", localize: true },
  { name: "Canada", code: "CA", languages: ["en", "fr"], currency: "CAD", proficiency: "high", localize: true },
  { name: "Chile", code: "CL", languages: ["es", "en"], currency: "CLP", proficiency: "medium", localize: true },
  { name: "China", code: "CN", languages: ["zh-CN", "en"], currency: "CNY", proficiency: "medium", localize: true },
  { name: "Costa Rica", code: "CR", languages: ["es", "en"], currency: "CRC", proficiency: "medium", localize: true },
  { name: "Croatia", code: "HR", languages: ["hr", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Cyprus", code: "CY", languages: ["el", "tr", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Czechia", code: "CZ", languages: ["cs", "en"], currency: "CZK", proficiency: "high", localize: true },
  { name: "Denmark", code: "DK", languages: ["da", "en"], currency: "DKK", proficiency: "high", localize: true },
  { name: "Dominica", code: "DM", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "Dominican Republic", code: "DO", languages: ["es", "en"], currency: "DOP", proficiency: "medium", localize: true },
  { name: "Egypt", code: "EG", languages: ["ar", "en"], currency: "EGP", proficiency: "medium", localize: true },
  { name: "El Salvador", code: "SV", languages: ["es", "en"], currency: "USD", proficiency: "medium", localize: true },
  { name: "Estonia", code: "EE", languages: ["et", "ru", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Finland", code: "FI", languages: ["fi", "sv", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "France", code: "FR", languages: ["fr", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Georgia", code: "GE", languages: ["ka", "en"], currency: "GEL", proficiency: "medium", localize: true },
  { name: "Germany", code: "DE", languages: ["de", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Greece", code: "GR", languages: ["el", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Grenada", code: "GD", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "Guyana", code: "GY", languages: ["en"], currency: "GYD", proficiency: "high", localize: true },
  { name: "Hungary", code: "HU", languages: ["hu", "en"], currency: "HUF", proficiency: "medium", localize: true },
  { name: "Iceland", code: "IS", languages: ["is", "en"], currency: "ISK", proficiency: "high", localize: true },
  { name: "Indonesia", code: "ID", languages: ["id", "en"], currency: "IDR", proficiency: "medium", localize: true },
  { name: "Ireland", code: "IE", languages: ["en", "ga"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Italy", code: "IT", languages: ["it", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Jamaica", code: "JM", languages: ["en"], currency: "JMD", proficiency: "high", localize: true },
  { name: "Japan", code: "JP", languages: ["ja", "en"], currency: "JPY", proficiency: "medium", localize: true },
  { name: "Kuwait", code: "KW", languages: ["ar", "en"], currency: "KWD", proficiency: "medium", localize: true },
  { name: "Latvia", code: "LV", languages: ["lv", "en", "ru"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Liechtenstein", code: "LI", languages: ["de", "en"], currency: "CHF", proficiency: "high", localize: true },
  { name: "Lithuania", code: "LT", languages: ["lt", "en", "ru"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Luxembourg", code: "LU", languages: ["lb", "fr", "de", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Malaysia", code: "MY", languages: ["ms", "en", "zh", "ta"], currency: "MYR", proficiency: "high", localize: true },
  { name: "Maldives", code: "MV", languages: ["dv", "en"], currency: "MVR", proficiency: "medium", localize: true },
  { name: "Malta", code: "MT", languages: ["mt", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Mauritius", code: "MU", languages: ["en", "fr", "mfe"], currency: "MUR", proficiency: "high", localize: true },
  { name: "Moldova", code: "MD", languages: ["ro", "ru", "en"], currency: "MDL", proficiency: "medium", localize: true },
  { name: "Monaco", code: "MC", languages: ["fr", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Montenegro", code: "ME", languages: ["sr", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Netherlands", code: "NL", languages: ["nl", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "New Zealand", code: "NZ", languages: ["en", "mi"], currency: "NZD", proficiency: "high", localize: true },
  { name: "North Macedonia", code: "MK", languages: ["mk", "sq", "en"], currency: "MKD", proficiency: "medium", localize: true },
  { name: "Norway", code: "NO", languages: ["nb", "nn", "en"], currency: "NOK", proficiency: "high", localize: true },
  { name: "Oman", code: "OM", languages: ["ar", "en"], currency: "OMR", proficiency: "medium", localize: true },
  { name: "Panama", code: "PA", languages: ["es", "en"], currency: "PAB", proficiency: "medium", localize: true },
  { name: "Paraguay", code: "PY", languages: ["es", "gn"], currency: "PYG", proficiency: "medium", localize: true },
  { name: "Peru", code: "PE", languages: ["es", "qu", "ay"], currency: "PEN", proficiency: "medium", localize: true },
  { name: "Philippines", code: "PH", languages: ["en", "fil"], currency: "PHP", proficiency: "high", localize: true },
  { name: "Poland", code: "PL", languages: ["pl", "en"], currency: "PLN", proficiency: "high", localize: true },
  { name: "Portugal", code: "PT", languages: ["pt-PT", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Qatar", code: "QA", languages: ["ar", "en"], currency: "QAR", proficiency: "medium", localize: true },
  { name: "Romania", code: "RO", languages: ["ro", "en"], currency: "RON", proficiency: "medium", localize: true },
  { name: "Saint Kitts and Nevis", code: "KN", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "Saint Lucia", code: "LC", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "Saint Vincent and the Grenadines", code: "VC", languages: ["en"], currency: "XCD", proficiency: "high", localize: true },
  { name: "San Marino", code: "SM", languages: ["it", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Saudi Arabia", code: "SA", languages: ["ar", "en"], currency: "SAR", proficiency: "medium", localize: true },
  { name: "Serbia", code: "RS", languages: ["sr", "en"], currency: "RSD", proficiency: "medium", localize: true },
  { name: "Seychelles", code: "SC", languages: ["en", "fr", "crs"], currency: "SCR", proficiency: "high", localize: true },
  { name: "Singapore", code: "SG", languages: ["en", "ms", "zh", "ta"], currency: "SGD", proficiency: "high", localize: true },
  { name: "Slovakia", code: "SK", languages: ["sk", "hu", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Slovenia", code: "SI", languages: ["sl", "en"], currency: "EUR", proficiency: "medium", localize: true },
  { name: "South Africa", code: "ZA", languages: ["en", "zu", "xh", "af"], currency: "ZAR", proficiency: "high", localize: true },
  { name: "South Korea", code: "KR", languages: ["ko", "en"], currency: "KRW", proficiency: "high", localize: true },
  { name: "Spain", code: "ES", languages: ["es", "ca", "eu", "gl", "en"], currency: "EUR", proficiency: "high", localize: true },
  { name: "Suriname", code: "SR", languages: ["nl", "en", "srn"], currency: "SRD", proficiency: "medium", localize: true },
  { name: "Sweden", code: "SE", languages: ["sv", "en"], currency: "SEK", proficiency: "high", localize: true },
  { name: "Switzerland", code: "CH", languages: ["de", "fr", "it", "rm", "en"], currency: "CHF", proficiency: "high", localize: true },
  { name: "Thailand", code: "TH", languages: ["th", "en"], currency: "THB", proficiency: "medium", localize: true },
  { name: "Trinidad and Tobago", code: "TT", languages: ["en"], currency: "TTD", proficiency: "high", localize: true },
  { name: "Turkey", code: "TR", languages: ["tr", "en"], currency: "TRY", proficiency: "medium", localize: true },
  { name: "United Arab Emirates", code: "AE", languages: ["ar", "en"], currency: "AED", proficiency: "medium", localize: true },
  { name: "United Kingdom", code: "GB", languages: ["en"], currency: "GBP", proficiency: "high", localize: true },
  { name: "United States", code: "US", languages: ["en"], currency: "USD", proficiency: "high", localize: true },
  { name: "Uruguay", code: "UY", languages: ["es", "en"], currency: "UYU", proficiency: "medium", localize: true },
  { name: "Vietnam", code: "VN", languages: ["vi", "en"], currency: "VND", proficiency: "medium", localize: true },
];

export const countryMetadata: readonly CountryMetadata[] = countryEntries;

export const countryMetadataByCode: Record<string, CountryMetadata> = countryEntries.reduce(
  (acc, country) => {
    acc[country.code] = country;
    return acc;
  },
  {} as Record<string, CountryMetadata>,
);

export const countryCodes = countryEntries.map((country) => country.code);

export const countryNames = countryEntries.map((country) => country.name);

export const localizeCountryCodes = countryEntries
  .filter((country) => country.localize)
  .map((country) => country.code);

export const lowEnglishCountriesByName = new Set(
  countryEntries
    .filter((country): country is CountryMetadata & { name: LowEnglishCountry } =>
      lowEnglishCountries.has(country.name as LowEnglishCountry)
    )
    .map((country) => country.name),
);

export default countryMetadata;
