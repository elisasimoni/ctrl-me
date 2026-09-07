// Notifications wrapper.
// - Native (Capacitor): LocalNotifications — works even when the app is killed.
// - Web: Notification API + setTimeout — only while the tab/PWA is open.

import { isNative } from './platform.js';

// ─── permission ────────────────────────────────────────────
let cachedPermission = null;

export async function ensurePermission() {
  if (cachedPermission !== null) return cachedPermission;
  try {
    if (isNative()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      cachedPermission = result.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        cachedPermission = result === 'granted';
      } else {
        cachedPermission = Notification.permission === 'granted';
      }
    } else {
      cachedPermission = false;
    }
  } catch {
    cachedPermission = false;
  }
  return cachedPermission;
}

export const requestPermission = ensurePermission;
export function getPermissionState() { return cachedPermission; }

// ─── id / time helpers ────────────────────────────────────
const MAX_INT32 = 2147483647;
export function notifIdFor(id) {
  const n = Math.abs(Number(id) || 0) % MAX_INT32;
  return n === 0 ? 1 : n;
}

// Next firing Date for a reminder. Null if no time.
export function nextFireForReminder(reminder) {
  if (!reminder?.time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(reminder.time);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const now = new Date();
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  if (at.getTime() <= now.getTime() + 5000) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

// True if the reminder is a daily-recurring one (tag or title hint).
export function isDailyReminder(reminder) {
  const blob = `${reminder?.tag || ''} ${reminder?.title || ''}`.toUpperCase();
  return /OGNI GIORNO|EVERY ?DAY|DAILY|GIORNALIE/.test(blob);
}

// Push a timestamp out of the user's sleep window. If `at` falls
// during the quiet hours [sleepHour, wakeHour), advance to wakeHour.
// Handles wrap (sleep 23, wake 8: quiet is 23–24 + 0–8).
export function applyQuietHours(at, wakeHour, sleepHour) {
  if (typeof wakeHour !== 'number' || typeof sleepHour !== 'number') return at;
  if (wakeHour === sleepHour) return at; // pathological: no quiet window
  const d = new Date(at);
  const h = d.getHours();
  const wraps = sleepHour > wakeHour;
  const inQuiet = wraps
    ? (h >= sleepHour || h < wakeHour)
    : (h >= sleepHour && h < wakeHour);
  if (!inQuiet) return at;
  const adjusted = new Date(d);
  if (wraps && h >= sleepHour) adjusted.setDate(adjusted.getDate() + 1);
  adjusted.setHours(wakeHour, 0, 0, 0);
  return adjusted.getTime();
}

// ─── action types (lock-screen quick actions on Android) ──
let actionTypesRegistered = false;
let actionListenerRemove = null;

export async function registerNotificationActions({ doneLabel, snoozeLabel } = {}) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'REMINDER_ACTIONS',
        actions: [
          { id: 'done',   title: doneLabel ?? 'Done' },
          { id: 'snooze', title: snoozeLabel ?? 'Snooze' },
        ],
      }],
    });
    if (actionListenerRemove) {
      try { actionListenerRemove.remove(); } catch {}
      actionListenerRemove = null;
    }
    actionListenerRemove = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const detail = {
          actionId: event.actionId,
          reminderId: event.notification?.extra?.reminderId,
        };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ctrlme.notif.action', { detail }));
        }
      }
    );
    actionTypesRegistered = true;
  } catch {
    // not running on a device — silently no-op
  }
}

// ─── low level schedule / cancel ──────────────────────────

async function rawSchedule({ id, title, body, at, repeats, extra }) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const notification = {
      id,
      title,
      body,
      schedule: { at: new Date(at) },
      smallIcon: 'ic_stat_icon_config_sample',
    };
    if (repeats) {
      notification.schedule.repeats = true;
      notification.schedule.every = 'day';
    }
    if (actionTypesRegistered) {
      notification.actionTypeId = 'REMINDER_ACTIONS';
    }
    if (extra) notification.extra = extra;
    await LocalNotifications.schedule({ notifications: [notification] });
    return;
  }
  // Web fallback — setTimeout, dies when page closes. No repeats.
  const delay = at - Date.now();
  if (delay < 0) return;
  setTimeout(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icon.svg`, tag: String(id) });
  }, delay);
}

async function rawCancel(id) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }
}

export async function scheduleNotification(args) { return rawSchedule(args); }
export async function cancelNotification(id) { return rawCancel(id); }

// ─── high level: reminder-centric API ─────────────────────

export async function scheduleReminder(reminder, profile) {
  if (!reminder || reminder.done) return false;
  const baseAt = nextFireForReminder(reminder);
  if (!baseAt) return false;
  const at = applyQuietHours(
    baseAt.getTime(),
    profile?.wakeHour,
    profile?.sleepHour,
  );
  const granted = await ensurePermission();
  if (!granted) return false;
  await rawSchedule({
    id: notifIdFor(reminder.id),
    title: reminder.title || 'CTRL+Me',
    body: reminder.body || '',
    at,
    repeats: isDailyReminder(reminder),
    extra: { reminderId: reminder.id },
  });
  return true;
}

export async function cancelReminder(reminder) {
  if (!reminder) return;
  await rawCancel(notifIdFor(reminder.id));
}

// ─── weather nudge (existing demo) ────────────────────────

export async function scheduleWeatherNudge({ rainProbability, temp, lang }) {
  const granted = await ensurePermission();
  if (!granted) return;
  const title = lang === 'it' ? 'Ombrello. Fidati.' : 'Umbrella. Trust me.';
  const body = lang === 'it'
    ? `Pioggia al ${rainProbability}% nelle prossime ore. ${temp}°C fuori.`
    : `Rain at ${rainProbability}% in the next few hours. ${temp}°C outside.`;
  await rawSchedule({ id: 9001, title, body, at: Date.now() + 1000 });
}
