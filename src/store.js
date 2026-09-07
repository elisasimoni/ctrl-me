import { useEffect, useState, useCallback } from "react";
import {
  applyChange,
  canApplyChange,
  savedPlanChange,
} from "./lib/planChanges.js";
import { localDate, whenFor } from "./lib/planning.js";
let lastId = Date.now();
const nextId = () => {
  lastId = Math.max(lastId + 1, Date.now());
  return lastId;
};

const KEY = "ctrlme.state.v1";

const DEFAULT_PROFILE = {
  name: "",
  tone: "buddy", // 'chill' | 'buddy' | 'hype' (mirrors prefs.personality)
  directTone: true, // can I be direct with you?
  wakeHour: 8, // 0-23
  sleepHour: 23, // 0-23
  occupation: "student", // 'student' | 'work' | 'both' | 'other'
  noWorkDays: ["sat", "sun"], // subset of mon..sun
  areas: ["study"], // ['study','health','social','work','home','habits']
  onSkip: "ask", // 'repropose' | 'ask' | 'archive'
  insistence: "soft", // 'zero' | 'soft' | 'hard'
  eveningCheckin: true,
  permWeather: false,
  permLocation: false,
  permCalendar: false,
  permNotifications: false, // user-controlled mute switch (OS permission is separate)
  completedAt: null,
};

const DEFAULT_PREFS = {
  direction: "B",
  onboarded: false,
  themeChosen: false,
  profileDone: false,
  personality: "buddy",
  profile: DEFAULT_PROFILE,
};

export { DEFAULT_PROFILE };

// Replace a HH:MM time appearance inside a title with a new time.
// Handles both zero-padded ("08:00") and natural ("8:00") forms.
// Returns the original title unchanged if no time-shape is found.
function rewriteTimeInTitle(title, oldTime, newTime) {
  if (!oldTime || !newTime) return title;
  const [oh, om] = oldTime.split(":");
  const [nh, nm] = newTime.split(":");
  if (!oh || !nh) return title;
  const candidates = [
    `${oh}:${om}`, // 08:00
    `${parseInt(oh, 10)}:${om}`, // 8:00
  ];
  for (const cand of candidates) {
    if (title.includes(cand)) {
      // Match the same shape user/Haiku used — strip the leading zero if the
      // matched candidate didn't have one.
      const replacement = cand.startsWith("0")
        ? `${nh}:${nm}`
        : `${parseInt(nh, 10)}:${nm}`;
      return title.replace(cand, replacement);
    }
  }
  return title;
}

