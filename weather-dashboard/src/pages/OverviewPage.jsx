import { CloudSun } from '@phosphor-icons/react';
import SearchBar from '../components/SearchBar';
import HeroCard from '../components/HeroCard';
import OverviewGrid from '../components/OverviewGrid';
import RadarMap from '../components/RadarMap';
import NewsSection from '../components/NewsSection';

export default function OverviewPage({
  places,
  selected,
  selectedId,
  units,
  maxPlaces,
  keyPresent,
  onPick,
  onSelectPlace,
  onRemove,
  onOpenMap,
}) {
  return (
    <>
      <div className="brandrow">
        <h1><CloudSun size={26} weight="duotone" className="inline-ico" /> CloudCheck</h1>
        <p className="muted">Your places at a glance — search, locate, compare.</p>
      </div>
      <SearchBar onPick={onPick} disabled={!keyPresent} />
      <HeroCard place={selected} units={units} />
      <OverviewGrid
        places={places}
        selectedId={selectedId}
        units={units}
        maxPlaces={maxPlaces}
        onSelect={onSelectPlace}
        onRemove={onRemove}
      />
      <div className="section-title">
        <h2>Live Radar</h2>
        <a className="link" href="#/map">Open full map →</a>
      </div>
      <RadarMap
        mini
        places={places}
        selected={selected}
        onSelect={onSelectPlace}
        keyPresent={keyPresent}
        units={units}
        onOpen={onOpenMap}
      />
      <NewsSection limit={3} teaser swipe />
    </>
  );
}
