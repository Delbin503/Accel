/**
 * Single source of truth for the timezone picker.
 *
 * Four different timezone lists had drifted across the app (site wizard, site
 * edit, signup, on-prem setup, system config), each with its own label format.
 * Every picker now reads this one, so an operator sees the same string —
 * IANA name plus GMT offset — wherever a timezone is chosen or displayed.
 *
 * Offsets are standard time (no DST shifting) — they label the zone, they
 * don't do the arithmetic.
 */

export interface TimezoneOption {
  /** IANA zone id — what gets stored. */
  value: string;
  /** What the operator reads, e.g. "Asia/Singapore (GMT+08:00)". */
  label: string;
}

function tz(value: string, offset: string): TimezoneOption {
  return { value, label: `${value} (GMT${offset})` };
}

export const TIMEZONES: TimezoneOption[] = [
  tz("Pacific/Auckland", "+12:00"),
  tz("Australia/Sydney", "+10:00"),
  tz("Australia/Brisbane", "+10:00"),
  tz("Australia/Perth", "+08:00"),
  tz("Asia/Seoul", "+09:00"),
  tz("Asia/Tokyo", "+09:00"),
  tz("Asia/Manila", "+08:00"),
  tz("Asia/Shanghai", "+08:00"),
  tz("Asia/Hong_Kong", "+08:00"),
  tz("Asia/Singapore", "+08:00"),
  tz("Asia/Kuala_Lumpur", "+08:00"),
  tz("Asia/Jakarta", "+07:00"),
  tz("Asia/Bangkok", "+07:00"),
  tz("Asia/Ho_Chi_Minh", "+07:00"),
  tz("Asia/Dhaka", "+06:00"),
  tz("Asia/Yangon", "+06:30"),
  tz("Asia/Kolkata", "+05:30"),
  tz("Asia/Karachi", "+05:00"),
  tz("Asia/Dubai", "+04:00"),
  tz("Asia/Riyadh", "+03:00"),
  tz("Europe/Istanbul", "+03:00"),
  tz("Africa/Nairobi", "+03:00"),
  tz("Europe/Berlin", "+01:00"),
  tz("Europe/Paris", "+01:00"),
  tz("Europe/Madrid", "+01:00"),
  tz("Europe/London", "+00:00"),
  tz("UTC", "+00:00"),
  tz("America/Sao_Paulo", "-03:00"),
  tz("America/New_York", "-05:00"),
  tz("America/Chicago", "-06:00"),
  tz("America/Denver", "-07:00"),
  tz("America/Los_Angeles", "-08:00"),
  tz("Pacific/Honolulu", "-10:00"),
];

/** Default for new sites and accounts. */
export const DEFAULT_TIMEZONE = "Asia/Singapore";

/**
 * Label for a stored zone id. Falls back to the raw value so a zone that
 * isn't in the list above still renders something sensible.
 */
export function timezoneLabel(value: string): string {
  return TIMEZONES.find((t) => t.value === value)?.label ?? value;
}
