import { useEffect, useRef } from "react";
import {
  checkPermission,
  scheduleNotification,
  cancelNotification,
  nextFireForReminder,
  notifIdFor,
  applyQuietHours,
  isDailyReminder,
} from "../native/notifications.js";

// Keeps the OS notification queue in sync with `state.reminders`.
// On every change, diffs the live reminders against what we've
// already scheduled and dispatches schedule/cancel calls so the OS
// fires reminders even when the app is closed (on native) or in
// background (PWA, while open).
//
// Tracks scheduled state in a Map keyed by reminder.id with the
// firingAt timestamp + title + body of the last scheduled version,
// so re-scheduling only happens when something material changes.
export function useReminderNotifications(
  reminders,
  enabled = true,
  profile = null,
) {
  const scheduledRef = useRef(new Map());
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    queueRef.current = queueRef.current
      .catch(() => {})
      .then(async () => {
        if (cancelled) return;
        // Build the set of reminders that SHOULD be scheduled right now.
        // If the user has muted notifications, the set is empty so any
        // previously scheduled ones get cancelled below.
        const wanted = new Map();
        if (enabled) {
          for (const r of reminders ?? []) {
            if (r.done && !isDailyReminder(r)) continue;
            const baseAt = nextFireForReminder(r);
            if (!baseAt) continue;
            // Push out of the user's sleep window if needed.
            const at = applyQuietHours(
              baseAt.getTime(),
              profile?.wakeHour,
              profile?.sleepHour,
            );
            wanted.set(r.id, {
              firingAt: at,
              title: r.title,
              body: r.body,
              repeats: isDailyReminder(r),
            });
          }
        }

        // If nothing to schedule, just clean up any leftovers from prior state
        // — but don't trigger the permission prompt for nothing.
        if (wanted.size === 0) {
          for (const [, prev] of scheduledRef.current) {
            await cancelNotification(prev.notifId);
          }
          scheduledRef.current.clear();
          return;
        }

        for (const [id, prev] of scheduledRef.current) {
          if (!wanted.has(id)) {
            await cancelNotification(prev.notifId);
            scheduledRef.current.delete(id);
          }
        }
        const granted = await checkPermission();
        if (!granted || cancelled) return;

        // Schedule new or materially-changed reminders.
        for (const [id, want] of wanted) {
          const prev = scheduledRef.current.get(id);
          const changed =
            !prev ||
            prev.firingAt !== want.firingAt ||
            prev.title !== want.title ||
            prev.body !== want.body ||
            prev.repeats !== want.repeats;
          if (changed) {
            const nid = notifIdFor(id);
            if (prev) await cancelNotification(prev.notifId);
            await scheduleNotification({
              id: nid,
              title: want.title || "CTRL+Me",
              body: want.body || "",
              at: want.firingAt,
              repeats: want.repeats,
              extra: { reminderId: id },
            });
            scheduledRef.current.set(id, { ...want, notifId: nid });
          }
        }

        // Cancel anything we used to schedule but no longer want.
        for (const [id, prev] of scheduledRef.current) {
          if (!wanted.has(id)) {
            await cancelNotification(prev.notifId);
            scheduledRef.current.delete(id);
          }
        }
      })
      .catch((error) =>
        console.warn("[CTRL+Me] Notification scheduling failed", error),
      );
    return () => {
      cancelled = true;
    };
  }, [
    reminders,
    enabled,
    profile?.wakeHour,
    profile?.sleepHour,
    profile?.notificationRevision,
  ]);
}
