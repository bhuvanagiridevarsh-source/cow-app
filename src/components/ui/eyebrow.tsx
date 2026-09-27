import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

/** Small uppercase pill label, like the site's "OUR STORY". */
export function Eyebrow({ label }: { label: string }) {
  const p = usePalette();
  return (
    <View style={[styles.pill, { backgroundColor: p.surfaceTint }]}>
      <AppText variant="eyebrow" color="link">
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
});
