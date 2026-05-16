import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../i18n.jsx';
import { Pebble } from '../atoms.jsx';

// Visual tokens per direction
const T = {
  A: {
    bg: '#0a0a0a', ink: '#f5f5f2', dim: 'rgba(245,245,242,0.55)',
    hair: 'rgba(245,245,242,0.16)', accent: '#f5f5f2',
    fontTitle: "'JetBrains Mono', monospace",
    fontBody: "'JetBrains Mono', monospace",
    titleLetter: '-0.01em', titleWeight: 600,
  },
  B: {
    bg: '#f4f1ec', ink: '#0d0d0d', dim: 'rgba(13,13,13,0.55)',
    hair: 'rgba(13,13,13,0.14)', accent: '#0d0d0d',
    fontTitle: "'Inter Tight', sans-serif",
    fontBody: "'Geist', system-ui, sans-serif",
    titleLetter: '-0.03em', titleWeight: 600,
  },
};

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const AREAS = ['study', 'health', 'social', 'work', 'home', 'habits'];

export function OnboardingQuestionnaire({ dir = 'B', profile, setProfile, onDone }) {
  const { t } = useT();
  const tok = T[dir];
  const [step, setStep] = useState(0); // 0 = intro, 1..11 = questions, 12 = done
  const total = 11;
  const wrapRef = useRef(null);

  const next = () => setStep(s => Math.min(s + 1, 12));
  const back = () => setStep(s => Math.max(s - 1, 0));

  // Swipe gestures
  const startX = useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) next();
      else back();
    }
    startX.current = null;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderStep = () => {
    if (step === 0) return <Intro tok={tok} onStart={next} />;
    if (step === 12) return <Done tok={tok} name={profile.name} onDone={onDone} />;
    return <Question step={step} tok={tok} profile={profile} setProfile={setProfile} />;
  };

  const showFooter = step > 0 && step < 12;

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'absolute', inset: 0, background: tok.bg, color: tok.ink,
        fontFamily: tok.fontBody, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {showFooter && <ProgressBar tok={tok} step={step} total={total} />}

      <div key={step} className="ctrl-fadein" style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {renderStep()}
      </div>

      {showFooter && <Footer tok={tok} step={step} total={total} onBack={back} onNext={next} />}
    </div>
  );
}

function ProgressBar({ tok, step, total }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '18px 20px 0',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 2, borderRadius: 2,
          background: i < step ? tok.ink : tok.hair,
          transition: 'background .25s',
        }} />
      ))}
    </div>
  );
}

function Footer({ tok, step, total, onBack, onNext }) {
  const { t } = useT();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 22px',
    }}>
      <button onClick={onBack} disabled={step === 1} style={{
        ...linkStyle(tok), opacity: step === 1 ? 0.25 : 0.7,
      }}>← {t('q.back')}</button>

      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, letterSpacing: '0.12em', color: tok.dim, textTransform: 'uppercase',
      }}>{t('q.progress', { n: step, total })}</span>

      <button onClick={onNext} style={{
        ...linkStyle(tok), fontWeight: 600,
      }}>{step === total ? t('q.done.cta') : t('q.next')} →</button>
    </div>
  );
}

function linkStyle(tok) {
  return {
    background: 'none', border: 'none', color: tok.ink,
    fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
    padding: '6px 8px', letterSpacing: '0.02em',
  };
}

function Intro({ tok, onStart }) {
  const { t } = useT();
  return (
    <div style={pageStyle()}>
      <div style={{ marginBottom: 28 }}>
        <Pebble size={72} eyes="open" />
      </div>
      <h1 style={titleStyle(tok)}>{t('q.intro.title')}</h1>
      <p style={subStyle(tok)}>{t('q.intro.sub')}</p>
      <button onClick={onStart} style={primaryBtn(tok)}>{t('q.intro.cta')}</button>
    </div>
  );
}

function Done({ tok, name, onDone }) {
  const { t } = useT();
  return (
    <div style={pageStyle()}>
      <div style={{ marginBottom: 28 }}>
        <Pebble size={72} eyes="closed" />
      </div>
      <h1 style={titleStyle(tok)}>
        {name ? `${t('q.done.title')} ${name}.` : t('q.done.title')}
      </h1>
      <p style={subStyle(tok)}>{t('q.done.sub')}</p>
      <button onClick={onDone} style={primaryBtn(tok)}>{t('q.done.cta')}</button>
    </div>
  );
}

function Question({ step, tok, profile, setProfile }) {
  const { t } = useT();
  const title = t(`q.${step}.title`);
  const sub = canTranslate(t, `q.${step}.sub`);

  return (
    <div style={pageStyle()}>
      <h1 style={titleStyle(tok)}>{title}</h1>
      {sub && <p style={subStyle(tok)}>{sub}</p>}
      <div style={{ marginTop: 18, width: '100%', maxWidth: 380 }}>
        {renderInput(step, tok, profile, setProfile, t)}
      </div>
    </div>
  );
}

function canTranslate(t, key) {
  const v = t(key);
  return v && v !== key ? v : null;
}

