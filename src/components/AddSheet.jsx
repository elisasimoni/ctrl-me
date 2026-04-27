import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../atoms.jsx';
import { useT } from '../i18n.jsx';
import { analyzeReminder, isLlmEnabled } from '../lib/llm.js';

// Local fallback parser — runs when no API key is configured.
function parseLocal(text) {
  const t = text.toLowerCase();
  if (/(rain|umbrella|weather|cloud|piov|piogg|ombrell|meteo|nuvol)/.test(t)) return { icon: 'rain', tag: 'WEATHER' };
  if (/(pill|med|vitamin|drug|pillol|farmac|medicin)/.test(t))                return { icon: 'pill', tag: 'PILL · DAILY' };
  if (/(exam|class|building|room|school|esame|aula|edificio|scuol|lezion)/.test(t)) return { icon: 'pin', tag: 'PLACE' };
  if (/(\$|€|budget|spend|takeout|money|sold|spes|euro|denar)/.test(t))       return { icon: 'wallet', tag: 'BUDGET' };
  if (/(birthday|gift|present|complean|regal)/.test(t))                       return { icon: 'spark', tag: 'BIRTHDAY' };
  if (/(sleep|bed|night|sonno|letto|nott|dorm)/.test(t))                      return { icon: 'moon', tag: 'NIGHT' };
  return { icon: 'spark', tag: 'NOTE' };
}

const LOCAL_BODIES = {
  en: {
    rain:   { chill: 'Noted. Sky check engaged.',
              buddy: "Got it. I'll watch the sky for you.",
              hype:  "GENIUS. Umbrella patrol activated." },
    pill:   { chill: 'Noted. Same time, daily.',
              buddy: "On it. Every day at the same time, like a metronome.",
              hype:  "YES. Health era. Locked in." },
    pin:    { chill: 'Saved. Location pinned.',
              buddy: "Pinned. I'll nudge you 11 minutes before.",
              hype:  "Address committed to memory. Crushing it." },
    wallet: { chill: 'Tracked.',
              buddy: "I'll quietly count for you. Mostly quietly.",
              hype:  "BUDGET MODE: ON. Let's go." },
    spark:  { chill: 'Saved.',
              buddy: "Got it. I'll keep an eye on this.",
              hype:  "Locked in. Easy." },
    moon:   { chill: 'Bedtime saved.',
              buddy: "Sleep is a love language. I'll remind you.",
              hype:  "GOOD CALL. Sleep era." },
  },
  it: {
    rain:   { chill: 'Segnato. Occhio al cielo.',
              buddy: "Ok. Ti tengo d'occhio il cielo.",
              hype:  "GENIO. Pattuglia ombrello attiva." },
    pill:   { chill: 'Segnato. Stessa ora, ogni giorno.',
              buddy: "Ci penso io. Stessa ora ogni giorno, fisso.",
              hype:  "EVVAI. Era della salute. Locked in." },
    pin:    { chill: 'Salvato. Posto fissato.',
              buddy: "Fissato. Ti spingo 11 min prima.",
              hype:  "Indirizzo memorizzato. Stai spaccando." },
    wallet: { chill: 'Tracciato.',
              buddy: "Conto per te in silenzio. Quasi sempre.",
              hype:  "MODALITÀ BUDGET ON. Andiamo." },
    spark:  { chill: 'Salvato.',
              buddy: "Ci penso io. Tengo d'occhio.",
              hype:  "Locked in. Facile." },
    moon:   { chill: 'Ora del sonno salvata.',
              buddy: "Dormire è un linguaggio d'amore. Ti ricordo.",
              hype:  "OTTIMO. Era del sonno." },
  },
};

function localBody({ icon, personality, lang }) {
  return LOCAL_BODIES[lang]?.[icon]?.[personality]
    ?? LOCAL_BODIES.en[icon]?.[personality]
    ?? '';
}

