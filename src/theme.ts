/**
 * CoW design tokens. Every color in the app comes from here.
 *
 * Values are sampled from the website stylesheet (reference/website-home.html, `:root`).
 * A few are adjusted only where the site's pairing fails WCAG AA contrast; those are marked
 * "adjusted". `src/__tests__/theme.test.ts` checks every text/background pair below.
 */

export type Palette = {
  /** Page background */
  background: string;
  /** Cards and sheets */
  surface: string;
  /** Warm cream card (quotes, highlights) */
  surfaceWarm: string;
  /** Light blue tint (chips, selected states) */
  surfaceTint: string;
  border: string;

  /** Headings */
  heading: string;
  /** Body text */
  text: string;
  /** Secondary text */
  muted: string;
  /** Small blue text and links */
  link: string;

  /** Brand blue for fills, icons, large text */
  brand: string;
  /** Sky blue for glows and illustrations only (never text) */
  sky: string;

  /** Main action buttons (CoW yellow) */
  accent: string;
  onAccent: string;
  /** Secondary action buttons (blue) */
  action: string;
  onAction: string;
  /** Success and "Join" (CoW green) */
  success: string;
  onSuccess: string;
  danger: string;
  onDanger: string;

  /** Highlighted-word chip, e.g. "Compassion" */
  highlightText: string;
  highlightBg: string;

  shadow: string;
};

export const palettes: { light: Palette; dark: Palette } = {
  light: {
    background: '#F2FBFF', // site --blue-softer
    surface: '#FFFFFF',
    surfaceWarm: '#FFF6DC', // site --yellow-soft
    surfaceTint: '#E1F5FE', // site --blue-soft
    border: '#CFE6F2',

    heading: '#0B3C5D', // site --blue-ink
    text: '#173A4E', // site --ink
    muted: '#5B7488', // site --muted
    link: '#0277BD', // adjusted: site #0288D1 is 3.9:1 on white

    brand: '#0288D1', // site --blue-deep
    sky: '#29B6F6', // site --blue

    accent: '#FFCA28', // site --yellow
    onAccent: '#5A3D00', // site yellow-button text
    action: '#0277BD', // adjusted so white text passes AA
    onAction: '#FFFFFF',
    success: '#7CB342', // site .btn-green
    onSuccess: '#0B3C5D', // adjusted: site white-on-green is 2.5:1
    danger: '#C62828',
    onDanger: '#FFFFFF',

    highlightText: '#FFF176', // site .hl
    highlightBg: '#0277BD',

    shadow: 'rgba(2,136,209,0.14)', // site --shadow
  },
  dark: {
    background: '#0B1F2E',
    surface: '#133049',
    surfaceWarm: '#2B2616',
    surfaceTint: '#0F2A3F',
    border: '#24455E',

    heading: '#FFF6DC',
    text: '#E6F1F8',
    muted: '#A3BCCC',
    link: '#81D4FA',

    brand: '#29B6F6',
    sky: '#29B6F6',

    accent: '#FFCA28',
    onAccent: '#3D2900',
    action: '#29B6F6',
    onAction: '#0B1F2E',
    success: '#9CCC65',
    onSuccess: '#0B1F2E',
    danger: '#EF9A9A',
    onDanger: '#0B1F2E',

    highlightText: '#FFF176',
    highlightBg: '#01579B',

    shadow: 'rgba(0,0,0,0.35)',
  },
};

/** Font family names, registered in src/app/_layout.tsx. */
export const fonts = {
  display: 'Baloo2_700Bold',
  displayHeavy: 'Baloo2_800ExtraBold',
  displaySemi: 'Baloo2_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
} as const;

/** Text styles. Sizes grow with the phone's text-size setting (Dynamic Type). */
export const type = {
  display: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 42 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 34 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 28 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 25 },
  small: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: fonts.bodyHeavy, fontSize: 12, lineHeight: 16, letterSpacing: 1.6 },
  button: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 12, card: 22, pill: 999 } as const;

/** Minimum touch target (Apple HIG / WCAG). */
export const MIN_TOUCH = 44;
