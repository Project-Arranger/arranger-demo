import {
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  createElement,
  forwardRef,
  useRef,
} from 'react';
import {
  MAX_TRACK_VOLUME_DB,
  MIN_TRACK_VOLUME_DB,
} from '../trackVolumeViewModels.js';
import { getTrackVolumeFromClientX } from '../trackVolumeInteraction.js';
import { TRACK_ICONS, renderIcon } from './icons.js';

function TrackRow({
  active,
  fillEmptyClipsDisabled = false,
  onFillEmptyTrackClips = () => {},
  onSelect,
  onVolumeChange = () => {},
  track,
}) {
  const volumeInputRef = useRef(null);
  const Icon = TRACK_ICONS[track.id];
  const classes = [
    'track',
    active ? 'selected' : '',
    track.hasClip ? 'has-phrase' : '',
  ].filter(Boolean).join(' ');
  const handleVolumeChange = (event) => {
    onVolumeChange(track.id, Number(event.target.value));
  };
  const updateVolumeFromPointer = (event) => {
    onVolumeChange(
      track.id,
      getTrackVolumeFromClientX(event.clientX, event.currentTarget.getBoundingClientRect()),
    );
  };
  const handleVolumePointerDown = (event) => {
    onSelect(track.id);
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    volumeInputRef.current?.focus();
    updateVolumeFromPointer(event);
  };
  const handleVolumePointerMove = (event) => {
    if (event.buttons !== 1) return;

    event.preventDefault();
    event.stopPropagation();
    updateVolumeFromPointer(event);
  };
  const handleVolumePointerUp = (event) => {
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  const handleVolumeKeyDown = (event) => {
    const keyDeltas = {
      ArrowDown: -1,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -3,
      PageUp: 3,
    };

    if (event.key === 'Home') {
      event.preventDefault();
      onVolumeChange(track.id, MIN_TRACK_VOLUME_DB);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      onVolumeChange(track.id, MAX_TRACK_VOLUME_DB);
      return;
    }

    if (!Object.hasOwn(keyDeltas, event.key)) return;
    event.preventDefault();
    onVolumeChange(track.id, track.volume.value + keyDeltas[event.key]);
  };
  const stopVolumeEventPropagation = (event) => {
    event.stopPropagation();
  };
  const handleTrackSelect = (event) => {
    event.stopPropagation();
    onSelect(track.id);
  };
  const handleFillEmptyClips = (event) => {
    event.stopPropagation();
    onFillEmptyTrackClips(track.id);
  };

  return (
    <div
      className={classes}
      data-type={track.id}
      onClick={() => onSelect(track.id)}
    >
      <div className="track-main-row">
        <button
          className="track-select"
          type="button"
          aria-pressed={active}
          onClick={handleTrackSelect}
        >
          <span className="ic">
            {renderIcon(Icon)}
          </span>
          <span className="track-name">{track.label}</span>
        </button>
        <button
          className="fill-empty-clips"
          type="button"
          aria-label="补齐这一轨缺失的空 clips"
          title="补齐这一轨缺失的空 clips"
          disabled={fillEmptyClipsDisabled}
          onClick={handleFillEmptyClips}
        >
          <span className="fill-empty-clips-icon" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="fill-empty-clips-label">补齐空Clip</span>
        </button>
      </div>
      <label
        className="vol"
        onClick={stopVolumeEventPropagation}
        onPointerDown={stopVolumeEventPropagation}
      >
        <span
          className="volume-control"
          onPointerDown={handleVolumePointerDown}
          onPointerMove={handleVolumePointerMove}
          onPointerUp={handleVolumePointerUp}
        >
          <span className="bar" aria-hidden="true">
            <span className="fill" style={{ width: `${track.volume.level}%` }} />
            <span className="knob" style={{ left: `${track.volume.level}%` }} />
          </span>
          <input
            className="volume-slider"
            ref={volumeInputRef}
            type="range"
            min={MIN_TRACK_VOLUME_DB}
            max={MAX_TRACK_VOLUME_DB}
            step="1"
            value={track.volume.value}
            aria-label={`${track.label} volume`}
            onChange={handleVolumeChange}
            onKeyDown={handleVolumeKeyDown}
          />
        </span>
        <span className="db mono">{track.volume.label}</span>
      </label>
    </div>
  );
}

const TracksColumn = forwardRef(function TracksColumn(
  {
    activeTrackId,
    fillEmptyClipsDisabled = false,
    onFillEmptyTrackClips,
    onTrackSelect,
    onVolumeChange,
    tracks,
  },
  scrollRef,
) {
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

      <div className="tracks-list" ref={scrollRef}>
        {tracks.map((track) => createElement(TrackRow, {
          active: track.id === activeTrackId,
          fillEmptyClipsDisabled,
          key: track.id,
          onFillEmptyTrackClips,
          onSelect: onTrackSelect,
          onVolumeChange,
          track,
        }))}
      </div>

      <button className="add-track" type="button">
        {renderIcon(Plus)}
        Add Track
      </button>
    </aside>
  );
});

export { TracksColumn };
