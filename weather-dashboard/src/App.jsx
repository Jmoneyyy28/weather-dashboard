import { useCallback, useEffect, useRef, useState } from 'react';
import { CloudSun, X } from '@phosphor-icons/react';
import DetailPanel from './components/DetailPanel';
import HeroCard from './components/HeroCard';
import NewsSection from './components/NewsSection';
import OverviewGrid from './components/OverviewGrid';
import RadarMap from './components/RadarMap';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import WeatherEffects from './components/WeatherEffects';
import {
  getCurrentWeather,
  getForecast,
  hasApiKey,
  reverseGeocode,
} from './lib/weatherApi';
import { getTheme, getEffect, intensityBucket } from './lib/background';

const DEFAULTS = [
  { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
];

function placeId(lat, lon) {
  return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
}

const MAX_PLACES = 8;

export default function App() {
  const [places, setPlaces] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [units, setUnits] = useState('metric');
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoBusy, setGeoBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === '#/map' ? 'map' : 'home',
  );
  const keyPresent = hasApiKey();
  const unitsRef = useRef(units);
  unitsRef.current = units;
  // Mirrors for use inside callbacks without stale closures.
  const placesRef = useRef(places);
  placesRef.current = places;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const noticeTimer = useRef(null);

  const flashNotice = useCallback((text) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    if (text) {
      noticeTimer.current = setTimeout(() => setNotice(null), 5000);
    }
  }, []);

  const loadWeather = useCallback(async (place) => {
    const u = unitsRef.current;
    setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, loading: true, error: null } : p)));
    try {
      const [current, forecast] = await Promise.all([
        getCurrentWeather(place.lat, place.lon, u),
        getForecast(place.lat, place.lon, u),
      ]);
      setPlaces((prev) =>
        prev.map((p) => (p.id === place.id ? { ...p, current, forecast, loading: false, error: null } : p)),
      );
    } catch (err) {
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === place.id ? { ...p, loading: false, error: err.message } : p,
        ),
      );
    }
  }, []);

  const addPlace = useCallback(
    (loc) => {
      const id = placeId(loc.lat, loc.lon);
      const prev = placesRef.current;
      if (prev.some((p) => p.id === id)) {
        setSelectedId(id);
        flashNotice(null);
        return;
      }
      let next = [
        ...prev,
        { id, ...loc, current: null, forecast: null, loading: true, error: null },
      ];
      if (next.length > MAX_PLACES) {
        // Evict the oldest tile, never the just-added or currently viewed one.
        const victim = next.find((p) => p.id !== id && p.id !== selectedRef.current);
        if (victim) {
          next = next.filter((p) => p.id !== victim.id);
          flashNotice(`“${victim.name}” removed — dashboard holds max ${MAX_PLACES} places.`);
        }
      } else {
        flashNotice(null);
      }
      setPlaces(next);
      setSelectedId(id);
      // Defer fetch so state is committed first; loadWeather matches by id.
      setTimeout(() => loadWeather({ id, ...loc }), 0);
    },
    [loadWeather, flashNotice],
  );

  // Initial defaults.
  useEffect(() => {
    if (!hasApiKey()) return;
    DEFAULTS.forEach((d) => addPlace(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on unit change.
  useEffect(() => {
    if (places.length === 0) return;
    places.forEach((p) => loadWeather(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // Auto-refresh every 10 min.
  useEffect(() => {
    const t = setInterval(() => {
      setPlaces((prev) => {
        prev.forEach((p) => loadWeather(p));
        return prev;
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadWeather]);

  // View routing (hash-synced so #/map is shareable + back-button friendly).
  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#/map' ? 'map' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((v, anchor) => {
    window.location.hash = v === 'map' ? '/map' : '/';
    setView(v);
    if (v === 'home' && anchor) {
      // Let the home view render before scrolling to its section.
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  async function handleGeo() {
    if (!('geolocation' in navigator)) {
      setGeoStatus('Geolocation is not supported by this browser.');
      return;
    }
    if (!hasApiKey()) {
      setGeoStatus('Add your API key to .env first.');
      return;
    }
    setGeoStatus('Locating…');
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const rev = await reverseGeocode(latitude, longitude);
          const label = rev?.[0]?.name ?? 'Current location';
          const country = rev?.[0]?.country ?? '';
          addPlace({ name: label, country, lat: latitude, lon: longitude, isGeo: true });
          setGeoStatus('idle');
        } catch (err) {
          setGeoStatus(err.message);
        } finally {
          setGeoBusy(false);
        }
      },
      (err) => {
        setGeoStatus(`Location denied: ${err.message}`);
        setGeoBusy(false);
      },
      { timeout: 10000 },
    );
  }

  const selected = places.find((p) => p.id === selectedId) ?? places[0] ?? null;
  const theme = selected?.current ? getTheme(selected.current) : 'clear-night';
  const fx = selected?.current
    ? getEffect(selected.current, selected.forecast)
    : { type: 'clear-night', intensity: 1 };
  const fxBucket = intensityBucket(fx.intensity);

  return (
    <>
    <div className={`bg bg-${theme}`} key={theme} aria-hidden="true" />
    <WeatherEffects key={`${fx.type}-${fxBucket}`} effect={fx} />
    <div className="layout">
      <Sidebar units={units} onUnits={setUnits} onGeo={handleGeo} geoBusy={geoBusy} view={view} onNavigate={navigate} />

      <div className="main">
        {view === 'map' ? (
          <RadarMap places={places} selected={selected} onSelect={setSelectedId} />
        ) : (
        <>
        <div className="brandrow">
          <h1><CloudSun size={26} weight="duotone" className="inline-ico" /> 4Winds Weather</h1>
          <p className="muted">Your places at a glance — search, locate, compare.</p>
        </div>

        {!keyPresent && (
          <div className="banner">
            <strong>No API key found.</strong> Get a free key at{' '}
            <a href="https://home.openweathermap.org/users/sign_up" target="_blank" rel="noreferrer">
              openweathermap.org
            </a>{' '}
            then put it in <code>weather-dashboard/.env</code> as{' '}
            <code>VITE_OPENWEATHER_API_KEY=…</code> and restart <code>npm run dev</code>.
          </div>
        )}

        {geoStatus !== 'idle' && <p className="muted">{geoStatus}</p>}

        <SearchBar onPick={addPlace} disabled={!keyPresent} />

        {notice && (
          <p className="muted small">
            {notice}{' '}
            <button type="button" className="icon-btn" onClick={() => flashNotice(null)} title="Dismiss" aria-label="Dismiss">
              <X size={12} />
            </button>
          </p>
        )}

        <HeroCard place={selected} units={units} />

        <DetailPanel key={selected?.id ?? 'none'} place={selected} units={units} />

        <OverviewGrid
          places={places}
          selectedId={selected?.id}
          units={units}
          maxPlaces={MAX_PLACES}
          onSelect={setSelectedId}
          onRemove={(id) => {
            setPlaces((prev) => prev.filter((p) => p.id !== id));
            if (selectedId === id) setSelectedId(null);
          }}
        />

        <NewsSection />

        <footer className="muted small">
          Data: OpenWeatherMap (free tier — current + 5-day forecast). Refreshes every 10 min.
        </footer>
        </>
        )}
      </div>
    </div>
    </>
  );
}
