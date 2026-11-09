<div align="center">

# பைந்தமிழ் · Payinthamil

**தமிழ்99 விசைப்பலகை தட்டச்சுப் பயிற்சி**
*A Tamil99 keyboard typing trainer*

[![CI](https://github.com/siruththondan/Payinthamil/actions/workflows/ci.yml/badge.svg)](https://github.com/siruththondan/Payinthamil/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-c47d56.svg?style=flat-square)](LICENSE)
![No build step](https://img.shields.io/badge/build-none_required-6fcb81?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/vanilla-JS-9d99d8?style=flat-square)
![Offline first](https://img.shields.io/badge/data-stays_in_your_browser-6ba8e0?style=flat-square)

<img src="assets/images/preview.gif" alt="பைந்தமிழ் தட்டச்சுப் பயிற்சி" width="760" />

</div>

---

## தமிழ்

### என்ன இது?

பைந்தமிழ் என்பது **தமிழ்99 விசைப்பலகை** அமைப்பில் தட்டச்சு கற்றுக்கொள்ள உதவும்
இலவச, திறந்த மூல வலைத்தளம். நடுவரிசையில் தொடங்கி, ஒவ்வொரு விசையாக
அறிமுகப்படுத்தி, 35 பாடங்களில் முழு விசைப்பலகையையும் கற்றுத்தருகிறது.

உங்கள் தரவு அனைத்தும் **உங்கள் உலாவியிலேயே** இருக்கும். எந்தச் சேவையகத்திற்கும்
எதுவும் அனுப்பப்படுவதில்லை. பதிவு செய்ய வேண்டாம், கணக்கு தேவையில்லை.

> **கவனம்:** இது உண்மையான விசைப்பலகைக்கான பயிற்சி. திரைத் தொடு
> விசைப்பலகையில் நிலையான விசை இடங்கள் இல்லாததால், கைபேசியில் இது வேலை
> செய்யாது. கணினி அல்லது மடிக்கணினியில் திறக்கவும்.

### சிறப்பம்சங்கள்

| | |
|---|---|
| **35 பாடங்கள்** | தொடக்கம் 20 · இடைநிலை 8 · மேல்நிலை 7 |
| **படிப்படியான வளர்ச்சி** | கற்றுத்தராத விசை ஒருபோதும் தோன்றாது |
| **உயிர்மெய் பயிற்சி** | ஒவ்வொரு மெய்யெழுத்தும் × 12 உயிரெழுத்து |
| **திருக்குறள் பயன்முறை** | 1330 குறள்களில் எதையும் தட்டச்சு செய்யலாம் (இணையம் தேவை; இணையமின்றி 10 குறள்கள்) |
| **விரல் வழிகாட்டி** | எந்த விரலால் எந்த விசை — வண்ணக் குறியீடு |
| **நேரடி புள்ளிவிவரம்** | WPM, துல்லியம், விசைவாரியாக நேரம் |
| **முன்னேற்ற அறிக்கை** | PDF ஆகப் பதிவிறக்கலாம் |
| **16 வண்ணத் தோற்றங்கள்** | சொந்த நிறமும் எழுத்துருவும் அமைக்கலாம் |

### பாடத் திட்டம்

**தொடக்கநிலை (20)**

நடுவரிசையில் `க ப` + புள்ளி `்` என ஆரம்பித்து — முதல் பாடத்திலேயே
`கல்` போன்ற உண்மையான சொற்கள் தோன்றும். பின் `ம த ந ய` வந்து நடுவரிசை
முடிகிறது. அடுத்து 12 உயிரெழுத்துகளும் ஜோடி ஜோடியாக, பிறகு எஞ்சிய
மெய்யெழுத்துகள் பயன்பாட்டு அளவின்படி. இறுதியாக உயிர்மெய் பயிற்சிகள்.

**இடைநிலை (8)** — மீதமுள்ள உயிர்மெய் சேர்க்கைகள், பின் வேகப் பயிற்சி 24 → 30 WPM.

**மேல்நிலை (7)** — கிரந்த எழுத்துகள் `ஸ ஷ ஜ ஹ`, ஆயுத எழுத்து `ஃ`,
வேகப் பயிற்சி 40 WPM வரை, தமிழ் கணக்குக் குறியீடுகள் `௳ ௴ ௵ ௶ ௷ ௸ ௹ ௺`.

### இயக்குவது எப்படி

கட்டமைப்பு (build) ஏதும் தேவையில்லை. ஆனால் ES modules பயன்படுத்துவதால்
`file://` வழியாகத் திறக்க முடியாது — ஏதேனும் ஒரு HTTP சேவையகம் தேவை.

```bash
git clone https://github.com/siruththondan/Payinthamil.git
cd Payinthamil
python3 -m http.server 5501
```

உலாவியில் **http://localhost:5501** திறக்கவும்.

<details>
<summary>வேறு வழிகள்</summary>

```bash
npx serve -l 5501        # Node
php -S localhost:5501    # PHP
```

VS Code பயன்படுத்தினால் **Live Server** நீட்சியும் போதும்.
</details>

### பங்களிப்பு

எல்லா வகையான பங்களிப்பும் வரவேற்கப்படுகிறது — புதிய பாடங்கள், சொற்கள்,
வண்ணத் தோற்றங்கள், பிழைத் திருத்தம், ஆவணம்.

1. Fork செய்யவும்
2. கிளை உருவாக்கவும் — `git checkout -b my-feature`
3. மாற்றங்களைச் செய்து உலாவியில் சோதிக்கவும்
4. `npm run check` இயக்கி, அது தேறுகிறதா என்று பார்க்கவும்
5. Pull request அனுப்பவும்

விவரங்களுக்கு [CONTRIBUTING.md](CONTRIBUTING.md) பார்க்கவும். நடத்தை விதிகள்:
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). பாதுகாப்புக் குறைபாடுகளைப்
புகாரளிக்க: [SECURITY.md](SECURITY.md).

பிழை கண்டால் [issue](https://github.com/siruththondan/Payinthamil/issues) திறக்கவும்.
உங்கள் உலாவி, திரை அளவு, மற்றும் என்ன நடந்தது என்பதைக் குறிப்பிடுங்கள்.

---

## English

### What is this?

Payinthamil is a free, open-source web app for learning to touch-type Tamil
using the **Tamil99 keyboard layout**. It starts you on the home row and
introduces one key at a time across 35 lessons until you've covered the
whole keyboard.

Everything stays **in your browser**. Nothing is uploaded anywhere. No
sign-up, no account, no tracking.

> **Note:** This trains a *physical* keyboard layout. Touchscreen keyboards
> have no fixed key positions, so the app won't work on phones. Open it on
> a desktop or laptop.

### Features

| | |
|---|---|
| **35 lessons** | 20 beginner · 8 intermediate · 7 advanced |
| **Progressive unlocking** | A key never appears before it's taught |
| **Uyirmei drills** | Every consonant × all 12 vowels |
| **Thirukkural mode** | Type any of the 1330 verses (needs internet; 10 saved verses offline) |
| **Finger guide** | Colour-coded finger-to-key zones |
| **Live metrics** | WPM, accuracy, per-key timing (EMA-smoothed) |
| **Progress report** | Exportable to PDF |
| **16 themes** | Plus custom colours and font switching |

### Curriculum

**Beginner (20)**

Opens with `க ப` on the home row *plus* the pulli `்` — so real words like
`கல்` appear from lesson one. Then `ம த ந ய` completes the home row. All 12
vowels follow in pairs, then the remaining consonants ordered by frequency,
then uyirmei (consonant + vowel) grids.

**Intermediate (8)** — Remaining uyirmei combinations, then speed work from
24 → 30 WPM.

**Advanced (7)** — Grantha letters `ஸ ஷ ஜ ஹ`, the aytham `ஃ`, speed drills
up to 40 WPM, and Tamil accounting symbols `௳ ௴ ௵ ௶ ௷ ௸ ௹ ௺`.

### Running it

No build step. But it uses ES modules, so `file://` won't work — you need
any HTTP server.

```bash
git clone https://github.com/siruththondan/Payinthamil.git
cd Payinthamil
python3 -m http.server 5501
```

Open **http://localhost:5501**

### Deploying

Push the folder as-is to any static host — GitHub Pages, Netlify, Vercel,
Cloudflare Pages. There's nothing to compile.

**Do make sure gzip or brotli is enabled.** It takes the payload from
~269 KB down to roughly 105 KB, which matters far more than any other
optimisation here. Every major host does this by default.

Per-host notes:

- **Netlify, Vercel, Cloudflare Pages, GitHub Pages** compress text assets
  (HTML, CSS, JS, SVG) automatically. Nothing to configure.
- **Self-hosted nginx / Apache / Caddy:** enable `gzip` (or `brotli`) for
  `text/html`, `text/css`, `text/javascript`, `image/svg+xml`.
- **Verify** that compression is really on:

  ```bash
  curl -sI -H 'Accept-Encoding: br,gzip' https://HOST/styles/style.css | grep -i content-encoding
  ```

  You should see `content-encoding: br` or `gzip`.

**Caching.** Every JS file, the stylesheet, the keyboard SVG and the keyboard
module graph are requested with `?v=<version>`, so they can be cached forever;
bumping the version string (see the checklist in `CONTRIBUTING.md`) is the
cache-bust. `index.html` itself must be revalidated so visitors pick up a new
version string. Example `netlify.toml` (the project ships no host config):

```toml
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/styles/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Other hosts: set the same `Cache-Control` values with their own header
mechanism (`_headers` on Cloudflare Pages, `vercel.json` `headers` on Vercel).

### Project layout

```
index.html              Single page — all markup
styles/style.css        All styles, CSS custom properties for theming
assets/images/
  Tamil99.svg           Keyboard graphic (every key is an addressable id)
  preview.webp / .gif   Shown on the mobile gate (webp preferred, gif fallback)
assets/fonts/           Self-hosted subset fonts: nst-ta, jbm-ui, coiny-logo (.woff2)
  OFL.txt, README.md    Font license and per-file source notes
tools/mkcrit.py         Regenerates the inline critical CSS in index.html
scripts/check.mjs       `npm run check`: syntax, version strings, file references
.github/                CI workflow, issue forms, pull request template
package.json            Scripts only (start, check); no dependencies
CONTRIBUTING.md         How to run, style, PR and release checklist
CODE_OF_CONDUCT.md      Contributor Covenant 2.1
SECURITY.md             How to report vulnerabilities
CHANGELOG.md            Release notes
NOTICE, LICENSE         Apache-2.0 license and third-party notices
js/
  practice.js           Entry point, lesson engine, tab routing
  lessons.js            35 lessons + Tamil word database
  mapping.js            Tamil99 key ↔ glyph maps, syllable composition
  keyboard.js           SVG injection, key highlighting
  metrics.js            WPM, accuracy, per-key stats
  storage.js            localStorage wrapper (buffered writes)
  themes.js             16 themes + custom theme vars
  thirukkural.js        Thirukkural mode (lazy-loaded)
  report.js             Progress report (lazy-loaded)
  tour.js               12-step onboarding (lazy-loaded)
  fingerGuide.js        Finger-zone overlay
```

### Technical notes

- **No framework, no bundler.** Native ES modules loaded straight by the
  browser. Clone it and read it — there's no build output to decode.
- **Lazy loading.** `thirukkural.js`, `report.js` and `tour.js` load only
  when actually needed, keeping the initial payload to 8 files. On a gated
  (phone) device the app JS and the keyboard SVG are not fetched at all.
- **Fast first paint without a build step.** The first-frame CSS is inlined in
  `index.html` and mirrors `styles/style.css` (keep both in sync); the full
  sheet loads non-blocking. The import map and the modulepreloads live in
  `<head>`. Fonts are self-hosted subsets (no third-party requests):
  Noto Sans Tamil and JetBrains Mono as variable fonts, and a Coiny subset that
  contains only the glyphs of the logo text, so changing the logo text means
  regenerating `assets/fonts/coiny-logo.woff2` (command in `index.html`).
- **Keystrokes stay off the main thread's critical path.** Per-key stats
  buffer in memory and flush on idle, tab-hide, or lesson end — never
  synchronously on keypress. Measured at ~100 µs per keystroke with zero
  forced reflows.
- **Themes are CSS custom properties** applied inline by `applyTheme()`.
  All 16 meet WCAG AA contrast for muted text.
- **Tamil text is NFC-normalised** before key mapping, so copy-pasted text
  from different sources composes identically.

### Contributing

Contributions of every kind are welcome — new lessons, more words, themes,
bug fixes, documentation.

1. Fork the repo
2. Create a branch — `git checkout -b my-feature`
3. Make your changes and test them in a browser
4. Run `npm run check` (syntax, version strings and file references; no
   install needed, just Node)
5. Open a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details, the
[Code of Conduct](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) for
reporting vulnerabilities.

Found a bug? [Open an issue](https://github.com/siruththondan/Payinthamil/issues)
with your browser, screen size, and what happened.

### Roadmap

- **Bundle all 1,330 Thirukkural verses into the app** so it works fully
  offline with no dependency on the third-party Kural API.

---

## Credits

- **Thirukkural text** — [tamil-kural-api](https://tamil-kural-api.vercel.app),
  with a local fallback bundled for offline use
- **Fonts** (self-hosted subsets, SIL OFL) — [Noto Sans Tamil](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil),
  [JetBrains Mono](https://www.jetbrains.com/lp/mono/),
  [Coiny](https://fonts.google.com/specimen/Coiny)
- **Tamil99 layout** — the Tamil Nadu government standard

## License

[Apache License 2.0](LICENSE) — free to use, modify and distribute.

<div align="center">

**தமிழ்நாட்டில் அன்புடன் உருவாக்கப்பட்டது**
*Made with care in Tamil Nadu*

</div>
