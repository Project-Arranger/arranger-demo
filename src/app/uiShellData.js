import { TOTAL_BARS, TRACK_IDS } from '../domain/musicConstants.js';
import { CHORD_GRID_PITCHES } from '../domain/chordCells.js';
import { createTrackVolumeView } from './trackVolumeViewModels.js';

const trackLabels = {
  drums: 'Drums',
  bass: 'Bass',
  chord: 'Chord',
  lead: 'Melody',
  pad: 'Pad',
  vocal: 'Vocal',
  sample: 'Sample',
};

const TRACK_UI = Object.freeze(
  TRACK_IDS.map((id) => Object.freeze({
    id,
    label: trackLabels[id],
    volume: createTrackVolumeView(),
  })),
);

const BAR_NUMBERS = Object.freeze(
  Array.from({ length: TOTAL_BARS }, (_, index) => index + 1),
);

const CHORD_NOTES = Object.freeze([
  { label: 'B', sharp: false },
  { label: 'A#', sharp: true },
  { label: 'A', sharp: false },
  { label: 'G#', sharp: true },
  { label: 'G', sharp: false },
  { label: 'F#', sharp: true },
  { label: 'F', sharp: false },
  { label: 'E', sharp: false },
  { label: 'D#', sharp: true },
  { label: 'D', sharp: false },
  { label: 'C#', sharp: true },
  { label: 'C', sharp: false, root: true },
]);

const BEAT_NUMBERS = Object.freeze([1, 2, 3, 4]);

export { BAR_NUMBERS, BEAT_NUMBERS, CHORD_GRID_PITCHES, CHORD_NOTES, TRACK_UI };
