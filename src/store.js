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

function buildReminder(partial) {
  return {
    id: partial.id ?? Date.now(),
    time: partial.time ?? null,
    when: partial.when ?? 'later',
    icon: partial.icon ?? 'spark',
    tag: partial.tag ?? 'NOTE',
    title: partial.title,
    body: partial.body ?? '',
    done: false,
    clusterId: partial.clusterId ?? null,
    parentId: partial.parentId ?? null,
    kind: partial.kind ?? 'standalone', // 'standalone' | 'parent' | 'child'
  };
}

function mergePrefs(saved) {
  const base = { ...DEFAULT_PREFS, ...(saved ?? {}) };
  base.profile = { ...DEFAULT_PROFILE, ...((saved && saved.profile) || {}) };
  return base;
}

const BEHAVIOR_CAP = 200;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      reminders: parsed.reminders ?? [],
      prefs: mergePrefs(parsed.prefs),
      behaviorLog: parsed.behaviorLog ?? [],
    };
  } catch {
    return null;
  }
}

function appendEvent(log, entry) {
  return [...log, entry].slice(-BEHAVIOR_CAP);
}

export function useStore(/* t, lang kept for signature compat */) {
  const [state, setState] = useState(() => {
    const loaded = load();
    return {
      reminders: loaded?.reminders ?? [],
      prefs: mergePrefs(loaded?.prefs),
      behaviorLog: loaded?.behaviorLog ?? [],
    };
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const toggleDone = useCallback((id) => {
    setState(s => {
      const r = s.reminders.find(x => x.id === id);
      if (!r) return s;
      const nowDone = !r.done;
      return {
        ...s,
        reminders: s.reminders.map(x => x.id === id ? { ...x, done: nowDone } : x),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: nowDone ? 'done' : 'undone',
          title: r.title, tag: r.tag, icon: r.icon, when: r.when,
          at: Date.now(),
        }),
      };
    });
  }, []);

  const snooze = useCallback((id) => {
    setState(s => {
      const r = s.reminders.find(x => x.id === id);
      const log = r
        ? appendEvent(s.behaviorLog, {
            type: 'snooze', title: r.title, tag: r.tag, icon: r.icon, when: r.when,
            at: Date.now(),
          })
        : s.behaviorLog;
      return { ...s, reminders: s.reminders.filter(x => x.id !== id), behaviorLog: log };
    });
  }, []);

  const addReminder = useCallback((partial) => {
    setState(s => {
      const r = buildReminder(partial);
      return {
        ...s,
        reminders: [...s.reminders, r],
        behaviorLog: appendEvent(s.behaviorLog, {
          type: 'created', title: r.title, tag: r.tag, icon: r.icon, when: r.when,
          at: Date.now(),
        }),
      };
    });
  }, []);

  // Atomically add a parent reminder + its children, linked by clusterId.
  const addCluster = useCallback(({ parent, children }) => {
    setState(s => {
      const clusterId = `c_${Date.now()}`;
      const parentR = buildReminder({ ...parent, clusterId, kind: 'parent' });
      const childR = (children ?? []).map((c, i) => buildReminder({
        ...c,
        clusterId,
        parentId: parentR.id,
        kind: 'child',
        id: parentR.id + 1 + i,
      }));
      const log = appendEvent(s.behaviorLog, {
        type: 'cluster_created',
        title: parentR.title, tag: parentR.tag, icon: parentR.icon, when: parentR.when,
        childrenCount: childR.length,
        at: Date.now(),
      });
      return { ...s, reminders: [...s.reminders, parentR, ...childR], behaviorLog: log };
    });
  }, []);

  // Patch an existing reminder (e.g. reschedule it to a new time/when).
  // Logs a 'rescheduled' event so behavior aggregation can learn from it.
  const updateReminder = useCallback((id, patch) => {
    setState(s => {
      const r = s.reminders.find(x => x.id === id);
      if (!r) return s;
      const updated = { ...r, ...patch };
      return {
        ...s,
        reminders: s.reminders.map(x => x.id === id ? updated : x),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: 'rescheduled',
          title: r.title, tag: r.tag, icon: r.icon,
          from: { time: r.time, when: r.when },
          to:   { time: updated.time, when: updated.when },
          at: Date.now(),
        }),
      };
    });
  }, []);

  // Remove past snooze events for a given title — used after the user
  // moves a reminder so the "spesso saltato" badge resets.
  const clearSkipsForTitle = useCallback((title) => {
    setState(s => ({
      ...s,
      behaviorLog: s.behaviorLog.filter(e => !(e.type === 'snooze' && e.title === title)),
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
    setState({ reminders: [], prefs: mergePrefs(null), behaviorLog: [] });
  }, []);

  // Replay onboarding without wiping reminders.
  const resetOnboarding = useCallback(() => {
    setState(s => ({
      ...s,
      prefs: { ...s.prefs, onboarded: false, profileDone: false, themeChosen: false },
    }));
  }, []);

  // Clear reminders only (keeps behavior log so the LLM keeps patterns).
  const clearReminders = useCallback(() => {
    setState(s => ({ ...s, reminders: [] }));
  }, []);

  // Wipe just the behavior log (for the user; settings affordance).
  const clearBehaviorLog = useCallback(() => {
    setState(s => ({ ...s, behaviorLog: [] }));
  }, []);

  return { state, toggleDone, snooze, addReminder, addCluster, updateReminder, clearSkipsForTitle, setPref, setProfile, reset, resetOnboarding, clearReminders, clearBehaviorLog };
}
