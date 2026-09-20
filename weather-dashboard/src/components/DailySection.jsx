import { useState } from 'react';
import { SunHorizon, Thermometer } from '@phosphor-icons/react';
import { formatDay, getDailyForecast } from '../lib/aggregate';

function sunTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DailySection({ current, forecast, units }) {
  const [selDay, setSelDay] = useState(0);
  if (!current || !forecast) return null;

  const unit = units === 'metric' ? '°C' : '°F';
  const daily = getDailyForecast(forecast);
  const active = daily[Math.min(selDay, daily.length - 1)];

  return (
    <>
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

      <p className="muted small tier-note">Free OpenWeatherMap tier provides ~5 days of forecast.</p>
    </>
  );
}
