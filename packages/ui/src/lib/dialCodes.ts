/* Country dialing codes for phone fields (name + code; no flag emojis per the
   design system's icon rules). Shared by every form that takes a phone number. */

export const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "+65",  name: "Singapore" },
  { code: "+60",  name: "Malaysia" },
  { code: "+62",  name: "Indonesia" },
  { code: "+66",  name: "Thailand" },
  { code: "+63",  name: "Philippines" },
  { code: "+84",  name: "Vietnam" },
  { code: "+91",  name: "India" },
  { code: "+86",  name: "China" },
  { code: "+852", name: "Hong Kong" },
  { code: "+81",  name: "Japan" },
  { code: "+82",  name: "South Korea" },
  { code: "+61",  name: "Australia" },
  { code: "+64",  name: "New Zealand" },
  { code: "+44",  name: "United Kingdom" },
  { code: "+1",   name: "United States" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+49",  name: "Germany" },
  { code: "+33",  name: "France" },
];

export const DEFAULT_DIAL_CODE = "+65";

/** Split a stored phone string ("+65 9123 4567") into dial code + national number. */
export function splitPhone(raw: string | undefined): { dialCode: string; number: string } {
  const v = (raw ?? "").trim();
  if (!v) return { dialCode: DEFAULT_DIAL_CODE, number: "" };
  // Longest code first so "+65" wins over "+6", "+1" matched last, etc.
  const match = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length).find((c) => v.startsWith(c.code));
  if (match) return { dialCode: match.code, number: v.slice(match.code.length).trim() };
  return { dialCode: DEFAULT_DIAL_CODE, number: v };
}
