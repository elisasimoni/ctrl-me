// Where the Anthropic key comes from.
//
// Two sources, in order:
//  1. localStorage — pasted by whoever is using the app (the public demo path:
//     the deployed build ships no key, so each visitor brings their own).
//  2. VITE_ANTHROPIC_API_KEY — a build-time env var, for local development.
//
// Both are client-side, so both are prototype-only: a bundled key is visible
// to anyone who opens devtools. A real deployment puts the key behind a
// server route (/api/analyze) and this module goes away.

const KEY = 'ctrlme.apikey.v1';
const PLACEHOLDER = 'sk-ant-...';

const listeners = new Set();

export function getApiKey() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
  } catch { /* private mode — fall through to the env var */ }

  const fromEnv = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return fromEnv && fromEnv !== PLACEHOLDER ? fromEnv : null;
}

export function setApiKey(value) {
  const trimmed = value.trim();
  try {
    if (trimmed) localStorage.setItem(KEY, trimmed);
    else localStorage.removeItem(KEY);
  } catch { /* nothing we can do; the app still works without a key */ }
  listeners.forEach(fn => fn());
}

export function clearApiKey() { setApiKey(''); }

// True when a key was pasted in-app (as opposed to baked in at build time) —
// the Settings screen uses this to offer a "remove" button.
export function hasStoredKey() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

// Lets the LLM client drop its cached instance when the key changes.
export function onApiKeyChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
