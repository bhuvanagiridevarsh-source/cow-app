import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, radius, space } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  icon: PhosphorIcon;
  onPress: () => void;
  selected?: boolean;
  /** Screen-reader role: a navigation button, or one choice among several. */
  role?: 'button' | 'radio';
};

/** Big tappable card for "one decision per screen" choices. */
export function ChoiceCard({ title, subtitle, icon: Icon, onPress, selected = false, role = 'button' }: Props) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={role === 'radio' ? { selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? p.surfaceTint : p.surface,
          borderColor: selected ? p.action : p.border,
          shadowColor: p.shadow,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: p.surfaceWarm }]}>
        <Icon size={30} weight="duotone" color={p.brand} duotoneColor={p.accent} duotoneOpacity={0.9} />
      </View>
      <View style={styles.text}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText color="muted">{subtitle}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: MIN_TOUCH + 28,
    borderRadius: radius.card,
    borderWidth: 2,
    padding: space.md,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
