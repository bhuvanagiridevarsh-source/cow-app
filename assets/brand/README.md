# Brand artwork

| File | Used for |
|---|---|
| `icon.png` | The app icon (App Store and iPhone). 1024×1024, fills the whole square, no transparency. |
| `adaptive-foreground.png` | Android icon, front layer. Transparent; the lamp sits inside the centre safe area. The back layer is the cream color `#FFF6DC` set in `app.json`. |
| `adaptive-monochrome.png` | Android 13+ "themed icon": a one-color lamp shape that Android recolors. |
| `splash.png` | The lamp on the launch screen (cream background in light mode, navy in dark mode). |
| `cow-logo-256.png` | CoW's logo as saved from the website (256 px). Kept for reference; too small for an icon. |
| `source/*.svg` | The drawings the PNG files above were made from. |

The lamp was redrawn for the app from CoW's own logo, because the only logo file available was
256 px. **CoW should approve this artwork before the store release.** If CoW supplies an official
logo of 1024×1024 or larger, replace `icon.png` (and ideally the other three) with it.

To change the artwork, edit the SVG files in `source/` and export each one as a 1024×1024 PNG
with the same file name. `icon.png` must have no transparency.
