# CTRL+Me

The buddy who notices. A B&W reminder app that reads the room.

Built with **Vite + React** as an installable **PWA**.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built PWA
```

## What's in here

- `src/screens/DirA.jsx` — Direction A "OS" (mono, dark, terminal-adjacent)
- `src/screens/DirB.jsx` — Direction B "Pebble" (warm paper, editorial, friendly mascot)
- `src/components/AddSheet.jsx` — bottom sheet to add a reminder, with light intent parsing
- `src/components/Settings.jsx` — theme + personality toggle
- `src/store.js` — `useStore()` hook, localStorage-persisted reminders & prefs
- `src/PhoneFrame.jsx` — desktop preview frame; collapses to fullscreen on mobile / installed PWA
- `public/icon*.svg` — PWA icons (SVG; regenerate as PNGs later if needed)

## Direction switch

In-app: tap the gear icon → **Theme** → OS / Pebble. State persists.

## Optional: Haiku 4.5 follow-ups

If you want the smart follow-up flow ("ho un esame" → "Quando? In che aula?"), copy `.env.example` to `.env.local` and drop in an Anthropic API key:

```bash
cp .env.example .env.local
# edit .env.local and set VITE_ANTHROPIC_API_KEY
```

Without a key, the app falls back to a local keyword parser — still works, just less smart.

⚠️ `VITE_*` vars are bundled into the JS at build time, so this is **local prototyping only**. Production needs a backend proxy (a `/api/analyze` route that holds the key server-side).

## i18n

Italian (Gen-Z friendly) + English. Auto-detects browser locale, override in Settings → Lingua / Language.

## Install as PWA

After `npm run build && npm run preview`, open the preview URL on your phone — Safari "Add to Home Screen" or Chrome "Install app" gives you a fullscreen, offline-capable CTRL+Me.
