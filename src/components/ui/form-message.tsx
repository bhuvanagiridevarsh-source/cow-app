import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

type Props = { message: string | null; tone?: 'error' | 'info' };

/** A friendly message box under a form. Screen readers announce it when it appears. */
export function FormMessage({ message, tone = 'error' }: Props) {
  const p = usePalette();
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  if (!message) return null;
  const Icon = tone === 'error' ? WarningCircleIcon : InfoIcon;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: tone === 'error' ? p.surfaceWarm : p.surfaceTint }]}>
      <Icon size={24} weight="duotone" color={tone === 'error' ? p.danger : p.brand} />
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.sm },
  text: { flex: 1 },
});
