import { ArrowClockwise, Clock, MapPin } from '@phosphor-icons/react';

function tzLabel(seconds) {
  if (seconds == null) return '—';
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.round((abs % 3600) / 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

function ageLabel(dt) {
  if (dt == null) return '—';
  const s = Math.max(0, Math.round(Date.now() / 1000 - dt));
  if (s < 60) return 'just now';
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export default function PlaceMeta({ place }) {
  const current = place?.current;
  if (!place || !current) return null;
  return (
    <div className="suns" aria-label="Place details">
      <div>
        <MapPin size={20} className="inline-ico" /> {Number(place.lat).toFixed(2)}, {Number(place.lon).toFixed(2)} <span>coordinates</span>
      </div>
      <div>
        <Clock size={20} className="inline-ico" /> {tzLabel(current.timezone)} <span>timezone</span>
      </div>
      <div>
        <ArrowClockwise size={20} className="inline-ico" /> {ageLabel(current.dt)} <span>data updated</span>
      </div>
    </div>
  );
}
