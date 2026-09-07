<div align="center">

# CTRL+Me

**Your brain’s new plus one.** A thoughtful reminder app that reads the room —
you type the messy sentence you'd actually say out loud, and it comes back as a
clean reminder, at the right time, in your tone.

[**Live demo**](https://elisasimoni.github.io/ctrl-me/) · [Android APK](https://github.com/elisasimoni/ctrl-me/releases/latest)

![React](https://img.shields.io/badge/React-18-0d0d0d?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-0d0d0d?style=flat-square)
![Capacitor](https://img.shields.io/badge/Capacitor-8-0d0d0d?style=flat-square)
![Claude Haiku 4.5](https://img.shields.io/badge/Claude-Haiku%204.5-0d0d0d?style=flat-square)
![MIT](https://img.shields.io/badge/license-MIT-0d0d0d?style=flat-square)

<a href="https://elisasimoni.github.io/ctrl-me/"><img src=".github/assets/showcase-desktop.png" width="1200" alt="CTRL+Me interactive playground: a clear head, three linked reminders, and a little less noise"></a>

</div>

---

## The idea

Reminder apps make *you* do the structuring: pick a date, pick a time, pick a
list, write a title. CTRL+Me does the structuring itself. You type
*"remind me to take my pill every day at 8"* and it extracts the action,
parses the time, picks an icon, replies in your language and tone, and files
away the parts worth remembering.

The other half of the idea is restraint. No streaks, no confetti, no 7am
affirmations — one nudge, when it actually matters, and silence otherwise.

## What it does

| | |
|---|---|
| **Natural-language capture** | One text field. Claude Haiku 4.5 returns a structured reminder: `{icon, tag, title, body, time, when}`. |
| **Follow-up questions** | When something critical is missing (*"I have an exam tomorrow"* — when? which room?) it asks instead of guessing. |
| **Constellations** | A request that implies several linked reminders ("help me get ready for my exam on Tuesday") is proposed as a cluster — parent plus children — that you accept, trim, or drop. |
| **It learns your patterns** | The app logs what you complete, skip, and reschedule, then feeds a short summary back into the next call: reminders you keep dismissing, your most reliable time of day, habits that have become daily, candidates to archive. |
| **Tone that adapts quietly** | A streak of completions makes it *terser*, not louder — and it is explicitly forbidden from ever mentioning the streak. |
| **Real notifications** | Scheduled through the OS, with snooze, daily repeats, action buttons, and quiet hours. |
| **Weather nudges** | Open-Meteo + geolocation: if rain is likely in the next six hours, it offers the umbrella. |
| **Works with no AI at all** | With no API key it falls back to a local regex parser — still cleans the title, still finds the time. |
| **Two design directions** | The same app in two skins, chosen by dragging a mascot left or right. |
| **Bilingual** | English by default, with Italian available in Settings. |
| **Installable** | PWA (offline-capable, add to home screen) and a real Android build via Capacitor. |

## Try the playground

[**Give your brain a break →**](https://elisasimoni.github.io/ctrl-me/)

Choose **The big day**, **Everyday brain**, or **Weekend escape**. Run the preview,
watch one thought become three linked reminders, check them off, and switch
between Pebble and OS. Works on desktop and mobile, with reduced-motion support.

The playground uses **scripted English scenarios**, not live AI inference. It
makes no API calls and saves no demo reminders to your personal list. Open the
[full app](https://elisasimoni.github.io/ctrl-me/#app) to capture your own thoughts;
the app works locally without a key, with optional Claude-powered analysis.

The public experience starts in English. Italian remains available in the app’s
Settings, and your language choice is remembered. Installed PWAs and Android
launch directly into the app.

## How the AI part works

The constraint that shaped everything: this call runs on *every* reminder a user
types, so it had to be one small model call, not a chain.

```
profile   ─┐
behavior  ─┼─→ user turn ─→ Haiku 4.5 ─→ JSON schema ─→ reminder (+ cluster,
memory    ─┤                 (cached system prompt)      followups, new facts)
user text ─┘
                └─→ on any failure ─→ local regex parser
```

- **One call, structured output.** The response is constrained by a JSON schema
  (`output_config.format`), so there's no prose to parse and no
  "sometimes it wraps the JSON in markdown" class of bug.
- **Prompt caching.** The system prompt is long — rules, a field spec, behavioural
  guidance, worked examples — and never changes, so it's marked
  `cache_control: ephemeral`. Per-call cost is then essentially the user's sentence.
- **Everything variable lives in the user turn.** Profile, behaviour summary and
  remembered facts are prepended to the *user* message precisely so the cached
  system prompt stays byte-identical and keeps hitting the cache.
- **Behaviour is summarised, not dumped.** `src/lib/behavior.js` reduces the raw
  event log to a handful of short clauses ("frequently dismissed: X", "most
  reliable window: morning") — small enough to stay cheap, concrete enough for
  the model to act on.
- **Graceful degradation is the default path, not an afterthought.** No key, a
  network failure, or a malformed response all land in the same local parser, so
  the app never surfaces an error — it just gets a little dumber.

Worth reading: [`src/lib/llm.js`](src/lib/llm.js) (the prompt),
[`src/lib/behavior.js`](src/lib/behavior.js) (the signals),
[`src/components/AddSheet.jsx`](src/components/AddSheet.jsx) (the fallback).

## Two directions

The app ships two complete visual languages, chosen once at first launch by
dragging the mascot — with spring physics and a velocity-based squish, because
tapping a radio button would have been sad:

- **OS** — mono, near-black, terminal-adjacent. Tags, timestamps, a blinking cursor.
- **Pebble** — warm paper, an editorial serif/sans mix, rounded cards, a mascot with eyes.

Both app themes keep their monochrome identity. The public playground adds soft sage and lime accents around an interactive phone preview.

## Stack

- **React 18 + Vite 5** — no UI framework, no CSS framework; styles are inline and
  the shared primitives live in [`src/atoms.jsx`](src/atoms.jsx).
- **vite-plugin-pwa / Workbox** — installable, offline-capable.
- **Capacitor 8** — Android wrapper. Notifications and geolocation go through
  native APIs when installed and browser APIs on the web;
  [`src/native/`](src/native/) hides the difference behind one interface.
- **Anthropic SDK** — `claude-haiku-4-5`.
- **Open-Meteo** — weather, no key required.
- **localStorage** — all state. No backend, no account, nothing leaves the device
  except data sent to enabled services: AI analysis includes your input, profile, behavior summary, and remembered context; weather uses your location.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built PWA (open it on your phone to install)
```

To enable the Haiku flow, either paste a key at runtime under **⚙ → AI brain**,
or set it at build time:

```bash
cp .env.example .env.local   # then set VITE_ANTHROPIC_API_KEY
```

The live demo uses the runtime option, since the deployed build ships no key of
its own.

### Android

```bash
npm run build
npx cap sync android
npx cap open android          # or: cd android && ./gradlew assembleDebug
```

Pushing a `v*.*.*` tag builds and publishes a debug APK via
[`.github/workflows/release.yml`](.github/workflows/release.yml).

## Project structure

```
src/
├── Showcase.jsx               English landing page and isolated interactive preview
├── showcase.css               responsive playground styling and motion
├── App.jsx                    theme picker → questionnaire → onboarding → home
├── store.js                   reminders, prefs, profile, behaviour log (localStorage)
├── i18n.jsx                   IT/EN dictionary, English default
├── atoms.jsx                  logo, icon set, mascot, pills
├── lib/
│   ├── llm.js                 the Haiku call: cached system prompt, JSON schema
│   ├── behavior.js            raw event log → short signals for the prompt
│   ├── clusters.js            parent/child reminder grouping
│   ├── apiKey.js              where the key comes from (runtime > build-time)
│   └── useReminderNotifications.js   keeps the OS queue in sync with state
├── native/                    one interface, two implementations (Capacitor / web)
│   └── notifications.js  geo.js  weather.js  maps.js  calendar.js  memory.js
├── screens/
│   ├── DirA.jsx               direction A — "OS"
│   └── DirB.jsx               direction B — "Pebble"
└── components/
    ├── AddSheet.jsx           capture sheet + local fallback parser
    ├── ConstellationReveal.jsx   animated cluster proposal
    ├── ConstellationGraph.jsx    cluster overview
    ├── OnboardingQuestionnaire.jsx
    ├── ThemeChooser.jsx       drag-to-pick, spring physics
    ├── Settings.jsx           profile panel + config panel
    └── WeatherBanner.jsx  ProfileInputs.jsx  PebbleHint.jsx
```

## Known limitations

- **The API key is client-side.** Whether it comes from `VITE_ANTHROPIC_API_KEY`
  at build time or from Settings at runtime, it lives in the browser — fine for a
  prototype, not fine for production. The real fix is a `/api/analyze` server
  route holding the key, at which point [`src/lib/apiKey.js`](src/lib/apiKey.js)
  and `dangerouslyAllowBrowser` both go away. Neither this repo nor any published
  build contains a key.
- **Web notifications only fire while the tab is open.** Scheduling survives
  backgrounding only in the Capacitor build, which uses real local notifications.
- **Recurrence is shallow.** "every day at 8" is handled as a daily repeat, but
  there's no general recurrence rule (every other Tuesday, last day of month…).
- **The behaviour log lives on one device.** No sync, so patterns don't follow you
  between phone and browser.

## License

MIT © Elisa Simoni — see [LICENSE](LICENSE).
