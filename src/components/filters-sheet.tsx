import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DISTANCE_CHOICES, distanceChoiceLabel } from '@/domain/distance';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

type Props = {
  ref: Ref<BottomSheetModal>;
  maxMiles: number | null;
  onChange: (maxMiles: number | null) => void;
  onDone: () => void;
};

/** The Filters sheet on Browse: how far away to look. */
export function FiltersSheet({ ref, maxMiles, onChange, onDone }: Props) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backgroundStyle={{ backgroundColor: p.surface }}
      handleIndicatorStyle={{ backgroundColor: p.muted }}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}>
      <BottomSheetView style={[styles.body, { paddingBottom: Math.max(insets.bottom, space.md) + space.md }]}>
        <AppText variant="title">Filters</AppText>
        <AppText variant="bodyStrong" color="heading">
          How far away?
        </AppText>
        <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Distance">
          {DISTANCE_CHOICES.map((miles) => (
            <Chip
              key={String(miles)}
              label={distanceChoiceLabel(miles)}
              selected={maxMiles === miles}
              onPress={() => onChange(miles)}
            />
          ))}
        </View>
        <Button label="Show items" onPress={onDone} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.md, gap: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
