import {
  Pencil,
  Plus,
} from 'lucide-react';
import { createElement } from 'react';
import {
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../../store/useMusicStore.js';
import { BAR_NUMBERS } from '../uiShellData.js';
import { renderIcon } from './icons.js';

function Clip({
  active,
  clip,
  onOpenClip,
  onPreview,
  track,
}) {
  if (!clip) return null;

  const handleClick = () => {
    onOpenClip(clip.id);
    if (track.id === 'drums') onPreview();
  };

  return (
    <button
      className={`clip${active ? ' selected' : ''}`}
      data-type={track.id}
      data-bar-index={clip.bar}
      style={{ '--bar-index': clip.bar }}
      aria-label={`${track.label} clip bar ${clip.bar + 1}`}
      title={track.id === 'drums' ? 'Preview drums' : undefined}
      type="button"
      onClick={handleClick}
    >
      <div className="clip-name">
        {clip.name}
        {renderIcon(Pencil)}
      </div>
      <div className="clip-mini" />
      <div className="clip-empty-tag">empty</div>
    </button>
  );
}

function Timeline({
  activeTrackId,
  currentBar,
  currentStep,
  onAddClip,
  onDrumsPreview,
  onOpenClip,
  selectedClipId,
  tracks,
}) {
  const flatStep = currentBar * STEPS_PER_BAR + currentStep;
  const playheadLeft = `${(flatStep / (TOTAL_BARS * STEPS_PER_BAR)) * 100}%`;

  return (
    <section className="timeline-col" style={{ '--bars': TOTAL_BARS }}>
      <div className="ruler" aria-label="Timeline bars">
        {BAR_NUMBERS.map((barNumber) => (
          <div
            className={`bar-label${barNumber === 1 || barNumber === 5 ? ' major' : ''} mono`}
            key={barNumber}
          >
            {barNumber}
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="grid-rows" aria-hidden="true">
          {tracks.map((track) => (
            <div className="row" key={track.id} />
          ))}
        </div>

        <div className="hover-rows">
          {tracks.map((track, trackIndex) => (
            <div
              className={[
                'hover-row',
                track.hasClip ? 'has-phrase' : '',
                track.id === activeTrackId ? 'active' : '',
              ].filter(Boolean).join(' ')}
              data-type={track.id}
              data-track-row={track.id}
              data-track-index={trackIndex}
              key={track.id}
            >
              {track.clipsByBar.map((clip, barIndex) => createElement(Clip, {
                active: clip?.id === selectedClipId,
                clip,
                key: clip?.id ?? `${track.id}-empty-${barIndex}`,
                onOpenClip,
                onPreview: onDrumsPreview,
                track,
              }))}
              {BAR_NUMBERS.map((barNumber, barIndex) => (
                <button
                  className="add-clip"
                  aria-label={`Add clip to ${track.label} bar ${barNumber}`}
                  data-bar-index={barIndex}
                  key={`${track.id}-add-${barIndex}`}
                  style={{ '--bar-index': barIndex }}
                  type="button"
                  onClick={() => onAddClip(track.id, barIndex)}
                >
                  {renderIcon(Plus)}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="playhead" style={{ left: playheadLeft }} />
      </div>
    </section>
  );
}

export { Timeline };
