// Notifications wrapper.
// - Native (Capacitor): LocalNotifications — works even when app is in background.
// - Web: Notification API — only while the tab/PWA is open.
//
// The high-level API used by the rest of the app:
//   scheduleReminder(reminder)  — schedule (or re-schedule) a single OS notif
//   cancelReminder(reminder)    — cancel a previously scheduled notif
//   ensurePermission()          — lazy + cached permission request
//   nextFireForReminder(r)      — derive next firing Date from r.time
//   notifIdFor(reminderId)      — stable int32 derived from reminder.id

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

// Older callers used requestPermission directly.
export const requestPermission = ensurePermission;

export function getPermissionState() {
  return cachedPermission;
}

// ─── reminder ↔ notification ──────────────────────────────

// Capacitor LocalNotifications requires a positive 32-bit integer id.
// reminder.id is Date.now() (~10^12) — too big. Use modulo to fit.
const MAX_INT32 = 2147483647;
export function notifIdFor(id) {
  const n = Math.abs(Number(id) || 0) % MAX_INT32;
  return n === 0 ? 1 : n;
}

// Returns the next firing Date for a reminder, or null if it has no time.
// Interprets reminder.time ("HH:MM") as "the next occurrence of that
// time": today if it hasn't passed yet, otherwise tomorrow.
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
    // Within 5s of now or already past → next day
    at.setDate(at.getDate() + 1);
  }
  return at;
}

// ─── low level schedule / cancel ──────────────────────────

async function rawSchedule({ id, title, body, at }) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(at) },
        smallIcon: 'ic_stat_icon_config_sample',
      }],
    });
    return;
  }
  // Web fallback — setTimeout, dies when page closes.
  const delay = at - Date.now();
  if (delay < 0) return;
  setTimeout(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: '/icon.svg', tag: String(id) });
  }, delay);
}

async function rawCancel(id) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }
  // Web: closing a previously fired toast and unsetting setTimeout isn't
  // worth the complexity — the notification just won't fire if not yet shown.
}

// Back-compat for the existing weather nudge caller.
export async function scheduleNotification(args) { return rawSchedule(args); }
export async function cancelNotification(id) { return rawCancel(id); }

// ─── high level: reminder-centric API ─────────────────────

export async function scheduleReminder(reminder) {
  if (!reminder || reminder.done) return false;
  const at = nextFireForReminder(reminder);
  if (!at) return false;
  const granted = await ensurePermission();
  if (!granted) return false;
  await rawSchedule({
    id: notifIdFor(reminder.id),
    title: reminder.title || 'CTRL+Me',
    body: reminder.body || '',
    at: at.getTime(),
  });
  return true;
}

export async function cancelReminder(reminder) {
  if (!reminder) return;
  await rawCancel(notifIdFor(reminder.id));
}

// ─── weather nudge (existing demo, untouched semantics) ───

export async function scheduleWeatherNudge({ rainProbability, temp, lang }) {
  const granted = await ensurePermission();
  if (!granted) return;

  const title = lang === 'it' ? 'Ombrello. Fidati.' : 'Umbrella. Trust me.';
  const body = lang === 'it'
    ? `Pioggia al ${rainProbability}% nelle prossime ore. ${temp}°C fuori.`
    : `Rain at ${rainProbability}% in the next few hours. ${temp}°C outside.`;

  await rawSchedule({ id: 9001, title, body, at: Date.now() + 1000 });
}
