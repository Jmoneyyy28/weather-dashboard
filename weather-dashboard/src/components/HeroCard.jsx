import { Drop, MapPin } from '@phosphor-icons/react';
import { trackShine } from '../lib/shine';
import WeatherIcon from '../lib/weatherIcons';

export default function HeroCard({ place, units }) {
  const unit = units === 'metric' ? '°' : '°';

  if (!place) {
    return (
      <section className="hero hero-empty" id="today">
        <p className="muted">Search for a city or use your location to see the weather.</p>
      </section>
    );
  }
  if (place.loading || !place.current) {
    return (
      <section className="hero hero-empty" id="today">
        <p className="muted">Loading {place.name}…</p>
      </section>
    );
  }
  if (place.error) {
    return (
      <section className="hero hero-empty" id="today">
        <p className="error">{place.error}</p>
      </section>
    );
  }

  const { current } = place;
  const date = new Date(current.dt * 1000).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <section className="hero shine" id="today" onMouseMove={trackShine}>
      <div className="hero-blob" aria-hidden="true" />
      <div className="hero-left">
        <h2 className="hero-city">
          {place.isGeo && <MapPin size={20} weight="fill" className="inline-ico" />}
          {current.name}
        </h2>
        <p className="hero-date muted">{date}</p>
        <WeatherIcon
          id={current.weather[0].id}
          icon={current.weather[0].icon}
          size={120}
          weight="duotone"
          alt={current.weather[0].description}
        />
      </div>
      <div className="hero-right">
        <p className="hero-cond cap">{current.weather[0].description}</p>
        <div className="hero-temp">
          {Math.round(current.main.temp)}
          <span>{unit}</span>
        </div>
        <p className="hero-minmax">
          Max: {Math.round(current.main.temp_max)}{unit} &nbsp; Min:{' '}
          {Math.round(current.main.temp_min)}
          {unit}
        </p>
        <div className="hero-chip"><Drop size={13} weight="bold" className="inline-ico" /> Pressure: {current.main.pressure} hPa</div>
      </div>
    </section>
  );
}
