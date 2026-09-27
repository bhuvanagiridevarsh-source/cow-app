import { useColorScheme } from 'react-native';

import { palettes, type Palette } from '@/theme';

/** Current color palette, following the phone's light/dark setting. */
export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? palettes.dark : palettes.light;
}
