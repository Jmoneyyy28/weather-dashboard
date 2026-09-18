/**
 * Global weather headlines via keyless RSS feeds (BBC Weather + Phys.org Earth),
 * proxied through rss2json (CORS-friendly, no API key). Results are merged,
 * deduped, newest-first, and cached in memory for 60 minutes to stay far
 * under the proxy's free quota.
 */

const FEEDS = [
  { source: 'BBC Weather', url: 'https://feeds.bbci.co.uk/news/weather/rss.xml' },
  { source: 'Phys.org Earth', url: 'https://phys.org/rss-feed/earth-news/' },
];

const TTL = 60 * 60 * 1000;
const MAX_ITEMS = 8;

let cache = { at: 0, items: [] };

function stripHtml(s) {
  return String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  const t = stripHtml(s);
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

async function fetchFeed({ source, url }) {
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('bad feed payload');
  return data.items
    .filter((i) => i && i.link && i.title)
    .map((i) => ({
      id: i.guid || i.link,
      title: stripHtml(i.title),
      link: i.link,
      source,
      publishedAt: i.pubDate || '',
      ts: Date.parse(i.pubDate) || 0,
      description: truncate(i.description || i.content || '', 140),
      thumbnail: i.thumbnail || i.enclosure?.link || null,
    }));
}

export async function getWeatherNews() {
  if (Date.now() - cache.at < TTL && cache.items.length > 0) return cache.items;
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const seen = new Map();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (!seen.has(item.link)) seen.set(item.link, item);
    }
  }
  const items = [...seen.values()].sort((a, b) => b.ts - a.ts).slice(0, MAX_ITEMS);
  if (items.length > 0) cache = { at: Date.now(), items };
  // On total failure return stale cache (possibly []) — the UI falls back gracefully.
  return items.length > 0 ? items : cache.items;
}
