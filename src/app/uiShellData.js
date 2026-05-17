import { TOTAL_BARS, TRACK_IDS } from '../domain/musicConstants.js';

const trackLabels = {
  drums: 'Drums',
  bass: 'Bass',
  chord: 'Chord',
  lead: 'Lead',
  pad: 'Pad',
  vocal: 'Vocal',
  sample: 'Sample',
};

const trackVolumes = {
  drums: { level: 72, label: '-4dB' },
  bass: { level: 64, label: '-6dB' },
  chord: { level: 58, label: '-8dB' },
  lead: { level: 54, label: '-9dB' },
  pad: { level: 48, label: '-11dB' },
  vocal: { level: 50, label: '-10dB' },
  sample: { level: 60, label: '-7dB' },
};

const trackClips = {
  drums: 'Drum 01',
  chord: 'Chord 01',
};

const TRACK_UI = Object.freeze(
  TRACK_IDS.map((id) => Object.freeze({
    id,
    label: trackLabels[id],
    volume: trackVolumes[id],
    clipName: trackClips[id] ?? null,
    selected: id === 'chord',
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

export { BAR_NUMBERS, BEAT_NUMBERS, CHORD_NOTES, TRACK_UI };
