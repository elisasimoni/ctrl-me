// Geolocation wrapper — Capacitor on device, browser API on web.
// Returns { lat, lon } or throws.

import { isNative } from './platform.js';

export async function getPosition() {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions();
    const pos = await Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: false });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not available')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      e => reject(e),
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
