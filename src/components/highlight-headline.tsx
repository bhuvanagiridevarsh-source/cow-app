import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

/** "Compassion Driven Change" with the highlighted word, like the website's hero. */
export function HighlightHeadline({ highlight, rest }: { highlight: string; rest: string }) {
  const p = usePalette();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${highlight} ${rest}`}>
      <View style={[styles.chip, { backgroundColor: p.highlightBg }]}>
        <AppText variant="display" style={{ color: p.highlightText }}>
          {highlight}
        </AppText>
      </View>
      <AppText variant="display">{rest}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  chip: { borderRadius: 14, paddingHorizontal: space.sm, paddingTop: 4 },
});
