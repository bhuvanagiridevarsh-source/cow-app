import { ArrowClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowClockwise';
import { StyleSheet, View } from 'react-native';

import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { space } from '@/theme';

/** Loading: the lamp glow, never a blank screen. */
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <Lamp size={96} />
    </View>
  );
}

type EmptyProps = { title: string; body?: string; actionLabel?: string; onAction?: () => void };

/** Nothing here yet: a calm lamp plus one clear next step. */
export function EmptyState({ title, body, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <Lamp size={96} glow={0.4} flicker={false} />
      <AppText variant="heading" style={styles.text}>
        {title}
      </AppText>
      {body ? (
        <AppText color="muted" style={styles.text}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

type ErrorProps = { message?: string; onRetry: () => void; retrying?: boolean };

/** Something went wrong: friendly words and a Try again button. */
export function ErrorRetry({ message, onRetry, retrying }: ErrorProps) {
  return (
    <View style={styles.center}>
      <Lamp size={80} glow={0.25} flicker={false} />
      <AppText variant="heading" style={styles.text}>
        We couldn&apos;t load this
      </AppText>
      <AppText color="muted" style={styles.text}>
        {message ?? 'Check your internet connection and try again.'}
      </AppText>
      <Button
        label="Try again"
        variant="secondary"
        icon={ArrowClockwiseIcon}
        onPress={onRetry}
        loading={retrying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.lg },
  text: { textAlign: 'center' },
});
