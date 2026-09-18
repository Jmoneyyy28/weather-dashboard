const BASE = 'https://api.openweathermap.org';

export function getApiKey() {
  return import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() || '';
}

export function hasApiKey() {
  return Boolean(getApiKey());
}

export function iconUrl(icon, size = '2x') {
  return `https://openweathermap.org/img/wn/${icon}@${size}.png`;
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        'Invalid API key (401). Add your free key to .env as VITE_OPENWEATHER_API_KEY and restart the dev server.',
      );
    }
    if (res.status === 404) throw new Error('Location not found (404).');
    if (res.status === 429) throw new Error('Rate limit hit (429). Wait a minute and retry.');
    throw new Error(`OpenWeatherMap error: ${res.status}`);
  }
  return res.json();
}

export function searchLocations(query, limit = 5) {
  const key = getApiKey();
  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${key}`;
  return apiFetch(url);
}

export function reverseGeocode(lat, lon) {
  const key = getApiKey();
  const url = `${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`;
  return apiFetch(url);
}

export function getCurrentWeather(lat, lon, units = 'metric') {
  const key = getApiKey();
  const url = `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
  return apiFetch(url);
}

export function getForecast(lat, lon, units = 'metric') {
  const key = getApiKey();
  const url = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`;
  return apiFetch(url);
}
