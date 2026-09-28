import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, space } from '@/theme';

type Props = { label: string; checked: boolean; onChange: (checked: boolean) => void };

/** A tappable checkbox with its label (the whole row is the touch target). */
export function Checkbox({ label, checked, onChange }: Props) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? p.action : p.muted, backgroundColor: checked ? p.action : p.surface },
        ]}>
        {checked ? <CheckIcon size={18} weight="bold" color={p.onAction} /> : null}
      </View>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH, paddingVertical: space.xs },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
});
