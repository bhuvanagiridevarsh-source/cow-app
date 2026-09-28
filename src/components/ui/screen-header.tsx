import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, space } from '@/theme';

type Props = { title?: string; onBack?: () => void; showBack?: boolean };

/** Top bar with a big Back button (our own, so it matches the CoW look). */
export function ScreenHeader({ title, onBack, showBack = true }: Props) {
  const p = usePalette();
  const canGoBack = showBack && (onBack !== undefined || router.canGoBack());
  return (
    <View style={styles.row}>
      {canGoBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={onBack ?? (() => router.back())}
          style={styles.back}>
          <CaretLeftIcon size={26} weight="bold" color={p.link} />
          <AppText variant="bodyStrong" color="link">
            Back
          </AppText>
        </Pressable>
      ) : null}
      {title ? (
        <AppText variant="heading" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: MIN_TOUCH },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, paddingRight: space.sm },
  title: { flex: 1 },
});
