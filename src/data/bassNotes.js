import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import { CHORD_GRID_PITCHES } from '../domain/chordCells.js';

/**
 * Bass 音符定义 — 复用 Chord 的三八度音高卷帘。
 * 可用采样仍由 Tone.Sampler 负责邻近转调。
 */

const BASS_NOTES = Object.freeze(
  CHORD_GRID_PITCHES.map((pitch) => Object.freeze({
    ...pitch,
    note: pitch.label,
    label: pitch.label,
  })),
);

const BASS_NOTE_IDS = Object.freeze(BASS_NOTES.map((note) => note.note));

const BASS_COLUMNS = STEPS_PER_BAR;

export { BASS_NOTES, BASS_NOTE_IDS, BASS_COLUMNS };