export function AddSheet({ open, onClose, onAdd, personality, theme }) {
  const { t, lang } = useT();
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extra, setExtra] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 100);
    else { setText(''); setAnalysis(null); setError(null); setExtra(''); setLoading(false); }
  }, [open]);

  if (!open) return null;

  const isDark = theme === 'A';

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!isLlmEnabled()) {
      const meta = parseLocal(trimmed);
      onAdd({
        title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        body: localBody({ icon: meta.icon, personality, lang }),
        icon: meta.icon,
        tag: meta.tag,
      });
      onClose();
      return;
    }

    setLoading(true); setError(null);
    try {
      const result = await analyzeReminder({ text: trimmed, lang, personality });
      if (result.needs_followup && result.followups.length > 0) {
        setAnalysis(result);
        setLoading(false);
      } else {
        onAdd({ icon: result.icon, tag: result.tag, title: result.title, body: result.body });
        onClose();
      }
    } catch (e) {
      console.error('[CTRL+Me] LLM call failed, falling back:', e);
      const meta = parseLocal(trimmed);
      onAdd({
        title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        body: localBody({ icon: meta.icon, personality, lang }),
        icon: meta.icon,
        tag: meta.tag,
      });
      onClose();
    }
  };

  const finalize = async () => {
    if (!analysis) return;
    const merged = extra.trim() ? `${text} — ${extra.trim()}` : text;
    if (!extra.trim()) {
      onAdd({ icon: analysis.icon, tag: analysis.tag, title: analysis.title, body: analysis.body });
      onClose();
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeReminder({ text: merged, lang, personality });
      onAdd({ icon: result.icon, tag: result.tag, title: result.title, body: result.body });
      onClose();
    } catch (e) {
      onAdd({ icon: analysis.icon, tag: analysis.tag, title: analysis.title, body: analysis.body });
      onClose();
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} className="ctrl-fadein" style={{
        width: '100%',
        background: isDark ? '#0a0a0a' : '#f4f1ec',
        color: isDark ? '#f5f5f2' : '#0d0d0d',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '14px 22px 28px',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
          margin: '0 auto 18px',
        }} />
        <div className={isDark ? 'mono' : 'tight'} style={{
          fontSize: isDark ? 11 : 13, color: isDark ? 'rgba(245,245,242,0.5)' : 'rgba(13,13,13,0.55)',
          letterSpacing: isDark ? '0.18em' : '0.04em',
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          {analysis ? (lang === 'it' ? 'Mi serve un dettaglio' : 'Quick follow-up') :
            (isDark ? t('add.title.a') : t('add.title.b'))}
        </div>

        {!analysis && (
          <textarea
            ref={ref}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder={isDark ? t('add.placeholder.a') : t('add.placeholder.b')}
            rows={3}
            disabled={loading}
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              background: 'transparent',
              color: isDark ? '#f5f5f2' : '#0d0d0d',
              fontFamily: isDark ? "'JetBrains Mono', monospace" : "'Inter Tight', sans-serif",
              fontSize: isDark ? 16 : 22,
              fontWeight: isDark ? 500 : 600,
              letterSpacing: isDark ? '-0.01em' : '-0.025em',
              lineHeight: 1.35,
              opacity: loading ? 0.5 : 1,
            }}
          />
        )}

        {analysis && (
          <div className="ctrl-fadein">
            <div className="tight" style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>
              {analysis.title}
            </div>
            <div className="tight" style={{ fontSize: 13, color: isDark ? 'rgba(245,245,242,0.55)' : 'rgba(13,13,13,0.55)', marginBottom: 14 }}>
              {analysis.body}
            </div>
            {analysis.followups.map((q, i) => (
              <div key={i} className={isDark ? 'mono' : 'tight'} style={{
                fontSize: isDark ? 12 : 14, color: isDark ? 'rgba(245,245,242,0.7)' : 'rgba(13,13,13,0.7)',
                marginBottom: 6,
              }}>· {q}</div>
            ))}
            <input
              autoFocus
              value={extra}
              onChange={e => setExtra(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') finalize(); }}
              placeholder={lang === 'it' ? 'rispondi qui (o lascia vuoto)…' : 'answer here (or leave blank)…'}
              style={{
                width: '100%', border: 'none', outline: 'none',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: isDark ? '#f5f5f2' : '#0d0d0d',
                fontFamily: isDark ? "'JetBrains Mono', monospace" : "'Inter Tight', sans-serif",
                fontSize: 15, padding: '12px 14px',
                borderRadius: isDark ? 10 : 14,
                marginTop: 8,
              }}
            />
          </div>
        )}

        {error && (
          <div className="mono" style={{ fontSize: 11, color: '#d97757', marginTop: 8 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} className={isDark ? 'mono' : 'tight'} style={{
            flex: 1, height: 50, borderRadius: isDark ? 12 : 100,
            border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1.5px solid rgba(0,0,0,0.12)',
            background: 'transparent',
            color: isDark ? '#f5f5f2' : '#0d0d0d',
            cursor: 'pointer',
            fontSize: isDark ? 12 : 15,
            fontWeight: 600, letterSpacing: isDark ? '0.06em' : '-0.01em',
            textTransform: isDark ? 'uppercase' : 'none',
          }}>{t('add.cancel')}</button>
          <button
            onClick={analysis ? finalize : submit}
            disabled={loading || (!analysis && !text.trim())}
            className={isDark ? 'mono' : 'tight'}
            style={{
              flex: 2, height: 50, borderRadius: isDark ? 12 : 100, border: 'none',
              background: isDark ? '#f5f5f2' : '#0d0d0d',
              color: isDark ? '#0a0a0a' : '#f4f1ec',
              cursor: (loading || (!analysis && !text.trim())) ? 'not-allowed' : 'pointer',
              opacity: (loading || (!analysis && !text.trim())) ? 0.4 : 1,
              fontSize: isDark ? 12 : 15, fontWeight: 700,
              letterSpacing: isDark ? '0.06em' : '-0.01em',
              textTransform: isDark ? 'uppercase' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading
              ? (lang === 'it' ? 'penso…' : 'thinking…')
              : (isDark ? t('add.confirm.a') : t('add.confirm.b'))}
            {!loading && <Icon name="arrow" size={16} stroke={isDark ? '#0a0a0a' : '#f4f1ec'} sw={2} />}
          </button>
        </div>

        {isLlmEnabled() && !analysis && (
          <div className={isDark ? 'mono' : 'tight'} style={{
            fontSize: 10, color: isDark ? 'rgba(245,245,242,0.4)' : 'rgba(13,13,13,0.45)',
            marginTop: 12, textAlign: 'center', letterSpacing: isDark ? '0.1em' : '-0.005em',
          }}>
            {lang === 'it' ? 'haiku 4.5 attivo' : 'haiku 4.5 connected'} ●
          </div>
        )}
      </div>
    </div>
  );
}
