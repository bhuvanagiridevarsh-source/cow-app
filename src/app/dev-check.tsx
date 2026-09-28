/**
 * TEMPORARY (Phase 1 phone check #1): proves each library runs in Expo Go on a real iPhone.
 * Deleted at the end of Phase 1.
 */
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { SealCheckIcon } from 'phosphor-react-native/src/icons/SealCheck';
import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { usePalette } from '@/hooks/use-theme';
import { hapticsAvailable, successBuzz } from '@/lib/haptics';

export default function DevCheck() {
  const p = usePalette();
  const sheet = useRef<BottomSheetModal>(null);
  const [wide, setWide] = useState(false);
  const [buzzed, setBuzzed] = useState<string>('not tried');

  return (
    <Screen>
      <AppText variant="title">Expo Go check</AppText>
      <AppText color="muted">Tap each test. Tell Claude which ones worked.</AppText>

      <Card>
        <AppText variant="heading">1. Fonts and icons</AppText>
        <AppText>Headings use Baloo 2, this text uses Nunito.</AppText>
        <SealCheckIcon size={40} weight="duotone" color={p.brand} duotoneColor={p.accent} duotoneOpacity={0.9} />
      </Card>

      <Card>
        <AppText variant="heading">2. Lamp animation (Reanimated + SVG)</AppText>
        <Lamp size={120} />
        <AppText variant="small" color="muted">The flame should gently flicker.</AppText>
      </Card>

      <Card>
        <AppText variant="heading">3. Glow (Skia)</AppText>
        <Canvas style={styles.canvas}>
          <Circle cx={80} cy={60} r={56}>
            <RadialGradient c={vec(80, 60)} r={56} colors={['#FFE082', '#FFCA2800']} />
          </Circle>
        </Canvas>
        <AppText variant="small" color="muted">You should see a soft yellow glow.</AppText>
      </Card>

      <Card>
        <AppText variant="heading">4. Smooth size change</AppText>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: p.success, width: wide ? '100%' : '30%' },
            { transitionProperty: 'width', transitionDuration: 400 },
          ]}
        />
        <Chip label={wide ? 'Shrink' : 'Grow'} selected={wide} onPress={() => setWide((w) => !w)} />
      </Card>

      <Card>
        <AppText variant="heading">5. Bottom sheet</AppText>
        <Button label="Open sheet" variant="secondary" onPress={() => sheet.current?.present()} />
      </Card>

      <Card>
        <AppText variant="heading">6. Buzz (haptics)</AppText>
        <AppText variant="small">Module found: {hapticsAvailable() ? 'yes' : 'no'} · Result: {buzzed}</AppText>
        <Button
          label="Buzz"
          variant="success"
          onPress={async () => {
            await successBuzz();
            setBuzzed('called (did you feel it?)');
          }}
        />
      </Card>

      <Button label="Back" variant="outline" onPress={() => router.back()} />

      <BottomSheetModal ref={sheet} backgroundStyle={{ backgroundColor: p.surface }}>
        <BottomSheetView style={styles.sheet}>
          <AppText variant="heading">The sheet works</AppText>
          <AppText>Swipe down to close it.</AppText>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  canvas: { width: 160, height: 120 },
  bar: { height: 20, borderRadius: 10 },
  sheet: { padding: 24, gap: 8, paddingBottom: 48 },
});
