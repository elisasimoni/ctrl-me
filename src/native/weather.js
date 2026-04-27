// Open-Meteo API — free, no key needed.
// Returns { temp, rainProbability, rainMm, description, icon }
// where rainProbability is 0-100 for the next 6 hours.

import { getPosition } from './geo.js';

const CACHE_KEY = 'ctrlme.weather.v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export async function fetchWeather() {
  const cached = loadCache();
  if (cached) return cached;

  const { lat, lon } = await getPosition();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode` +
    `&hourly=precipitation_probability,precipitation` +
    `&timezone=auto&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();

  const currentHour = new Date().getHours();
  const hours = data.hourly.time.map(t => new Date(t).getHours());

  // Next 6 hours of rain probability
  const nextSlots = hours.reduce((acc, h, i) => {
    if (h >= currentHour && h < currentHour + 6) acc.push(i);
    return acc;
  }, []);

  const maxRainProb = nextSlots.length
    ? Math.max(...nextSlots.map(i => data.hourly.precipitation_probability[i]))
    : 0;
  const totalRain = nextSlots.length
    ? nextSlots.reduce((s, i) => s + data.hourly.precipitation[i], 0)
    : 0;

  const temp = Math.round(data.current.temperature_2m);
  const code = data.current.weathercode;

  const result = {
    temp,
    rainProbability: maxRainProb,
    rainMm: Math.round(totalRain * 10) / 10,
    description: weatherDescription(code),
    willRain: maxRainProb >= 50,
    lat,
    lon,
    fetchedAt: Date.now(),
  };

  saveCache(result);
  return result;
}

function weatherDescription(code) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partly cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'showers';
  return 'thunderstorm';
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (Date.now() - d.fetchedAt > CACHE_TTL) return null;
    return d;
  } catch { return null; }
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}
