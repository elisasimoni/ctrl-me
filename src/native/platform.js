// Detects whether we're running inside Capacitor (real device) or in the browser.
// All native modules import this and use it to pick the right code path.

export const isNative = () =>
  typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

export const getPlatform = () =>
  typeof window !== 'undefined' ? (window.Capacitor?.getPlatform?.() ?? 'web') : 'web';
