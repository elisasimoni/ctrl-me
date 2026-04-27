import React, { createContext, useContext, useEffect, useState } from 'react';

const dict = {
  en: {
    // onboarding A
    'a.boot.0': 'BOOT · 0001',
    'a.boot.1': 'CONFIG · 0002',
    'a.boot.2': 'READY · 0003',
    'a.headline.0': "I'm not another reminder app.",
    'a.headline.0.italic': 'not',
    'a.sub.0': "I notice things. Then I tell you. That's it.",
    'a.cta.0': 'Continue',
    'a.headline.1': 'Tell me what you\nwant to remember.',
    'a.sub.1': 'Or let me figure it out by reading the room.',
    'a.cta.1': 'Sounds good',
    'a.headline.2': "I'll only\nspeak when useful.",
    'a.sub.2': 'No nags. No streaks. No 7am affirmations. Pinky promise.',
    'a.cta.2': 'Hand over the keys',
    'a.preview.weather': 'Rain at 14:00 (78%). I moved your umbrella to the hook.',
    'a.preview.budget': '$12 left in takeout. You always order on Thursdays. Hm.',
    'a.preview.exam': 'Building C, room 204. I left already, you should too.',
    'a.tag.weather': 'WEATHER · 06:42',
    'a.tag.budget': 'BUDGET · 19:11',
    'a.tag.exam': 'EXAM · 08:45',

    // onboarding B
    'b.eyebrow.0': '01 — meet',
    'b.eyebrow.1': '02 — how',
    'b.eyebrow.2': '03 — vibe',
    'b.headline.0': "Hi. I'm Me.",
    'b.headline.0.italic': 'Me.',
    'b.sub.0': "Well, technically I'm yours. A tiny brain that lives in your phone and remembers the boring stuff so you don't have to.",
    'b.cta.0': 'Hi back',
    'b.headline.1': 'I read between the lines.',
    'b.headline.1.italic': 'lines.',
    'b.sub.1': "You say \"remind me to take the pill\" — done. You don't say anything — I still notice it'll rain at 2pm.",
    'b.cta.1': 'Spooky. Continue',
    'b.headline.2': 'Helpful, never noisy.',
    'b.headline.2.italic': 'noisy.',
    'b.sub.2': "No streaks. No 47 notifications. No \"you're crushing it!\". Just one nudge, when it actually matters.",
    'b.cta.2': "Let's go",
    'b.skip': 'skip',
    'b.things.label': 'Things I remember',
    'b.things.list': "umbrellas · pills · birthdays · budgets · exam rooms · the dog's vet · that one tab you never closed",
    'b.bubble.user': '"remind me to take the pill"',
    'b.bubble.bot': 'On it. Every day at noon, like a metronome.',
    'b.tag.streaks': '· no streaks',
    'b.tag.7am': '· no 7am',
    'b.tag.guilt': '· no guilt',

    // home shared
    'home.greeting': "Morning,",
    'home.greeting.italic': "here's the day.",
    'home.things': 'I\'ve got {n} thing{s} for you.',
    'home.allDone': "That's the lot.",
    'home.allDone.italic': "Go outside.",
    'home.tapHint': 'Tap when done. Swipe left if I was wrong.',
    'home.toGo': '{n} to go.',
    'home.toGo.italic': 'No pressure.',
    'home.compose.b': 'Tell me a thing to remember…',
    'home.compose.a': '$ remind me to',
    'home.empty.b': 'All clear.',
    'home.empty.b.italic': 'Add something below.',
    'home.empty.a': '> Empty stack. Add something below.',

    // status — A
    'a.online': '● ONLINE',
    'a.today': '┌─ TODAY ─────────────────┐',
    'a.things': '{n} thing{s},',
    'a.notUrgent': 'none',
    'a.urgentSuffix': ' urgent.',
    'a.idle': '> Awaiting orders. Or don\'t. I\'m here either way.',
    'a.progress': '> {done} of {total} handled. Building momentum.',
    'a.zero': '> Inbox zero. You absolute machine.',
    'a.feedFooter': '└── EOF · TAP TO COMPLETE · ← SWIPE TO SNOOZE ──┘',

    // notification
    'nudge.title': 'Umbrella.',
    'nudge.title.italic': 'Trust me.',
    'nudge.body': "Rain at 2pm — 78% — and you're 19 min from home. The math, friend, is not mathing.",
    'nudge.body.a': "Rain hits in 47 min. 78%. You're 19 min from home. The math isn't mathing in your favor.",
    'nudge.snooze': 'Snooze',
    'nudge.gotIt': 'Got it',
    'nudge.snooze.a': 'SNOOZE 1H',
    'nudge.gotIt.a': 'GOT IT, BOSS',
    'nudge.tagline': 'one nudge.',
    'nudge.tagline.italic': 'no follow-up.',
    'nudge.forecast': 'FORECAST · 14:00',
    'nudge.weather.a': '14°C · light rain · 78%',
    'nudge.weather.b': 'Light rain · 14°',
    'nudge.followup.a': '── ONE NUDGE · NO FOLLOW-UP ──',

    // when (time-of-day labels)
    'when.morning': 'morning',
    'when.noon': 'noon',
    'when.afternoon': 'afternoon',
    'when.evening': 'evening',
    'when.later': 'later',

    // settings
    'settings.title.a': '┌─ SETTINGS ─┐',
    'settings.title.b': 'Settings',
    'settings.theme': 'Theme',
    'settings.theme.a': 'OS · DARK',
    'settings.theme.b': 'PEBBLE · LIGHT',
    'settings.theme.a.lc': 'OS · dark',
    'settings.theme.b.lc': 'Pebble · light',
    'settings.personality': 'Personality',
    'settings.chill': 'Chill',
    'settings.buddy': 'Buddy',
    'settings.hype': 'Hype',
    'settings.language': 'Language',
    'settings.lang.en': 'English',
    'settings.lang.it': 'Italiano',
    'settings.reset': 'Reset demo data',

    // add sheet
    'add.title.a': '$ remind me to',
    'add.title.b': 'New thing to remember',
    'add.placeholder.a': 'take the umbrella when it rains',
    'add.placeholder.b': 'Take the umbrella when it rains…',
    'add.cancel': 'Cancel',
    'add.confirm.a': 'COMMIT',
    'add.confirm.b': 'Add it',

    // seed
    'seed.r1.title': 'Bring the umbrella.',
    'seed.r1.body':  'I peeked at the sky. Rain at 2-ish. Trust me on this one.',
    'seed.r1.tag':   'WEATHER',
    'seed.r2.title': 'The pill, friend.',
    'seed.r2.body':  'Same time as yesterday, and the day before. Routine is your love language.',
    'seed.r2.tag':   'PILL · DAILY',
    'seed.r3.title': 'Building C, room 204.',
    'seed.r3.body':  'The one with the broken vending machine. 11 minutes from where you are now.',
    'seed.r3.tag':   'EXAM · CS-204',
    'seed.r4.title': '$12 left in takeout.',
    'seed.r4.body':  'You usually cave on Thursdays. I believe in you. Mostly.',
    'seed.r4.tag':   'BUDGET',

    // misc
    'desktop.tagline': 'CTRL+Me — Vite + PWA prototype',
    'desktop.previewNudge': 'preview the nudge →',
  },

  it: {
    'a.boot.0': 'BOOT · 0001',
    'a.boot.1': 'CONFIG · 0002',
    'a.boot.2': 'READY · 0003',
    'a.headline.0': 'Non la solita app di promemoria.',
    'a.headline.0.italic': 'solita',
    'a.sub.0': 'Mi accorgo delle cose. Poi te le dico. Stop.',
    'a.cta.0': 'Vai',
    'a.headline.1': 'Dimmi cosa\nvuoi che ti ricordi.',
    'a.sub.1': 'O zero, ci penso io a leggere l\'aria.',
    'a.cta.1': 'Forte',
    'a.headline.2': 'Apro bocca\nsolo quando serve.',
    'a.sub.2': 'Zero rotture. Zero streak. Zero affermazioni alle 7. Giuro.',
    'a.cta.2': 'Ti passo le chiavi',
    'a.preview.weather': 'Piove alle 14 (78%). Ombrello già sull\'attaccapanni.',
    'a.preview.budget': '12€ rimasti sul takeout. Il giovedì sgarri sempre, occhio.',
    'a.preview.exam': 'Edificio C, aula 204. Io sono già uscito, fai due conti.',
    'a.tag.weather': 'METEO · 06:42',
    'a.tag.budget': 'BUDGET · 19:11',
    'a.tag.exam': 'ESAME · 08:45',

    'b.eyebrow.0': '01 — ciao',
    'b.eyebrow.1': '02 — come',
    'b.eyebrow.2': '03 — vibe',
    'b.headline.0': 'Ciao. Sono Me.',
    'b.headline.0.italic': 'Me.',
    'b.sub.0': 'Tipo, sono tuo. Un cervellino nel telefono che si ricorda le rotture al posto tuo.',
    'b.cta.0': 'Ciao a te',
    'b.headline.1': 'Capisco al volo.',
    'b.headline.1.italic': 'volo.',
    'b.sub.1': 'Mi dici "ricordami la pillola" — ok. Non dici niente — noto lo stesso che alle 14 piove.',
    'b.cta.1': 'Inquietante, avanti',
    'b.headline.2': 'Utile, mai pesante.',
    'b.headline.2.italic': 'pesante.',
    'b.sub.2': 'Zero streak. Zero 47 notifiche. Zero "stai spaccando!!". Una sola spinta, quando serve.',
    'b.cta.2': 'Si va',
    'b.skip': 'salta',
    'b.things.label': 'Roba che mi ricordo',
    'b.things.list': 'ombrelli · pillole · compleanni · budget · aule d\'esame · veterinario del cane · quella tab aperta da tre mesi',
    'b.bubble.user': '"ricordami la pillola"',
    'b.bubble.bot': 'Ci penso io. Ogni giorno a mezzogiorno, fisso.',
    'b.tag.streaks': '· no streak',
    'b.tag.7am': '· no sveglia alle 7',
    'b.tag.guilt': '· no sensi di colpa',

    'home.greeting': 'Buongiorno,',
    'home.greeting.italic': 'questa è la giornata.',
    'home.things': 'Ti ho preparato {n} cos{a}.',
    'home.allDone': 'Hai chiuso tutto.',
    'home.allDone.italic': 'Vai a respirare.',
    'home.tapHint': 'Tocca se hai fatto. Scorri a sinistra se ho cannato.',
    'home.toGo': 'Te ne mancano {n}.',
    'home.toGo.italic': 'Tranqui.',
    'home.compose.b': 'Dimmi una cosa da non scordare…',
    'home.compose.a': '$ ricordami di',
    'home.empty.b': 'Pulito.',
    'home.empty.b.italic': 'Aggiungi qualcosa qua sotto.',
    'home.empty.a': '> Stack vuoto. Aggiungi qualcosa qua sotto.',

    'a.online': '● ONLINE',
    'a.today': '┌─ OGGI ──────────────────┐',
    'a.things': '{n} cos{a},',
    'a.notUrgent': 'zero',
    'a.urgentSuffix': ' urgenti.',
    'a.idle': '> Aspetto ordini. O pure no, comunque sto qua.',
    'a.progress': '> {done} su {total} fatte. Stai prendendo ritmo.',
    'a.zero': '> Inbox zero. Sei una bestia.',
    'a.feedFooter': '└── EOF · TOCCA PER FATTO · ← SCORRI PER DOPO ──┘',

    'nudge.title': 'Ombrello.',
    'nudge.title.italic': 'Fidati.',
    'nudge.body': 'Pioggia alle 14 — 78% — sei a 19 min da casa. I conti non te li sto a fare.',
    'nudge.body.a': 'Piove tra 47 min. 78%. Sei a 19 min da casa. I conti, ahimè, non tornano.',
    'nudge.snooze': 'Dopo',
    'nudge.gotIt': 'Ricevuto',
    'nudge.snooze.a': 'DOPO 1H',
    'nudge.gotIt.a': 'CAPITO CAPO',
    'nudge.tagline': 'una spinta.',
    'nudge.tagline.italic': 'niente di più.',
    'nudge.forecast': 'METEO · 14:00',
    'nudge.weather.a': '14°C · pioggia leggera · 78%',
    'nudge.weather.b': 'Pioggia leggera · 14°',
    'nudge.followup.a': '── UNA SPINTA · NIENTE DI PIÙ ──',

    'when.morning': 'mattina',
    'when.noon': 'mezzogiorno',
    'when.afternoon': 'pomeriggio',
    'when.evening': 'sera',
    'when.later': 'dopo',

    'settings.title.a': '┌─ IMPOSTAZIONI ─┐',
    'settings.title.b': 'Impostazioni',
    'settings.theme': 'Tema',
    'settings.theme.a': 'OS · SCURO',
    'settings.theme.b': 'PEBBLE · CHIARO',
    'settings.theme.a.lc': 'OS · scuro',
    'settings.theme.b.lc': 'Pebble · chiaro',
    'settings.personality': 'Personalità',
    'settings.chill': 'Tranqui',
    'settings.buddy': 'Amico',
    'settings.hype': 'Hype',
    'settings.language': 'Lingua',
    'settings.lang.en': 'English',
    'settings.lang.it': 'Italiano',
    'settings.reset': 'Resetta dati demo',

    'add.title.a': '$ ricordami di',
    'add.title.b': 'Cosa non vuoi scordare',
    'add.placeholder.a': 'prendere l\'ombrello quando piove',
    'add.placeholder.b': 'Prendere l\'ombrello quando piove…',
    'add.cancel': 'Lascia stare',
    'add.confirm.a': 'CONFERMA',
    'add.confirm.b': 'Aggiungilo',

    'seed.r1.title': 'Ombrello, prendilo.',
    'seed.r1.body':  'Ho sbirciato il cielo. Piove verso le 14. Fidati.',
    'seed.r1.tag':   'METEO',
    'seed.r2.title': 'La pillola, raga.',
    'seed.r2.body':  'Stessa ora di ieri e dell\'altroieri. La routine è il tuo linguaggio d\'amore.',
    'seed.r2.tag':   'PILLOLA · OGNI GIORNO',
    'seed.r3.title': 'Edificio C, aula 204.',
    'seed.r3.body':  'Quella col distributore rotto. Sei a 11 min a piedi da lì.',
    'seed.r3.tag':   'ESAME · CS-204',
    'seed.r4.title': '12€ rimasti sul takeout.',
    'seed.r4.body':  'Il giovedì molli sempre. Credo in te. Più o meno.',
    'seed.r4.tag':   'BUDGET',

    'desktop.tagline': 'CTRL+Me — prototipo Vite + PWA',
    'desktop.previewNudge': 'anteprima della spinta →',
  },
};

function format(s, vars = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

const I18nCtx = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const stored = localStorage.getItem('ctrlme.lang');
      if (stored === 'en' || stored === 'it') return stored;
    } catch {}
    const nav = (navigator.language || 'en').slice(0, 2);
    return nav === 'it' ? 'it' : 'en';
  });

  useEffect(() => {
    try { localStorage.setItem('ctrlme.lang', lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, vars) => {
    const raw = dict[lang]?.[key] ?? dict.en[key] ?? key;
    return vars ? format(raw, vars) : raw;
  };

  return <I18nCtx.Provider value={{ lang, t, setLang }}>{children}</I18nCtx.Provider>;
}

export function useT() {
  return useContext(I18nCtx);
}

// Pluralisation helper for IT (-a / -e) and EN (- / s)
export function plural(lang, n, opts) {
  if (lang === 'it') return n === 1 ? opts.itOne : opts.itMany;
  return n === 1 ? opts.enOne : opts.enMany;
}

// Locale-aware date formatter
export function formatDate(lang, date, opts) {
  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', opts);
}
