# Security Policy

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private vulnerability reporting instead:

1. Go to https://github.com/mastergokul/payinthamil
2. Open the **Security** tab
3. Click **Report a vulnerability**

Include what you found, how to reproduce it, and the browser you used. You can expect a reply on a best-effort basis.

## Scope

Payinthamil is a static, client-side web app. It has no server component and no accounts.

- All user data (progress, settings, key statistics) is stored only in the browser's `localStorage`.
- The only external network call is to `https://tamil-kural-api.vercel.app/api/kural`, used by Thirukkural mode to fetch verse text. A short offline fallback is bundled.
- Fonts are self-hosted; there are no other third-party requests.
