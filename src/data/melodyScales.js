const MELODY_KEY_SEQUENCE = Object.freeze(['.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=']);

const MELODY_SCALES = Object.freeze({
  major: Object.freeze({
    id: 'major',
    label: '自然大调音阶',
    tag: '默认',
    notes: Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
    keyNotes: Object.freeze([
      'G3',
      'A3',
      'B3',
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'A4',
      'B4',
      'C5',
      'D5',
      'E5',
    ]),
    description: '最广为人知的音阶，应用最广泛的音阶。',
    footLabel: '7 个音 · 全-全-半-全-全-全-半',
  }),
  pentatonic: Object.freeze({
    id: 'pentatonic',
    label: '五声音阶',
    tag: '',
    notes: Object.freeze(['C', 'D', 'E', null, 'G', 'A', null]),
    keyNotes: Object.freeze([
      'D3',
      'E3',
      'G3',
      'A3',
      'C4',
      'D4',
      'E4',
      'G4',
      'A4',
      'C5',
      'D5',
      'E5',
      'G5',
    ]),
    description: '最和谐悦耳的音阶，更是中国传统音乐的代名词。许多耳熟能详的旋律都是基于它创造的。',
    footLabel: '5 个音 · 无半音冲突',
  }),
});

const MELODY_SCALE_IDS = Object.freeze(Object.keys(MELODY_SCALES));

const MELODY_RAIL_ROOTS = Object.freeze(['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']);
const MELODY_RAIL_NOTES = Object.freeze(
  MELODY_RAIL_ROOTS.map((label) => Object.freeze({
    label,
    note: `${label}4`,
    root: label === 'C',
    sharp: label.includes('#'),
  })),
);

const MELODY_NOTE_IDS = Object.freeze([
  'D3',
  'D#3',
  'E3',
  'F3',
  'F#3',
  'G3',
  'G#3',
  'A3',
  'A#3',
  'B3',
  'C4',
  'C#4',
  'D4',
  'D#4',
  'E4',
  'F4',
  'F#4',
  'G4',
  'G#4',
  'A4',
  'A#4',
  'B4',
  'C5',
  'C#5',
  'D5',
  'D#5',
  'E5',
  'F5',
  'F#5',
  'G5',
]);

function getMelodyScale(scaleId) {
  return MELODY_SCALES[scaleId] ?? MELODY_SCALES.major;
}

function getMelodyKeyNote(scaleId, key) {
  const keyIndex = MELODY_KEY_SEQUENCE.indexOf(key);
  if (keyIndex < 0) return null;

  return getMelodyScale(scaleId).keyNotes[keyIndex] ?? null;
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
  getMelodyKeyNote,
  getMelodyScale,
  MELODY_KEY_SEQUENCE,
  MELODY_NOTE_IDS,
  MELODY_RAIL_NOTES,
  MELODY_SCALES,
  MELODY_SCALE_IDS,
};
