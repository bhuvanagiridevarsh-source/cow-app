import { type Content, parseContent } from '@/features/content/schema';

/** The largest content file the app will accept (the real one is about 7 KB). */
export const MAX_CONTENT_BYTES = 200_000;
const FETCH_TIMEOUT_MS = 10_000;

/** Of two valid copies, the one edited more recently. Ties keep the first. */
export function newerContent(a: Content, b: Content): Content {
  return b.updated > a.updated ? b : a;
}

/**
 * Downloads and checks the online copy. Returns null (never throws) if the phone is offline,
 * the download fails or is too big, or the file doesn't pass the content rules.
 */
export async function fetchRemoteContent(url: string, fetchImpl: typeof fetch = fetch): Promise<Content | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body = await response.text();
    if (body.length > MAX_CONTENT_BYTES) return null;
    return parseContent(JSON.parse(body));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Sources = {
  /** The copy shipped inside the app. Always valid (a test guards it). */
  bundled: Content;
  fetchRemote: () => Promise<Content | null>;
  /** The last good online copy saved on this phone (unchecked: it's re-validated here). */
  readCache: () => Promise<unknown>;
  writeCache: (content: Content) => Promise<void>;
};

/**
 * Picks the content to show:
 * 1. A valid online copy wins, and is saved as the new "last good copy".
 * 2. Otherwise the last good copy stays, unless the app itself now ships something newer.
 * 3. Otherwise the copy shipped inside the app.
 */
export async function resolveContent({ bundled, fetchRemote, readCache, writeCache }: Sources): Promise<Content> {
  const remote = await fetchRemote();
  if (remote) {
    await writeCache(remote);
    return remote;
  }
  const cached = parseContent(await readCache());
  return cached ? newerContent(bundled, cached) : bundled;
}