function deriveWhen(time) {
  if (!time) return "later";
  const h = parseInt(time.split(":")[0], 10);
  if (h >= 5 && h < 12) return "morning";
  if (h === 12) return "noon";
  if (h >= 13 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "later";
}

function buildReminder(partial) {
  return {
    id: partial.id ?? nextId(),
    date: partial.date ?? null,
    repeat: partial.repeat ?? "none",
    time: partial.time ?? null,
    when: partial.when ?? "later",
    icon: partial.icon ?? "spark",
    tag: partial.tag ?? "NOTE",
    title: partial.title,
    body: partial.body ?? "",
    done: false,
    clusterId: partial.clusterId ?? null,
    parentId: partial.parentId ?? null,
    kind: partial.kind ?? "standalone", // 'standalone' | 'parent' | 'child'
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

  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  useEffect(() => {
    const rollover = () =>
      setState((s) => {
        const stale = s.reminders.some(
          (r) =>
            r.repeat === "daily" && r.done && r.completedOn !== localDate(),
        );
        if (!stale) return s;
        return {
          ...s,
          reminders: s.reminders.map((r) =>
            r.repeat === "daily" && r.done && r.completedOn !== localDate()
              ? { ...r, done: false }
              : r,
          ),
        };
      });
    rollover();
    const timer = setInterval(rollover, 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleDone = useCallback((id) => {
    setState((s) => {
      const r = s.reminders.find((x) => x.id === id);
      if (!r) return s;
      const nowDone = !r.done;
      return {
        ...s,
        reminders: s.reminders.map((x) =>
          x.id === id
            ? { ...x, done: nowDone, completedOn: nowDone ? localDate() : null }
            : x,
        ),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: nowDone ? "done" : "undone",
          reminderId: r.id,
          title: r.title,
          tag: r.tag,
          icon: r.icon,
          when: r.when,
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
    setState((s) => {
      const r = s.reminders.find((x) => x.id === id);
      if (!r) return s;
      const next = new Date(Date.now() + deltaMin * 60000);
      const nextTime = `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`;
      const nextWhen = deriveWhen(nextTime);
      const updated = {
        ...r,
        time: nextTime,
        date: localDate(next),
        when: nextWhen,
        done: false,
      };
      return {
        ...s,
        reminders: s.reminders.map((x) => (x.id === id ? updated : x)),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: "snooze",
          reminderId: r.id,
          title: r.title,
          tag: r.tag,
          icon: r.icon,
          when: r.when,
          at: Date.now(),
        }),
      };
    });
  }, []);

  const addReminder = useCallback((partial) => {
    setState((s) => {
      const r = buildReminder(partial);
      return {
        ...s,
        reminders: [...s.reminders, r],
        behaviorLog: appendEvent(s.behaviorLog, {
          type: "created",
          title: r.title,
          tag: r.tag,
          icon: r.icon,
          when: r.when,
          at: Date.now(),
        }),
      };
    });
  }, []);

  // Atomically add a parent reminder + its kept children. Also records
  // a cluster_decision event capturing which child tags were kept vs
  // dropped from the LLM's original proposal, so future similar
  // constellations can be biased toward what the user actually wants.
  const addCluster = useCallback(
    ({ parent, children, droppedChildren = [] }) => {
      setState((s) => {
        const clusterId = `c_${nextId()}`;
        const parentR = buildReminder({ ...parent, clusterId, kind: "parent" });
        const childR = (children ?? []).map((c, i) =>
          buildReminder({
            ...c,
            clusterId,
            parentId: parentR.id,
            kind: "child",
            id: nextId(),
          }),
        );
        let log = appendEvent(s.behaviorLog, {
          type: "cluster_created",
          title: parentR.title,
          tag: parentR.tag,
          icon: parentR.icon,
          when: parentR.when,
          childrenCount: childR.length,
          at: Date.now(),
        });
        log = appendEvent(log, {
          type: "cluster_decision",
          parentTitle: parentR.title,
          parentTag: parentR.tag,
          kept: (children ?? []).map((c) => c.tag),
          dropped: (droppedChildren ?? []).map((c) => c.tag),
          at: Date.now(),
        });
        return {
          ...s,
          reminders: [...s.reminders, parentR, ...childR],
          behaviorLog: log,
        };
      });
    },
    [],
  );

  // Patch an existing reminder (e.g. reschedule it to a new time/when).
  // Logs a 'rescheduled' event so behavior aggregation can learn from it.
  // When the time changes, also rewrites any time mention inside the
  // title so it doesn't go stale (e.g. "Pillola alle 8:00." → "13:00.").
  const updateReminder = useCallback((id, patch) => {
    setState((s) => {
      const r = s.reminders.find((x) => x.id === id);
      if (!r) return s;
      const updated = { ...r, ...patch };
      if ("time" in patch) updated.when = whenFor(patch.time);
      if (
        !patch.title &&
        patch.time &&
        r.time &&
        patch.time !== r.time &&
        r.title
      ) {
        const rewritten = rewriteTimeInTitle(r.title, r.time, patch.time);
        if (rewritten !== r.title) updated.title = rewritten;
      }
      return {
        ...s,
        reminders: s.reminders.map((x) => (x.id === id ? updated : x)),
        behaviorLog: appendEvent(s.behaviorLog, {
          type: "rescheduled",
          reminderId: r.id,
          title: r.title,
          tag: r.tag,
          icon: r.icon,
          from: { time: r.time, when: r.when },
          to: { time: updated.time, when: updated.when },
          at: Date.now(),
        }),
      };
    });
  }, []);

  // Remove past snooze events for a given title — used after the user
  // moves a reminder so the "spesso saltato" badge resets.
  const clearSkipsForTitle = useCallback((title) => {
    setState((s) => ({
      ...s,
      behaviorLog: s.behaviorLog.filter(
        (e) => !(e.type === "snooze" && e.title === title),
      ),
    }));
  }, []);

  const setPref = useCallback((key, value) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } }));
  }, []);

  const setProfile = useCallback((patch) => {
    setState((s) => ({
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
    setState((s) => ({
      ...s,
      prefs: {
        ...s.prefs,
        onboarded: false,
        profileDone: false,
        themeChosen: false,
      },
    }));
  }, []);

  // Clear reminders only (keeps behavior log so the LLM keeps patterns).
  const clearReminders = useCallback(() => {
    setState((s) => ({ ...s, reminders: [] }));
  }, []);

  // Wipe just the behavior log (for the user; settings affordance).
  const clearBehaviorLog = useCallback(() => {
    setState((s) => ({ ...s, behaviorLog: [] }));
  }, []);

  const restoreReminder = useCallback((reminder) => {
    setState((s) => {
      const eventIndex = s.behaviorLog.findLastIndex(
        (e) => e.reminderId === reminder.id,
      );
      return {
        ...s,
        reminders: s.reminders.map((r) =>
          r.id === reminder.id ? reminder : r,
        ),
        behaviorLog: s.behaviorLog.filter((_, index) => index !== eventIndex),
      };
    });
  }, []);

  const preparePlanChange = (original, draft) =>
    savedPlanChange(original, draft, nextId);
  const commitChange = (change) => {
    if (!canApplyChange(state.reminders, change)) return false;
    setState((s) => {
      const reminders = applyChange(s.reminders, change);
      return reminders === s.reminders ? s : { ...s, reminders };
    });
    return true;
  };

  return {
    state,
    preparePlanChange,
    commitChange,
    storageError,
    restoreReminder,
    toggleDone,
    snooze,
    addReminder,
    addCluster,
    updateReminder,
    clearSkipsForTitle,
    setPref,
    setProfile,
    reset,
    resetOnboarding,
    clearReminders,
    clearBehaviorLog,
  };
}
