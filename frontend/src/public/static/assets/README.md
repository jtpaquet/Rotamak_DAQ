# Static Assets Directory

## Icon Setup

Place your application icon in this directory as `icon.png`. 

The icon will be automatically referenced in the built index.html file and all assets will be organized under `/static/assets/` when you build the project.

## Build Output Structure

When you run `npm run build`, the assets will be organized as:
- `/static/assets/icon-[hash].png` - Your application icon
- `/static/assets/index-[hash].js` - Main JavaScript bundle
- `/static/assets/index-[hash].css` - Main CSS bundle
- Other assets will follow the pattern: `/static/assets/[name]-[hash].[ext]`

The favicon provided by the user (atom icon) should be saved here as `icon.png`.
