import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

type Props = {
  children: ReactNode;
  /** Set false for screens that manage their own list scrolling. */
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

/** Standard page: safe-area padding, brand background, optional scrolling. */
export function Screen({ children, scroll = true, contentStyle }: Props) {
  const p = usePalette();
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: p.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.md },
});
