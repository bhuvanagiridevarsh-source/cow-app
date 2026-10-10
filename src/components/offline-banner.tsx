import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { useIsOnline } from '@/lib/query';
import { space } from '@/theme';

/** A strip at the top of every screen while the phone has no connection. */
export function OfflineBanner() {
  const p = usePalette();
  const online = useIsOnline();
  if (online) return null;
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel="You're offline. Showing saved information."
      style={[styles.bar, { backgroundColor: p.surfaceWarm, borderBottomColor: p.border }]}>
      <WifiSlashIcon size={20} weight="bold" color={p.heading} />
      <AppText variant="small" color="heading" style={styles.text}>
        You&apos;re offline. Showing saved information.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1 },
});
