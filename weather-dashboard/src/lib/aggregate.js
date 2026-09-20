/** Next N 3-hour entries = ~24h when N = 8. */
export function getHourlySlice(forecast, count = 8) {
  if (!forecast?.list) return [];
  return forecast.list.slice(0, count);
}

/**
 * Aggregate 3-hour /forecast entries into per-day summaries.
 * Free tier only returns ~5 days, so this yields up to 5 daily cards.
 */
export function getDailyForecast(forecast) {
  if (!forecast?.list) return [];
  const groups = new Map();
  for (const entry of forecast.list) {
    const day = entry.dt_txt.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(entry);
  }
  return [...groups.entries()].slice(0, 5).map(([day, entries]) => {
    const temps = entries.map((e) => e.main.temp);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    // Prefer a midday entry for a representative icon/description.
    const mid =
      entries.find((e) => e.dt_txt.includes('12:00:00')) ??
      entries[Math.floor(entries.length / 2)];
    return {
      date: day,
      min: Math.round(min),
      max: Math.round(max),
      iconId: mid.weather?.[0]?.id ?? 800,
      icon: mid.weather?.[0]?.icon ?? '01d',
      description: mid.weather?.[0]?.description ?? '',
      pop: Math.max(...entries.map((e) => e.pop ?? 0)),
    };
  });
}

export function formatHour(dtTxt) {
  const d = new Date(dtTxt.replace(' ', 'T'));
  return d.toLocaleTimeString([], { hour: 'numeric' });
}

export function formatDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Wind degrees → 8-point compass label. Returns '—' when unknown. */
export function degToCompass(deg) {
  if (typeof deg !== 'number') return '—';
  return COMPASS[Math.round(deg / 45) % 8];
}
