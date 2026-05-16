import { useEffect, useRef } from 'react';
import {
  ensurePermission, scheduleReminder, cancelReminder,
  nextFireForReminder, notifIdFor,
} from '../native/notifications.js';

// Keeps the OS notification queue in sync with `state.reminders`.
// On every change, diffs the live reminders against what we've
// already scheduled and dispatches schedule/cancel calls so the OS
// fires reminders even when the app is closed (on native) or in
// background (PWA, while open).
//
// Tracks scheduled state in a Map keyed by reminder.id with the
// firingAt timestamp + title + body of the last scheduled version,
// so re-scheduling only happens when something material changes.
export function useReminderNotifications(reminders, enabled = true) {
  const scheduledRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Build the set of reminders that SHOULD be scheduled right now.
      // If the user has muted notifications, the set is empty so any
      // previously scheduled ones get cancelled below.
      const wanted = new Map();
      if (enabled) {
        for (const r of reminders ?? []) {
          if (r.done) continue;
          const at = nextFireForReminder(r);
          if (!at) continue;
          wanted.set(r.id, { firingAt: at.getTime(), title: r.title, body: r.body });
        }
      }

      // If nothing to schedule, just clean up any leftovers from prior state
      // — but don't trigger the permission prompt for nothing.
      if (wanted.size === 0) {
        for (const [id] of scheduledRef.current) {
          await cancelReminder({ id });
        }
        scheduledRef.current.clear();
        return;
      }

      const granted = await ensurePermission();
      if (!granted || cancelled) return;

      // Schedule new or materially-changed reminders.
      for (const [id, want] of wanted) {
        const prev = scheduledRef.current.get(id);
        const changed = !prev
          || prev.firingAt !== want.firingAt
          || prev.title !== want.title
          || prev.body !== want.body;
        if (changed) {
          if (prev) await cancelReminder({ id });
          await scheduleReminder({ id, time: extractTimeFromAt(want.firingAt), title: want.title, body: want.body });
          scheduledRef.current.set(id, want);
        }
      }

      // Cancel anything we used to schedule but no longer want.
      for (const [id] of scheduledRef.current) {
        if (!wanted.has(id)) {
          await cancelReminder({ id });
          scheduledRef.current.delete(id);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [reminders, enabled]);
}

// Helper: rebuild the HH:MM time string from a firing timestamp.
// scheduleReminder() expects a reminder shape with .time + computes
// nextFireForReminder internally — but since we've already computed
// the firing moment we need to pass back a `time` that round-trips.
function extractTimeFromAt(at) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
