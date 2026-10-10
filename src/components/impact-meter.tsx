import { Canvas, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { formatDollars, goalProgress } from '@/domain/format';
import { useImpact } from '@/features/impact/use-impact';
import { usePalette } from '@/hooks/use-theme';
import { radius, space } from '@/theme';

const SIZE = 220;
const CENTER = SIZE / 2;

/**
 * CoW's impact meter: the lamp glows wider and brighter as the total grows toward the goal.
 * The glow and the bar grow in each time the screen appears, unless the phone's Reduce Motion
 * setting is on.
 */
export function ImpactMeter() {
  const p = usePalette();
  const reduceMotion = useReducedMotion();
  const { data, isError, refetch } = useImpact();
  const progress = data ? goalProgress(data.total, data.goal) : 0;

  const hasData = !!data;
  // `target` is how far along the goal we are; `lit` runs 0 -> 1 each time the screen appears.
  const target = useSharedValue(0);
  const lit = useSharedValue(0);
  useEffect(() => {
    target.set(progress);
  }, [progress, target]);
  useFocusEffect(
    useCallback(() => {
      if (!hasData) return;
      if (reduceMotion) {
        lit.set(1);
        return;
      }
      lit.set(0);
      lit.set(withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    }, [hasData, reduceMotion, lit]),
  );

  // The lamp starts as a small ember and opens up to its full glow. Even at $0 there is some
  // glow: the lamp is lit from the first day.
  const glowRadius = useDerivedValue(() => SIZE * (0.16 + (0.1 + 0.24 * target.get()) * lit.get()));
  const glowOpacity = useDerivedValue(() => 0.2 + (0.2 + 0.6 * target.get()) * lit.get());
  const barStyle = useAnimatedStyle(() => ({ width: `${Math.max(target.get() * lit.get() * 100, 2)}%` }));

  const percent = Math.round(progress * 100);
  const summary = data
    ? `Total impact: ${formatDollars(data.total)} of ${formatDollars(data.goal)}, ${percent} percent of the ${data.label}.`
    : 'Total impact is loading.';

  return (
    <Card tone="warm">
      <View accessible accessibilityRole="progressbar" accessibilityLabel={summary} style={styles.body}>
        <View style={styles.stage}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group opacity={glowOpacity}>
              <Circle cx={CENTER} cy={CENTER - 14} r={glowRadius}>
                <RadialGradient
                  c={vec(CENTER, CENTER - 14)}
                  r={glowRadius}
                  colors={['#FFF59DFF', '#FFCA28B3', '#FFCA2800']}
                  positions={[0, 0.45, 1]}
                />
              </Circle>
            </Group>
          </Canvas>
          <Lamp size={132} glow={0.35 + 0.65 * progress} />
        </View>

        {data ? (
          <>
            <AppText variant="display" style={styles.center}>
              {formatDollars(data.total)}
            </AppText>
            <AppText color="muted" style={styles.center}>
              of {formatDollars(data.goal)} · {data.label}
            </AppText>
            <View style={[styles.track, { backgroundColor: p.surface }]}>
              <Animated.View
                style={[styles.fill, { backgroundColor: p.success }, barStyle]}
              />
            </View>
            <AppText variant="small" color="muted" style={styles.center}>
              Every confirmed pickup adds its value to the total.
            </AppText>
          </>
        ) : (
          <AppText color="muted" style={styles.center} onPress={isError ? () => void refetch() : undefined}>
            {isError ? "We couldn't load the total. Tap to try again." : 'Lighting the lamp…'}
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.sm, alignItems: 'stretch' },
  stage: { width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  track: { height: 14, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
