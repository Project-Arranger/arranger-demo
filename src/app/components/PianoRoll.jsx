import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  PIANO_ROLL_VISIBLE_ROWS,
} from '../../data/pianoRollNotes.js';
import { usePianoRollRowIndicator } from '../usePianoRollRowIndicator.js';
import { usePitchScrollSync } from '../usePitchScrollSync.js';
import { BEAT_NUMBERS } from '../uiShellData.js';
import { renderIcon } from './icons.js';

const EMPTY_ACTIVE_NOTE_IDS = new Set();

function PianoRollRowIndicator() {
  return <span className="piano-roll-row-indicator" aria-hidden="true" />;
}

function PianoRollNoteKey({
  active,
  disabled,
  highlighted,
  note,
  onNotePreview,
  rowIndex,
  trackId,
}) {
  const className = [
    'note-key',
    `${trackId}-note-key`,
    note.sharp ? 'sharp' : '',
    note.root ? 'root' : '',
    highlighted ? 'scale-tone' : '',
    active ? 'playing' : '',
  ].filter(Boolean).join(' ');
  const commonProps = {
    className,
    'data-note': note.note,
    'data-row': rowIndex,
    title: note.note,
  };

  if (!onNotePreview) {
    return <div {...commonProps}>{note.label}</div>;
  }

  return (
    <button
      {...commonProps}
      type="button"
      disabled={disabled}
      onClick={() => onNotePreview(note.note)}
    >
      {note.label}
    </button>
  );
}

function PianoRoll({
  activeNoteIds = EMPTY_ACTIVE_NOTE_IDS,
  ariaLabel,
  autoRevealActiveNote = false,
  disabled = false,
  highlightedNoteIds = EMPTY_ACTIVE_NOTE_IDS,
  initialTopNote,
  isCellActive,
  notes,
  onCellToggle,
  onNotePreview,
  onPitchInteraction,
  trackId,
}) {
  const noteIndexById = useMemo(() => new Map(
    notes.map(({ note }, rowIndex) => [note, rowIndex]),
  ), [notes]);
  const initialTopRow = noteIndexById.get(initialTopNote)
    ?? Math.min(PIANO_ROLL_VISIBLE_ROWS, Math.max(0, notes.length - PIANO_ROLL_VISIBLE_ROWS));
  const previousActiveNoteIdsRef = useRef(new Set());
  const {
    canScrollPitchDown,
    canScrollPitchUp,
    handlePitchViewportScroll,
    handlePitchWheel,
    revealPitchRow,
    scalePitchViewportRef,
    scrollPitchByOctave,
    setBeatCellsViewportRef,
  } = usePitchScrollSync({
    initialTopRow,
    noteCount: notes.length,
    onPitchInteraction,
  });
  const {
    handleBlurCapture,
    handleFocusCapture,
    handlePointerLeave,
    handlePointerOver,
    pianoRollRef,
  } = usePianoRollRowIndicator();

  useEffect(() => {
    const pianoRoll = pianoRollRef.current;
    if (!pianoRoll) return undefined;

    pianoRoll.addEventListener('wheel', handlePitchWheel, { passive: false });
    return () => pianoRoll.removeEventListener('wheel', handlePitchWheel);
  }, [handlePitchWheel, pianoRollRef]);

  useLayoutEffect(() => {
    const nextActiveNoteIds = activeNoteIds instanceof Set
      ? activeNoteIds
      : new Set(activeNoteIds ?? []);
    let latestAddedNoteId = null;

    if (autoRevealActiveNote) {
      nextActiveNoteIds.forEach((noteId) => {
        if (!previousActiveNoteIdsRef.current.has(noteId)) latestAddedNoteId = noteId;
      });
    }
    previousActiveNoteIdsRef.current = new Set(nextActiveNoteIds);

    if (latestAddedNoteId) {
      revealPitchRow(noteIndexById.get(latestAddedNoteId));
    }
  }, [activeNoteIds, autoRevealActiveNote, noteIndexById, revealPitchRow]);

  return (
    <div
      className={`seq-body piano-roll ${trackId}-seq-body`}
      ref={pianoRollRef}
      role="group"
      aria-label={ariaLabel}
      data-track-id={trackId}
      style={{ '--piano-roll-total-rows': notes.length }}
      onBlurCapture={handleBlurCapture}
      onFocusCapture={handleFocusCapture}
      onPointerLeave={handlePointerLeave}
      onPointerOver={handlePointerOver}
    >
      <aside className={`scale-rail ${trackId}-scale-rail`} aria-label={`${ariaLabel} note ruler`}>
        <button
          className="scale-arrow"
          aria-label="Scroll up an octave"
          title="Scroll up an octave"
          type="button"
          disabled={!canScrollPitchUp}
          onClick={() => scrollPitchByOctave(-1)}
        >
          {renderIcon(ChevronUp)}
        </button>
        <div
          className="scale-notes-viewport"
          ref={scalePitchViewportRef}
          onScroll={handlePitchViewportScroll}
        >
          <div className={`scale-notes ${trackId}-scale-notes`}>
            {createElement(PianoRollRowIndicator)}
            {notes.map((note, rowIndex) => (
              createElement(PianoRollNoteKey, {
                active: activeNoteIds.has(note.note),
                disabled,
                highlighted: highlightedNoteIds.has(note.note),
                key: note.note,
                note,
                onNotePreview,
                rowIndex,
                trackId,
              })
            ))}
          </div>
        </div>
        <button
          className="scale-arrow"
          aria-label="Scroll down an octave"
          title="Scroll down an octave"
          type="button"
          disabled={!canScrollPitchDown}
          onClick={() => scrollPitchByOctave(1)}
        >
          {renderIcon(ChevronDown)}
        </button>
      </aside>

      <div className={`piano-roll-grid ${trackId}-grid`}>
        {BEAT_NUMBERS.map((beatNumber) => {
          const beatIndex = beatNumber - 1;

          return (
            <div
              className={`beat-group piano-roll-beat-group ${trackId}-beat-group`}
              key={beatNumber}
            >
              <div className="pitch-grid-head-spacer" aria-hidden="true" />
              <div
                className="beat-cells-viewport"
                ref={(viewport) => setBeatCellsViewportRef(beatIndex, viewport)}
                onScroll={handlePitchViewportScroll}
              >
                <div className={`beat-cells ${trackId}-beat-cells`}>
                  {createElement(PianoRollRowIndicator)}
                  {notes.flatMap((note, rowIndex) => (
                    BEAT_NUMBERS.map((stepNumber, colIndex) => {
                      const step = beatIndex * 4 + colIndex;
                      const active = isCellActive(step, note.note);
                      const highlighted = highlightedNoteIds.has(note.note);
                      const previewing = activeNoteIds.has(note.note);

                      return (
                        <button
                          className={[
                            'pitch-step-cell',
                            `${trackId}-cell`,
                            note.sharp ? 'sharp' : '',
                            highlighted ? 'scale-tone' : '',
                            active ? 'active' : '',
                            previewing ? 'previewing' : '',
                          ].filter(Boolean).join(' ')}
                          data-row={rowIndex}
                          data-col={colIndex}
                          data-note={note.note}
                          key={`${note.note}-${step}`}
                          type="button"
                          aria-label={`${note.note} beat ${beatNumber}.${stepNumber}`}
                          aria-pressed={active}
                          disabled={disabled}
                          onClick={() => onCellToggle(step, note.note)}
                        />
                      );
                    })
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PianoRoll };
