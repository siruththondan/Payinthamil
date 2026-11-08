# Contributing to Payinthamil

Thanks for helping out. Bug reports, new words and lessons, themes, fixes and documentation are all welcome. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Running locally

There is no build step. The app uses native ES modules, so it must be served over HTTP (`file://` does not work).

```bash
python3 -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000. `npm start` runs the Python command above.

## Project layout

See the "Project layout" section of [README.md](README.md).

## Code style

- Plain JavaScript, native ES modules, no framework, no bundler, no dependencies.
- Indentation is 2 spaces (no tabs) in `js/*.js`, `index.html` and `styles/style.css`. Files use LF line endings and UTF-8. `.editorconfig` encodes this.
- Match the style of the file you are editing: single quotes, semicolons, `const`/`let`.
- Keep Tamil text NFC-normalised.

## Checking your changes

```bash
npm run check
```

This runs `node --check` on every `js/*.js` file, verifies that every `?v=` version string is identical, and verifies that every local file referenced from `index.html` and from the JS imports exists. CI runs the same command. Node 18 or newer is needed.

## Manual browser checklist

There is no automated test suite, so please test in a browser at both 1440x900 and 1280x720 and confirm there are no console errors:

- Practice tab: type through a lesson, switch lessons, wrong-key feedback, hints on and off
- Thirukkural tab: load a verse, type it, next and previous
- Report tab: opens and shows your stats
- Tour: runs through all steps and can be skipped
- Themes: switch between several, including a light one, and the custom theme controls
- Reset progress in the settings modal

## Pull requests

- Keep each PR focused on one change.
- Describe what changed and why. Include a screenshot for visible changes.
- `npm run check` must pass.
- If you changed any JS, CSS or asset, bump the version string (see below).
- Do not add dependencies or a build step without discussing it in an issue first.

## Releasing / cache-busting

JS, CSS and the keyboard SVG are requested with `?v=YYYYMMDD` so hosts can cache them forever. When bumping the version, all of these must change together:

1. The `importmap` in `<head>` of `index.html` (the static inter-module imports).
2. The early head script in `index.html`: its `V` constant, used for the JS-injected modulepreloads and the `Tamil99.svg` preload.
3. The inline module script at the end of `<body>` in `index.html`: `import('./js/practice.js?v=...')`.
4. The three dynamic imports in `js/practice.js` (`thirukkural.js`, `report.js`, `tour.js`).
5. The `Tamil99.svg` fetch default in `js/keyboard.js` (`loadKeyboard`'s `svgPath`). It must equal the preload URL from item 2.
6. Both `styles/style.css` links in `index.html`: the `media="print"` link and the one inside `<noscript>`.

`npm run check` fails if any of these disagree. The comment at the top of `index.html` `<head>` lists the same places.

Also update `CHANGELOG.md`.

## Critical CSS

`index.html` has the first-frame CSS inlined in a `<style>` block in `<head>`. It mirrors a selected set of rules from `styles/style.css`; the full stylesheet loads without blocking render.

`tools/mkcrit.py` regenerates that block. It reads `styles/style.css`, strips comments, keeps only an allow-list of selectors needed for the first frame (navbar, tabs, stats strip, key panel, typing area, keyboard, footer, mobile gate, and so on, plus the `@media` blocks containing them), minifies them, and prints the result. After editing any of those rules in `style.css`:

```bash
python3 tools/mkcrit.py > /tmp/critical.css
```

Paste the output into the inline `<style>` in `index.html`. `index.html` keeps one extra comment before the deliberate `#key-panel{min-height}` rules. Those rules reserve space for the keyboard panel to avoid layout shift, and they are not in `style.css`; the script appends them to the output. If you add a new first-frame selector, add it to the allow-list in `tools/mkcrit.py`.

## Other notes

- **Keyboard SVG:** never run plain `npx svgo` on `assets/images/Tamil99.svg`. The default preset's `cleanupIds` strips the 209 element IDs the code looks up. If you must use svgo, disable `cleanupIds`, `mergePaths`, `collapseGroups` and `convertShapeToPath`.
- **Themes:** theme colours live in `js/themes.js`. `applyTheme()` writes inline CSS variables on the root element, which override the `:root` values in `styles/style.css`.
- **Hosting:** serve with gzip or brotli compression. It cuts the payload from about 269 KB to about 105 KB. See the Deploying section of the README.
