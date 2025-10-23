# Icon Setup Instructions

## Adding Your Application Icon

To use the atom icon provided (or any other icon):

1. Save your icon image as `icon.png` in this directory (`/public/static/assets/`)
2. The icon should ideally be:
   - Square format (e.g., 512x512, 256x256, or 128x128 pixels)
   - PNG format with transparency
   - High quality for good display at various sizes

## Provided Icon

The atom icon image provided should be saved as `icon.png` in this directory.

## Build Process

When you run `npm run build`, the icon will be:
- Automatically copied to the dist folder
- Renamed with a content hash for cache busting (e.g., `icon-abc123.png`)
- Referenced in the built index.html file
- Located at `/static/assets/icon-[hash].png` in the production build

## Current Status

- [ ] Add `icon.png` to this directory
- The build process is configured and ready
- The HTML file is set up to reference the icon

## Manual Setup

If you prefer to manually set up the icon:

1. Download or convert your icon to PNG format
2. Name it `icon.png`
3. Place it in `/public/static/assets/`
4. Rebuild your application with `npm run build`
