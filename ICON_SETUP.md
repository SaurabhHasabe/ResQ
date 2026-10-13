# Icon Setup Guide for ResQ PWA

## Required Icons

To complete the PWA setup, you'll need to create the following icon files in the `public/icons/` directory:

### App Icons (for home screen and app display)
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px (Apple Touch Icon)
- `icon-192x192.png` - 192x192px (Android home screen)
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px (Android splash screen)

### Shortcut Icons (optional, for app shortcuts)
- `shortcut-report.png` - 96x96px (Report Incident shortcut)
- `shortcut-shelter.png` - 96x96px (Find Shelter shortcut)
- `shortcut-aid.png` - 96x96px (Request Aid shortcut)

### Screenshots (optional, for app stores)
- `screenshots/desktop-home.png` - 1280x720px
- `screenshots/mobile-home.png` - 540x720px

## Design Guidelines

### Style
- Use the ResQ logo (the target/crosshair icon from the navbar)
- Background color: `#0f172a` (slate-950)
- Icon color: `#e3e3e3` (light gray) or `#ea580c` (orange)
- Keep design simple and recognizable at small sizes

### Format
- PNG format with transparency
- Square dimensions
- High contrast for visibility
- Padding: ~10% around the icon for safety area

## Quick Creation Methods

### Option 1: Using an Icon Generator (Recommended)
1. Visit https://realfavicongenerator.net or https://www.pwabuilder.com
2. Upload a 512x512px source image
3. Generate all required sizes
4. Download and place in `public/icons/` directory

### Option 2: Using Design Software
1. Create a 512x512px canvas in Figma/Adobe XD/Sketch
2. Design your icon with the ResQ theme
3. Export at all required sizes
4. Place in `public/icons/` directory

### Option 3: Using Command Line (ImageMagick)
If you have a source image `icon-source.png`:

```bash
# Install ImageMagick first
# brew install imagemagick (macOS)
# apt-get install imagemagick (Linux)

# Generate all sizes
magick icon-source.png -resize 72x72 public/icons/icon-72x72.png
magick icon-source.png -resize 96x96 public/icons/icon-96x96.png
magick icon-source.png -resize 128x128 public/icons/icon-128x128.png
magick icon-source.png -resize 144x144 public/icons/icon-144x144.png
magick icon-source.png -resize 152x152 public/icons/icon-152x152.png
magick icon-source.png -resize 192x192 public/icons/icon-192x192.png
magick icon-source.png -resize 384x384 public/icons/icon-384x384.png
magick icon-source.png -resize 512x512 public/icons/icon-512x512.png
```

### Option 4: Simple SVG to PNG Conversion
Use the existing SVG from the navbar:

```html
<!-- Copy the SVG from navbar.ejs -->
<svg xmlns="http://www.w3.org/2000/svg" height="512px" viewBox="0 -960 960 960" width="512px" fill="#e3e3e3">
  <path d="M480-320q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400ZM661-80q18-56 27-100t14-70q-43 42-100 66t-122 24q-136 0-238.5-18.5T80-214v-85q56 18 100 27t70 14q-42-43-66-100t-24-122q0-137 18.5-239T214-880h85q-18 56-27.5 100T258-710q43-42 100-66t122-24q137 0 239 18.5T880-746v85q-56-18-100-27.5T710-702q42 43 66 100t24 122q0 137-18.5 239T746-80h-85Zm-11-230q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70Z"/>
</svg>
```

1. Convert this SVG to PNG online at https://svgtopng.com
2. Set size to 512x512px
3. Use as source for other sizes

## Temporary Placeholder

Until you create proper icons, you can use a simple colored square:

1. Create `public/icons/` directory
2. Use any placeholder image service temporarily:
   - https://placehold.co/512x512/0f172a/ea580c
   - https://via.placeholder.com/512/0f172a/ea580c

## Verification

After creating icons, verify they work:

1. Open Chrome DevTools → Application → Manifest
2. Check all icons load without errors
3. Test "Add to Home Screen" on mobile
4. Verify icon appears correctly on home screen

## Current Fallback

The app currently falls back to:
- Browser default icon if no icons present
- Still installable as PWA
- All functionality works, just no custom icon

**Priority:** Medium - Create icons for better branding and user experience, but the app is fully functional without them.

---

**Recommended Action:** Use Option 1 (Icon Generator) for the quickest professional results.
