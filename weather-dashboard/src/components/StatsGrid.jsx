import { useState } from 'react';
import { Drop, DropHalf, Eye, Gauge, Thermometer, Wind } from '@phosphor-icons/react';
import { degToCompass } from '../lib/aggregate';

function Stat({ icon, value, label, open, onToggle, children }) {
  return (
    <div
      className={`stat${open ? ' open' : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      title="Click for more details"
    >
      <div className="stat-ico">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
      {open && <div className="stat-x">{children}</div>}
    </div>
  );
}

/** Dew point via the Magnus formula (input in °C, output in °C). */
function dewPointC(tC, rh) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tC) / (b + tC)) + Math.log(Math.max(rh, 1) / 100);
  return (b * alpha) / (a - alpha);
}

export default function StatsGrid({ current, forecast, units, extended = false }) {
  const [openStat, setOpenStat] = useState(null);
  if (!current || !forecast) return null;

  const unit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';
  const rainMm = current.rain?.['1h'] ?? current.rain?.['3h'] ?? 0;
  const precip = rainMm > 0 ? `${rainMm}mm` : `${Math.round((forecast.list[0]?.pop ?? 0) * 100)}%`;
  const visibility = current.visibility != null ? `${(current.visibility / 1000).toFixed(1)}km` : '—';
  const toggleStat = (id) => setOpenStat((prev) => (prev === id ? null : id));

  const tempC = units === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const dewC = dewPointC(tempC, current.main.humidity);
  const dew = units === 'metric' ? Math.round(dewC) : Math.round((dewC * 9) / 5 + 32);
  const feels = Math.round(current.main.feels_like);
  const actual = Math.round(current.main.temp);
  const gap = feels - actual;

  return (
    <div className={`stats${extended ? ' six' : ''}`}>
      <Stat
        icon={<Gauge size={22} />}
        value={`${current.main.pressure}hPa`}
        label="pressure"
        open={openStat === 'pressure'}
        onToggle={() => toggleStat('pressure')}
      >
        <div><span>sea level</span><strong>{current.main.sea_level ?? '—'}hPa</strong></div>
        <div><span>ground</span><strong>{current.main.grnd_level ?? '—'}hPa</strong></div>
      </Stat>
      <Stat
        icon={<Drop size={22} />}
        value={precip}
        label="precipitation"
        open={openStat === 'precip'}
        onToggle={() => toggleStat('precip')}
      >
        <div><span>last 1h</span><strong>{current.rain?.['1h'] ?? 0}mm</strong></div>
        <div><span>chance 3h</span><strong>{Math.round((forecast.list[0]?.pop ?? 0) * 100)}%</strong></div>
      </Stat>
      <Stat
        icon={<Wind size={22} />}
        value={`${Math.round(current.wind.speed)}${windUnit}`}
        label="speed wind"
        open={openStat === 'wind'}
        onToggle={() => toggleStat('wind')}
      >
        <div><span>gust</span><strong>{current.wind.gust != null ? `${Math.round(current.wind.gust)}${windUnit}` : '—'}</strong></div>
        <div><span>direction</span><strong>{degToCompass(current.wind.deg)}{current.wind.deg != null ? ` ${current.wind.deg}°` : ''}</strong></div>
      </Stat>
      <Stat
        icon={<Eye size={22} />}
        value={visibility}
        label="visibility"
        open={openStat === 'vis'}
        onToggle={() => toggleStat('vis')}
      >
        <div><span>clouds</span><strong>{current.clouds?.all ?? '—'}%</strong></div>
        <div><span>humidity</span><strong>{current.main.humidity}%</strong></div>
      </Stat>
      {extended && (
        <>
          <Stat
            icon={<Thermometer size={22} />}
            value={`${feels}${unit}`}
            label="feels like"
            open={openStat === 'feels'}
            onToggle={() => toggleStat('feels')}
          >
            <div><span>actual</span><strong>{actual}{unit}</strong></div>
            <div><span>difference</span><strong>{gap > 0 ? `+${gap}` : gap}{unit}</strong></div>
          </Stat>
          <Stat
            icon={<DropHalf size={22} />}
            value={`${current.main.humidity}%`}
            label="humidity"
            open={openStat === 'humidity'}
            onToggle={() => toggleStat('humidity')}
          >
            <div><span>dew point</span><strong>{dew}{unit}</strong></div>
            <div><span>cloud cover</span><strong>{current.clouds?.all ?? '—'}%</strong></div>
          </Stat>
        </>
      )}
    </div>
  );
}
