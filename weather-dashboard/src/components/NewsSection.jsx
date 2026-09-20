import { useEffect, useRef, useState } from 'react';
import { Newspaper } from '@phosphor-icons/react';
import { getWeatherNews } from '../lib/newsApi';

const REFRESH_MS = 60 * 60 * 1000;

function timeAgo(iso) {
  const ts = Date.parse(iso);
  if (!ts) return '';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NewsSection({ limit = null, teaser = false, swipe = false }) {
  const [state, setState] = useState({ status: 'loading', items: [], updatedAt: null });
  const lastFetch = useRef(0);
  const items = limit != null ? state.items.slice(0, limit) : state.items;

  useEffect(() => {
    let live = true;
    const sameLineup = (a, b) =>
      a.length === b.length && a.every((item, i) => item.link === b[i]?.link);

    const load = async (force) => {
      let items = [];
      try {
        items = await getWeatherNews(force);
      } catch {
        items = [];
      }
      if (!live) return;
      setState((prev) => {
        if (items.length > 0) {
          if (prev.status === 'ready' && sameLineup(prev.items, items)) return prev;
          return { status: 'ready', items, updatedAt: Date.now() };
        }
        // Empty result: only the initial load can land in the error state;
        // later refreshes silently keep showing the stale stories.
        return prev.status === 'ready'
          ? prev
          : { status: 'error', items: [], updatedAt: null };
      });
    };

    // NOTE: the initial load is unconditional on purpose. With StrictMode's
    // double-effect in dev, a staleness guard here would let the discarded
    // pass consume the fetch while the live pass skips it. Only the
    // interval / visibility triggers below are staleness-guarded.
    lastFetch.current = Date.now();
    load(false);
    const timer = setInterval(() => {
      if (document.hidden) return;
      lastFetch.current = Date.now();
      load(true);
    }, REFRESH_MS);
    const onVis = () => {
      if (document.hidden) return;
      if (Date.now() - lastFetch.current < REFRESH_MS) return;
      lastFetch.current = Date.now();
      load(false);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const updated = state.updatedAt
    ? new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section aria-label="Weather news">
      <div className="section-title" id="news">
        <h2>{teaser ? 'Top Stories' : 'Weather News'}</h2>
        {teaser ? (
          <a className="link" href="#/news">All news →</a>
        ) : (
          <span className="muted small">
            Global headlines
            {updated && ` · updated ${updated}`}
          </span>
        )}
      </div>

      {state.status === 'loading' && (
        <div className={`news-grid${swipe ? ' swipe' : ''}`} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="news-card skeleton">
              <div className="sk-thumb" />
              <div className="sk-line" />
              <div className="sk-line short" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <p className="muted small">Headlines unavailable right now — check your connection and try again later.</p>
      )}

      {state.status === 'ready' && (
        <div className={`news-grid${swipe ? ' swipe' : ''}`}>
          {items.map((n) => (
            <a key={n.id} className="news-card" href={n.link} target="_blank" rel="noreferrer" title={n.title}>
              {n.thumbnail ? (
                <img src={n.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <span className="news-fallback" aria-hidden="true">
                  <Newspaper size={28} />
                </span>
              )}
              <div className="news-body">
                <span className="muted small">
                  {n.source}
                  {n.publishedAt && ` · ${timeAgo(n.publishedAt)}`}
                </span>
                <strong>{n.title}</strong>
                {n.description && <span className="muted small clamp">{n.description}</span>}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
