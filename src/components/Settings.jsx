import React, { useState } from 'react';
import { useT } from '../i18n.jsx';
import { loadMemory, removeFact, clearMemory } from '../native/memory.js';
import { isLlmEnabled } from '../lib/llm.js';
import { setApiKey, hasStoredKey } from '../lib/apiKey.js';
import { Pebble } from '../atoms.jsx';
import {
  TOKENS, toggleInArray,
  TextInput, Choice, MultiChoice, MultiPills, HourPicker, Toggles,
} from './ProfileInputs.jsx';
import { ConstellationGraph } from './ConstellationGraph.jsx';
import { listClusters } from '../lib/clusters.js';
import { behaviorStats } from '../lib/behavior.js';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const AREAS = ['study', 'health', 'social', 'work', 'home', 'habits'];

export function Settings({ open, mode = 'profile', onClose, store }) {
  const { t, lang, setLang } = useT();
  const [, forceRender] = useState(0);
  const [graphOpen, setGraphOpen] = useState(false);
  if (!open) return null;
  const isProfile = mode === 'profile';
  const isConfig  = mode === 'config';
  const { state, setPref, setProfile, reset, resetOnboarding, clearReminders, clearBehaviorLog } = store;
  const clusterCount = listClusters(state.reminders).length;
  const stats = behaviorStats(state.behaviorLog);
  const dir = state.prefs.direction;
  const tok = TOKENS[dir];
  const isDark = dir === 'A';
  const profile = state.prefs.profile;
  const mem = loadMemory();
  const hasFacts = mem.facts.length > 0;

  // Keep prefs.personality in sync when tone changes from Settings.
  const setTone = (v) => {
    setProfile({ tone: v });
    setPref('personality', v);
  };

  const handleRedo = () => {
    resetOnboarding();
    onClose();
  };

  const handleWipe = () => {
    reset();
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-start',
    }}>
      <div onClick={e => e.stopPropagation()} className="ctrl-fadein" style={{
        width: '100%', background: tok.bg, color: tok.ink,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        padding: '52px 22px 32px',
        maxHeight: '92%', overflowY: 'auto',
        fontFamily: tok.fontBody,
      }}>
        {/* Header with close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} aria-label="close" style={{
            background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
            fontSize: 28, padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Hero: differs by mode */}
        {isProfile ? (
          <Hero tok={tok} name={profile.name} t={t} />
        ) : (
          <ConfigHero tok={tok} t={t} />
        )}

        {/* Constellation graph entry — profile only, when clusters exist */}
        {isProfile && clusterCount > 0 && (
          <button onClick={() => setGraphOpen(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', marginBottom: 24,
            padding: '14px 18px', borderRadius: 16,
            background: tok.ink, color: tok.bg,
            border: 'none', cursor: 'pointer',
            fontFamily: tok.fontBody, fontSize: 14, fontWeight: 600,
            letterSpacing: '-0.005em', textAlign: 'left',
          }}>
            <span>✦ {t('graph.openButton')}</span>
            <span style={{ opacity: 0.7, fontSize: 12 }}>{clusterCount}</span>
          </button>
        )}

        {/* Profile */}
        {isProfile && (
        <Section tok={tok} label={t('settings.section.profile')}>
          <FieldLabel tok={tok} text={t('settings.name')} />
          <TextInput tok={tok} value={profile.name}
            placeholder={t('q.1.placeholder')}
            onChange={v => setProfile({ name: v })} />
        </Section>
        )}

        {/* Appearance — config */}
        {isConfig && (
        <Section tok={tok} label={t('settings.section.appearance')}>
          <FieldLabel tok={tok} text={t('settings.theme')} />
          <SegToggle tok={tok}
            options={[
              { v: 'A', label: isDark ? t('settings.theme.a') : t('settings.theme.a.lc') },
              { v: 'B', label: isDark ? t('settings.theme.b') : t('settings.theme.b.lc') },
            ]}
            value={dir}
            onChange={v => setPref('direction', v)}
          />
          <Spacer />
          <FieldLabel tok={tok} text={t('settings.language')} />
          <SegToggle tok={tok}
            options={[
              { v: 'en', label: t('settings.lang.en') },
              { v: 'it', label: t('settings.lang.it') },
            ]}
            value={lang}
            onChange={setLang}
          />
        </Section>
        )}

        {/* Behavior (tone) — profile */}
        {isProfile && (
        <Section tok={tok} label={t('settings.section.behavior')}>
          <FieldLabel tok={tok} text={t('settings.personality')} />
          <SegToggle tok={tok}
            options={[
              { v: 'chill', label: t('settings.chill') },
              { v: 'buddy', label: t('settings.buddy') },
              { v: 'hype',  label: t('settings.hype') },
            ]}
            value={profile.tone}
            onChange={setTone}
          />
          <Spacer />
          <FieldLabel tok={tok} text={t('settings.directTone.label')} />
          <SegToggle tok={tok}
            options={[
              { v: 'y', label: t('settings.directTone.on') },
              { v: 'n', label: t('settings.directTone.off') },
            ]}
            value={profile.directTone ? 'y' : 'n'}
            onChange={v => setProfile({ directTone: v === 'y' })}
          />
          <Spacer />
          <FieldLabel tok={tok} text={t('settings.insistence.label')} />
          <SegToggle tok={tok}
            options={[
              { v: 'zero', label: t('q.9.zero') },
              { v: 'soft', label: t('q.9.soft') },
              { v: 'hard', label: t('q.9.hard') },
            ]}
            value={profile.insistence}
            onChange={v => setProfile({ insistence: v })}
          />
          <Spacer />
          <FieldLabel tok={tok} text={t('settings.onSkip.label')} />
          <Choice tok={tok} value={profile.onSkip}
            onChange={v => setProfile({ onSkip: v })}
            options={[
              { v: 'repropose', label: t('q.8.repropose') },
              { v: 'ask',       label: t('q.8.ask') },
              { v: 'archive',   label: t('q.8.archive') },
            ]}
          />
          <Spacer />
          <Toggles tok={tok}
            items={[
              { key: 'eveningCheckin', label: t('settings.eveningCheckin.label'), value: profile.eveningCheckin },
            ]}
            onToggle={(k) => setProfile({ [k]: !profile[k] })}
          />
        </Section>
        )}

        {/* Schedule — profile */}
        {isProfile && (
        <Section tok={tok} label={t('settings.section.schedule')}>
          <div style={{ display: 'flex', gap: 16 }}>
            <HourPicker tok={tok} label={t('settings.wake')} value={profile.wakeHour}
              onChange={v => setProfile({ wakeHour: v })} />
            <HourPicker tok={tok} label={t('settings.sleep')} value={profile.sleepHour}
              onChange={v => setProfile({ sleepHour: v })} />
          </div>
          <Spacer />
          <FieldLabel tok={tok} text={t('settings.noWorkDays')} />
          <MultiPills tok={tok} values={profile.noWorkDays}
            onToggle={v => setProfile({ noWorkDays: toggleInArray(profile.noWorkDays, v) })}
            options={DAYS.map(d => ({ v: d, label: t(`q.6.${d}`) }))}
          />
        </Section>
        )}

        {/* Focus — profile */}
        {isProfile && (
        <Section tok={tok} label={t('settings.section.focus')}>
          <MultiChoice tok={tok} values={profile.areas}
            onToggle={v => setProfile({ areas: toggleInArray(profile.areas, v) })}
            options={AREAS.map(a => ({ v: a, label: t(`q.7.${a}`) }))}
          />
        </Section>
        )}

        {/* AI brain — config */}
        {isConfig && (
        <Section tok={tok} label={lang === 'it' ? 'Cervello AI' : 'AI brain'}>
          <ApiKeyField tok={tok} lang={lang} onChange={() => forceRender(n => n + 1)} />
        </Section>
        )}

        {/* Ambient — config */}
        {isConfig && (
        <Section tok={tok} label={t('settings.section.ambient')}>
          <Toggles tok={tok}
            items={[
              { key: 'permNotifications', label: t('q.11.notifications'), value: profile.permNotifications },
              { key: 'permWeather',  label: t('q.11.weather'),  value: profile.permWeather },
              { key: 'permLocation', label: t('q.11.location'), value: profile.permLocation },
              { key: 'permCalendar', label: t('q.11.calendar'), value: profile.permCalendar },
            ]}
            onToggle={(k) => setProfile({ [k]: !profile[k] })}
          />
        </Section>
        )}

        {/* Memory (LLM facts) — profile */}
        {isProfile && isLlmEnabled() && (
          <Section tok={tok} label={t('settings.section.memory')}>
            {hasFacts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mem.facts.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 12,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }}>
                    <span style={{
                      flex: 1, fontSize: 13,
                      color: isDark ? 'rgba(245,245,242,0.85)' : 'rgba(13,13,13,0.8)',
                    }}>· {f}</span>
                    <button onClick={() => { removeFact(i); forceRender(n => n+1); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: tok.dim, fontSize: 16, lineHeight: 1, padding: '0 2px',
                    }}>×</button>
                  </div>
                ))}
                <DangerLink tok={tok} onClick={() => { clearMemory(); forceRender(n => n+1); }}
                  label={lang === 'it' ? 'Cancella tutto' : 'Clear all'}
                />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: tok.dim }}>
                {lang === 'it' ? 'Ancora niente — aggiungi qualche reminder.' : 'Nothing yet — add some reminders.'}
              </div>
            )}
          </Section>
        )}

        <ConstellationGraph
          open={graphOpen}
          onClose={() => setGraphOpen(false)}
          reminders={state.reminders}
          theme={dir}
        />

        {/* Behavior — profile */}
        {isProfile && (
        <Section tok={tok} label={t('settings.section.behaviorLog')}>
          <BehaviorPanel tok={tok} t={t} lang={lang} stats={stats}
            onClear={() => {
              if (window.confirm(t('settings.behavior.forget.confirm'))) clearBehaviorLog();
            }}
          />
        </Section>
        )}

        {/* Danger zone — config */}
        {isConfig && (
        <Section tok={tok} label={t('settings.section.danger')}>
          <DangerLink tok={tok} onClick={handleRedo} label={t('settings.redoOnboarding')} />
          <DangerLink tok={tok} onClick={() => { if (confirmReminders(lang)) clearReminders(); }}
            label={t('settings.clearReminders')} />
          <DangerLink tok={tok} onClick={() => { if (confirmWipe(lang)) handleWipe(); }}
            label={t('settings.wipeAll')} danger />
        </Section>
        )}
      </div>
    </div>
  );
}

