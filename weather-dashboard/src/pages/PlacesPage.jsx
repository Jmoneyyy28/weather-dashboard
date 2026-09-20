import SearchBar from '../components/SearchBar';
import HeroCard from '../components/HeroCard';
import StatsGrid from '../components/StatsGrid';
import HourlyStrip from '../components/HourlyStrip';
import DailySection from '../components/DailySection';
import PlaceMeta from '../components/PlaceMeta';

export default function PlacesPage({ places, selected, units, keyPresent, onPick, onSelect }) {
  const hasData =
    selected != null &&
    !selected.loading &&
    !selected.error &&
    selected.current != null &&
    selected.forecast != null;
  const placeState = !selected ? (
    <p className="muted">Search for a city or use your location to see the weather.</p>
  ) : (
    <p className={selected.error ? 'error' : 'muted'}>
      {selected.error ?? `Loading ${selected.name}…`}
    </p>
  );

  return (
    <>
      <div className="section-title">
        <h2>Places</h2>
        <span className="muted small">
          {selected ? `${selected.name}${selected.country ? `, ${selected.country}` : ''}` : 'no place selected'}
        </span>
      </div>
      {places.length > 1 && (
        <div className="place-strip static" role="group" aria-label="Switch place">
          {places.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`place-chip${p.id === selected?.id ? ' active' : ''}`}
              onClick={() => onSelect(p.id)}
              title={`Show ${p.name}`}
            >
              <span>{p.name}</span>
              {p.current && (
                <strong>
                  {Math.round(p.current.main.temp)}
                  {units === 'metric' ? '°C' : '°F'}
                </strong>
              )}
            </button>
          ))}
        </div>
      )}
      <SearchBar onPick={onPick} disabled={!keyPresent} />
      {!hasData ? (
        placeState
      ) : (
        <>
          <HeroCard place={selected} units={units} />
          <StatsGrid
            key={`s-${selected.id}`}
            extended
            current={selected.current}
            forecast={selected.forecast}
            units={units}
          />
          <HourlyStrip key={`h-${selected.id}`} forecast={selected.forecast} units={units} />
          <DailySection
            key={`d-${selected.id}`}
            current={selected.current}
            forecast={selected.forecast}
            units={units}
          />
          <PlaceMeta place={selected} />
        </>
      )}
    </>
  );
}
