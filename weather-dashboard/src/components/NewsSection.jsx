import { useEffect, useState } from 'react';
import { Newspaper } from '@phosphor-icons/react';
import { getWeatherNews } from '../lib/newsApi';

function timeAgo(iso) {
  const ts = Date.parse(iso);
  if (!ts) return '';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NewsSection() {
  const [state, setState] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let live = true;
    getWeatherNews().then(
      (items) => {
        if (live) setState({ status: items.length > 0 ? 'ready' : 'error', items });
      },
      () => {
        if (live) setState({ status: 'error', items: [] });
      },
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <section aria-label="Weather news">
      <div className="section-title" id="news">
        <h2>Weather News</h2>
        <span className="muted small">Global headlines</span>
      </div>

      {state.status === 'loading' && (
        <div className="news-grid" aria-hidden="true">
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
        <div className="news-grid">
          {state.items.map((n) => (
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
