import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { TIMELINE_LABELS } from '@/domain/pickup-text';
import { TIMELINE, timelineStep, type PickupStatus } from '@/domain/status';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

/** Requested → Accepted → Picked up → Confirmed, with the steps done so far filled in. */
export function PickupTimeline({ status }: { status: PickupStatus }) {
  const p = usePalette();
  const reduceMotion = useReducedMotion();
  // Steps fill in smoothly when the pickup moves on.
  const ease = reduceMotion ? null : { transitionProperty: ['backgroundColor', 'borderColor'], transitionDuration: 350 };
  const current = timelineStep(status);
  const stopped = current < 0;
  const summary = stopped
    ? `This pickup was ${status}.`
    : `Step ${current + 1} of ${TIMELINE.length}: ${TIMELINE_LABELS[status as keyof typeof TIMELINE_LABELS]}.`;
  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel={summary}>
      {TIMELINE.map((step, index) => {
        const done = !stopped && index <= current;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.track}>
              <View style={[styles.line, { backgroundColor: index === 0 ? 'transparent' : done ? p.success : p.border }]} />
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: done ? p.success : p.surface, borderColor: done ? p.success : p.border },
                  ease,
                ]}>
                {done ? <CheckIcon size={14} weight="bold" color={p.onSuccess} /> : null}
              </Animated.View>
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      index === TIMELINE.length - 1 ? 'transparent' : !stopped && index < current ? p.success : p.border,
                  },
                ]}
              />
            </View>
            <AppText
              variant="small"
              maxFontSizeMultiplier={1.3}
              style={[styles.label, { color: done ? p.heading : p.muted }]}>
              {TIMELINE_LABELS[step as keyof typeof TIMELINE_LABELS]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: space.xs },
  track: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: 3 },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
});
