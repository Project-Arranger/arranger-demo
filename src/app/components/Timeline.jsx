import {
  Plus,
} from 'lucide-react';
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../../store/useMusicStore.js';
import { getTimelinePlayheadSeekPosition } from '../timelinePlayhead.js';
import { BAR_NUMBERS } from '../uiShellData.js';
import { renderIcon } from './icons.js';

const DRAG_THRESHOLD_PX = 6;
const DROP_FEEDBACK_MS = 700;
const DROP_FEEDBACK_CLASS_BY_TYPE = {
  move: 'drop-move',
  swap: 'drop-swap',
};

function didPointerDrag(event, dragSession) {
  return Math.abs(event.clientX - dragSession.startX) > DRAG_THRESHOLD_PX
    || Math.abs(event.clientY - dragSession.startY) > DRAG_THRESHOLD_PX;
}

function getBarFromRow(row, clientX) {
  if (!row) return null;

  const rect = row.getBoundingClientRect();
  const rawBar = Math.floor(((clientX - rect.left) / rect.width) * TOTAL_BARS);
  return Math.min(TOTAL_BARS - 1, Math.max(0, rawBar));
}

function getBarFromTrack(trackId, clientX) {
  return getBarFromRow(document.querySelector(`[data-track-row="${trackId}"]`), clientX);
}

function findTrackBar(tracks, trackId, barIndex) {
  return tracks
    .find((track) => track.id === trackId)
    ?.bars.find((bar) => bar.bar === barIndex);
}

function createDragFeedback(tracks, dragSession, targetBar) {
  const targetClip = findTrackBar(tracks, dragSession.trackId, targetBar)?.clip;
  const type = targetClip && targetClip.id !== dragSession.clipId ? 'swap' : 'move';

  return {
    sourceBar: dragSession.sourceBar,
    targetBar,
    trackId: dragSession.trackId,
    type,
  };
}

function getDropZoneClass(trackId, bar, dragOverBar, dragFeedback) {
  const classes = ['bar-drop-zone'];
  const hasDropFeedback = dragFeedback?.trackId === trackId
    && (dragFeedback.sourceBar === bar || dragFeedback.targetBar === bar);

  if (dragOverBar?.trackId === trackId && dragOverBar.bar === bar) {
    classes.push('drag-over');
  }

  if (hasDropFeedback) {
    classes.push(DROP_FEEDBACK_CLASS_BY_TYPE[dragFeedback.type]);
  }

  return classes.join(' ');
}

function getClipFeedbackClass(trackId, bar, dragFeedback) {
  if (dragFeedback?.trackId !== trackId) return '';
  if (dragFeedback.sourceBar !== bar && dragFeedback.targetBar !== bar) return '';
  return DROP_FEEDBACK_CLASS_BY_TYPE[dragFeedback.type];
}

function getTutorialBarRole(tutorialTargets, bar) {
  return tutorialTargets?.timelineBars?.find((target) => target.bar === bar)?.role ?? null;
}

function getTutorialBarClass(role) {
  if (role === 'completed') return 'tutorial-bar-completed';
  if (role === 'target') return 'tutorial-bar-target';
  return '';
}

function Clip({
  active,
  clip,
  dragFeedbackClass,
  dragging,
  onMouseDownClip,
  onOpenClip,
  onTutorialOpenClip,
  shouldIgnoreClick,
  tutorialLocked,
  tutorialBarRole,
  tutorialTimelineBarsCount,
  track,
}) {
  if (!clip) return null;

  const handleClick = (event) => {
    event.stopPropagation();
    if (shouldIgnoreClick()) return;
    if (
      tutorialLocked
      && track.id === 'drums'
      && tutorialTimelineBarsCount
      && tutorialBarRole !== 'target'
    ) {
      return;
    }

    if (onTutorialOpenClip(clip) === false) return;
    onOpenClip(clip.id);
  };
  const chordLabel = track.id === 'chord' ? clip.chordLabel : null;
  const clipName = chordLabel ? (
    <>
      <span className="clip-idx">{clip.name.toUpperCase()}</span>
      <span className="clip-chord-name">{chordLabel}</span>
    </>
  ) : clip.name;

  return (
    <button
      className={[
        'clip',
        active ? 'selected' : '',
        dragging ? 'clip-dragging' : '',
        dragFeedbackClass,
        getTutorialBarClass(tutorialBarRole),
      ].filter(Boolean).join(' ')}
      data-type={track.id}
      data-bar-index={clip.bar}
      style={{ '--bar-index': clip.bar }}
      aria-label={`${track.label} clip bar ${clip.bar + 1}`}
      type="button"
      onClick={handleClick}
      onMouseDown={(event) => {
        if (
          tutorialLocked
          && track.id === 'drums'
          && tutorialTimelineBarsCount
          && tutorialBarRole !== 'target'
        ) {
          return;
        }
        onMouseDownClip(event, clip, track.id);
      }}
    >
      <div className="clip-name">
        {clipName}
      </div>
      {chordLabel || clip.hasContent ? null : <div className="clip-empty-tag">empty</div>}
    </button>
  );
}

