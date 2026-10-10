import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { useRef, useState } from 'react';
import { FlatList, Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { BrowseCard } from '@/components/browse-card';
import { FiltersSheet } from '@/components/filters-sheet';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { TextLink } from '@/components/ui/text-link';
import { distanceChoiceLabel, sortByDistance } from '@/domain/distance';
import { CATEGORY_LABELS, type ItemCategory } from '@/domain/listing';
import { claimsLeft, requestBlocker, summarizeRequests } from '@/domain/requests';
import { useAuth } from '@/features/auth/auth-provider';
import { useOrigin } from '@/features/browse/use-origin';
import { friendlyError } from '@/features/errors';
import { requestPickups } from '@/features/pickups/api';
import { useMyStats, useOpenItems, useRefreshPickupData } from '@/features/pickups/use-pickups';
import { useSafetyGate } from '@/features/safety/use-safety-gate';
import { useRules } from '@/features/settings/use-settings';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ItemCategory[];

/** Browse: nearby items a volunteer can ask to pick up. */
export default function BrowseScreen() {
  const p = usePalette();
  const { userId, profile } = useAuth();
  const rules = useRules();
  const items = useOpenItems(userId);
  const stats = useMyStats(userId);
  const origin = useOrigin(profile?.zip);
  const refresh = useRefreshPickupData();
  const passedSafety = useSafetyGate();
  const sheet = useRef<BottomSheetModal>(null);

  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [maxMiles, setMaxMiles] = useState<number | null>(25);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);

  const all = items.data ?? [];
  const rows = sortByDistance(category ? all.filter((i) => i.category === category) : all, origin.point, maxMiles);
  const isAmbassador = !!profile?.verified_ambassador;
  // Only count choices that are still on the list (an item may have been taken meanwhile).
  const chosen = selected.filter((id) => all.some((i) => i.id === id));
  const needsAdult = !!stats.data?.needs_adult_on_pickup;

  const toggle = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const stopSelecting = () => {
    setSelecting(false);
    setSelected([]);
    setAdult(false);
  };

  const requestChosen = async () => {
    if (!stats.data || chosen.length === 0 || busy) return;
    const blocker = requestBlocker(stats.data, rules.minPickupAge, chosen.length);
    if (blocker) return setNotice({ text: blocker, tone: 'error' });
    if (needsAdult && !adult) {
      return setNotice({ text: 'Please confirm that an adult will come with you.', tone: 'error' });
    }
    if (!(await passedSafety())) return;
    setBusy(true);
    setNotice(null);
    try {
      const { requested, message } = summarizeRequests(await requestPickups(chosen, adult));
      await refresh();
      stopSelecting();
      const done = requested === 1 ? 'You asked for 1 item.' : `You asked for ${requested} items.`;
      setNotice({
        text: requested > 0 ? `${done} Find them on the Hours tab. ${message ?? ''}`.trim() : (message ?? ''),
        tone: requested > 0 ? 'info' : 'error',
      });
    } catch (e) {
      setNotice({ text: friendlyError(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="title">Browse</AppText>
      <View style={styles.originRow}>
        <AppText color="muted" style={styles.grow}>
          {origin.source === 'phone' ? 'Near you' : profile?.zip ? `Near ZIP ${profile.zip}` : 'Nearby items'}
        </AppText>
        {origin.source === 'phone' ? (
          <TextLink label="Use my ZIP instead" onPress={origin.switchToZip} />
        ) : (
          <TextLink
            label={origin.busy ? 'Finding you…' : 'Use my location'}
            disabled={origin.busy}
            onPress={() => void origin.switchToPhone()}
          />
        )}
      </View>
      <FormMessage message={origin.message} tone="info" />
      {origin.needsSettings ? <TextLink label="Open Settings" onPress={() => void Linking.openSettings()} /> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.bleed}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      <View style={styles.originRow}>
        <View style={styles.grow}>
          <Button
            label={distanceChoiceLabel(maxMiles)}
            variant="outline"
            icon={SlidersHorizontalIcon}
            accessibilityHint="Opens filters"
            onPress={() => sheet.current?.present()}
          />
        </View>
      </View>
      {isAmbassador ? (
        <TextLink
          label={selecting ? 'Stop selecting' : 'Select several items'}
          onPress={() => (selecting ? stopSelecting() : setSelecting(true))}
        />
      ) : null}
      {notice ? <FormMessage message={notice.text} tone={notice.tone} /> : null}
    </View>
  );

  let empty = null;
  if (items.isPending) empty = <Loading label="Finding items near you" />;
  else if (items.isError && all.length === 0) {
    empty = <ErrorRetry message={friendlyError(items.error)} onRetry={() => void items.refetch()} retrying={items.isFetching} />;
  } else if (all.length === 0) {
    empty = (
      <EmptyState
        title="No items right now"
        body="Nothing is waiting for pickup at the moment. Check back soon, or tell a neighbor about CoW."
      />
    );
  } else {
    empty = (
      <EmptyState
        title="Nothing matches"
        body="Try another category, or look farther away."
        actionLabel="Show everything"
        onAction={() => {
          setCategory(null);
          setMaxMiles(null);
        }}
      />
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.item.id}
        renderItem={({ item: row }) => (
          <BrowseCard
            item={row.item}
            miles={row.miles}
            selectable={selecting}
            selected={chosen.includes(row.item.id)}
            onPress={() =>
              selecting ? toggle(row.item.id) : router.push({ pathname: '/item/[id]', params: { id: row.item.id } })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.empty}>{empty}</View>}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={items.isRefetching} onRefresh={() => void refresh()} tintColor={p.brand} />
        }
      />
      {selecting ? (
        <View style={[styles.bar, { backgroundColor: p.surface, borderTopColor: p.border }]}>
          {stats.data ? (
            <AppText variant="small" color="muted">
              {`You can ask for ${claimsLeft(stats.data)} more right now.`}
            </AppText>
          ) : null}
          {needsAdult ? <Checkbox label="An adult will come with me." checked={adult} onChange={setAdult} /> : null}
          <Button
            label={chosen.length === 1 ? 'Request 1 item' : `Request ${chosen.length} items`}
            disabled={chosen.length === 0}
            loading={busy}
            onPress={() => void requestChosen()}
          />
        </View>
      ) : null}
      <FiltersSheet
        ref={sheet}
        maxMiles={maxMiles}
        onChange={setMaxMiles}
        onDone={() => sheet.current?.dismiss()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, paddingBottom: 0, gap: 0 },
  list: { padding: space.md, paddingBottom: space.xxl, gap: space.md },
  header: { gap: space.sm },
  originRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  bleed: { marginHorizontal: -space.md, flexGrow: 0 },
  chips: { gap: space.sm, paddingHorizontal: space.md },
  empty: { minHeight: 320 },
  bar: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
