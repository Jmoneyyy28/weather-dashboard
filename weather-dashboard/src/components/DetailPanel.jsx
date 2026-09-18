import { useState } from 'react';
import { Drop, DropHalf, Eye, Gauge, SunHorizon, Thermometer, Wind } from '@phosphor-icons/react';
import { degToCompass, formatDay, formatHour, getDailyForecast, getHourlySlice } from '../lib/aggregate';
import { trackShine } from '../lib/shine';
import WeatherIcon from '../lib/weatherIcons';

function sunTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

export default function DetailPanel({ place, units }) {
  const [selDay, setSelDay] = useState(0);
  const [hoverHour, setHoverHour] = useState(null);
  const [openStat, setOpenStat] = useState(null);

  if (!place) return <p className="muted">Select a place to see details.</p>;
  if (place.loading) return <p className="muted">Loading {place.name}…</p>;
  if (place.error) return <p className="error">{place.error}</p>;
  if (!place.current || !place.forecast) return null;

  const { current, forecast } = place;
  const unit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';
  const hourly = getHourlySlice(forecast, 10);
  const daily = getDailyForecast(forecast);
  const active = daily[Math.min(selDay, daily.length - 1)];
  const peek = hourly[Math.min(hoverHour ?? 0, hourly.length - 1)];

  const rainMm = current.rain?.['1h'] ?? current.rain?.['3h'] ?? 0;
  const precip = rainMm > 0 ? `${rainMm}mm` : `${Math.round((forecast.list[0]?.pop ?? 0) * 100)}%`;
  const visibility = current.visibility != null ? `${(current.visibility / 1000).toFixed(1)}km` : '—';
  const toggleStat = (id) => setOpenStat((prev) => (prev === id ? null : id));

  return (
    <section id="details">
      <div className="stats">
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
      </div>

      <div className="section-title">
        <h2>Today</h2>
        <span className="link">Next {daily.length} Days</span>
      </div>
      <div className="hourly">
        {hourly.map((h, i) => (
          <div
            key={h.dt}
            className={`hour shine${i === 0 ? ' now' : ''}`}
            onMouseEnter={() => setHoverHour(i)}
            onMouseLeave={() => setHoverHour(null)}
            onMouseMove={trackShine}
            onFocus={() => setHoverHour(i)}
            onBlur={() => setHoverHour(null)}
            tabIndex={0}
            aria-label={`${i === 0 ? 'Now' : formatHour(h.dt_txt)}: ${Math.round(h.main.temp)}${unit}, ${h.weather[0].description}`}
          >
            <span className="t muted">{i === 0 ? 'Now' : formatHour(h.dt_txt)}</span>
            <WeatherIcon id={h.weather[0].id} icon={h.weather[0].icon} size={42} alt={h.weather[0].description} />
            <strong>
              {Math.round(h.main.temp)}
              {unit}
            </strong>
          </div>
        ))}
      </div>
      {peek && (
        <p className="readout small" aria-live="polite">
          <strong>{hoverHour ? formatHour(peek.dt_txt) : 'Now'}</strong>
          <span className="cap"> · {peek.weather[0].description}</span>
          <span> · feels {Math.round(peek.main.feels_like)}{unit}</span>
          <span> · <Drop size={13} className="inline-ico" /> {Math.round((peek.pop ?? 0) * 100)}%</span>
          <span> · <DropHalf size={13} className="inline-ico" /> {peek.main.humidity}%</span>
          <span> · <Wind size={13} className="inline-ico" /> {Math.round(peek.wind.speed)}{windUnit}</span>
        </p>
      )}

      <div className="section-title">
        <h2>Daily</h2>
      </div>
      <div className="daytabs">
        {daily.map((d, i) => (
          <button
            key={d.date}
            type="button"
            className={`daytab${i === selDay ? ' active' : ''}`}
            onClick={() => setSelDay(i)}
          >
            {i === 0 ? 'Today' : formatDay(d.date).split(',')[0]}
            <strong>
              {d.max}
              {unit}
            </strong>
          </button>
        ))}
      </div>

      {active && (
        <div className="suns">
          <div>
            <SunHorizon size={20} className="inline-ico" /> {sunTime(current.sys.sunrise)} <span>sunrise</span>
          </div>
          <div>
            <SunHorizon size={20} className="inline-ico flip-y" /> {sunTime(current.sys.sunset)} <span>sunset</span>
          </div>
          <div>
            <Thermometer size={20} className="inline-ico" /> {active.min}
            {unit} / {active.max}
            {unit} <span className="cap">{active.description}</span>
          </div>
        </div>
      )}

      <ul className="daily">
        {daily.map((d, i) => (
          <li key={d.date} className={i === selDay ? 'sel' : ''} onClick={() => setSelDay(i)}>
            <span>{i === 0 ? 'Today' : formatDay(d.date)}</span>
            <span className="daily-mid">
              <WeatherIcon id={d.iconId} icon={d.icon} size={32} alt={d.description} />
              <span className="cap muted small">{d.description}</span>
            </span>
            <span>
              <strong>
                {d.max}
                {unit}
              </strong>{' '}
              <span className="muted">
                / {d.min}
                {unit}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="muted small tier-note">Free OpenWeatherMap tier provides ~5 days of forecast.</p>
    </section>
  );
}
