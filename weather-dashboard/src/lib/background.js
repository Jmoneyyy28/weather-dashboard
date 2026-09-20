/**
 * Map an OpenWeatherMap current-weather object to a background theme key.
 * Themes (all rich-dark for white-text readability):
 * clear-day, clear-night, clouds, rain, storm, snow, fog
 */
export function getTheme(current) {
  const id = current?.weather?.[0]?.id;
  const icon = current?.weather?.[0]?.icon ?? 'd';
  const night = icon.endsWith('n');

  if (typeof id !== 'number') return 'clear-night';
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return night ? 'clear-night' : 'clear-day';
  return 'clouds';
}

export const THEMES = ['clear-day', 'clear-night', 'clouds', 'rain', 'storm', 'snow', 'fog'];

/**
 * Describe the canvas effect for a place: { type, intensity }.
 * intensity is 0..1 derived from real precipitation data so a drizzle
 * looks different from a downpour. Falls back to forecast probability.
 */
export function getEffect(current, forecast) {
  const type = getTheme(current);
  if (type === 'rain' || type === 'storm' || type === 'snow') {
    const mm = current?.rain?.['1h'] ?? current?.rain?.['3h'] ?? current?.snow?.['1h'] ?? current?.snow?.['3h'] ?? 0;
    const pop = forecast?.list?.[0]?.pop ?? 0;
    // ~0.5mm light, ~4mm+ heavy. Blend mm (70%) with probability (30%).
    const fromMm = Math.min(mm / 4, 1);
    const intensity = Math.max(fromMm * 0.7 + pop * 0.3, 0.15);
    return { type, intensity };
  }
  return { type, intensity: 1 };
}

/** Bucket intensity so the canvas only re-seeds on meaningful changes. */
export function intensityBucket(intensity) {
  if (intensity < 0.35) return 'light';
  if (intensity < 0.7) return 'moderate';
  return 'heavy';
}
