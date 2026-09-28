import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { formatDollars, goalProgress } from '@/domain/format';
import { useImpact } from '@/features/impact/use-impact';
import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

/** "$5,000 raised of $25,000 · 3-year goal" with a progress bar. Hidden until it loads. */
export function ImpactSummary() {
  const p = usePalette();
  const { data } = useImpact();
  if (!data) return null;
  const progress = goalProgress(data.total, data.goal);
  const summary = `${formatDollars(data.total)} of ${formatDollars(data.goal)} raised, ${data.label}`;
  return (
    <Card tone="warm">
      <View accessible accessibilityLabel={summary} style={styles.body}>
        <AppText variant="heading">
          {formatDollars(data.total)}{' '}
          <AppText color="muted">of {formatDollars(data.goal)}</AppText>
        </AppText>
        <View style={[styles.track, { backgroundColor: p.surface }]}>
          <View style={[styles.fill, { width: `${Math.max(progress * 100, 2)}%`, backgroundColor: p.success }]} />
        </View>
        <AppText variant="small" color="muted">
          Total impact so far · {data.label}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.sm },
  track: { height: 14, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
