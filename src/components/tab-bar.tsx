import { Tabs } from 'expo-router';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { HandHeartIcon } from 'phosphor-react-native/src/icons/HandHeart';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { UserCircleIcon } from 'phosphor-react-native/src/icons/UserCircle';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, radius, space } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Tab route name -> label and icon. Order follows the brief: Home · Browse · Donate · Hours · Me. */
export const TABS: Record<string, { label: string; icon: PhosphorIcon }> = {
  index: { label: 'Home', icon: HouseIcon },
  browse: { label: 'Browse', icon: MagnifyingGlassIcon },
  donate: { label: 'Donate', icon: HandHeartIcon },
  hours: { label: 'Hours', icon: ClockIcon },
  me: { label: 'Me', icon: UserCircleIcon },
};

/** CoW's own tab bar: duotone icons in brand colors, a soft pill behind the active tab. */
export function CowTabBar({ state, navigation }: TabBarProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { backgroundColor: p.surface, borderTopColor: p.border, paddingBottom: Math.max(insets.bottom, space.sm) },
      ]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = tab.icon;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.tab}>
            <View style={[styles.pill, focused && { backgroundColor: p.surfaceTint }]}>
              <Icon
                size={26}
                weight={focused ? 'duotone' : 'regular'}
                color={focused ? p.brand : p.muted}
                duotoneColor={p.accent}
                duotoneOpacity={0.9}
              />
            </View>
            <AppText
              variant="small"
              maxFontSizeMultiplier={1.3}
              style={{ color: focused ? p.link : p.muted }}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.sm },
  tab: { flex: 1, alignItems: 'center', minHeight: MIN_TOUCH, gap: 2 },
  pill: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
});
