import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, space } from '@/theme';

type Props = {
  label: string;
  /** A second line, e.g. an email address. */
  detail?: string;
  icon: PhosphorIcon;
  onPress: () => void;
  /** True when the row leaves the app (website, email, YouTube). */
  external?: boolean;
};

/** One row in a list of links: icon, words, and an arrow. */
export function LinkRow({ label, detail, icon: Icon, onPress, external = false }: Props) {
  const p = usePalette();
  const End = external ? ArrowSquareOutIcon : CaretRightIcon;
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={external ? 'Opens outside the app' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon size={26} weight="duotone" color={p.brand} duotoneColor={p.accent} duotoneOpacity={0.9} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" color="heading">
          {label}
        </AppText>
        {detail ? (
          <AppText variant="small" color="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      <End size={20} color={p.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH + 4 },
  text: { flex: 1 },
});
