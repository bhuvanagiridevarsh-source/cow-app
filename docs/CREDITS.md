# Credits

## Artwork and photos

- **Lamp (diya) artwork**, used for the app icon, splash screen, loading states, and the impact meter: redrawn for this app from Children of War Project's own logo. It is CoW's own artwork. No third-party animation or illustration files are used.
- **Team, board, and event photos** in `assets/content/`: from Children of War Project's website, childrenofwarproject.org, used with CoW's permission as its own material.
- **CoW logo** in `assets/brand/cow-logo-256.png`: Children of War Project.

The brief allowed one third-party lamp animation (Lottie). It was not used, because Lottie doesn't run in Expo Go on this SDK version, so there is nothing to credit for it.

## Fonts

| Font | License | Source |
|---|---|---|
| Baloo 2 | SIL Open Font License 1.1 | Google Fonts, via `@expo-google-fonts/baloo-2` |
| Nunito | SIL Open Font License 1.1 | Google Fonts, via `@expo-google-fonts/nunito` |

## Icons

- **Phosphor Icons** (`phosphor-react-native`), MIT License. phosphoricons.com

## Data

- **ZIP code locations** (`zip_centroids` table): US Census Bureau ZIP Code Tabulation Area data, public domain.

## Open-source libraries

Every library the app ships with is under the MIT License (the two font packages are MIT for the code and OFL 1.1 for the fonts).

| Library | Used for |
|---|---|
| Expo and its modules (`expo`, `expo-router`, `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `expo-file-system`, `expo-location`, `expo-apple-authentication`, `expo-crypto`, `expo-network`, `expo-font`, `expo-haptics`, `expo-linking`, `expo-web-browser`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-constants`) | The app framework, navigation, photos, location, and sign-in |
| React, React Native | The app's foundation |
| `@supabase/supabase-js` | Talking to the database |
| `@tanstack/react-query` and its persist packages | Loading, retrying, and offline saved data |
| `@react-native-async-storage/async-storage` | Small on-phone storage |
| `@shopify/react-native-skia` | The glowing impact meter |
| `react-native-reanimated`, `react-native-worklets` | Motion |
| `react-native-svg` | The lamp artwork |
| `react-native-gesture-handler`, `@gorhom/bottom-sheet` | The filters sheet |
| `react-native-safe-area-context`, `react-native-screens` | Screen layout and navigation |
| `zod` | Checking the About content file |

To list exact versions, open `package.json`.

## Services

- **Supabase**: database, sign-in, and photo storage.
- **GitHub**: hosts the code and the About content file.
- **Zeffy**: CoW's donation page (opened in the browser).
