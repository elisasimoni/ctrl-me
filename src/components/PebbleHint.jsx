import React, { useEffect, useState } from 'react';
import { useT } from '../i18n.jsx';
import { TOKENS } from './ProfileInputs.jsx';

const KEY = 'ctrlme.pebbleHintSeen.v1';

// One-time tooltip nudging the user to tap the Pebble (or its OS-theme
// equivalent, the ONLINE pill). Auto-dismisses after 8s or on any click.
export function PebbleHint({ theme = 'B' }) {
  const { t } = useT();
  const tok = TOKENS[theme];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') return;
    } catch { return; }
    const show = setTimeout(() => setVisible(true), 1200);
    const hide = setTimeout(() => dismiss(), 14000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  // Floats in the safe top area, with a small caret pointing DOWN to
  // the Pebble (DirB) or ONLINE pill (DirA). Horizontally aligned to
  // wherever the target lives.
  const caretLeft = theme === 'A' ? 38 : 14; // align with target center
  const top = 22;
  const left = theme === 'A' ? 14 : 14;

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'absolute', top, left, zIndex: 30,
        pointerEvents: 'auto',
      }}
      className="ctrl-fadein"
    >
      <div style={{
        position: 'relative',
        padding: '8px 14px 10px', borderRadius: 14,
        background: tok.ink, color: tok.bg,
        fontFamily: tok.fontBody, fontSize: 12, fontWeight: 600,
        letterSpacing: '-0.005em',
        maxWidth: 220,
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        cursor: 'pointer',
      }}>
        {t('settings.profile.title')}
      </div>
      {/* Caret pointing DOWN towards the Pebble/pill */}
      <div style={{
        position: 'absolute', bottom: -5, left: caretLeft,
        width: 10, height: 10, background: tok.ink,
        transform: 'rotate(45deg)', borderRadius: 2,
      }} />
    </div>
  );
}
