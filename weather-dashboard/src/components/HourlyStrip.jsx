import { useRef, useState } from 'react';
import { Drop, DropHalf, Wind } from '@phosphor-icons/react';
import { formatHour, getDailyForecast, getHourlySlice } from '../lib/aggregate';
import { trackShine } from '../lib/shine';
import WeatherIcon from '../lib/weatherIcons';

export default function HourlyStrip({ forecast, units }) {
  const [hoverHour, setHoverHour] = useState(null);
  const [selHour, setSelHour] = useState(null);
  const touchStart = useRef(null);
  if (!forecast) return null;

  const unit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';
  const hourly = getHourlySlice(forecast, 10);
  const dayCount = getDailyForecast(forecast).length;
  // Hover live-previews on desktop; tap pins a selection for touch.
  const activeHour = hoverHour ?? selHour ?? 0;
  const peek = hourly[Math.min(activeHour, hourly.length - 1)];
  const toggleHour = (i) => setSelHour((prev) => (prev === i ? null : i));

  return (
    <>
      <div className="section-title">
        <h2>Today</h2>
        <span className="link">Next {dayCount} Days</span>
      </div>
      <div className="hourly">
        {hourly.map((h, i) => (
          <div
            key={h.dt}
            className={`hour shine${i === 0 ? ' now' : ''}${i === selHour ? ' sel' : ''}`}
            onMouseEnter={() => setHoverHour(i)}
            onMouseLeave={() => setHoverHour(null)}
            onMouseMove={trackShine}
            onFocus={() => setHoverHour(i)}
            onBlur={() => setHoverHour(null)}
            onPointerDown={(e) => {
              touchStart.current = [e.clientX, e.clientY];
            }}
            onClick={(e) => {
              // Swiping the strip to scroll must not pin an hour.
              const s = touchStart.current;
              if (s && Math.hypot(e.clientX - s[0], e.clientY - s[1]) > 10) return;
              toggleHour(i);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleHour(i);
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={i === selHour}
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
          <strong>{activeHour ? formatHour(peek.dt_txt) : 'Now'}</strong>
          <span className="cap"> · {peek.weather[0].description}</span>
          <span> · feels {Math.round(peek.main.feels_like)}{unit}</span>
          <span> · <Drop size={13} className="inline-ico" /> {Math.round((peek.pop ?? 0) * 100)}%</span>
          <span> · <DropHalf size={13} className="inline-ico" /> {peek.main.humidity}%</span>
          <span> · <Wind size={13} className="inline-ico" /> {Math.round(peek.wind.speed)}{windUnit}</span>
        </p>
      )}
    </>
  );
}
