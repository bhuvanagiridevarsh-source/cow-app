import { useQuery } from '@tanstack/react-query';

import bundledJson from '../../../content/content.json';

import { CONTENT_URL } from '@/config';
import { isUsableUrl } from '@/domain/urls';
import { fetchRemoteContent, resolveContent } from '@/features/content/load';
import { type Content, contentSchema } from '@/features/content/schema';
import { readJSON, STORAGE_KEYS, writeJSON } from '@/lib/storage';

/** The copy of content/content.json shipped inside the app (a test keeps it valid). */
export const BUNDLED_CONTENT: Content = contentSchema.parse(bundledJson);

function loadContent(): Promise<Content> {
  return resolveContent({
    bundled: BUNDLED_CONTENT,
    fetchRemote: async () => (isUsableUrl(CONTENT_URL) ? fetchRemoteContent(CONTENT_URL) : null),
    readCache: () => readJSON<unknown>(STORAGE_KEYS.contentCache),
    writeCache: (content) => writeJSON(STORAGE_KEYS.contentCache, content),
  });
}

/**
 * About-screen content. Shows the built-in copy right away, then quietly switches to the
 * newest good copy (online, or the last one saved on this phone). Never loading, never an error.
 */
export function useContent(): Content {
  const { data } = useQuery({
    queryKey: ['content'],
    queryFn: loadContent,
    staleTime: 60 * 60 * 1000,
    retry: false, // loadContent already falls back by itself
  });
  return data ?? BUNDLED_CONTENT;
}
