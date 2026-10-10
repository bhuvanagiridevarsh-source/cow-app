import { Image } from 'expo-image';
import { PackageIcon } from 'phosphor-react-native/src/icons/Package';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { usePhotoLink } from '@/features/items/use-items';
import { usePalette } from '@/hooks/use-theme';
import { radius } from '@/theme';

type Props = {
  /** A photo already uploaded (its storage path). */
  path?: string | null;
  /** A photo still on this phone. Wins over `path`. */
  uri?: string | null;
  label: string;
  style?: ViewStyle;
};

/** An item's photo. Shows a soft placeholder while it loads or if it can't be shown. */
export function ItemPhoto({ path, uri, label, style }: Props) {
  const p = usePalette();
  const link = usePhotoLink(uri ? null : path);
  const source = uri ?? link.data ?? null;
  return (
    <View style={[styles.frame, { backgroundColor: p.surfaceTint }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          // Signed links change every time; the path stays the same, so cache by path.
          cachePolicy="memory-disk"
          recyclingKey={uri ?? path ?? undefined}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`Photo of ${label}`}
        />
      ) : (
        <PackageIcon size={36} weight="duotone" color={p.brand} duotoneColor={p.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
