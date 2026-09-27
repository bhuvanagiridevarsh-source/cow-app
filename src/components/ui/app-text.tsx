import { Text, type TextProps } from 'react-native';

import { usePalette } from '@/hooks/use-theme';
import { type, type Palette, type TypeVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: keyof Palette;
};

const headingVariants: TypeVariant[] = ['display', 'title', 'heading'];

/** All text in the app. Scales with Dynamic Type; very large display text is capped so layouts hold. */
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const p = usePalette();
  const isHeading = headingVariants.includes(variant);
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={variant === 'display' || variant === 'title' ? 1.6 : undefined}
      style={[type[variant], { color: p[color ?? (isHeading ? 'heading' : 'text')] }, style]}
      {...rest}
    />
  );
}
