import { useEffect, useState, useCallback } from 'react';

const KEY = 'ctrlme.state.v1';

function buildSeed(t) {
  return [
    { id: 1, time: '08:42', when: 'morning', icon: 'rain',
      tag: t('seed.r1.tag'), title: t('seed.r1.title'), body: t('seed.r1.body'),
      done: false, seed: true },
    { id: 2, time: '12:00', when: 'noon', icon: 'pill',
      tag: t('seed.r2.tag'), title: t('seed.r2.title'), body: t('seed.r2.body'),
      done: false, seed: true },
    { id: 3, time: '15:30', when: 'afternoon', icon: 'pin',
      tag: t('seed.r3.tag'), title: t('seed.r3.title'), body: t('seed.r3.body'),
      done: false, seed: true },
    { id: 4, time: '19:00', when: 'evening', icon: 'wallet',
      tag: t('seed.r4.tag'), title: t('seed.r4.title'), body: t('seed.r4.body'),
      done: false, seed: true },
  ];
}

const DEFAULT_PROFILE = {
  name: '',
  tone: 'buddy',               // 'chill' | 'buddy' | 'hype' (mirrors prefs.personality)
  directTone: true,            // can I be direct with you?
  wakeHour: 8,                 // 0-23
  sleepHour: 23,               // 0-23
  occupation: 'student',       // 'student' | 'work' | 'both' | 'other'
  noWorkDays: ['sat', 'sun'],  // subset of mon..sun
  areas: ['study'],            // ['study','health','social','work','home','habits']
  onSkip: 'ask',               // 'repropose' | 'ask' | 'archive'
  insistence: 'soft',          // 'zero' | 'soft' | 'hard'
  eveningCheckin: true,
  permWeather: false,
  permLocation: false,
  permCalendar: false,
  completedAt: null,           // ISO string when questionnaire finished
};

const DEFAULT_PREFS = {
  direction: 'B', // 'A' | 'B'
  onboarded: false,
  themeChosen: false,
  profileDone: false,
  personality: 'buddy', // 'chill' | 'buddy' | 'hype'
  profile: DEFAULT_PROFILE,
};

export { DEFAULT_PROFILE };

function mergePrefs(saved) {
  const base = { ...DEFAULT_PREFS, ...(saved ?? {}) };
  base.profile = { ...DEFAULT_PROFILE, ...((saved && saved.profile) || {}) };
  return base;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      reminders: parsed.reminders ?? null,
      prefs: mergePrefs(parsed.prefs),
    };
  } catch {
    return null;
  }
}

export function useStore(t, lang) {
  const [state, setState] = useState(() => {
    const loaded = load();
    // Already onboarded → use persisted reminders (empty list if they deleted everything)
    if (loaded?.prefs?.onboarded) {
      return { reminders: loaded.reminders ?? [], prefs: mergePrefs(loaded.prefs) };
    }
    // Not yet onboarded → show seeds as preview inside onboarding
    return { reminders: buildSeed(t), prefs: { ...DEFAULT_PREFS, ...(loaded?.prefs ?? {}) } };
  });

  // Re-translate seed reminders when language changes (only the untouched ones).
  useEffect(() => {
    setState(s => {
      const fresh = buildSeed(t);
      return {
        ...s,
        reminders: s.reminders.map(r => {
          if (!r.seed) return r;
          const seed = fresh.find(f => f.id === r.id);
          if (!seed) return r;
          return { ...r, tag: seed.tag, title: seed.title, body: seed.body };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const toggleDone = useCallback((id) => {
    setState(s => ({
      ...s,
      reminders: s.reminders.map(r => r.id === id ? { ...r, done: !r.done } : r),
    }));
  }, []);

  const snooze = useCallback((id) => {
    setState(s => ({ ...s, reminders: s.reminders.filter(r => r.id !== id) }));
  }, []);

  const addReminder = useCallback((partial) => {
    setState(s => ({
      ...s,
      reminders: [
        ...s.reminders,
        {
          id: Date.now(),
          time: partial.time ?? null,
          when: partial.when ?? 'later',
          icon: partial.icon ?? 'spark',
          tag: partial.tag ?? 'NOTE',
          title: partial.title,
          body: partial.body ?? '',
          done: false,
          seed: false,
        },
      ],
    }));
  }, []);

  const setPref = useCallback((key, value) => {
    setState(s => {
      const newPrefs = { ...s.prefs, [key]: value };
      // Completing onboarding → wipe seeds, start with empty list
      if (key === 'onboarded' && value === true) {
        return { ...s, prefs: newPrefs, reminders: s.reminders.filter(r => !r.seed) };
      }
      return { ...s, prefs: newPrefs };
    });
  }, []);

  const setProfile = useCallback((patch) => {
    setState(s => ({
      ...s,
      prefs: { ...s.prefs, profile: { ...s.prefs.profile, ...patch } },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ reminders: buildSeed(t), prefs: mergePrefs(null) });
  }, [t]);

  return { state, toggleDone, snooze, addReminder, setPref, setProfile, reset };
}
