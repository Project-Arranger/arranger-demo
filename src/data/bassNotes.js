import { STEPS_PER_BAR } from '../domain/musicConstants.js';

const BASS_GRID_ROOTS = Object.freeze(['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']);
const BASS_GRID_OCTAVES = Object.freeze([2, 1, 0]);

const BASS_NOTES = Object.freeze(
  BASS_GRID_OCTAVES.flatMap((octave) => (
    BASS_GRID_ROOTS.map((root) => Object.freeze({
      label: `${root}${octave}`,
      note: `${root}${octave}`,
      rootName: root,
      octave,
      sharp: root.includes('#'),
      root: root === 'C',
    }))
  )),
);

const BASS_NOTE_IDS = Object.freeze(BASS_NOTES.map((note) => note.note));

const BASS_COLUMNS = STEPS_PER_BAR;

export { BASS_NOTES, BASS_NOTE_IDS, BASS_COLUMNS };
