import {
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { createElement } from 'react';
import { TRACK_ICONS, renderIcon } from './icons.js';

function TrackRow({ active, onSelect, track }) {
  const Icon = TRACK_ICONS[track.id];
  const classes = [
    'track',
    active ? 'selected' : '',
    track.hasClip ? 'has-phrase' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      data-type={track.id}
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(track.id)}
    >
      <span className="ic">
        {renderIcon(Icon)}
      </span>
      <span className="meta">
        <span className="track-name">{track.label}</span>
        <span className="vol">
          <span className="bar">
            <span className="fill" style={{ width: `${track.volume.level}%` }} />
            <span className="knob" style={{ left: `${track.volume.level}%` }} />
          </span>
          <span className="db mono">{track.volume.label}</span>
        </span>
      </span>
    </button>
  );
}

function TracksColumn({ activeTrackId, onTrackSelect, tracks }) {
  return (
    <aside className="tracks-col">
      <div className="tracks-head">
        <div className="tracks-title">
          <span className="label">Tracks</span>
          <span className="count">{tracks.length}</span>
        </div>
        <button className="edit-btn" aria-label="Edit tracks" title="Reorder and rename">
          {renderIcon(SlidersHorizontal)}
        </button>
      </div>

      <div className="tracks-list">
        {tracks.map((track) => createElement(TrackRow, {
          active: track.id === activeTrackId,
          key: track.id,
          onSelect: onTrackSelect,
          track,
        }))}
      </div>

      <button className="add-track" type="button">
        {renderIcon(Plus)}
        Add Track
      </button>
    </aside>
  );
}

export { TracksColumn };
