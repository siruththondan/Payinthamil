# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] - 2026-11-08

Initial public release.

### Added
- Tamil99 typing trainer in vanilla JavaScript with native ES modules and no build step.
- 35 lessons: 20 beginner, 8 intermediate, 7 advanced, with progressive key unlocking.
- Uyirmei drills (each consonant with all 12 vowels), grantha letters, aytham, speed drills up to 40 WPM, and Tamil accounting symbols.
- Thirukkural mode: type any of the 1330 verses, fetched at runtime, with a 10-verse offline fallback.
- On-screen SVG keyboard with key highlighting and a colour-coded finger guide.
- Live metrics: WPM, accuracy and per-key timing.
- Progress report that can be exported to PDF.
- 16 colour themes, plus custom colours and font switching.
- 12-step onboarding tour.
- Mobile gate for touch-only devices, with an override for users who have a physical keyboard.
- All data stored in the browser's `localStorage`; nothing is uploaded.
- Self-hosted subset fonts (Noto Sans Tamil, JetBrains Mono, Coiny) under the SIL OFL.
- `npm run check` script and a GitHub Actions workflow running it.