function renderInput(step, tok, profile, setProfile, t) {
  switch (step) {
    case 1: return <TextInput tok={tok} value={profile.name}
      placeholder={t('q.1.placeholder')} onChange={v => setProfile({ name: v })} />;
    case 2: return <Choice tok={tok} value={profile.tone || 'buddy'} onChange={v => setProfile({ tone: v })}
      options={[
        { v: 'chill', label: t('q.2.opt.chill') },
        { v: 'buddy', label: t('q.2.opt.buddy') },
        { v: 'hype',  label: t('q.2.opt.hype') },
      ]} />;
    case 3: return <Choice tok={tok} value={profile.directTone ? 'y' : 'n'}
      onChange={v => setProfile({ directTone: v === 'y' })}
      options={[
        { v: 'y', label: t('q.3.yes') },
        { v: 'n', label: t('q.3.no') },
      ]} />;
    case 4: return <HourPair tok={tok} profile={profile} setProfile={setProfile} t={t} />;
    case 5: return <Choice tok={tok} value={profile.occupation} onChange={v => setProfile({ occupation: v })}
      options={[
        { v: 'student', label: t('q.5.opt.student') },
        { v: 'work',    label: t('q.5.opt.work') },
        { v: 'both',    label: t('q.5.opt.both') },
        { v: 'other',   label: t('q.5.opt.other') },
      ]} />;
    case 6: return <MultiPills tok={tok} values={profile.noWorkDays}
      onToggle={v => setProfile({ noWorkDays: toggle(profile.noWorkDays, v) })}
      options={DAYS.map(d => ({ v: d, label: t(`q.6.${d}`) }))} />;
    case 7: return <MultiChoice tok={tok} values={profile.areas}
      onToggle={v => setProfile({ areas: toggle(profile.areas, v) })}
      options={AREAS.map(a => ({ v: a, label: t(`q.7.${a}`) }))} />;
    case 8: return <Choice tok={tok} value={profile.onSkip} onChange={v => setProfile({ onSkip: v })}
      options={[
        { v: 'repropose', label: t('q.8.repropose') },
        { v: 'ask',       label: t('q.8.ask') },
        { v: 'archive',   label: t('q.8.archive') },
      ]} />;
    case 9: return <Choice tok={tok} value={profile.insistence} onChange={v => setProfile({ insistence: v })}
      options={[
        { v: 'zero', label: t('q.9.zero') },
        { v: 'soft', label: t('q.9.soft') },
        { v: 'hard', label: t('q.9.hard') },
      ]} />;
    case 10: return <Choice tok={tok} value={profile.eveningCheckin ? 'y' : 'n'}
      onChange={v => setProfile({ eveningCheckin: v === 'y' })}
      options={[
        { v: 'y', label: t('q.10.yes') },
        { v: 'n', label: t('q.10.no') },
      ]} />;
    case 11: return <Toggles tok={tok}
      items={[
        { key: 'permWeather',  label: t('q.11.weather'),  value: profile.permWeather },
        { key: 'permLocation', label: t('q.11.location'), value: profile.permLocation },
        { key: 'permCalendar', label: t('q.11.calendar'), value: profile.permCalendar },
      ]}
      onToggle={(k) => setProfile({ [k]: !profile[k] })}
    />;
    default: return null;
  }
}

function toggle(arr, v) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

// ─── input atoms ────────────────────────────────────────────

function TextInput({ tok, value, placeholder, onChange }) {
  return (
    <input
      autoFocus
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

function Choice({ tok, value, onChange, options }) {
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

function MultiChoice({ tok, values, onToggle, options }) {
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

function MultiPills({ tok, values, onToggle, options }) {
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

function HourPair({ tok, profile, setProfile, t }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <HourPicker tok={tok} label={t('q.4.wake')} value={profile.wakeHour}
        onChange={v => setProfile({ wakeHour: v })} />
      <HourPicker tok={tok} label={t('q.4.sleep')} value={profile.sleepHour}
        onChange={v => setProfile({ sleepHour: v })} />
    </div>
  );
}

function HourPicker({ tok, label, value, onChange }) {
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

function Toggles({ tok, items, onToggle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <button key={it.key} onClick={() => onToggle(it.key)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 4px',
          borderTop: i === 0 ? 'none' : `1px solid ${tok.hair}`,
          background: 'transparent', border: 'none',
          borderBottom: i === items.length - 1 ? `1px solid ${tok.hair}` : 'none',
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

// ─── shared layout helpers ──────────────────────────────

function pageStyle() {
  return {
    flex: 1, padding: '20px 24px 24px',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'flex-start',
    overflow: 'auto',
  };
}

function titleStyle(tok) {
  return {
    fontFamily: tok.fontTitle, fontSize: 28, fontWeight: tok.titleWeight,
    letterSpacing: tok.titleLetter, lineHeight: 1.15,
    margin: '0 0 10px', color: tok.ink,
  };
}

function subStyle(tok) {
  return {
    fontFamily: tok.fontBody, fontSize: 14, lineHeight: 1.5,
    color: tok.dim, margin: '0 0 8px', maxWidth: 380,
  };
}

function primaryBtn(tok) {
  return {
    marginTop: 24,
    padding: '14px 24px', borderRadius: 100,
    background: tok.ink, color: tok.bg, border: 'none',
    fontFamily: tok.fontBody, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', letterSpacing: '-0.01em',
  };
}
