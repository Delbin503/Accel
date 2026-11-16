/** Returns 0–4 based on length and character class diversity. */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

/** A password is considered strong enough to proceed once it reaches "Good" (score ≥ 3). */
export function isStrongPassword(pw: string): boolean {
  return scorePassword(pw) >= 3;
}
