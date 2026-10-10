import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { initials } from '@/domain/format';
import { photoSource } from '@/features/content/photos';
import { usePalette } from '@/hooks/use-theme';

type Props = { name: string; photo?: string; size?: number };

/** A round photo of a person. Falls back to their initials if there's no photo or it won't load. */
export function Avatar({ name, photo, size = 72 }: Props) {
  const p = usePalette();
  const [failed, setFailed] = useState(false);
  const source = failed ? null : photoSource(photo);
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (source) {
    return (
      <Image
        source={source}
        style={[shape, { backgroundColor: p.surfaceTint }]}
        contentFit="cover"
        transition={150}
        onError={() => setFailed(true)}
        accessibilityLabel={`Photo of ${name}`}
      />
    );
  }
  return (
    <View
      style={[shape, styles.center, { backgroundColor: p.surfaceTint }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <AppText variant="heading" color="link" maxFontSizeMultiplier={1.2}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
