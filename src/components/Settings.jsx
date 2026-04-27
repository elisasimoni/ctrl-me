import React from 'react';
import { useT } from '../i18n.jsx';

export function Settings({ open, onClose, store }) {
  const { t, lang, setLang } = useT();
  if (!open) return null;
  const { state, setPref, reset } = store;
  const isDark = state.prefs.direction === 'A';

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-start',
    }}>
      <div onClick={e => e.stopPropagation()} className="ctrl-fadein" style={{
        width: '100%',
        background: isDark ? '#0a0a0a' : '#f4f1ec',
        color: isDark ? '#f5f5f2' : '#0d0d0d',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        padding: '60px 22px 28px',
        maxHeight: '90%', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div className={isDark ? 'mono' : 'tight'} style={{
            fontSize: isDark ? 12 : 24, fontWeight: isDark ? 600 : 700,
            letterSpacing: isDark ? '0.18em' : '-0.03em',
            textTransform: isDark ? 'uppercase' : 'none',
          }}>
            {isDark ? t('settings.title.a') : t('settings.title.b')}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
            fontSize: 28, padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        <Section label={t('settings.theme')} isDark={isDark}>
          <Toggle
            isDark={isDark}
            options={[
              { v: 'A', label: isDark ? t('settings.theme.a') : t('settings.theme.a.lc') },
              { v: 'B', label: isDark ? t('settings.theme.b') : t('settings.theme.b.lc') },
            ]}
            value={state.prefs.direction}
            onChange={v => setPref('direction', v)}
          />
        </Section>

        <Section label={t('settings.language')} isDark={isDark}>
          <Toggle
            isDark={isDark}
            options={[
              { v: 'en', label: t('settings.lang.en') },
              { v: 'it', label: t('settings.lang.it') },
            ]}
            value={lang}
            onChange={setLang}
          />
        </Section>

        <Section label={t('settings.personality')} isDark={isDark}>
          <Toggle
            isDark={isDark}
            options={[
              { v: 'chill', label: t('settings.chill') },
              { v: 'buddy', label: t('settings.buddy') },
              { v: 'hype',  label: t('settings.hype') },
            ]}
            value={state.prefs.personality}
            onChange={v => setPref('personality', v)}
          />
        </Section>

        <button onClick={() => { reset(); onClose(); }} className={isDark ? 'mono' : 'tight'} style={{
          width: '100%', marginTop: 28, height: 48,
          borderRadius: isDark ? 10 : 100,
          border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1.5px solid rgba(0,0,0,0.12)',
          background: 'transparent', color: 'inherit', cursor: 'pointer',
          fontSize: isDark ? 12 : 14, fontWeight: 600,
          letterSpacing: isDark ? '0.08em' : '-0.01em',
          textTransform: isDark ? 'uppercase' : 'none',
        }}>
          {t('settings.reset')}
        </button>
      </div>
    </div>
  );
}

function Section({ label, isDark, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className={isDark ? 'mono' : 'tight'} style={{
        fontSize: isDark ? 10.5 : 12,
        color: isDark ? 'rgba(245,245,242,0.5)' : 'rgba(13,13,13,0.55)',
        letterSpacing: isDark ? '0.18em' : '0.04em',
        textTransform: 'uppercase', marginBottom: 8,
        fontWeight: 600,
      }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ options, value, onChange, isDark }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      borderRadius: isDark ? 10 : 100,
      background: isDark ? 'rgba(245,245,242,0.06)' : 'rgba(0,0,0,0.05)',
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
    }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} className={isDark ? 'mono' : 'tight'} style={{
          flex: 1, height: 40,
          borderRadius: isDark ? 8 : 100,
          border: 'none', cursor: 'pointer',
          background: value === o.v
            ? (isDark ? '#f5f5f2' : '#0d0d0d')
            : 'transparent',
          color: value === o.v
            ? (isDark ? '#0a0a0a' : '#f4f1ec')
            : 'inherit',
          fontSize: isDark ? 11 : 13, fontWeight: 600,
          letterSpacing: isDark ? '0.06em' : '-0.01em',
          transition: 'all .2s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}
