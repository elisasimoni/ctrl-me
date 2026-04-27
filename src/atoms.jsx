// Shared atoms: logo, icons, pebble mascot, pills.

export function CtrlMark({ size = 18, color = 'currentColor', mono = true }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.28,
      fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter Tight', sans-serif",
      fontWeight: 700, fontSize: size, color, letterSpacing: '-0.02em', lineHeight: 1,
    }}>
      <span style={{
        border: `1.5px solid ${color}`, borderRadius: size * 0.22,
        padding: `${size * 0.06}px ${size * 0.32}px`,
        fontSize: size * 0.7, lineHeight: 1, letterSpacing: '0.04em', fontWeight: 600,
      }}>CTRL</span>
      <span style={{ fontWeight: 700, fontSize: size * 0.95 }}>+ Me</span>
    </span>
  );
}

export function Icon({ name, size = 16, stroke = 'currentColor', sw = 1.5 }) {
  const p = { fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const v = `0 0 24 24`;
  switch (name) {
    case 'umbrella':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M3 12a9 9 0 0118 0H3z"/><path {...p} d="M12 3v0M12 12v7a3 3 0 003 3"/></svg>;
    case 'pill':
      return <svg width={size} height={size} viewBox={v}><rect {...p} x="2" y="9" width="20" height="6" rx="3"/><path {...p} d="M12 9v6"/></svg>;
    case 'pin':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle {...p} cx="12" cy="9" r="2.5"/></svg>;
    case 'wallet':
      return <svg width={size} height={size} viewBox={v}><rect {...p} x="3" y="6" width="18" height="13" rx="2"/><path {...p} d="M16 12h2"/></svg>;
    case 'sun':
      return <svg width={size} height={size} viewBox={v}><circle {...p} cx="12" cy="12" r="4"/><path {...p} d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></svg>;
    case 'moon':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z"/></svg>;
    case 'check':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M5 12.5l4.5 4.5L19 7"/></svg>;
    case 'plus':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M12 5v14M5 12h14"/></svg>;
    case 'arrow':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-left':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'bolt':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>;
    case 'eye':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle {...p} cx="12" cy="12" r="3"/></svg>;
    case 'snooze':
      return <svg width={size} height={size} viewBox={v}><circle {...p} cx="12" cy="13" r="8"/><path {...p} d="M9 10h6l-6 6h6"/></svg>;
    case 'mic':
      return <svg width={size} height={size} viewBox={v}><rect {...p} x="9" y="3" width="6" height="12" rx="3"/><path {...p} d="M5 11a7 7 0 0014 0M12 18v3"/></svg>;
    case 'cloud':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M7 18a4 4 0 010-8 6 6 0 0111.5 1.5A4 4 0 0117 18H7z"/></svg>;
    case 'rain':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M7 14a4 4 0 010-8 6 6 0 0111.5 1.5A4 4 0 0117 14H7z"/><path {...p} d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/></svg>;
    case 'spark':
      return <svg width={size} height={size} viewBox={v}><path {...p} d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/></svg>;
    case 'settings':
      return <svg width={size} height={size} viewBox={v}><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    default:
      return null;
  }
}

export function APill({ children, dark = true, accent = false }) {
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999,
      fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: accent ? (dark ? '#000' : '#fff') : (dark ? '#fff' : '#000'),
      background: accent ? (dark ? '#fff' : '#000') : 'transparent',
      border: accent ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)'}`,
    }}>{children}</span>
  );
}

export function Pebble({ size = 56, eyes = 'open' }) {
  const eyeY = 0.46;
  const eyeOffset = 0.18;
  const PAPER = '#f4f1ec';
  const INK = '#0d0d0d';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: INK, position: 'relative',
      boxShadow: 'inset -3px -4px 0 rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {eyes === 'open' && (
        <>
          <div style={{
            position: 'absolute', width: size * 0.1, height: size * 0.16,
            background: PAPER, borderRadius: '50%',
            top: size * eyeY, left: size * (0.5 - eyeOffset - 0.05),
          }} />
          <div style={{
            position: 'absolute', width: size * 0.1, height: size * 0.16,
            background: PAPER, borderRadius: '50%',
            top: size * eyeY, left: size * (0.5 + eyeOffset - 0.05),
          }} />
        </>
      )}
      {eyes === 'closed' && (
        <>
          <div style={{
            position: 'absolute', width: size * 0.14, height: 2,
            background: PAPER, borderRadius: 2,
            top: size * (eyeY + 0.07), left: size * (0.5 - eyeOffset - 0.07),
          }} />
          <div style={{
            position: 'absolute', width: size * 0.14, height: 2,
            background: PAPER, borderRadius: 2,
            top: size * (eyeY + 0.07), left: size * (0.5 + eyeOffset - 0.07),
          }} />
        </>
      )}
    </div>
  );
}

export function ADotGrid({ opacity = 0.05, ink = '#f5f5f2' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(${ink} 0.7px, transparent 0.7px)`,
      backgroundSize: '14px 14px',
      opacity,
      maskImage: 'radial-gradient(ellipse at 50% 30%, #000 30%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 30%, transparent 80%)',
    }} />
  );
}
