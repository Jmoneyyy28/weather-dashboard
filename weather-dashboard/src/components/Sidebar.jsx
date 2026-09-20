import {
  CircleNotch,
  CloudSun,
  House,
  MapPin,
  MapTrifold,
  Newspaper,
} from '@phosphor-icons/react';

export default function Sidebar({ units, onUnits, onGeo, geoBusy, view, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="side-brand" title="Weather Dashboard">
        <CloudSun size={26} weight="duotone" />
      </div>
      <nav className="side-nav">
        <button type="button" onClick={() => onNavigate('overview')} title="Overview" className={view === 'overview' ? 'active' : ''}>
          <span className="side-ico"><House size={20} /></span>
          <span className="side-lbl">Overview</span>
        </button>
        <button type="button" onClick={() => onNavigate('places')} title="Places" className={view === 'places' ? 'active' : ''}>
          <span className="side-ico"><MapPin size={20} /></span>
          <span className="side-lbl">Places</span>
        </button>
        <button type="button" onClick={() => onNavigate('news')} title="News" className={view === 'news' ? 'active' : ''}>
          <span className="side-ico"><Newspaper size={20} /></span>
          <span className="side-lbl">News</span>
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