// Lets whoever runs the app supply their own Anthropic key — which is what
// makes the public demo able to show the Haiku flow at all, since the deployed
// build ships no key. Stored in localStorage, on this device only.
function ApiKeyField({ tok, lang, onChange }) {
  const [draft, setDraft] = useState('');
  const stored = hasStoredKey();
  const active = isLlmEnabled();

  const save = () => {
    if (!draft.trim()) return;
    setApiKey(draft);
    setDraft('');
    onChange();
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: tok.dim, marginBottom: 10, lineHeight: 1.45 }}>
        {active
          ? (lang === 'it' ? 'Haiku 4.5 attivo ●' : 'Haiku 4.5 connected ●')
          : (lang === 'it'
              ? 'Senza chiave uso il parser locale. Incolla una chiave Anthropic per il parsing intelligente — resta solo in questo browser.'
              : 'Without a key I use the local parser. Paste an Anthropic key for smart parsing — it stays in this browser only.')}
      </div>

      {active && !stored ? null : stored ? (
        <DangerLink tok={tok} onClick={() => { setApiKey(''); onChange(); }}
          label={lang === 'it' ? 'Rimuovi la chiave' : 'Remove key'} />
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); }}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1, minWidth: 0, height: 44, padding: '0 14px',
              borderRadius: 12, outline: 'none',
              border: `1px solid ${tok.hair}`,
              background: 'transparent', color: tok.ink,
              fontFamily: tok.fontBody, fontSize: 14,
            }}
          />
          <button onClick={save} disabled={!draft.trim()} style={{
            height: 44, padding: '0 20px', borderRadius: 12, border: 'none',
            background: tok.ink, color: tok.bg,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            opacity: draft.trim() ? 1 : 0.4,
            fontFamily: tok.fontTitle, fontSize: 14, fontWeight: 600,
          }}>{lang === 'it' ? 'Salva' : 'Save'}</button>
        </div>
      )}
    </div>
  );
}

