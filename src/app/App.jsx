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
import { createElement } from 'react';
import useMusicStore, {
  BEATS_PER_BAR,
  ROOT_KEY,
  SCALE,
  TOTAL_BARS,
} from '../store/useMusicStore.js';
import {
  BAR_NUMBERS,
  BEAT_NUMBERS,
  CHORD_NOTES,
  TRACK_UI,
} from './uiShellData.js';

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

function TopBar({ bpm, currentBar, currentStep, rootKey, scale }) {
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
          <button className="t-btn" aria-label="Back to start" title="Back to start">
            {renderIcon(SkipBack)}
          </button>
          <button className="t-btn" aria-label="Stop" title="Stop">
            {renderIcon(Square)}
          </button>
          <button className="t-btn play" aria-label="Play" title="Play (Space)">
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

function TrackRow({ track }) {
  const Icon = TRACK_ICONS[track.id];
  const classes = [
    'track',
    track.selected ? 'selected' : '',
    track.clipName ? 'has-phrase' : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} data-type={track.id} type="button">
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

function TracksColumn() {
  return (
    <aside className="tracks-col">
      <div className="tracks-head">
        <div className="tracks-title">
          <span className="label">Tracks</span>
          <span className="count">{TRACK_UI.length}</span>
        </div>
        <button className="edit-btn" aria-label="Edit tracks" title="Reorder and rename">
          {renderIcon(SlidersHorizontal)}
        </button>
      </div>

      <div className="tracks-list">
        {TRACK_UI.map((track) => createElement(TrackRow, { key: track.id, track }))}
      </div>

      <button className="add-track" type="button">
        {renderIcon(Plus)}
        Add Track
      </button>
    </aside>
  );
}

function Clip({ track }) {
  if (!track.clipName) return null;

  return (
    <div
      className={`clip${track.selected ? ' selected' : ''}`}
      data-type={track.id}
      tabIndex="0"
      aria-label={`${track.label} clip`}
    >
      <div className="clip-name">
        {track.clipName}
        {renderIcon(Pencil)}
      </div>
      <div className="clip-mini" />
      <div className="clip-empty-tag">empty</div>
    </div>
  );
}

function Timeline() {
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
          {TRACK_UI.map((track) => (
            <div className="row" key={track.id} />
          ))}
        </div>

        <div className="hover-rows">
          {TRACK_UI.map((track) => (
            <div
              className={`hover-row${track.clipName ? ' has-phrase' : ''}`}
              data-type={track.id}
              key={track.id}
            >
              {createElement(Clip, { track })}
              <button className="add-clip" aria-label={`Add clip to ${track.label}`} type="button">
                {renderIcon(Plus)}
              </button>
            </div>
          ))}
        </div>

        <div className="playhead" style={{ left: 0 }} />
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

export default function App() {
  const bpm = useMusicStore((state) => state.bpm);
  const rootKey = useMusicStore((state) => state.rootKey);
  const scale = useMusicStore((state) => state.scale);
  const currentBar = useMusicStore((state) => state.currentBar);
  const currentStep = useMusicStore((state) => state.currentStep);

  return (
    <div className="app" data-screen-label="Main" aria-label="Project Arranger workspace">
      {createElement(TopBar, {
        bpm,
        currentBar,
        currentStep,
        rootKey,
        scale,
      })}
      <main className="workspace">
        {createElement(TracksColumn)}
        {createElement(Timeline)}
      </main>
      {createElement(ChordEditor)}
    </div>
  );
}
