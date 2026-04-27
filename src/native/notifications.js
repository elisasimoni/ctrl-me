// Notifications wrapper.
// - Native (Capacitor): LocalNotifications — works even when app is in background.
// - Web: Notification API — only while the browser is open.

import { isNative } from './platform.js';

export async function requestPermission() {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function scheduleNotification({ id, title, body, at }) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(at) },
        sound: undefined,
        smallIcon: 'ic_stat_icon_config_sample',
      }],
    });
    return;
  }
  // Web fallback — schedule via setTimeout (works only while page is open)
  const delay = new Date(at).getTime() - Date.now();
  if (delay < 0) return;
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.svg' });
    }
  }, delay);
}

export async function cancelNotification(id) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }
  // Web: no easy cancel for setTimeout — acceptable for now
}

export async function scheduleWeatherNudge({ rainProbability, temp, lang }) {
  const granted = await requestPermission();
  if (!granted) return;

  const title = lang === 'it' ? 'Ombrello. Fidati.' : 'Umbrella. Trust me.';
  const body = lang === 'it'
    ? `Pioggia al ${rainProbability}% nelle prossime ore. ${temp}°C fuori.`
    : `Rain at ${rainProbability}% in the next few hours. ${temp}°C outside.`;

  await scheduleNotification({
    id: 9001,
    title,
    body,
    at: Date.now() + 1000, // immediate nudge
  });
}
