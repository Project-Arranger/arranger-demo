import { createPianoRollNotes } from './pianoRollNotes.js';

const MELODY_PITCH_CLASSES = Object.freeze([
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]);
const MELODY_KEY_SEQUENCE = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+']);
const MELODY_KEY_ALIASES = Object.freeze({
  '=': '+',
});
const MELODY_KEY_NOTES = Object.freeze(MELODY_PITCH_CLASSES.map((pitchClass) => `${pitchClass}4`));

const MELODY_SCALES = Object.freeze({
  major: Object.freeze({
    id: 'major',
    label: '自然大调音阶',
    tag: '默认',
    highlightedPitchClasses: Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
    description: '最广为人知的音阶，应用最广泛的音阶。',
    footLabel: '7 个音 · 全-全-半-全-全-全-半',
  }),
  pentatonic: Object.freeze({
    id: 'pentatonic',
    label: '五声音阶',
    tag: '',
    highlightedPitchClasses: Object.freeze(['C', 'D', 'E', 'G', 'A']),
    description: '最和谐悦耳的音阶，更是中国传统音乐的代名词。许多耳熟能详的旋律都是基于它创造的。',
    footLabel: '5 个音 · 无半音冲突',
  }),
});

const MELODY_SCALE_IDS = Object.freeze(Object.keys(MELODY_SCALES));

const MELODY_NOTES = createPianoRollNotes({ lowestOctave: 3 });
const MELODY_NOTE_IDS = Object.freeze(MELODY_NOTES.map(({ note }) => note));

function getMelodyScale(scaleId) {
  return MELODY_SCALES[scaleId] ?? MELODY_SCALES.major;
}

function getMelodyKeyboardKey(key) {
  return MELODY_KEY_ALIASES[key] ?? key;
}

function getMelodyKeyNote(key) {
  const keyIndex = MELODY_KEY_SEQUENCE.indexOf(getMelodyKeyboardKey(key));
  if (keyIndex < 0) return null;

  return MELODY_KEY_NOTES[keyIndex] ?? null;
}

function isMelodyScalePitchClass(scaleId, pitchClass) {
  return getMelodyScale(scaleId).highlightedPitchClasses.includes(pitchClass);
}

function getMelodyScalePreviewNotes(scaleId) {
  return MELODY_KEY_NOTES.filter((note, index) => (
    isMelodyScalePitchClass(scaleId, MELODY_PITCH_CLASSES[index])
  ));
}

function formatMelodyNoteParts(note) {
  const [, name, octave] = /^([A-G]#?)(\d)$/.exec(note) ?? [];
  return {
    name: name ?? note,
    octave: octave ?? '',
  };
}

export {
  formatMelodyNoteParts,
  getMelodyKeyboardKey,
  getMelodyKeyNote,
  getMelodyScale,
  getMelodyScalePreviewNotes,
  isMelodyScalePitchClass,
  MELODY_KEY_SEQUENCE,
  MELODY_NOTES,
  MELODY_NOTE_IDS,
  MELODY_PITCH_CLASSES,
  MELODY_SCALES,
  MELODY_SCALE_IDS,
};