function confirmReminders(lang) {
  return window.confirm(lang === 'it'
    ? 'Sicura? Cancello tutti i reminder.'
    : 'Sure? This clears all reminders.');
}
function confirmWipe(lang) {
  return window.confirm(lang === 'it'
    ? 'Cancello TUTTO: profilo, reminder, memoria. Sicura?'
    : 'This wipes EVERYTHING: profile, reminders, memory. Sure?');
}

// ─── building blocks ────────────────────────────────────────

function ConfigHero({ tok, t }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{
        margin: 0, fontFamily: tok.fontTitle, fontSize: 24, fontWeight: 700,
        letterSpacing: tok.titleLetter, lineHeight: 1.1,
      }}>{t('settings.config.title')}</h1>
      <p style={{
        margin: '4px 0 0', fontSize: 13, color: tok.dim, lineHeight: 1.4,
      }}>{t('settings.config.subtitle')}</p>
    </div>
  );
}

function Hero({ tok, name, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <Pebble size={52} eyes="open" />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: tok.fontTitle, fontSize: 22, fontWeight: 700,
          letterSpacing: tok.titleLetter, lineHeight: 1.1,
        }}>
          {name ? t('settings.profile.preview.named', { name }) : t('settings.profile.preview.anon')}
        </div>
        <div style={{ fontSize: 13, color: tok.dim, marginTop: 2 }}>
          {t('settings.profile.preview.sub')}
        </div>
      </div>
    </div>
  );
}

