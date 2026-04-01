/**
 * Converts a Date to the YYYY-MM-DDTHH:MM format required by <input type="datetime-local">.
 * Uses local time to avoid UTC offset issues.
 */
export function dateToLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  );
}

/**
 * Parses a YYYY-MM-DDTHH:MM string from <input type="datetime-local"> into a local Date.
 * Returns undefined if the string is empty.
 */
export function localISOToDate(s: string): Date | undefined {
  if (!s) return undefined;
  // Appending :00 makes it unambiguously local time in all browsers
  return new Date(s + ':00');
}

/**
 * Formats a Date for display (e.g., "Apr 1, 2026 at 9:30 AM").
 */
export function formatDateTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats a Date as a short date (e.g., "Apr 1, 2026").
 */
export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a Date as MM/DD/YY for milestone pill display.
 */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

/**
 * Adds a given number of minutes to a Date, returning a new Date.
 */
export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/**
 * Adds a given number of days to a Date, returning a new Date.
 */
export function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns true if a <= b (by time value).
 */
export function dateLE(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}
