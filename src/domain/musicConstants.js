const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
const BEATS_PER_BAR = 4;
const CHORD_SPAN = STEPS_PER_BAR / BEATS_PER_BAR;
const EIGHTH_STEPS_PER_BAR = 8;

const TRACK_IDS = Object.freeze([
  'drums',
  'chord',
  'bass',
  'lead',
  'pad',
  'vocal',
  'sample',
]);

const CORE_TRACK_IDS = Object.freeze(['drums', 'chord', 'bass', 'lead']);
const OPTIONAL_TRACK_IDS = Object.freeze(['pad', 'vocal', 'sample']);
const DRUMS_INSTRUMENT_IDS = Object.freeze(['kick', 'snare', 'hihat']);

const DEFAULT_BPM = 120;
const ROOT_KEY = 'C';
const SCALE = 'Ionian';

export {
  BEATS_PER_BAR,
  CHORD_SPAN,
  CORE_TRACK_IDS,
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  EIGHTH_STEPS_PER_BAR,
  OPTIONAL_TRACK_IDS,
  ROOT_KEY,
  SCALE,
  STEPS_PER_BAR,
  TOTAL_BARS,
  TRACK_IDS,
};
