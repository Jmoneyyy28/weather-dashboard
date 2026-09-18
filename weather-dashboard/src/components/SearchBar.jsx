import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { hasApiKey, searchLocations } from '../lib/weatherApi';

export default function SearchBar({ onPick, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  function debouncedSearch(value) {
    clearTimeout(timer.current);
    if (value.trim().length < 2 || !hasApiKey()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchLocations(value.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function pick(r) {
    onPick({ name: r.name, country: r.country, lat: r.lat, lon: r.lon });
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="search" ref={boxRef}>
      <span className="search-ico" aria-hidden="true"><MagnifyingGlass size={16} /></span>
      <input
        value={query}
        disabled={disabled}
        placeholder={hasApiKey() ? 'Type a city… e.g. Paris' : 'Add API key to .env to search'}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) pick(results[0]);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {searching && <span className="search-spin" aria-label="searching" />}
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button type="button" onClick={() => pick(r)}>
                <strong>{r.name}</strong>
                <span>
                  {r.state ? `${r.state}, ` : ''}
                  {r.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
