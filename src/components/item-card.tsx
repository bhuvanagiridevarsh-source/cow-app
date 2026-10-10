import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/domain/listing';
import { describeWindow } from '@/domain/pickup-windows';
import type { Item } from '@/features/items/api';
import { space } from '@/theme';

type Props = {
  item: Item;
  /** A line about where the item stands, e.g. "Pickup time has passed". */
  note?: string;
  /** Buttons for this item. */
  children?: ReactNode;
};

/** One listing: photo, name, value, and pickup time, plus any buttons. */
export function ItemCard({ item, note, children }: Props) {
  return (
    <Card>
      <View style={styles.row}>
        <ItemPhoto path={item.photo_path} label={item.title} style={styles.photo} />
        <View style={styles.text}>
          <AppText variant="heading">{item.title}</AppText>
          <AppText color="muted">
            {`${CATEGORY_LABELS[item.category]} · ${CONDITION_LABELS[item.condition]} · ${formatDollars(item.value)}`}
          </AppText>
          <AppText variant="small">{describeWindow(item.pickup_window_start, item.pickup_window_end)}</AppText>
          <AppText variant="small" color="muted">
            {item.town}
          </AppText>
        </View>
      </View>
      {note ? (
        <AppText variant="bodyStrong" color="link">
          {note}
        </AppText>
      ) : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  photo: { width: 88, height: 88 },
  text: { flex: 1, gap: 2 },
});
