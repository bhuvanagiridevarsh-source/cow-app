import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, radius, space, type Palette } from '@/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'outline' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: PhosphorIcon;
  disabled?: boolean;
  loading?: boolean;
  /** Extra words for screen readers when the label alone isn't clear. */
  accessibilityHint?: string;
};

const colors: Record<Variant, [keyof Palette, keyof Palette]> = {
  primary: ['accent', 'onAccent'],
  secondary: ['action', 'onAction'],
  success: ['success', 'onSuccess'],
  danger: ['danger', 'onDanger'],
  outline: ['surface', 'link'],
};

/** Big pill button, 52pt tall. One per decision. */
export function Button({ label, onPress, variant = 'primary', icon: Icon, disabled, loading, accessibilityHint }: Props) {
  const p = usePalette();
  const [bg, fg] = colors[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p[bg], opacity: inactive ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'outline' && { borderWidth: 2, borderColor: p.link },
      ]}>
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={p[fg]} />
        ) : (
          Icon && <Icon size={22} color={p[fg]} weight="bold" />
        )}
        <AppText variant="button" style={{ color: p[fg] }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(52, MIN_TOUCH),
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
});
