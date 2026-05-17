import {
  AudioLines,
  Boxes,
  ChevronDown,
  ChevronUp,
  Drum,
  Layers,
  LayoutTemplate,
  Mic,
  MoreHorizontal,
  Music,
  Pencil,
  Piano,
  Play,
  Plus,
  Settings,
  SkipBack,
  SlidersHorizontal,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import audioEngine from '../audio/audioEngineSingleton.js';
import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useKeyboardCommands from '../input/useKeyboardCommands.js';
import useMusicStore, {
  BEATS_PER_BAR,
  ROOT_KEY,
  SCALE,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../store/useMusicStore.js';
import { findClipForTrackBar } from '../store/slices/clipsSlice.js';
import {
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
} from './audioUiBridge.js';
import {
  DRUM_SEQUENCER_ROWS,
  isDrumsStepActive,
  toggleInstrumentInCell,
} from './drumSequencerData.js';
import {
  BAR_NUMBERS,
  BEAT_NUMBERS,
  CHORD_NOTES,
  TRACK_UI,
} from './uiShellData.js';

const STEP_NUMBERS = Array.from({ length: STEPS_PER_BAR }, (_, index) => index + 1);

const TRACK_ICONS = {
  drums: Drum,
  bass: Music,
  chord: Piano,
  lead: AudioLines,
  pad: Layers,
  vocal: Mic,
  sample: Boxes,
};

function renderIcon(Icon, props = {}) {
  return createElement(Icon, { 'aria-hidden': 'true', ...props });
}

function TopBar({
  bpm,
  currentBar,
  currentStep,
  isPlaying,
  onBackToStart,
  onPlayToggle,
  onStop,
  rootKey,
  scale,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="name">Project Arranger</div>
        <div className="project">v0.22</div>
      </div>

      <button className="btn-new" aria-label="New song">
        {renderIcon(Plus)}
        New Song
      </button>

      <div className="topbar-center">
        <div className="transport" role="toolbar" aria-label="Transport">
          <button
            className="t-btn"
            aria-label="Back to start"
            title="Back to start"
            type="button"
            onClick={onBackToStart}
          >
            {renderIcon(SkipBack)}
          </button>
          <button className="t-btn" aria-label="Stop" title="Stop" type="button" onClick={onStop}>
            {renderIcon(Square)}
          </button>
          <button
            className={`t-btn play${isPlaying ? ' active' : ''}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            type="button"
            onClick={onPlayToggle}
          >
            {renderIcon(Play)}
          </button>
        </div>

        <div className="stats" role="group" aria-label="Project info">
          <div className="stat">
            <div className="lbl">Position</div>
            <div className="val mono">
              {currentBar + 1}
              <span className="sep">.</span>
              {Math.floor(currentStep / BEATS_PER_BAR) + 1}
              <span className="sep">.</span>
              {(currentStep % BEATS_PER_BAR) + 1}
            </div>
          </div>
          <div className="stat">
            <div className="lbl">BPM</div>
            <div className="val mono">{bpm}</div>
          </div>
          <div className="stat">
            <div className="lbl">Key</div>
            <div className="val mono">{rootKey} maj</div>
          </div>
          <div className="stat">
            <div className="lbl">Scale</div>
            <div className="val mono">{scale === SCALE ? ROOT_KEY : scale}</div>
          </div>
        </div>
      </div>

      <div className="right-tools">
        <div className="save-pill" title="All changes saved">
          <span className="dot" />
          Saved
        </div>
        <button className="btn-export">Export</button>
        <button className="icon-btn" aria-label="Settings" title="Settings">
          {renderIcon(Settings)}
        </button>
      </div>
    </header>
  );
}

function TrackRow({ active, onSelect, track }) {
  const Icon = TRACK_ICONS[track.id];
  const classes = [
    'track',
    active ? 'selected' : '',
    track.clip ? 'has-phrase' : '',
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
      aria-label={`${track.label} clip`}
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
                track.clip ? 'has-phrase' : '',
                track.id === activeTrackId ? 'active' : '',
              ].filter(Boolean).join(' ')}
              data-type={track.id}
              data-track-row={track.id}
              data-track-index={trackIndex}
              key={track.id}
            >
              {createElement(Clip, {
                active: track.clip?.id === selectedClipId,
                clip: track.clip,
                onOpenClip,
                onPreview: onDrumsPreview,
                track,
              })}
              <button
                className="add-clip"
                aria-label={`Add clip to ${track.label}`}
                type="button"
                onClick={() => onAddClip(track.id)}
              >
                {renderIcon(Plus)}
              </button>
            </div>
          ))}
        </div>

        <div className="playhead" style={{ left: playheadLeft }} />
      </div>
    </section>
  );
}

function DrumSequencer({ matrix, onStepToggle, selectedBar }) {
  return (
    <section className="editor drum-editor" data-screen-label="Drum Sequencer">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(Drum)}
          </div>
          <div className="clip-title">
            <div className="crumb">Drums · Phrase</div>
            <div className="clip-name-input">
              DRUM SEQUENCER - BAR
              {' '}
              {selectedBar + 1}
            </div>
          </div>
        </div>

        <div className="tools">
          <button className="btn-template drum-action" type="button">
            为本小节生成基础律动
          </button>
          <button className="btn-template drum-action" type="button">
            全局生成基础律动
          </button>
        </div>
      </header>

      <div className="drum-seq-body">
        <div className="drum-seq-panel">
          <div className="drum-step-numbers" aria-hidden="true">
            <div />
            <div className="drum-steps">
              {STEP_NUMBERS.map((stepNumber) => (
                <span
                  className={`drum-step-number${stepNumber % 4 === 0 ? ' beat-end' : ''} mono`}
                  key={stepNumber}
                >
                  {stepNumber}
                </span>
              ))}
            </div>
          </div>

          {DRUM_SEQUENCER_ROWS.map((row) => (
            <div className="drum-row" key={row.id}>
              <div className="drum-row-label">
                <span className="drum-dot" data-instrument={row.id} />
                <span>{row.label}</span>
              </div>
              <div className="drum-steps">
                {STEP_NUMBERS.map((stepNumber) => {
                  const stepIndex = stepNumber - 1;
                  const active = isDrumsStepActive(matrix, selectedBar, stepIndex, row.id);
                  return (
                    <button
                      className={[
                        'drum-step',
                        active ? 'active' : '',
                        stepNumber % 4 === 0 ? 'beat-end' : '',
                      ].filter(Boolean).join(' ')}
                      data-instrument={row.id}
                      data-step={stepIndex}
                      key={stepNumber}
                      type="button"
                      aria-label={`Toggle ${row.label} step ${stepNumber}`}
                      aria-pressed={active}
                      onClick={() => onStepToggle(row.id, stepIndex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="drum-bar-indicator mono">
            {selectedBar + 1}
            {' '}
            / 8
          </div>
        </div>
      </div>
    </section>
  );
}

function ChordEditor() {
  return (
    <section className="editor" data-screen-label="Chord Editor">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(Piano)}
          </div>
          <div className="clip-title">
            <div className="crumb">Chord · Phrase</div>
            <div className="clip-name-input">
              Chord 01
              {renderIcon(Pencil)}
            </div>
          </div>
        </div>

        <div className="tools">
          <button className="btn-template" aria-label="选择和弦进行模板" type="button">
            {renderIcon(LayoutTemplate)}
            选择和弦进行模板
          </button>
          <button className="tool-icon" aria-label="Clear phrase" title="Clear phrase" type="button">
            {renderIcon(Trash2)}
          </button>
          <button className="tool-icon" aria-label="More" title="More" type="button">
            {renderIcon(MoreHorizontal)}
          </button>
          <button className="editor-close" aria-label="Close editor" title="Close" type="button">
            {renderIcon(X)}
          </button>
        </div>
      </header>

      <div className="seq-body">
        <aside className="scale-rail" aria-label="Scale ruler">
          <button className="scale-arrow" aria-label="Scroll up an octave" title="Scroll up an octave">
            {renderIcon(ChevronUp)}
          </button>
          <div className="scale-notes">
            {CHORD_NOTES.map((note) => (
              <div
                className={[
                  'note-key',
                  note.sharp ? 'sharp' : '',
                  note.root ? 'root' : '',
                ].filter(Boolean).join(' ')}
                key={note.label}
              >
                {note.label}
              </div>
            ))}
          </div>
          <button className="scale-arrow" aria-label="Scroll down an octave" title="Scroll down an octave">
            {renderIcon(ChevronDown)}
          </button>
        </aside>

        <div className="chord-grid">
          {BEAT_NUMBERS.map((beatNumber) => (
            <div className="beat-group" key={beatNumber}>
              <div className="beat-head">
                <button className="add-chord-btn" aria-label="添加和弦" type="button">
                  {renderIcon(Plus)}
                  Chord
                </button>
                <span className="beat-num mono">{beatNumber}</span>
              </div>
              <div className="beat-cells">
                {CHORD_NOTES.flatMap((note, rowIndex) => (
                  BEAT_NUMBERS.map((stepNumber, colIndex) => (
                    <button
                      className={[
                        'cell',
                        note.sharp ? 'sharp' : '',
                        colIndex === 0 ? 'downbeat' : '',
                      ].filter(Boolean).join(' ')}
                      data-row={rowIndex}
                      data-col={colIndex}
                      key={`${note.label}-${stepNumber}`}
                      type="button"
                      aria-label={`${note.label} beat ${beatNumber}.${stepNumber}`}
                    />
                  ))
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackEditorPlaceholder({ activeTrackId }) {
  return (
    <section className="editor" data-screen-label="Track Editor">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(TRACK_ICONS[activeTrackId] ?? Music)}
          </div>
          <div className="clip-title">
            <div className="crumb">Track · Phrase</div>
            <div className="clip-name-input">{activeTrackId} editor</div>
          </div>
        </div>
      </header>
      <div className="empty-editor">
        Select Drums or Chord to edit a phrase.
      </div>
    </section>
  );
}

function BottomEditor({
  activeTrackId,
  matrix,
  onDrumsStepToggle,
  selectedBar,
}) {
  if (activeTrackId === 'drums') {
    return createElement(DrumSequencer, {
      matrix,
      onStepToggle: onDrumsStepToggle,
      selectedBar,
    });
  }

  if (activeTrackId === 'chord') {
    return createElement(ChordEditor);
  }

  return createElement(TrackEditorPlaceholder, { activeTrackId });
}

export default function App() {
  const bpm = useMusicStore((state) => state.bpm);
  const rootKey = useMusicStore((state) => state.rootKey);
  const scale = useMusicStore((state) => state.scale);
  const currentBar = useMusicStore((state) => state.currentBar);
  const currentStep = useMusicStore((state) => state.currentStep);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const matrix = useMusicStore((state) => state.matrix);
  const activeTrackId = useMusicStore((state) => state.activeTrackId);
  const selectedBar = useMusicStore((state) => state.selectedBar);
  const selectedClipId = useMusicStore((state) => state.selectedClipId);
  const clips = useMusicStore((state) => state.clips);

  const dispatchAppCommand = useMemo(
    () => createUiAudioDispatcher({ store: useMusicStore, audio: audioEngine }),
    [],
  );

  useKeyboardCommands({ dispatch: dispatchAppCommand });

  useEffect(() => {
    seedDefaultDrumsPattern(useMusicStore);
  }, []);

  useEffect(() => {
    audioEngine.onPositionChange = (bar, step) => {
      useMusicStore.getState().setPosition(bar, step);
    };

    return () => {
      audioEngine.onPositionChange = null;
    };
  }, []);

  const handleBackToStart = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
  }, [dispatchAppCommand]);

  const handleStop = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [dispatchAppCommand]);

  const handlePlayToggle = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
  }, [dispatchAppCommand]);

  const handleDrumsPreview = useCallback(() => {
    void audioEngine.triggerDrumsStep(['kick', 'snare', 'hihat']);
  }, []);

  const tracks = useMemo(() => TRACK_UI.map((track) => ({
    ...track,
    clip: findClipForTrackBar(clips, track.id, selectedBar),
  })), [clips, selectedBar]);

  const handleTrackSelect = useCallback((trackId) => {
    const state = useMusicStore.getState();
    const clip = state.getClipForTrackBar(trackId, selectedBar);
    if (clip) {
      state.selectClip(clip.id);
      return;
    }

    const { setActiveTrackId, setSelectedBar, setSelectedClipId } = state;
    setActiveTrackId(trackId);
    setSelectedBar(selectedBar);
    setSelectedClipId(null);
  }, [selectedBar]);

  const handleAddClip = useCallback((trackId) => {
    useMusicStore.getState().createClip(trackId, selectedBar);
  }, [selectedBar]);

  const handleOpenClip = useCallback((clipId) => {
    useMusicStore.getState().selectClip(clipId);
  }, []);

  const handleDrumsStepToggle = useCallback((instrument, step) => {
    const state = useMusicStore.getState();
    const currentCell = state.matrix.drums[selectedBar]?.[step] ?? null;
    state.setCell('drums', selectedBar, step, toggleInstrumentInCell(currentCell, instrument));
    void dispatchAppCommand({
      type: APP_COMMAND_TYPES.DRUMS_TOGGLE,
      bar: selectedBar,
      step,
      instrument,
    });
  }, [dispatchAppCommand, selectedBar]);

  return (
    <div className="app" data-screen-label="Main" aria-label="Project Arranger workspace">
      {createElement(TopBar, {
        bpm,
        currentBar,
        currentStep,
        isPlaying,
        onBackToStart: handleBackToStart,
        onPlayToggle: handlePlayToggle,
        onStop: handleStop,
        rootKey,
        scale,
      })}
      <main className="workspace">
        {createElement(TracksColumn, {
          activeTrackId,
          onTrackSelect: handleTrackSelect,
          tracks,
        })}
        {createElement(Timeline, {
          activeTrackId,
          currentBar,
          currentStep,
          onAddClip: handleAddClip,
          onDrumsPreview: handleDrumsPreview,
          onOpenClip: handleOpenClip,
          selectedClipId,
          tracks,
        })}
      </main>
      {createElement(BottomEditor, {
        activeTrackId,
        matrix,
        onDrumsStepToggle: handleDrumsStepToggle,
        selectedBar,
      })}
    </div>
  );
}
