import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

type Props = {
  children: ReactNode;
  /** Set false for screens that manage their own list scrolling. */
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Forms: keep the focused field above the keyboard. */
  keyboard?: boolean;
};

/** Standard page: safe-area padding, brand background, optional scrolling. */
export function Screen({ children, scroll = true, contentStyle, keyboard = false }: Props) {
  const p = usePalette();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: p.background }]}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.md },
});
