import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { StepHeader } from '@/components/step-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS, CONDITION_LABELS, parseValue } from '@/domain/listing';
import { formatDay, windowHours } from '@/domain/pickup-windows';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import { saveListing } from '@/features/items/api';
import { useListingDraft } from '@/features/items/listing-draft';
import { PhotoError } from '@/lib/photos';
import { space } from '@/theme';

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="small" color="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

/** Step 4: check everything, then post. */
export default function ListItemReview() {
  const { userId } = useAuth();
  const { draft, editingId } = useListingDraft();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const post = async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await saveListing(userId, draft, editingId);
      await queryClient.invalidateQueries({ queryKey: ['my-items'] });
      if (draft.photoPath) await queryClient.invalidateQueries({ queryKey: ['photo-link', draft.photoPath] });
      router.dismissTo('/donate');
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : friendlyError(e));
      setBusy(false);
      inFlight.current = false;
    }
  };

  const address = [draft.street.trim(), draft.unit.trim()].filter(Boolean).join(', ');
  return (
    <Screen>
      <ScreenHeader />
      <StepHeader
        step={4}
        of={4}
        title="Does this look right?"
        body={editingId ? undefined : 'Once you post, volunteers nearby can ask to pick it up.'}
      />
      <Card>
        <ItemPhoto uri={draft.photoUri} path={draft.photoPath} label={draft.title} style={styles.photo} />
        <AppText variant="heading">{draft.title.trim()}</AppText>
        <Line
          label="Category and condition"
          value={`${draft.category ? CATEGORY_LABELS[draft.category] : ''} · ${
            draft.condition ? CONDITION_LABELS[draft.condition] : ''
          }`}
        />
        <Line label="Estimated value" value={formatDollars(parseValue(draft.value) ?? 0)} />
        <Line
          label="Pickup time"
          value={draft.day && draft.window ? `${formatDay(draft.day)} · ${windowHours(draft.window)}` : ''}
        />
      </Card>
      <Card tone="tint">
        <AppText variant="bodyStrong" color="heading">
          Private until you accept a volunteer
        </AppText>
        <Line label="Address" value={`${address}\n${draft.town.trim()}, NJ ${draft.zip}`} />
        {draft.note.trim() ? <Line label="Note for the volunteer" value={draft.note.trim()} /> : null}
      </Card>

      <FormMessage message={error} />
      <Button label={editingId ? 'Save changes' : 'Post'} loading={busy} onPress={() => void post()} />
      <Button label="Go back and change something" variant="outline" disabled={busy} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3 },
  line: { gap: 2, marginTop: space.xs },
});
