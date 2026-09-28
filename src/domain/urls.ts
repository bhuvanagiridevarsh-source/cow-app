/** True only for a non-blank http(s) URL. Buttons whose URL fails this are hidden. */
export function isUsableUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Keeps only the links that have a usable URL. */
export function visibleLinks<T extends { url: string }>(links: T[]): T[] {
  return links.filter((l) => isUsableUrl(l.url));
}
