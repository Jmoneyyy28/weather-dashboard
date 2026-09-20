import { Drop, Gauge, MapPin, Thermometer, Wind, X } from '@phosphor-icons/react';
import WeatherIcon from '../lib/weatherIcons';

function unitSymbol(units) {
  return units === 'metric' ? '°C' : '°F';
}

function windUnit(units) {
  return units === 'metric' ? 'm/s' : 'mph';
}

export default function OverviewGrid({ places, selectedId, units, maxPlaces, onSelect, onRemove }) {
  const head = (
    <div className="section-title" id="overview">
      <h2>Overview</h2>
      <span className="muted small">
        {places.length}/{maxPlaces} places
        {places.length >= maxPlaces && ' — full, oldest tile auto-replaced'}
      </span>
    </div>
  );

  if (places.length === 0) {
    return (
      <>
        {head}
        <p className="muted">No places yet — search above or use your location.</p>
      </>
    );
  }
  return (
    <>
      {head}
      <div className="grid" role="region" aria-label="Saved places">
        {places.map((p) => {
          const c = p.current;
          const active = p.id === selectedId;
          return (
            <article
              key={p.id}
              className={`card${active ? ' active' : ''}`}
              onClick={() => onSelect(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={active}
              title="Click to view details"
            >
              <header>
                <div>
                  <h3>
                    {p.isGeo && <MapPin size={14} weight="fill" className="inline-ico" />}
                    {p.name}
                  </h3>
                  <span className="muted small">{p.country}</span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  title="Remove"
                  aria-label={`Remove ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(p.id);
                  }}
                >
                  <X size={14} />
                </button>
              </header>
              {p.loading && <p className="muted">Loading…</p>}
              {p.error && <p className="error small">{p.error}</p>}
              {c && (
                <>
                  <div className="card-main">
                    <WeatherIcon
                      id={c.weather[0].id}
                      icon={c.weather[0].icon}
                      size={64}
                      alt={c.weather[0].description}
                    />
                    <div className="temp">
                      {Math.round(c.main.temp)}
                      {unitSymbol(units)}
                    </div>
                  </div>
                  <p className="cap">{c.weather[0].description}</p>
                  <div className="card-meta">
                    <span>H {Math.round(c.main.temp_max)}{unitSymbol(units)}</span>
                    <span>L {Math.round(c.main.temp_min)}{unitSymbol(units)}</span>
                  </div>
                  <div className="card-meta muted small">
                    <span><Drop size={13} className="inline-ico" /> {c.main.humidity}%</span>
                    <span>
                      <Wind size={13} className="inline-ico" /> {Math.round(c.wind.speed)} {windUnit(units)}
                    </span>
                  </div>
                  <div className="card-meta muted small">
                    <span>
                      <Thermometer size={13} className="inline-ico" /> feels {Math.round(c.main.feels_like)}{unitSymbol(units)}
                    </span>
                    <span>
                      <Gauge size={13} className="inline-ico" /> {c.main.pressure}hPa
                    </span>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
