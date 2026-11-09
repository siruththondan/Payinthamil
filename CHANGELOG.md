# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-11-09

First public release of Payinthamil.

### Added
- Tamil99 typing trainer built with vanilla JavaScript and native ES modules. No build step required.
- 35 structured lessons: 20 beginner, 8 intermediate, and 7 advanced, with progressive key unlocking.
- Uyirmei drills covering each consonant with all 12 vowels.
- Grantha letters, aytham, speed drills up to 40 WPM, and Tamil accounting symbols.
- Thirukkural mode with all 1,330 verses fetched at runtime and a 10-verse offline fallback.
- On-screen SVG keyboard with key highlighting and a colour-coded finger guide.
- Live typing metrics: WPM, accuracy, and per-key timing.
- Progress reports with PDF export.
- 16 colour themes, custom colours, and font switching.
- 12-step onboarding tour.
- Mobile device gate for touch-only devices, with an override for users with a physical keyboard.
- Local storage for typing progress and preferences using the browser's `localStorage`.
- Self-hosted subset fonts: Noto Sans Tamil, JetBrains Mono, and Coiny, distributed under the SIL Open Font License (OFL).
- `npm run check` script for project validation.
- GitHub Actions workflow for automated validation.
