import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  size?: number;
  /** 0–1: how bright the glow is. The impact meter raises this as the total grows. */
  glow?: number;
  /** Gentle flame flicker. Always off when the phone's Reduce Motion setting is on. */
  flicker?: boolean;
};

// Pastel stripes from the CoW logo's bowl.
const STRIPES = ['#F8BBD0', '#FFE0B2', '#FFF59D', '#C5E1A5', '#B3E5FC', '#D1C4E9'];
const RIM_DOTS = [26, 36, 46, 56, 64, 74, 84, 94];

/**
 * The CoW diya (lamp), drawn from the logo. Used for loading, empty states,
 * and the impact meter. No third-party animation files, so no license questions.
 */
export function Lamp({ size = 120, glow = 0.7, flicker = true }: Props) {
  const reduceMotion = useReducedMotion();
  const animate = flicker && !reduceMotion;
  const t = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      t.set(0);
      return;
    }
    t.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 350, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [animate, t]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${(t.get() - 0.5) * 7}deg` },
      { scaleY: 1 + t.get() * 0.2 },
      { scaleX: 1 - t.get() * 0.1 },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, glow * (0.6 + t.get() * 0.4)),
    transform: [{ scale: 0.85 + glow * 0.2 + t.get() * 0.12 }],
  }));

  const box = { width: size, height: size };
  return (
    <View style={box}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id="glow" cx="60" cy="40" r="46" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFE082" stopOpacity="0.95" />
              <Stop offset="0.55" stopColor="#FFCA28" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#FFCA28" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="60" cy="40" r="46" fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.flameOrigin, flameStyle]}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Path
            d="M60 12 C71 29 78 40 73 51 C69 58 51 58 47 51 C42 40 49 29 60 12 Z"
            fill="#FF7043"
            stroke="#5E3A6E"
            strokeWidth={2}
          />
          <Path d="M60 26 C67 37 70 44 67 50 C64 54 56 54 53 50 C50 44 53 37 60 26 Z" fill="#FFB300" />
          <Path d="M60 38 C64 44 65 47 63 50 C61 52 59 52 57 50 C55 47 56 44 60 38 Z" fill="#FFF59D" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} viewBox="0 0 120 120" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="stripes" x1="16" y1="0" x2="104" y2="0" gradientUnits="userSpaceOnUse">
            {STRIPES.flatMap((c, i) => [
              <Stop key={`${i}a`} offset={i / STRIPES.length} stopColor={c} />,
              <Stop key={`${i}b`} offset={(i + 1) / STRIPES.length} stopColor={c} />,
            ])}
          </LinearGradient>
        </Defs>
        <Path d="M56 58 H64 V63 H56 Z" fill="#5E3A6E" />
        <Path
          d="M16 62 H104 C104 86 84 104 60 104 C36 104 16 86 16 62 Z"
          fill="url(#stripes)"
          stroke="#5E3A6E"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Path
          d="M16 62 H104 C103.6 65.6 102.9 69 101.8 72 H18.2 C17.1 69 16.4 65.6 16 62 Z"
          fill="#B39DDB"
          stroke="#5E3A6E"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {RIM_DOTS.map((x) => (
          <Circle key={x} cx={x} cy={67} r={1.8} fill="#FFFFFF" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Flicker grows from the flame's base, not its middle.
  flameOrigin: { transformOrigin: '50% 47%' },
});
