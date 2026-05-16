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
  permNotifications: true,    // user-controlled mute switch (OS permission is separate)
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

// Replace a HH:MM time appearance inside a title with a new time.
// Handles both zero-padded ("08:00") and natural ("8:00") forms.
// Returns the original title unchanged if no time-shape is found.
function rewriteTimeInTitle(title, oldTime, newTime) {
  if (!oldTime || !newTime) return title;
  const [oh, om] = oldTime.split(':');
  const [nh, nm] = newTime.split(':');
  if (!oh || !nh) return title;
  const candidates = [
    `${oh}:${om}`,                       // 08:00
    `${parseInt(oh, 10)}:${om}`,         // 8:00
  ];
  for (const cand of candidates) {
    if (title.includes(cand)) {
      // Match the same shape user/Haiku used — strip the leading zero if the
      // matched candidate didn't have one.
      const replacement = cand.startsWith('0') ? `${nh}:${nm}` : `${parseInt(nh, 10)}:${nm}`;
      return title.replace(cand, replacement);
    }
  }
  return title;
}

// Advance an HH:MM by N minutes, wrapping past midnight. If time is
// missing, default to "now + delta" — so snoozing an untimed reminder
// still gets a real time it can fire at.
function bumpTime(time, deltaMin) {
  let h, m;
  if (time && /^\d{1,2}:\d{2}$/.test(time)) {
    [h, m] = time.split(':').map(Number);
  } else {
    const now = new Date();
    h = now.getHours();
    m = now.getMinutes();
  }
  const total = (h * 60 + m + deltaMin) % (24 * 60);
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function deriveWhen(time) {
  if (!time) return 'later';
  const h = parseInt(time.split(':')[0], 10);
  if (h >= 5 && h < 12) return 'morning';
  if (h === 12) return 'noon';
  if (h >= 13 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'later';
}

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

  // Snooze = "remind me later". Pushes the reminder's time forward by
  // 10 minutes instead of deleting it, so the OS notification fires
  // again after the delay. Still logs a 'snooze' event for the behavior
  // aggregator (lots of snoozes = "spesso saltato" badge).
  const snooze = useCallback((id, deltaMin = 10) => {
    setState(s => {
      const r = s.reminders.find(x => x.id === id);
      if (!r) return s;
      const nextTime = bumpTime(r.time, deltaMin);
      const nextWhen = deriveWhen(nextTime);
      const updated = { ...r, time: nextTime, when: nextWhen };
      return {
        ...s,
        reminders: s.reminders.map(x => x.id === id ? updated : x),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: 'snooze', title: r.title, tag: r.tag, icon: r.icon, when: r.when,
          at: Date.now(),
        }),
      };
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

  // Atomically add a parent reminder + its kept children. Also records
  // a cluster_decision event capturing which child tags were kept vs
  // dropped from the LLM's original proposal, so future similar
  // constellations can be biased toward what the user actually wants.
  const addCluster = useCallback(({ parent, children, droppedChildren = [] }) => {
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
      let log = appendEvent(s.behaviorLog, {
        type: 'cluster_created',
        title: parentR.title, tag: parentR.tag, icon: parentR.icon, when: parentR.when,
        childrenCount: childR.length,
        at: Date.now(),
      });
      log = appendEvent(log, {
        type: 'cluster_decision',
        parentTitle: parentR.title,
        parentTag: parentR.tag,
        kept: (children ?? []).map(c => c.tag),
        dropped: (droppedChildren ?? []).map(c => c.tag),
        at: Date.now(),
      });
      return { ...s, reminders: [...s.reminders, parentR, ...childR], behaviorLog: log };
    });
  }, []);

  // Patch an existing reminder (e.g. reschedule it to a new time/when).
  // Logs a 'rescheduled' event so behavior aggregation can learn from it.
  // When the time changes, also rewrites any time mention inside the
  // title so it doesn't go stale (e.g. "Pillola alle 8:00." → "13:00.").
  const updateReminder = useCallback((id, patch) => {
    setState(s => {
      const r = s.reminders.find(x => x.id === id);
      if (!r) return s;
      const updated = { ...r, ...patch };
      if (patch.time && r.time && patch.time !== r.time && r.title) {
        const rewritten = rewriteTimeInTitle(r.title, r.time, patch.time);
        if (rewritten !== r.title) updated.title = rewritten;
      }
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
