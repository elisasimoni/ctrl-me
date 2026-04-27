import React, { useState } from 'react';
import { Icon, Pebble } from '../atoms.jsx';
import { useT, formatDate } from '../i18n.jsx';
import { WeatherBanner } from '../components/WeatherBanner.jsx';
import { openMaps } from '../native/maps.js';
import { addToCalendar } from '../native/calendar.js';

const PAPER = '#f4f1ec';
const PAPER_DEEP = '#ebe6dd';
const INK = '#0d0d0d';
const INK_SOFT = '#2a2a2a';
const DIM = 'rgba(13,13,13,0.55)';
const HAIR = 'rgba(13,13,13,0.12)';

function PaperGrain() {
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'multiply', pointerEvents: 'none',
      backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 0.5px, transparent 0.5px)',
      backgroundSize: '3px 3px',
    }} />
  );
}

// Render a headline with optional italic span + line breaks.
function richHeadline(text, italic) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    let content;
    if (italic && line.includes(italic)) {
      const [pre, ...rest] = line.split(italic);
      const post = rest.join(italic);
      content = <>{pre}<span className="serif-it" style={{ fontWeight: 400 }}>{italic}</span>{post}</>;
    } else {
      content = line;
    }
    return <React.Fragment key={li}>{content}{li < lines.length - 1 && <br/>}</React.Fragment>;
  });
}

