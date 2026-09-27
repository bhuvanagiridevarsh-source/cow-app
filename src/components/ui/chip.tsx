import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, radius, space } from '@/theme';

type Props = { label: string; selected: boolean; onPress: () => void };

/** Selectable pill (filters, choices). */
export function Chip({ label, selected, onPress }: Props) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? p.action : p.surface, borderColor: selected ? p.action : p.border },
      ]}>
      <AppText variant="small" style={{ color: selected ? p.onAction : p.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
});
