export type CountryOption = {
  iso2: string;
  name: string;
  callingCode: string;
};

/** East African markets first, then alphabetical by name. */
const PRIORITY_ISO2 = ["RW", "KE", "UG", "TZ", "BI", "CD", "ET", "SS", "ZA"];

const COUNTRY_DATA: CountryOption[] = [
  { iso2: "RW", name: "Rwanda", callingCode: "250" },
  { iso2: "KE", name: "Kenya", callingCode: "254" },
  { iso2: "UG", name: "Uganda", callingCode: "256" },
  { iso2: "TZ", name: "Tanzania", callingCode: "255" },
  { iso2: "BI", name: "Burundi", callingCode: "257" },
  { iso2: "CD", name: "Congo (DRC)", callingCode: "243" },
  { iso2: "ET", name: "Ethiopia", callingCode: "251" },
  { iso2: "SS", name: "South Sudan", callingCode: "211" },
  { iso2: "ZA", name: "South Africa", callingCode: "27" },
  { iso2: "AO", name: "Angola", callingCode: "244" },
  { iso2: "AR", name: "Argentina", callingCode: "54" },
  { iso2: "AU", name: "Australia", callingCode: "61" },
  { iso2: "AT", name: "Austria", callingCode: "43" },
  { iso2: "BE", name: "Belgium", callingCode: "32" },
  { iso2: "BJ", name: "Benin", callingCode: "229" },
  { iso2: "BW", name: "Botswana", callingCode: "267" },
  { iso2: "BR", name: "Brazil", callingCode: "55" },
  { iso2: "BF", name: "Burkina Faso", callingCode: "226" },
  { iso2: "CM", name: "Cameroon", callingCode: "237" },
  { iso2: "CA", name: "Canada", callingCode: "1" },
  { iso2: "TD", name: "Chad", callingCode: "235" },
  { iso2: "CN", name: "China", callingCode: "86" },
  { iso2: "CI", name: "Côte d'Ivoire", callingCode: "225" },
  { iso2: "DK", name: "Denmark", callingCode: "45" },
  { iso2: "EG", name: "Egypt", callingCode: "20" },
  { iso2: "FI", name: "Finland", callingCode: "358" },
  { iso2: "FR", name: "France", callingCode: "33" },
  { iso2: "DE", name: "Germany", callingCode: "49" },
  { iso2: "GH", name: "Ghana", callingCode: "233" },
  { iso2: "IN", name: "India", callingCode: "91" },
  { iso2: "IE", name: "Ireland", callingCode: "353" },
  { iso2: "IT", name: "Italy", callingCode: "39" },
  { iso2: "JP", name: "Japan", callingCode: "81" },
  { iso2: "LS", name: "Lesotho", callingCode: "266" },
  { iso2: "MG", name: "Madagascar", callingCode: "261" },
  { iso2: "MW", name: "Malawi", callingCode: "265" },
  { iso2: "ML", name: "Mali", callingCode: "223" },
  { iso2: "MU", name: "Mauritius", callingCode: "230" },
  { iso2: "MX", name: "Mexico", callingCode: "52" },
  { iso2: "MA", name: "Morocco", callingCode: "212" },
  { iso2: "MZ", name: "Mozambique", callingCode: "258" },
  { iso2: "NA", name: "Namibia", callingCode: "264" },
  { iso2: "NL", name: "Netherlands", callingCode: "31" },
  { iso2: "NZ", name: "New Zealand", callingCode: "64" },
  { iso2: "NE", name: "Niger", callingCode: "227" },
  { iso2: "NG", name: "Nigeria", callingCode: "234" },
  { iso2: "NO", name: "Norway", callingCode: "47" },
  { iso2: "PK", name: "Pakistan", callingCode: "92" },
  { iso2: "PT", name: "Portugal", callingCode: "351" },
  { iso2: "QA", name: "Qatar", callingCode: "974" },
  { iso2: "SN", name: "Senegal", callingCode: "221" },
  { iso2: "SL", name: "Sierra Leone", callingCode: "232" },
  { iso2: "SG", name: "Singapore", callingCode: "65" },
  { iso2: "ES", name: "Spain", callingCode: "34" },
  { iso2: "SE", name: "Sweden", callingCode: "46" },
  { iso2: "CH", name: "Switzerland", callingCode: "41" },
  { iso2: "AE", name: "United Arab Emirates", callingCode: "971" },
  { iso2: "GB", name: "United Kingdom", callingCode: "44" },
  { iso2: "US", name: "United States", callingCode: "1" },
  { iso2: "ZM", name: "Zambia", callingCode: "260" },
  { iso2: "ZW", name: "Zimbabwe", callingCode: "263" },
];

const prioritySet = new Set(PRIORITY_ISO2);

export const COUNTRIES: CountryOption[] = [
  ...COUNTRY_DATA.filter((c) => prioritySet.has(c.iso2)),
  ...COUNTRY_DATA.filter((c) => !prioritySet.has(c.iso2)).sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function countryFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function findCountryByIso2(iso2: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.iso2 === iso2);
}
