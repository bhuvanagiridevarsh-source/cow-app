import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { Pressable, StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { AppText } from '@/components/ui/app-text';
import { formatDistance } from '@/domain/distance';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/domain/listing';
import { describeWindow } from '@/domain/pickup-windows';
import type { Item } from '@/features/items/api';
import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

type Props = {
  item: Item;
  miles: number | null;
  onPress: () => void;
  /** Set while an Ambassador is choosing several items. */
  selectable?: boolean;
  selected?: boolean;
};

/** One nearby item on Browse: a big photo and the facts a volunteer needs to decide. */
export function BrowseCard({ item, miles, onPress, selectable = false, selected = false }: Props) {
  const p = usePalette();
  const where = miles === null ? item.town : `${item.town} · ${formatDistance(miles)}`;
  const facts = `${CATEGORY_LABELS[item.category]} · ${CONDITION_LABELS[item.condition]} · ${formatDollars(item.value)}`;
  const when = describeWindow(item.pickup_window_start, item.pickup_window_end);
  return (
    <Pressable
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      accessibilityLabel={`${item.title}. ${facts}. ${where}. Pickup ${when}.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: p.surface,
          borderColor: selected ? p.action : p.surface,
          shadowColor: p.shadow,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}>
      <ItemPhoto path={item.photo_path} label={item.title} style={styles.photo} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="heading" style={styles.grow} numberOfLines={2}>
            {item.title}
          </AppText>
          {selectable ? (
            selected ? (
              <CheckCircleIcon size={30} weight="fill" color={p.action} />
            ) : (
              <CircleIcon size={30} color={p.muted} />
            )
          ) : null}
        </View>
        <AppText color="muted">{facts}</AppText>
        <AppText variant="bodyStrong" color="link">
          {where}
        </AppText>
        <AppText variant="small">{when}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 3,
  },
  photo: { width: '100%', aspectRatio: 16 / 10, borderRadius: 0 },
  body: { padding: space.md, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  grow: { flex: 1 },
});
