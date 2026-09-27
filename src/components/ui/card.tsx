import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

type Props = { children: ReactNode; tone?: 'plain' | 'warm' | 'tint'; style?: ViewStyle };

/** Soft rounded card, like the website's. */
export function Card({ children, tone = 'plain', style }: Props) {
  const p = usePalette();
  const bg = tone === 'warm' ? p.surfaceWarm : tone === 'tint' ? p.surfaceTint : p.surface;
  return (
    <View style={[styles.card, { backgroundColor: bg, shadowColor: p.shadow }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 3,
  },
});
