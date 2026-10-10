import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { EMPTY_DRAFT, type ListingDraft } from '@/domain/listing';

type ListingFlow = {
  draft: ListingDraft;
  /** Set when changing an existing listing; undefined for a new one. */
  editingId: string | undefined;
  update: (patch: Partial<ListingDraft>) => void;
  /** Start over: a blank form, or one filled in from an existing listing. */
  start: (draft?: ListingDraft, editingId?: string) => void;
};

const ListingContext = createContext<ListingFlow | null>(null);

/** Holds the answers while someone moves through the four listing steps. */
export function ListingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const update = useCallback((patch: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const start = useCallback((next: ListingDraft = EMPTY_DRAFT, id?: string) => {
    setDraft(next);
    setEditingId(id);
  }, []);
  const value = useMemo(() => ({ draft, editingId, update, start }), [draft, editingId, update, start]);
  return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>;
}

export function useListingDraft(): ListingFlow {
  const flow = useContext(ListingContext);
  if (!flow) throw new Error('useListingDraft must be used inside the list-item screens');
  return flow;
}
