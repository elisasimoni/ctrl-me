import { useEffect, useState, useCallback } from 'react';

const KEY = 'ctrlme.state.v1';

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
  completedAt: null,
};

const DEFAULT_PREFS = {
  direction: 'B',
  onboarded: false,
  themeChosen: false,
  profileDone: false,
  personality: 'buddy',
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
      reminders: parsed.reminders ?? [],
      prefs: mergePrefs(parsed.prefs),
    };
  } catch {
    return null;
  }
}

export function useStore(/* t, lang kept for signature compat */) {
  const [state, setState] = useState(() => {
    const loaded = load();
    return {
      reminders: loaded?.reminders ?? [],
      prefs: mergePrefs(loaded?.prefs),
    };
  });

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
        },
      ],
    }));
  }, []);

  const setPref = useCallback((key, value) => {
    setState(s => ({ ...s, prefs: { ...s.prefs, [key]: value } }));
  }, []);

  const setProfile = useCallback((patch) => {
    setState(s => ({
      ...s,
      prefs: { ...s.prefs, profile: { ...s.prefs.profile, ...patch } },
    }));
  }, []);

  // Full nuke — used by "reset everything" in settings.
  const reset = useCallback(() => {
    setState({ reminders: [], prefs: mergePrefs(null) });
  }, []);

  // Replay onboarding without wiping reminders.
  const resetOnboarding = useCallback(() => {
    setState(s => ({
      ...s,
      prefs: { ...s.prefs, onboarded: false, profileDone: false, themeChosen: false },
    }));
  }, []);

  // Clear reminders only.
  const clearReminders = useCallback(() => {
    setState(s => ({ ...s, reminders: [] }));
  }, []);

  return { state, toggleDone, snooze, addReminder, setPref, setProfile, reset, resetOnboarding, clearReminders };
}
