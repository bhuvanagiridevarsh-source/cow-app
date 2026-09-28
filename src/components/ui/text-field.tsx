import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { fonts, MIN_TOUCH, radius, space } from '@/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

/** Labeled text box with an optional hint and error. Grows with Dynamic Type. */
export function TextField({ label, hint, error, style, onFocus, onBlur, ...rest }: Props) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? p.danger : focused ? p.action : p.border;
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyStrong" color="heading">
        {label}
      </AppText>
      {hint ? (
        <AppText variant="small" color="muted">
          {hint}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={p.muted}
        style={[styles.input, { borderColor, color: p.text, backgroundColor: p.surface }, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  input: {
    minHeight: Math.max(52, MIN_TOUCH),
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontFamily: fonts.bodySemi,
    fontSize: 18,
  },
});
