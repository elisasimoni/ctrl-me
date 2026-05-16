import React, { useState, useEffect, useMemo } from 'react';
import { Icon, APill, ADotGrid } from '../atoms.jsx';
import { useT, formatDate } from '../i18n.jsx';
import { groupReminders } from '../lib/clusters.js';
import { frequentlySkipped } from '../lib/behavior.js';

const BG = '#0a0a0a';
const INK = '#f5f5f2';
const DIM = 'rgba(245,245,242,0.5)';
const HAIR = 'rgba(245,245,242,0.12)';
const DONE = 'rgba(245,245,242,0.32)';

// ─── Onboarding ──────────────────────────────────────────────
export function A_Onboarding({ onDone }) {
  const { t } = useT();
  const [step, setStep] = useState(0);

  const headlineEl = (idx) => {
    const text = t(`a.headline.${idx}`);
    const italic = t(`a.headline.${idx}.italic`);
    if (italic && text.includes(italic)) {
      const parts = text.split(italic);
      return <>{parts[0]}<i>{italic}</i>{parts.slice(1).join(italic).split('\n').map((line, i, arr) => <React.Fragment key={i}>{line}{i < arr.length - 1 && <br/>}</React.Fragment>)}</>;
    }
    return text.split('\n').map((line, i, arr) => <React.Fragment key={i}>{line}{i < arr.length - 1 && <br/>}</React.Fragment>);
  };

  const steps = [0, 1, 2].map(i => ({
    tag: t(`a.boot.${i}`),
    sub: t(`a.sub.${i}`),
    cta: t(`a.cta.${i}`),
  }));
  const s = steps[step];
  const next = () => step < steps.length - 1 ? setStep(step + 1) : onDone?.();

  return (
    <div className="cm-screen" style={{
      background: BG, color: INK, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <ADotGrid />

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '70px 24px 0', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <APill>{s.tag}</APill>
        <span className="mono" style={{ fontSize: 10.5, color: DIM, letterSpacing: '0.1em' }}>
          {String(step + 1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', overflowY: 'auto', padding: '24px 24px 120px' }}>
          <div className="mono" style={{ fontSize: 13, color: DIM, letterSpacing: '0.2em', marginBottom: 14 }}>
            ┌─ CTRL+ME ──────────────┐
          </div>
          <div className="tight ctrl-fadein" key={step} style={{
            fontSize: 36, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.035em', color: INK,
          }}>
            {headlineEl(step)}
            <span className="ctrl-blink" style={{
              display: 'inline-block', width: 14, height: 28, background: INK,
              marginLeft: 6, verticalAlign: '-4px',
            }} />
          </div>
          <div className="mono" style={{ marginTop: 18, fontSize: 13, lineHeight: 1.55, color: DIM, maxWidth: 320 }}>
            {s.sub}
          </div>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {step >= 0 && <APreview delay={0}   icon="rain"   tag={t('a.tag.weather')} text={t('a.preview.weather')} />}
            {step >= 1 && <APreview delay={150} icon="wallet" tag={t('a.tag.budget')}  text={t('a.preview.budget')} />}
            {step >= 2 && <APreview delay={300} icon="pin"    tag={t('a.tag.exam')}    text={t('a.preview.exam')} />}
          </div>
        </div>
        {/* gradient fade above CTA */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 48,
          background: `linear-gradient(180deg, rgba(10,10,10,0) 0%, ${BG} 100%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* CTA */}
      <div style={{ flexShrink: 0, padding: '0 24px 64px' }}>
        <button onClick={next} style={{
          width: '100%', height: 56, borderRadius: 14, border: 'none',
          background: INK, color: BG, cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {s.cta} <Icon name="arrow" size={16} stroke={BG} sw={1.8} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i === step ? INK : HAIR, transition: 'all .25s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function APreview({ icon, tag, text, delay = 0 }) {
  return (
    <div className="ctrl-fadein" style={{
      animationDelay: `${delay}ms`,
      border: `1px solid ${HAIR}`, borderRadius: 10,
      padding: '11px 12px', background: 'rgba(245,245,242,0.02)',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        border: `1px solid ${HAIR}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK,
      }}><Icon name={icon} size={15} /></div>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 9.5, color: DIM, letterSpacing: '0.12em', marginBottom: 2 }}>{tag}</div>
        <div className="mono" style={{ fontSize: 12.5, color: INK, lineHeight: 1.45 }}>{text}</div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────
export function A_Home({ store, onCompose, onSettings }) {
  const { t, lang } = useT();
  const { state, toggleDone, snooze } = store;
  const items = state.reminders;
  const [drag, setDrag] = useState({ id: null, dx: 0, startX: 0 });
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const tm = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(tm);
  }, []);

  const onDown = (id) => (e) => setDrag({ id, dx: 0, startX: e.clientX });
  const onMove = (e) => {
    if (drag.id == null) return;
    const dx = Math.max(-120, Math.min(0, e.clientX - drag.startX));
    setDrag(d => ({ ...d, dx }));
  };
  const onUp = () => {
    if (drag.id == null) return;
    if (drag.dx < -70) snooze(drag.id);
    setDrag({ id: null, dx: 0, startX: 0 });
  };

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const skippedTitles = useMemo(
    () => new Set(frequentlySkipped(state.behaviorLog).map(s => s.title)),
    [state.behaviorLog]
  );

  // EN uses {s}; IT uses {a}.
  const thingsSuffix = total === 1 ? '' : 's';
  const itPlural = total === 1 ? 'a' : 'e';

  return (
    <div className="cm-screen" style={{ background: BG, color: INK, overflow: 'hidden' }}
      onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <ADotGrid opacity={0.04} />

      <div style={{ position: 'absolute', top: 64, left: 22, right: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <APill>{t('a.online')}</APill>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: DIM, letterSpacing: '0.1em' }}>
              {formatDate(lang, time, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </span>
            <button onClick={onSettings} style={{
              background: 'transparent', border: `1px solid ${HAIR}`, borderRadius: 8,
              width: 28, height: 28, color: INK, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="settings" size={13} stroke={INK} /></button>
          </div>
        </div>

        {state.prefs.profile.name && (
          <div className="mono" style={{ fontSize: 11, color: DIM, letterSpacing: '0.04em', marginBottom: 6 }}>
            {`> hello, ${state.prefs.profile.name.toLowerCase()}.`}
          </div>
        )}
        <div className="mono" style={{ fontSize: 11, color: DIM, letterSpacing: '0.18em', marginBottom: 8 }}>
          {t('a.today')}
        </div>
        <div className="tight" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          {t('a.things', { n: total, s: thingsSuffix, a: itPlural })} <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{t('a.notUrgent')}</span>{t('a.urgentSuffix')}
        </div>
        <div className="mono" style={{ fontSize: 12, color: DIM, marginTop: 8, lineHeight: 1.5 }}>
          {pct === 0 && t('a.idle')}
          {pct > 0 && pct < 100 && t('a.progress', { done: doneCount, total })}
          {pct === 100 && total > 0 && t('a.zero')}
        </div>
        <div style={{ marginTop: 14, height: 2, background: HAIR, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: INK, transition: 'width .4s ease' }} />
        </div>
      </div>

      <div className="cm-feed" style={{ position: 'absolute', top: 268, left: 0, right: 0, bottom: 110, overflow: 'auto', padding: '0 16px' }}>
        {groupReminders(items).map(item => {
          const isDone = item.done;
          const dx = drag.id === item.id ? drag.dx : 0;
          const isChild = item._isChild;
          const linkedCount = item._linked || 0;
          return (
            <div key={item.id} style={{
              position: 'relative',
              marginBottom: isChild ? 4 : 8,
              marginLeft: isChild ? 16 : 0,
            }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: INK, color: BG, display: 'flex',
                alignItems: 'center', justifyContent: 'flex-end', paddingRight: 18, gap: 8,
                opacity: dx < -10 ? 1 : 0, transition: 'opacity .15s',
              }}>
                <Icon name="snooze" size={16} stroke={BG} sw={1.8} />
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>SNOOZE</span>
              </div>
              <div
                onPointerDown={onDown(item.id)}
                onClick={() => toggleDone(item.id)}
                style={{
                  position: 'relative', cursor: 'pointer',
                  background: BG, border: `1px solid ${HAIR}`,
                  borderRadius: 12, padding: '14px 14px',
                  display: 'flex', gap: 12,
                  transform: `translateX(${dx}px)`,
                  transition: drag.id === item.id ? 'none' : 'transform .25s ease',
                  userSelect: 'none', touchAction: 'pan-y',
                }}>
                <div style={{ width: 38, flexShrink: 0, paddingTop: 1 }}>
                  <div className="mono" style={{
                    fontSize: 11, color: isDone ? DONE : INK,
                    letterSpacing: '0.05em', fontWeight: 600,
                  }}>{item.time}</div>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  border: `1px solid ${isDone ? DONE : HAIR}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDone ? DONE : INK,
                  background: isDone ? 'transparent' : 'rgba(245,245,242,0.03)',
                }}>
                  {isDone ? <Icon name="check" size={15} sw={2} /> : <Icon name={item.icon} size={15} stroke={INK} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div className="mono" style={{ fontSize: 9.5, color: DIM, letterSpacing: '0.14em' }}>{item.tag}</div>
                    {linkedCount > 0 && (
                      <span className="mono" style={{
                        padding: '1px 6px', borderRadius: 4,
                        background: INK, color: BG,
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      }}>+{linkedCount}</span>
                    )}
                  </div>
                  <div className="tight" style={{
                    fontSize: isChild ? 15 : 17, fontWeight: 600, lineHeight: 1.2,
                    color: isDone ? DONE : INK,
                    textDecoration: isDone ? 'line-through' : 'none', textDecorationThickness: 1,
                  }}>{item.title}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: isDone ? DONE : DIM, marginTop: 4, lineHeight: 1.45 }}>
                    {item.body}
                  </div>
                  {!isDone && skippedTitles.has(item.title) && (
                    <div className="mono" style={{
                      marginTop: 5, fontSize: 9.5, color: DIM,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                    }}>↺ {t('behavior.oftenSkipped')}</div>
                  )}
                </div>
                <div className={isDone ? 'ctrl-pop' : ''} style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${isDone ? INK : HAIR}`,
                  background: isDone ? INK : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}>
                  {isDone && <Icon name="check" size={12} stroke={BG} sw={2.5} />}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="mono" style={{ textAlign: 'center', color: DIM, fontSize: 12, padding: 40 }}>
            {t('home.empty.a')}
          </div>
        )}
        <div className="mono" style={{
          textAlign: 'center', fontSize: 10.5, color: DIM, padding: '14px 0 6px', letterSpacing: '0.15em',
        }}>{t('a.feedFooter')}</div>
      </div>

      <div style={{
        position: 'absolute', bottom: 38, left: 22, right: 22,
        height: 56, borderRadius: 16, background: INK, color: BG,
        display: 'flex', alignItems: 'center', padding: '0 18px',
        cursor: 'pointer',
      }} onClick={onCompose}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', flex: 1 }}>
          {t('home.compose.a')}<span className="ctrl-blink" style={{
            display: 'inline-block', width: 7, height: 14, background: BG, marginLeft: 4, verticalAlign: '-2px',
          }} />
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mic" size={16} stroke={BG} />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={18} stroke={INK} sw={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification (lockscreen demo) ─────────────────────────
export function A_Notification({ onDismiss }) {
  const { t, lang } = useT();
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="cm-screen" style={{ background: '#000', color: INK, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, #1a1a1a 0%, #050505 60%)',
      }} />
      <ADotGrid opacity={0.025} />

      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 13, color: DIM, letterSpacing: '0.25em' }}>
          {formatDate(lang, now, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
        </div>
        <div className="tight" style={{
          fontSize: 92, fontWeight: 200, letterSpacing: '-0.04em',
          marginTop: 4, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {hh}:{mm}
        </div>
      </div>

      <div className="ctrl-fadein" style={{
        position: 'absolute', top: 320, left: 14, right: 14,
        background: 'rgba(20,20,20,0.78)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, padding: '14px 14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: INK, color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em',
          }}>+M</div>
          <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', color: INK, flex: 1 }}>
            CTRL+ME
          </span>
          <span className="mono" style={{ fontSize: 11, color: DIM }}>now</span>
        </div>
        <div className="tight" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.22, marginBottom: 6, letterSpacing: '-0.02em' }}>
          {t('nudge.title')} {t('nudge.title.italic')}
        </div>
        <div className="mono" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
          {t('nudge.body.a')}
        </div>

        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Icon name="rain" size={18} stroke="#fff" />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 10.5, color: DIM, letterSpacing: '0.12em' }}>{t('nudge.forecast')}</div>
            <div className="mono" style={{ fontSize: 12, marginTop: 2 }}>{t('nudge.weather.a')}</div>
          </div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            78<span style={{ fontSize: 12, color: DIM }}>%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="mono" onClick={onDismiss} style={{
            flex: 1, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)',
            background: 'transparent', color: INK, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
          }}>{t('nudge.snooze.a')}</button>
          <button className="mono" onClick={onDismiss} style={{
            flex: 2, height: 38, borderRadius: 10, border: 'none',
            background: INK, color: '#000', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
          }}>{t('nudge.gotIt.a')}</button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10.5, color: DIM, letterSpacing: '0.18em' }}>
          {t('nudge.followup.a')}
        </div>
      </div>
    </div>
  );
}
