/** ZIP code rules. The database checks the same thing (private.zip_allowed) with the board's settings. */

/** All of New Jersey (070-089). Used only until the live settings load. */
export const DEFAULT_ZIP_PREFIXES: readonly string[] = Array.from({ length: 20 }, (_, i) =>
  String(70 + i).padStart(3, '0'),
);

export function normalizeZip(input: string): string {
  return input.replace(/\s+/g, '');
}

export function isValidZip(input: string): boolean {
  return /^\d{5}$/.test(normalizeZip(input));
}

/** True if the ZIP is inside the service area (its first 3 digits are an allowed prefix). */
export function isInServiceArea(input: string, allowedPrefixes: readonly string[]): boolean {
  const zip = normalizeZip(input);
  return isValidZip(zip) && allowedPrefixes.includes(zip.slice(0, 3));
}