function Section({ tok, label, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5, color: tok.dim,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 12, fontWeight: 600,
      }}>{label}</div>
      {children}
    </div>
  );
}

function FieldLabel({ tok, text }) {
  return (
    <div style={{
      fontSize: 12, color: tok.dim, fontWeight: 500,
      marginBottom: 8, letterSpacing: '-0.005em',
    }}>{text}</div>
  );
}

function Spacer() { return <div style={{ height: 18 }} />; }

function SegToggle({ tok, options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      borderRadius: 100,
      background: tok === TOKENS.A ? 'rgba(245,245,242,0.06)' : 'rgba(0,0,0,0.05)',
      border: `1px solid ${tok.hair}`,
    }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, height: 38, borderRadius: 100,
          border: 'none', cursor: 'pointer',
          background: value === o.v ? tok.ink : 'transparent',
          color: value === o.v ? tok.bg : tok.ink,
          fontFamily: tok.fontBody, fontSize: 13, fontWeight: 600,
          letterSpacing: '-0.005em',
          transition: 'all .2s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function BehaviorPanel({ tok, t, lang, stats, onClear }) {
  if (!stats.hasAnything) {
    return (
      <div style={{ fontSize: 13, color: tok.dim, lineHeight: 1.5 }}>
        {t('settings.behavior.empty')}
      </div>
    );
  }
  const whenLabel = stats.peakWhen ? t(`when.${stats.peakWhen}`) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stats.completionRate != null && stats.completionRate < 0.4 && (
        <div style={{ fontSize: 13, color: tok.ink, lineHeight: 1.45 }}>
          · {t('settings.behavior.completionLow')}
        </div>
      )}
      {stats.completionRate != null && stats.completionRate > 0.8 && (
        <div style={{ fontSize: 13, color: tok.ink, lineHeight: 1.45 }}>
          · {t('settings.behavior.completionHigh')}
        </div>
      )}
      {whenLabel && (
        <div style={{ fontSize: 13, color: tok.ink, lineHeight: 1.45 }}>
          · {t('settings.behavior.peak', { when: whenLabel })}
        </div>
      )}

      {stats.skipped.length > 0 && (
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: tok.dim,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            marginBottom: 8,
          }}>{t('settings.behavior.skipped')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.skipped.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10,
                background: tok === TOKENS.A ? 'rgba(245,245,242,0.05)' : 'rgba(0,0,0,0.04)',
              }}>
                <span style={{
                  flex: 1, fontSize: 13,
                  color: tok.ink, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginRight: 8,
                }}>{s.title}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: tok.dim, letterSpacing: '0.06em',
                  flexShrink: 0,
                }}>{s.count}{t('behavior.times')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onClear} style={{
        alignSelf: 'flex-start',
        padding: '8px 14px', borderRadius: 100,
        background: 'transparent', border: `1.5px solid ${tok.hair}`,
        color: tok.dim, fontFamily: tok.fontBody, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '-0.005em',
      }}>{t('settings.behavior.forget')}</button>
    </div>
  );
}

function DangerLink({ tok, onClick, label, danger = false }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%',
      textAlign: 'left',
      padding: '14px 4px',
      background: 'transparent', border: 'none',
      borderTop: `1px solid ${tok.hair}`,
      color: danger ? '#d44' : tok.ink,
      fontFamily: tok.fontBody, fontSize: 14, fontWeight: 500,
      cursor: 'pointer',
    }}>{label} →</button>
  );
}
