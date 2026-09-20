import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pause, Play, SkipBack, SkipForward } from '@phosphor-icons/react';
import SearchBar from './SearchBar';
import { getApiKey } from '../lib/weatherApi';
import { OWM_OVERLAYS, getRadarFrames, owmTile, rainviewerTile } from '../lib/radarApi';

const FRAME_MS = 1200;

function frameLabel(time) {
  return new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function unitSymbol(units) {
  return units === 'metric' ? '°C' : '°F';
}

export default function RadarMap({ places, selected, onSelect, onPick, keyPresent, units, mini = false, onOpen }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const radarRef = useRef([]);
  const owmRef = useRef({});
  const markersRef = useRef(null);
  const timerRef = useRef(null);
  const idxRef = useRef(0);
  const playingRef = useRef(true);
  const framesRef = useRef([]);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [frameIdx, setFrameIdx] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [activeLayer, setActiveLayer] = useState('radar');
  const [tilesLoading, setTilesLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  const showFrame = (i) => {
    idxRef.current = i;
    radarRef.current.forEach((layer, j) => layer.setOpacity(j === i ? 0.85 : 0));
    setFrameIdx(i);
  };

  const step = (dir) => {
    const n = framesRef.current.length;
    if (n === 0) return;
    showFrame((idxRef.current + dir + n) % n);
  };

  const togglePlay = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  // Init map + radar frames once per mount (view switch remounts).
  useEffect(() => {
    const map = L.map(hostRef.current, {
      zoomControl: !mini,
      dragging: !mini,
      scrollWheelZoom: !mini,
      doubleClickZoom: !mini,
      boxZoom: !mini,
      keyboard: !mini,
      worldCopyJump: true,
    }).setView(
      [selected?.lat ?? 20, selected?.lon ?? 0],
      5,
    );
    if (!mini) L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Powered by <a href="https://www.esri.com/">Esri</a> &mdash; Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
      maxNativeZoom: 16,
    }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      maxNativeZoom: 16,
    }).addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    let cancelled = false;
    getRadarFrames().then(
      (frames) => {
        if (cancelled) return;
        framesRef.current = frames;
        radarRef.current = frames.map((f) =>
          L.tileLayer(rainviewerTile(f.path), {
            opacity: 0,
            zIndex: 500,
            keepBuffer: 1,
            attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
          }).addTo(map),
        );
        setFrameCount(frames.length);
        showFrame(frames.length - 1);
        setStatus('ready');
        // Mini overview tile shows the latest frame statically (cheap).
        if (!mini) {
          timerRef.current = setInterval(() => {
            if (playingRef.current && document.visibilityState === 'visible') step(1);
          }, FRAME_MS);
        }
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      map.remove();
      mapRef.current = null;
      radarRef.current = [];
      owmRef.current = {};
      framesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry]);

  // Saved-place markers.
  useEffect(() => {
    const group = markersRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    places.forEach((p) => {
      const active = p.id === selected?.id;
      const marker = L.marker([p.lat, p.lon], {
        icon: L.divIcon({
          className: 'radar-pin-wrap',
          html: `<span class="radar-pin${active ? ' active' : ''}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
        title: p.name,
        keyboard: false,
      });
      marker.on('click', () => onSelect(p.id));
      marker.addTo(group);
    });
  }, [places, selected?.id, onSelect]);

  // Follow the selected place (skip tiny/no-op moves like marker clicks).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selected == null) return;
    const c = map.getCenter();
    if (Math.abs(c.lat - selected.lat) + Math.abs(c.lng - selected.lon) > 1) {
      map.flyTo([selected.lat, selected.lon], Math.max(map.getZoom(), 4), { duration: 0.8 });
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Overlay switching: radar frames vs one OWM layer at a time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    const radarOn = activeLayer === 'radar';
    radarRef.current.forEach((layer, j) =>
      layer.setOpacity(radarOn && j === idxRef.current ? 0.85 : 0),
    );
    Object.values(owmRef.current).forEach((layer) => map.removeLayer(layer));
    if (!radarOn) {
      const def = OWM_OVERLAYS.find((o) => o.id === activeLayer);
      if (def && keyPresent) {
        if (!owmRef.current[def.id]) {
          owmRef.current[def.id] = L.tileLayer(owmTile(def.layer, getApiKey()), {
            opacity: 0.55,
            zIndex: 480,
            keepBuffer: 1,
            attribution: 'Weather: <a href="https://openweathermap.org/">OpenWeatherMap</a>',
          });
        }
        const layer = owmRef.current[def.id];
        setTilesLoading(true);
        layer.once('load', () => setTilesLoading(false));
        layer.addTo(map);
      }
    } else {
      setTilesLoading(false);
    }
  }, [activeLayer, status, keyPresent]);

  const currentFrame = framesRef.current[frameIdx];

  return (
    <section aria-label="Live weather radar">
      {!mini && (
      <div className="section-title">
        <h2>Live Radar</h2>
        <span className="muted small">
          {status === 'ready' && currentFrame ? `Precipitation · ${frameLabel(currentFrame.time)}` : 'Precipitation radar'}
        </span>
        <span className="seg" role="group" aria-label="Map layer">
          <button
            type="button"
            className={activeLayer === 'radar' ? 'on' : ''}
            onClick={() => setActiveLayer('radar')}
          >
            Radar
          </button>
          {OWM_OVERLAYS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`${activeLayer === o.id ? 'on' : ''}${tilesLoading && activeLayer === o.id ? ' loading' : ''}`}
              onClick={() => keyPresent && setActiveLayer(o.id)}
              disabled={!keyPresent}
              title={keyPresent ? `${o.label} overlay` : 'Needs an OpenWeatherMap API key'}
            >
              {o.label}
            </button>
          ))}
        </span>
      </div>
      )}

      <div className="radar-wrap">
        {!mini && (
        <div className="radar-search">
          <SearchBar onPick={onPick} disabled={!keyPresent} />
        </div>
        )}
        <div
          ref={hostRef}
          className={`radar-host${mini ? ' mini' : ''}`}
          role="application"
          aria-label={mini ? 'Radar preview, activate to open the full map' : 'Interactive weather radar map'}
          {...(mini
            ? {
                tabIndex: 0,
                onClick: () => onOpen?.(),
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen?.();
                  }
                },
              }
            : {})}
        />
        {status === 'loading' && (
          <div className="radar-veil">
            <p className="muted">Loading radar frames…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="radar-veil">
            <p className="muted">Radar unavailable right now — check your connection.</p>
            <button type="button" className="daytab" onClick={() => { setStatus('loading'); setRetry((r) => r + 1); }}>
              Retry
            </button>
          </div>
        )}
        {status === 'ready' && !mini && activeLayer === 'radar' && frameCount > 1 && (
          <div className="radar-timeline" role="group" aria-label="Radar animation controls">
            <button type="button" className="carousel-btn" onClick={() => step(-1)} title="Previous frame" aria-label="Previous radar frame">
              <SkipBack size={16} weight="bold" />
            </button>
            <button type="button" className="carousel-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause radar animation' : 'Play radar animation'}>
              {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
            </button>
            <button type="button" className="carousel-btn" onClick={() => step(1)} title="Next frame" aria-label="Next radar frame">
              <SkipForward size={16} weight="bold" />
            </button>
            <span className="muted small">
              {frameIdx + 1}/{frameCount} · {currentFrame ? frameLabel(currentFrame.time) : ''}
            </span>
          </div>
        )}
        {!mini && places.length > 1 && (
          <div className="place-strip" role="group" aria-label="Jump to a saved place">
            {places.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`place-chip${p.id === selected?.id ? ' active' : ''}`}
                onClick={() => onSelect(p.id)}
                title={`Show ${p.name} on the map`}
              >
                <span>{p.name}</span>
                {p.current && (
                  <strong>
                    {Math.round(p.current.main.temp)}
                    {unitSymbol(units)}
                  </strong>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {!mini && (
      <p className="muted small tier-note">
        Radar: RainViewer (free) · overlays: OpenWeatherMap · markers jump to your places.
      </p>
      )}
    </section>
  );
}
