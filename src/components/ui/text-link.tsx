import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH } from '@/theme';

type Props = { label: string; onPress: () => void; align?: 'left' | 'center'; disabled?: boolean };

/** Text-style link button, still 44pt tall for easy tapping. */
export function TextLink({ label, onPress, align = 'center', disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.hit, { alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <AppText variant="bodyStrong" color={disabled ? 'muted' : 'link'} style={!disabled && styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  text: { textDecorationLine: 'underline' },
});
