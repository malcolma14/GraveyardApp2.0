// Provinces (ported from window.RPG_PROVINCES / window.RPG_PROVINCE).
// Top combined marginal rates, 2026 (EY tax cards, 15 Jan 2026).
// Probate: simplified large-estate schedules (IG Tax and Estate Library, Dec 2025, s8.4).

export const PROVINCES = [
  { code: "AB", name: "Alberta",                   ord: 0.48,   cap: 0.24,   probate: (e) => Math.min(525, e > 0 ? 525 : 0),                                  probateNote: "court fee capped at $525" },
  { code: "BC", name: "British Columbia",          ord: 0.535,  cap: 0.2675, probate: (e) => (e > 50000 ? 150 + ((e - 50000) / 1000) * 14 : 0),               probateNote: "$150 + $14 per $1,000 over $50K" },
  { code: "MB", name: "Manitoba",                  ord: 0.504,  cap: 0.252,  probate: () => 0,                                                                probateNote: "no probate fee" },
  { code: "NB", name: "New Brunswick",             ord: 0.525,  cap: 0.2625, probate: (e) => (e > 20000 ? (e / 1000) * 5 : 0),                                probateNote: "$5 per $1,000 over $20K" },
  { code: "NL", name: "Newfoundland and Labrador", ord: 0.548,  cap: 0.274,  probate: (e) => e * 0.006,                                                       probateNote: "0.6% of the estate" },
  { code: "NS", name: "Nova Scotia",               ord: 0.54,   cap: 0.27,   probate: (e) => (e > 100000 ? 1002.65 + ((e - 100000) / 1000) * 16.95 : 1002.65), probateNote: "$1,002.65 + $16.95 per $1,000 over $100K" },
  { code: "NT", name: "Northwest Territories",     ord: 0.4705, cap: 0.2353, probate: (e) => Math.min(435, e > 0 ? 435 : 0),                                  probateNote: "court fee capped at $435" },
  { code: "NU", name: "Nunavut",                   ord: 0.445,  cap: 0.2225, probate: (e) => Math.min(400, e > 0 ? 400 : 0),                                  probateNote: "court fee capped at $400" },
  { code: "ON", name: "Ontario",                   ord: 0.5353, cap: 0.2676, probate: (e) => (e > 50000 ? ((e - 50000) / 1000) * 15 : 0),                     probateNote: "$15 per $1,000 over $50K" },
  { code: "PE", name: "Prince Edward Island",      ord: 0.52,   cap: 0.26,   probate: (e) => (e > 100000 ? 400 + ((e - 100000) / 1000) * 4 : 400),            probateNote: "$400 + $4 per $1,000 over $100K" },
  { code: "QC", name: "Quebec",                    ord: 0.5331, cap: 0.2665, probate: (e) => (e > 0 ? 209 : 0),                                               probateNote: "$209 flat (nil for notarial wills)" },
  { code: "SK", name: "Saskatchewan",              ord: 0.475,  cap: 0.2375, probate: (e) => e * 0.007,                                                       probateNote: "0.7% of the estate" },
  { code: "YT", name: "Yukon",                     ord: 0.48,   cap: 0.24,   probate: (e) => Math.min(140, e > 0 ? 140 : 0),                                  probateNote: "court fee capped at $140" }
];

export function getProvince(code) {
  return PROVINCES.find((p) => p.code === code) || PROVINCES[8]; // default ON
}

export default PROVINCES;
