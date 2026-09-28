import { contrastRatio } from '@/domain/contrast';
import { palettes, type Palette } from '@/theme';

const AA = 4.5; // normal text
const AA_LARGE = 3; // large text (highlight chip is display-size only)

type Pair = [keyof Palette, keyof Palette, number];

const pairs: Pair[] = [
  ['heading', 'background', AA],
  ['heading', 'surface', AA],
  ['heading', 'surfaceWarm', AA],
  ['text', 'background', AA],
  ['text', 'surface', AA],
  ['text', 'surfaceWarm', AA],
  ['text', 'surfaceTint', AA],
  ['muted', 'background', AA],
  ['muted', 'surface', AA],
  ['muted', 'surfaceWarm', AA],
  ['link', 'background', AA],
  ['link', 'surface', AA],
  ['onAccent', 'accent', AA],
  ['onAction', 'action', AA],
  ['onSuccess', 'success', AA],
  ['onDanger', 'danger', AA],
  ['danger', 'background', AA],
  ['danger', 'surface', AA],
  ['highlightText', 'highlightBg', AA_LARGE],
];

describe.each(['light', 'dark'] as const)('%s theme contrast (WCAG AA)', (mode) => {
  it.each(pairs)('%s on %s', (fg, bg, min) => {
    const p = palettes[mode];
    expect(contrastRatio(p[fg], p[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe('contrastRatio', () => {
  it('matches known values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