const Timeline = forwardRef(function Timeline(
  {
    activeTrackId,
    currentBar,
    currentStep,
    onAddClip,
    onMoveClip,
    onOpenClip,
    onTransportSeek = () => {},
    onTutorialOpenClip = () => true,
    onTrackSelect,
    selectedClipId,
    tutorialLocked = false,
    tutorialTargets,
    tracks,
  },
  scrollRef,
) {
  const [dragSession, setDragSession] = useState(null);
  const [dragFeedback, setDragFeedback] = useState(null);
  const [dragOverBar, setDragOverBar] = useState(null);
  const [isPlayheadDragging, setIsPlayheadDragging] = useState(false);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const feedbackTimerRef = useRef(null);
  const rulerRef = useRef(null);
  const flatStep = currentBar * STEPS_PER_BAR + currentStep;
  const playheadLeft = `${(flatStep / (TOTAL_BARS * STEPS_PER_BAR)) * 100}%`;
  const tutorialPlayheadRole = tutorialTargets?.playhead?.role ?? null;
  const getPlayheadTutorialClass = (baseClass) => [
    baseClass,
    tutorialPlayheadRole === 'target' ? 'tutorial-playhead-target' : '',
    tutorialPlayheadRole === 'completed' ? 'tutorial-playhead-completed' : '',
  ].filter(Boolean).join(' ');
  const playheadLineClass = getPlayheadTutorialClass('ruler-playhead');
  const playheadGridClass = getPlayheadTutorialClass('playhead');
  const playheadHitClass = 'playhead-hit';
  const tutorialTimelineBars = new Set(
    (tutorialTargets?.timelineBars ?? []).map((target) => target.bar),
  );

  const shouldIgnoreClick = () => {
    if (!suppressNextClick) return false;

    setSuppressNextClick(false);
    return true;
  };

  const handleMouseDown = (event, clip, trackId) => {
    event.stopPropagation();
    flushSync(() => setDragSession({
      clipId: clip.id,
      sourceBar: clip.bar,
      startX: event.clientX,
      startY: event.clientY,
      trackId,
    }));
  };

  const showDragFeedback = useCallback((feedback) => {
    window.clearTimeout(feedbackTimerRef.current);
    setDragFeedback(feedback);
    feedbackTimerRef.current = window.setTimeout(() => {
      setDragFeedback(null);
    }, DROP_FEEDBACK_MS);
  }, []);

  const handleTrackRowClick = (event, trackId) => {
    const target = event.target;
    if (target.closest('button')) return;

    const barIndex = target.dataset.barIndex
      ? Number(target.dataset.barIndex)
      : getBarFromRow(event.currentTarget, event.clientX);

    if (
      tutorialLocked
      && trackId === 'drums'
      && tutorialTimelineBars.size
      && !tutorialTimelineBars.has(barIndex)
    ) {
      return;
    }

    onTrackSelect(trackId, Number.isInteger(barIndex) ? barIndex : undefined);
  };

  const seekPlayheadFromClientX = useCallback((clientX) => {
    const nextPosition = getTimelinePlayheadSeekPosition(
      clientX,
      rulerRef.current?.getBoundingClientRect(),
    );
    if (!nextPosition) return;

    onTransportSeek(nextPosition.bar, nextPosition.step);
  }, [onTransportSeek]);

  const handlePlayheadMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPlayheadDragging(true);
    seekPlayheadFromClientX(event.clientX);
  };

  useEffect(() => () => {
    window.clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    if (!dragSession) return undefined;

    const handleMouseMove = (event) => {
      if (!didPointerDrag(event, dragSession)) return;

      const targetBar = getBarFromTrack(dragSession.trackId, event.clientX);
      if (targetBar === null) return;

      setDragOverBar({ trackId: dragSession.trackId, bar: targetBar });
    };

    const handleMouseUp = (event) => {
      setDragSession(null);
      setDragOverBar(null);

      if (!didPointerDrag(event, dragSession)) return;

      const targetBar = getBarFromTrack(dragSession.trackId, event.clientX);
      if (targetBar === null) return;

      setSuppressNextClick(true);
      showDragFeedback(createDragFeedback(tracks, dragSession, targetBar));
      onMoveClip(dragSession.clipId, targetBar);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragSession, onMoveClip, showDragFeedback, tracks]);

  useEffect(() => {
    if (!isPlayheadDragging) return undefined;

    const handleMouseMove = (event) => {
      seekPlayheadFromClientX(event.clientX);
    };
    const handleMouseUp = (event) => {
      seekPlayheadFromClientX(event.clientX);
      setIsPlayheadDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPlayheadDragging, seekPlayheadFromClientX]);

  return (
    <section
      className={[
        'timeline-col',
        isPlayheadDragging ? 'playhead-dragging' : '',
      ].filter(Boolean).join(' ')}
      data-tutorial-target="track-area"
      ref={scrollRef}
      style={{ '--bars': TOTAL_BARS, '--track-count': tracks.length }}
    >
      <div className="ruler" aria-label="Timeline bars" ref={rulerRef}>
        {BAR_NUMBERS.map((barNumber) => (
          <div
            className={`bar-label${barNumber === 1 || barNumber === 5 ? ' major' : ''} mono`}
            key={barNumber}
          >
            {barNumber}
          </div>
        ))}
        <div className={playheadLineClass} style={{ left: playheadLeft }}>
          <div
            aria-label="Drag transport playhead"
            aria-valuemax={TOTAL_BARS * STEPS_PER_BAR - 1}
            aria-valuemin={0}
            aria-valuenow={flatStep}
            className={playheadHitClass}
            onMouseDown={handlePlayheadMouseDown}
            role="slider"
            tabIndex={0}
          />
        </div>
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
              onClick={(event) => handleTrackRowClick(event, track.id)}
            >
              {track.bars.map((bar) => {
                const dropZoneClass = getDropZoneClass(track.id, bar.bar, dragOverBar, dragFeedback);
                const tutorialBarRole = track.id === 'drums'
                  ? getTutorialBarRole(tutorialTargets, bar.bar)
                  : null;
                const dropZoneTutorialRole = bar.clip ? null : tutorialBarRole;

                return (
                  <div
                    className={[dropZoneClass, getTutorialBarClass(dropZoneTutorialRole)]
                      .filter(Boolean).join(' ')}
                    aria-label={`Drop clip on ${track.label} bar ${bar.barNumber}`}
                    data-bar-index={bar.bar}
                    data-tutorial-role={dropZoneTutorialRole ?? undefined}
                    key={`${track.id}-drop-${bar.bar}`}
                    style={{ '--bar-index': bar.bar }}
                  />
                );
              })}
              {track.bars.map((bar) => createElement(Clip, {
                active: bar.clip?.id === selectedClipId,
                clip: bar.clip,
                dragFeedbackClass: getClipFeedbackClass(track.id, bar.bar, dragFeedback),
                dragging: dragSession?.clipId === bar.clip?.id,
                key: bar.clip?.id ?? `${track.id}-empty-${bar.bar}`,
                onMouseDownClip: handleMouseDown,
                onOpenClip,
                onTutorialOpenClip,
                shouldIgnoreClick,
                tutorialLocked,
                tutorialBarRole: track.id === 'drums'
                  ? getTutorialBarRole(tutorialTargets, bar.bar)
                  : null,
                tutorialTimelineBarsCount: tutorialTimelineBars.size,
                track,
              }))}
              {track.bars.map((bar) => (
                bar.canAddClip ? (
                  <button
                    className="add-clip"
                    aria-label={`Add clip to ${track.label} bar ${bar.barNumber}`}
                    data-bar-index={bar.bar}
                    key={`${track.id}-add-${bar.bar}`}
                    style={{ '--bar-index': bar.bar }}
                    type="button"
                    disabled={tutorialLocked
                      && track.id === 'drums'
                      && tutorialTimelineBars.size
                      && !tutorialTimelineBars.has(bar.bar)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (
                        tutorialLocked
                        && track.id === 'drums'
                        && tutorialTimelineBars.size
                        && !tutorialTimelineBars.has(bar.bar)
                      ) {
                        return;
                      }
                      onAddClip(track.id, bar.bar);
                    }}
                  >
                    {renderIcon(Plus)}
                  </button>
                ) : null
              ))}
            </div>
          ))}
        </div>

        <div className={playheadGridClass} style={{ left: playheadLeft }}>
          <div
            aria-label="Drag transport playhead"
            aria-valuemax={TOTAL_BARS * STEPS_PER_BAR - 1}
            aria-valuemin={0}
            aria-valuenow={flatStep}
            className={playheadHitClass}
            onMouseDown={handlePlayheadMouseDown}
            role="slider"
            tabIndex={0}
          />
        </div>
      </div>
    </section>
  );
});

export { Timeline };
