import React from 'react';

// Visual tokens per direction — shared by onboarding questionnaire and Settings.
export const TOKENS = {
  A: {
    bg: '#0a0a0a', ink: '#f5f5f2', dim: 'rgba(245,245,242,0.55)',
    hair: 'rgba(245,245,242,0.16)',
    fontTitle: "'JetBrains Mono', monospace",
    fontBody: "'JetBrains Mono', monospace",
    titleLetter: '-0.01em', titleWeight: 600,
  },
  B: {
    bg: '#f4f1ec', ink: '#0d0d0d', dim: 'rgba(13,13,13,0.55)',
    hair: 'rgba(13,13,13,0.14)',
    fontTitle: "'Inter Tight', sans-serif",
    fontBody: "'Geist', system-ui, sans-serif",
    titleLetter: '-0.03em', titleWeight: 600,
  },
};

export function toggleInArray(arr, v) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

export function TextInput({ tok, value, placeholder, onChange, autoFocus = false }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'transparent',
        border: 'none', borderBottom: `1.5px solid ${tok.hair}`,
        outline: 'none', color: tok.ink,
        fontFamily: tok.fontTitle, fontSize: 22,
        padding: '12px 4px', letterSpacing: tok.titleLetter,
      }}
      onFocus={e => e.target.style.borderBottomColor = tok.ink}
      onBlur={e => e.target.style.borderBottomColor = tok.hair}
    />
  );
}

export function Choice({ tok, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          textAlign: 'left', padding: '14px 16px',
          borderRadius: 14,
          border: `1.5px solid ${value === o.v ? tok.ink : tok.hair}`,
          background: value === o.v ? tok.ink : 'transparent',
          color: value === o.v ? tok.bg : tok.ink,
          fontFamily: tok.fontBody, fontSize: 15,
          cursor: 'pointer', transition: 'all .15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

export function MultiChoice({ tok, values, onToggle, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map(o => {
        const on = values.includes(o.v);
        return (
          <button key={o.v} onClick={() => onToggle(o.v)} style={{
            textAlign: 'left', padding: '14px 16px',
            borderRadius: 14,
            border: `1.5px solid ${on ? tok.ink : tok.hair}`,
            background: on ? tok.ink : 'transparent',
            color: on ? tok.bg : tok.ink,
            fontFamily: tok.fontBody, fontSize: 15,
            cursor: 'pointer', transition: 'all .15s',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{o.label}</span>
            <span style={{ fontSize: 18, opacity: on ? 1 : 0.3 }}>{on ? '✓' : '+'}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiPills({ tok, values, onToggle, options }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const on = values.includes(o.v);
        return (
          <button key={o.v} onClick={() => onToggle(o.v)} style={{
            padding: '10px 16px', borderRadius: 100,
            border: `1.5px solid ${on ? tok.ink : tok.hair}`,
            background: on ? tok.ink : 'transparent',
            color: on ? tok.bg : tok.ink,
            fontFamily: tok.fontBody, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'all .15s',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function HourPicker({ tok, label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        color: tok.dim, letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>{label}</div>
      <select value={value} onChange={e => onChange(Number(e.target.value))} style={{
        width: '100%', background: 'transparent',
        border: `1.5px solid ${tok.hair}`, borderRadius: 12,
        padding: '12px 14px', color: tok.ink,
        fontFamily: tok.fontTitle, fontSize: 22, fontWeight: 600,
        outline: 'none', cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none',
      }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <option key={i} value={i} style={{ background: tok.bg, color: tok.ink }}>
            {String(i).padStart(2, '0')}:00
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggles({ tok, items, onToggle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <button key={it.key} onClick={() => onToggle(it.key)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 4px',
          borderTop: i === 0 ? 'none' : `1px solid ${tok.hair}`,
          background: 'transparent', border: 'none',
          color: tok.ink, fontFamily: tok.fontBody, fontSize: 15,
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span>{it.label}</span>
          <span style={{
            width: 44, height: 26, borderRadius: 100,
            background: it.value ? tok.ink : tok.hair,
            position: 'relative', transition: 'background .2s',
            flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: 3, left: it.value ? 21 : 3,
              width: 20, height: 20, borderRadius: 100,
              background: tok.bg, transition: 'left .2s',
            }} />
          </span>
        </button>
      ))}
    </div>
  );
}