// ─── Onboarding ──────────────────────────────────────────────
export function B_Onboarding({ onDone }) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const slides = [0, 1, 2].map(i => ({
    eyebrow: t(`b.eyebrow.${i}`),
    headline: t(`b.headline.${i}`),
    italic: t(`b.headline.${i}.italic`),
    sub: t(`b.sub.${i}`),
    cta: t(`b.cta.${i}`),
  }));
  const s = slides[step];
  const next = () => step < slides.length - 1 ? setStep(step + 1) : onDone?.();

  return (
    <div className="cm-screen" style={{ background: PAPER, color: INK, overflow: 'hidden' }}>
      <PaperGrain />

      <div style={{ position: 'absolute', top: 70, left: 28, right: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tight" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: DIM }}>
          {s.eyebrow}
        </span>
        <button onClick={() => onDone?.()} className="tight" style={{
          background: 'transparent', border: 'none', color: DIM, cursor: 'pointer',
          fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', padding: 0,
        }}>{t('b.skip')}</button>
      </div>

      <div className="ctrl-pulse" style={{
        position: 'absolute', top: 124, left: 0, right: 0, display: 'flex', justifyContent: 'center',
      }}>
        <Pebble size={84} />
      </div>

      <div className="ctrl-fadein" key={step} style={{ position: 'absolute', top: 240, left: 28, right: 28 }}>
        <div className="tight" style={{
          fontSize: 46, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.045em', color: INK,
        }}>{richHeadline(s.headline, s.italic)}</div>
        <div className="tight" style={{
          marginTop: 22, fontSize: 16, fontWeight: 400, lineHeight: 1.42, color: INK_SOFT,
          maxWidth: 320, letterSpacing: '-0.01em',
        }}>{s.sub}</div>
      </div>

      {step === 1 && (
        <div style={{ position: 'absolute', top: 510, left: 28, right: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BubbleR text={t('b.bubble.user')} />
          <BubbleL text={t('b.bubble.bot')} delay={400} />
        </div>
      )}
      {step === 0 && (
        <div style={{ position: 'absolute', top: 520, left: 28, right: 28 }}>
          <div style={{
            border: `1.5px dashed ${HAIR}`, borderRadius: 18, padding: '16px 18px',
            background: 'rgba(255,255,255,0.4)',
          }}>
            <div className="tight" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, marginBottom: 6 }}>
              {t('b.things.label')}
            </div>
            <div className="tight" style={{ fontSize: 14, lineHeight: 1.55, color: INK_SOFT }}>
              {t('b.things.list')}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div style={{ position: 'absolute', top: 520, left: 28, right: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Tag>{t('b.tag.streaks')}</Tag>
          <Tag>{t('b.tag.7am')}</Tag>
          <Tag>{t('b.tag.guilt')}</Tag>
        </div>
      )}

      <div style={{ position: 'absolute', left: 28, right: 28, bottom: 64 }}>
        <button onClick={next} className="tight" style={{
          width: '100%', height: 60, borderRadius: 100, border: 'none',
          background: INK, color: PAPER, cursor: 'pointer',
          fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {s.cta} <Icon name="arrow" size={18} stroke={PAPER} sw={2} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i === step ? INK : HAIR, transition: 'all .3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BubbleR({ text, delay = 0 }) {
  return (
    <div className="ctrl-fadein" style={{
      animationDelay: `${delay}ms`,
      alignSelf: 'flex-end', maxWidth: '78%', marginLeft: 'auto',
      background: INK, color: PAPER, borderRadius: '18px 18px 4px 18px', padding: '10px 14px',
    }}>
      <span className="tight" style={{ fontSize: 13.5, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}
function BubbleL({ text, delay = 0 }) {
  return (
    <div className="ctrl-fadein" style={{
      animationDelay: `${delay}ms`,
      alignSelf: 'flex-start', maxWidth: '82%',
      background: PAPER_DEEP, color: INK, borderRadius: '18px 18px 18px 4px',
      padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <Pebble size={20} />
      <span className="tight" style={{ fontSize: 13.5, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}
function Tag({ children }) {
  return (
    <span className="tight" style={{
      padding: '8px 14px', borderRadius: 999, background: PAPER_DEEP,
      fontSize: 13, fontWeight: 500, color: INK_SOFT, letterSpacing: '-0.01em',
    }}>{children}</span>
  );
}

// ─── Home ──────────────────────────────────────────────────
export function B_Home({ store, onCompose, onSettings, onAddReminder }) {
  const { t, lang } = useT();
  const { state, toggleDone, snooze } = store;
  const items = state.reminders;
  const [drag, setDrag] = useState({ id: null, dx: 0, startX: 0 });

  const onDown = (id) => (e) => setDrag({ id, dx: 0, startX: e.clientX });
  const onMove = (e) => {
    if (drag.id == null) return;
    const dx = Math.max(-130, Math.min(0, e.clientX - drag.startX));
    setDrag(d => ({ ...d, dx }));
  };
  const onUp = () => {
    if (drag.id == null) return;
    if (drag.dx < -75) snooze(drag.id);
    setDrag({ id: null, dx: 0, startX: 0 });
  };

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const thingsSuffix = total === 1 ? '' : 's';
  const itPlural = total === 1 ? 'a' : 'e';
  const remaining = total - doneCount;
  const remainingSuffix = remaining === 1 ? '' : 's';
  const itRemainingPlural = remaining === 1 ? 'a' : 'e';

  return (
    <div className="cm-screen" style={{ background: PAPER, color: INK, overflow: 'hidden' }}
      onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <PaperGrain />

      <div style={{ position: 'absolute', top: 64, left: 24, right: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pebble size={36} />
          <div style={{ flex: 1 }}>
            <div className="tight" style={{ fontSize: 12, fontWeight: 600, color: DIM, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {formatDate(lang, new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="tight" style={{ fontSize: 14, fontWeight: 500, color: INK_SOFT, marginTop: 1 }}>
              {(() => {
                const raw = t('home.things', { n: `__N__`, s: thingsSuffix, a: itPlural });
                const parts = raw.split('__N__');
                return <>{parts[0]}<span style={{ fontWeight: 700, color: INK }}>{total}</span>{parts[1]}</>;
              })()}
            </div>
          </div>
          <button onClick={onSettings} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1.5px solid ${HAIR}`, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Icon name="settings" size={16} />
          </button>
        </div>

        <div className="tight" style={{
          fontSize: 38, fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.04em', marginTop: 18,
        }}>
          {t('home.greeting')}<br/><span className="serif-it" style={{ fontWeight: 400 }}>{t('home.greeting.italic')}</span>
        </div>
      </div>

      <WeatherBanner theme="B" onAddReminder={onAddReminder} />

      <div className="cm-feed" style={{ position: 'absolute', top: 268, left: 0, right: 0, bottom: 110, overflow: 'auto', padding: '4px 16px 8px' }}>
        {items.map(item => {
          const isDone = item.done;
          const dx = drag.id === item.id ? drag.dx : 0;
          return (
            <div key={item.id} style={{ position: 'relative', marginBottom: 10 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 22,
                background: INK, color: PAPER,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingRight: 22, gap: 8,
                opacity: dx < -10 ? 1 : 0, transition: 'opacity .15s',
              }}>
                <Icon name="snooze" size={18} stroke={PAPER} sw={1.8} />
                <span className="tight" style={{ fontSize: 13, fontWeight: 600 }}>{t('when.later')}</span>
              </div>
              <div
                onPointerDown={onDown(item.id)}
                onClick={() => toggleDone(item.id)}
                style={{
                  position: 'relative', cursor: 'pointer', userSelect: 'none', touchAction: 'pan-y',
                  background: isDone ? PAPER_DEEP : '#fff',
                  border: `1px solid ${HAIR}`, borderRadius: 22,
                  padding: '14px 14px 14px 16px', display: 'flex', gap: 12,
                  transform: `translateX(${dx}px)`,
                  transition: drag.id === item.id ? 'none' : 'transform .25s ease',
                  boxShadow: isDone ? 'none' : '0 1px 0 rgba(0,0,0,0.04)',
                }}>
                <div style={{ width: 52, flexShrink: 0 }}>
                  <div className="tight" style={{
                    fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em',
                    color: isDone ? DIM : INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  }}>{item.time}</div>
                  <div className="serif-it" style={{ fontSize: 11.5, color: DIM, marginTop: 3 }}>
                    {t(`when.${item.when}`)}
                  </div>
                </div>
                <div style={{ width: 1, background: HAIR, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon name={item.icon} size={14} stroke={isDone ? DIM : INK_SOFT} />
                    <div className="tight" style={{
                      fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em',
                      color: isDone ? DIM : INK, lineHeight: 1.15,
                      textDecoration: isDone ? 'line-through' : 'none', textDecorationThickness: 1,
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{item.title}</div>
                  </div>
                  <div className="tight" style={{
                    fontSize: 13, color: isDone ? DIM : INK_SOFT, lineHeight: 1.4, letterSpacing: '-0.005em',
                  }}>{item.body}</div>
                  {!isDone && (item.icon === 'pin' || item.location) && (
                    <button
                      onClick={e => { e.stopPropagation(); openMaps(item.location || item.title); }}
                      className="tight"
                      style={{
                        marginTop: 8, padding: '4px 10px', borderRadius: 100,
                        border: `1px solid ${HAIR}`, background: 'transparent',
                        color: INK_SOFT, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                      <Icon name="pin" size={11} stroke={INK_SOFT} /> {lang === 'it' ? 'Apri Maps' : 'Open Maps'}
                    </button>
                  )}
                  {!isDone && (
                    <button
                      onClick={e => { e.stopPropagation(); addToCalendar({ title: item.title, body: item.body, startAt: Date.now() + 60000 }); }}
                      className="tight"
                      style={{
                        marginTop: 8, marginLeft: item.icon === 'pin' ? 6 : 0,
                        padding: '4px 10px', borderRadius: 100,
                        border: `1px solid ${HAIR}`, background: 'transparent',
                        color: INK_SOFT, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                      <Icon name="spark" size={11} stroke={INK_SOFT} /> {lang === 'it' ? '+ Calendario' : '+ Calendar'}
                    </button>
                  )}
                </div>
                <div className={isDone ? 'ctrl-pop' : ''} style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${isDone ? INK : HAIR}`,
                  background: isDone ? INK : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'center', transition: 'all .2s',
                }}>
                  {isDone && <Icon name="check" size={13} stroke={PAPER} sw={2.5} />}
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="tight" style={{ textAlign: 'center', padding: 40, color: DIM }}>
            {t('home.empty.b')} <span className="serif-it">{t('home.empty.b.italic')}</span>
          </div>
        )}

        <div className="tight" style={{
          textAlign: 'center', fontSize: 12.5, color: DIM, padding: '12px 16px', letterSpacing: '-0.01em',
        }}>
          {total === 0 ? null :
           doneCount === total ? <>{t('home.allDone')} <span className="serif-it">{t('home.allDone.italic')}</span></> :
           doneCount === 0 ? t('home.tapHint') :
           <>{t('home.toGo', { n: remaining, s: remainingSuffix, a: itRemainingPlural })} <span className="serif-it">{t('home.toGo.italic')}</span></>}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 36, left: 24, right: 24,
        background: '#fff', border: `1px solid ${HAIR}`,
        borderRadius: 100, height: 60, display: 'flex', alignItems: 'center',
        padding: '0 8px 0 22px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        cursor: 'pointer',
      }} onClick={onCompose}>
        <span className="tight" style={{ flex: 1, fontSize: 15, color: DIM, letterSpacing: '-0.01em' }}>
          {t('home.compose.b')}
        </span>
        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          <Icon name="mic" size={18} />
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: INK,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="plus" size={20} stroke={PAPER} sw={2.4} />
        </div>
      </div>
    </div>
  );
}

// ─── Notification (lockscreen demo) ─────────────────────────
export function B_Notification({ onDismiss }) {
  const { t, lang } = useT();
  const now = new Date();
  const hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="cm-screen" style={{
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
      color: '#fff', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 88, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>
        <div className="tight" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.04em', opacity: 0.65 }}>
          {formatDate(lang, now, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="tight" style={{
          fontSize: 96, fontWeight: 300, letterSpacing: '-0.05em',
          marginTop: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {hh}:{mm}
        </div>
      </div>

      <div className="ctrl-fadein" style={{
        position: 'absolute', top: 320, left: 14, right: 14,
        background: PAPER, color: INK,
        borderRadius: 22, padding: '16px 16px 14px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Pebble size={26} />
          <span className="tight" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>CTRL+Me</span>
          <span className="tight" style={{ fontSize: 12, color: DIM }}>now</span>
        </div>

        <div className="tight" style={{
          fontSize: 26, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.035em', marginBottom: 10,
        }}>
          {t('nudge.title')}<br/>
          <span className="serif-it" style={{ fontWeight: 400 }}>{t('nudge.title.italic')}</span>
        </div>
        <div className="tight" style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.45, letterSpacing: '-0.005em' }}>
          {t('nudge.body')}
        </div>

        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 14, background: PAPER_DEEP,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Icon name="rain" size={20} />
          <div style={{ flex: 1 }}>
            <div className="tight" style={{ fontSize: 11, fontWeight: 600, color: DIM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>2:00 PM</div>
            <div className="tight" style={{ fontSize: 13, fontWeight: 500 }}>{t('nudge.weather.b')}</div>
          </div>
          <div className="tight" style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
            78<span style={{ fontSize: 14, color: DIM, fontWeight: 500 }}>%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="tight" onClick={onDismiss} style={{
            flex: 1, height: 44, borderRadius: 100, border: `1.5px solid ${HAIR}`,
            background: 'transparent', color: INK, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
          }}>{t('nudge.snooze')}</button>
          <button className="tight" onClick={onDismiss} style={{
            flex: 2, height: 44, borderRadius: 100, border: 'none',
            background: INK, color: PAPER, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
          }}>{t('nudge.gotIt')}</button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, textAlign: 'center' }}>
        <div className="tight" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.005em' }}>
          {t('nudge.tagline')} <span className="serif-it">{t('nudge.tagline.italic')}</span>
        </div>
      </div>
    </div>
  );
}
