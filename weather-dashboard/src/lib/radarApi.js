/**
 * Live radar layers: RainViewer precipitation animation (free, no key) plus
 * OpenWeatherMap tile overlays (temp / wind / clouds) using the app's key.
 */

const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const FRAMES_TTL = 10 * 60 * 1000;
const MAX_FRAMES = 8;

let frameCache = { at: 0, frames: [] };

/** Past + nowcast radar frames, newest last. Throws when unavailable. */
export async function getRadarFrames() {
  if (Date.now() - frameCache.at < FRAMES_TTL && frameCache.frames.length > 0) {
    return frameCache.frames;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(RAINVIEWER_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`radar ${res.status}`);
    const data = await res.json();
    const past = data?.radar?.past ?? [];
    const nowcast = data?.radar?.nowcast ?? [];
    const frames = [...past.slice(-(MAX_FRAMES - 2)), ...nowcast.slice(0, 2)]
      .filter((f) => f && f.time && f.path)
      .map((f) => ({ time: f.time, path: f.path }));
    if (frames.length === 0) throw new Error('empty radar feed');
    frameCache = { at: Date.now(), frames };
    return frames;
  } finally {
    clearTimeout(timer);
  }
}

/** RainViewer tile template: universal colors + smoothing. */
export function rainviewerTile(path) {
  return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/4/1_1.png`;
}

export const OWM_OVERLAYS = [
  { id: 'temp', label: 'Temp', layer: 'temp_new' },
  { id: 'wind', label: 'Wind', layer: 'wind_new' },
  { id: 'clouds', label: 'Clouds', layer: 'clouds_new' },
];

/** OpenWeatherMap tile template for a layer id (requires API key). */
export function owmTile(layer, key) {
  return `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${key}`;
}
