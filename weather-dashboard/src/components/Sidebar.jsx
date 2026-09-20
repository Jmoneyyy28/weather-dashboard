import {
  CalendarDot,
  CircleNotch,
  CloudSun,
  GridFour,
  ListBullets,
  MapPin,
  MapTrifold,
} from '@phosphor-icons/react';

export default function Sidebar({ units, onUnits, onGeo, geoBusy, view, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="side-brand" title="Weather Dashboard">
        <CloudSun size={26} weight="duotone" />
      </div>
      <nav className="side-nav">
        <button type="button" onClick={() => onNavigate('today')} title="Today" className={view === 'today' ? 'active' : ''}>
          <span className="side-ico"><CalendarDot size={20} /></span>
          <span className="side-lbl">Today</span>
        </button>
        <button type="button" onClick={() => onNavigate('places')} title="Places" className={view === 'places' ? 'active' : ''}>
          <span className="side-ico"><GridFour size={20} /></span>
          <span className="side-lbl">Places</span>
        </button>
        <button type="button" onClick={() => onNavigate('details')} title="Details" className={view === 'details' ? 'active' : ''}>
          <span className="side-ico"><ListBullets size={20} /></span>
          <span className="side-lbl">Details</span>
        </button>
        <button type="button" onClick={() => onNavigate('map')} title="Radar map" className={view === 'map' ? 'active' : ''}>
          <span className="side-ico"><MapTrifold size={20} /></span>
          <span className="side-lbl">Radar</span>
        </button>
      </nav>
      <div className="side-div" />
      <button type="button" className="side-btn" onClick={onGeo} title="Use my location">
        <span className="side-ico">
          {geoBusy ? <CircleNotch size={20} className="spin" /> : <MapPin size={20} />}
        </span>
        <span className="side-lbl">Locate</span>
      </button>
      <div className="side-units">
        <button
          type="button"
          className={units === 'metric' ? 'on' : ''}
          onClick={() => onUnits('metric')}
          title="Celsius"
        >
          °C
        </button>
        <button
          type="button"
          className={units === 'imperial' ? 'on' : ''}
          onClick={() => onUnits('imperial')}
          title="Fahrenheit"
        >
          °F
        </button>
      </div>
    </aside>
  );
}
