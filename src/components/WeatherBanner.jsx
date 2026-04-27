import React, { useEffect, useState } from 'react';
import { fetchWeather } from '../native/weather.js';
import { openMaps } from '../native/maps.js';
import { scheduleWeatherNudge } from '../native/notifications.js';
import { Icon } from '../atoms.jsx';
import { useT } from '../i18n.jsx';

export function WeatherBanner({ theme, onAddReminder }) {
  const { lang } = useT();
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  const isDark = theme === 'A';
  const BG = isDark ? '#0a0a0a' : '#f4f1ec';
  const INK = isDark ? '#f5f5f2' : '#0d0d0d';
  const DIM = isDark ? 'rgba(245,245,242,0.5)' : 'rgba(13,13,13,0.55)';
  const HAIR = isDark ? 'rgba(245,245,242,0.1)' : 'rgba(13,13,13,0.1)';
  const ACCENT_BG = isDark ? 'rgba(245,245,242,0.06)' : 'rgba(0,0,0,0.04)';

  const load = async () => {
    setStatus('loading');
    try {
      const w = await fetchWeather();
      setWeather(w);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  if (status === 'idle' || status === 'loading') {
    return (
      <div style={{
        margin: '0 16px 8px', padding: '12px 14px', borderRadius: isDark ? 10 : 18,
        background: ACCENT_BG, border: `1px solid ${HAIR}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon name="cloud" size={16} stroke={DIM} />
        <span className={isDark ? 'mono' : 'tight'} style={{ fontSize: 12, color: DIM }}>
          {status === 'loading'
            ? (lang === 'it' ? 'Guardo il cielo…' : 'Checking the sky…')
            : (lang === 'it' ? 'Meteo non disponibile' : 'Weather unavailable')}
        </span>
      </div>
    );
  }

  if (status === 'error') return null;

  const { temp, rainProbability, description, willRain } = weather;

  const handleRainTap = async () => {
    await scheduleWeatherNudge({ rainProbability, temp, lang });
    onAddReminder?.({
      icon: 'rain', tag: lang === 'it' ? 'METEO' : 'WEATHER',
      title: lang === 'it' ? 'Ombrello, prendilo.' : 'Bring the umbrella.',
      body: lang === 'it'
        ? `Pioggia al ${rainProbability}% nelle prossime ore. ${temp}°C.`
        : `Rain at ${rainProbability}% in the next few hours. ${temp}°C.`,
    });
  };

  return (
    <div style={{
      margin: '0 16px 8px', padding: '12px 14px', borderRadius: isDark ? 10 : 18,
      background: willRain ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : ACCENT_BG,
      border: `1px solid ${willRain ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)') : HAIR}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <Icon name={willRain ? 'rain' : 'sun'} size={18} stroke={INK} />
      <div style={{ flex: 1 }}>
        <div className={isDark ? 'mono' : 'tight'} style={{ fontSize: isDark ? 11 : 13, fontWeight: 600, color: INK }}>
          {temp}°C · {description}
        </div>
        {willRain && (
          <div className={isDark ? 'mono' : 'tight'} style={{ fontSize: isDark ? 10 : 12, color: DIM, marginTop: 2 }}>
            {lang === 'it' ? `Pioggia al ${rainProbability}% nelle prossime ore` : `Rain ${rainProbability}% in the next few hours`}
          </div>
        )}
      </div>
      {willRain && (
        <button onClick={handleRainTap} className={isDark ? 'mono' : 'tight'} style={{
          padding: isDark ? '5px 10px' : '6px 12px',
          borderRadius: isDark ? 6 : 100,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
          background: 'transparent', color: INK, cursor: 'pointer',
          fontSize: isDark ? 10 : 12, fontWeight: 600,
          letterSpacing: isDark ? '0.08em' : '-0.01em',
          textTransform: isDark ? 'uppercase' : 'none',
          whiteSpace: 'nowrap',
        }}>
          {lang === 'it' ? '+ Ombrello' : '+ Umbrella'}
        </button>
      )}
    </div>
  );
}
