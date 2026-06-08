import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHORD_SPAN, STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import {
  DIATONIC_CHORD_OPTIONS,
  PASSING_CHORD_DEFAULT_OPTIONS,
  PASSING_CHORD_OPTIONS,
  CHORD_TEMPLATES,
  CHORD_GRID_OCTAVES,
  CHORD_GRID_PITCHES,
  CHORD_ROOTS,
  DEFAULT_CHORD_GRID_OCTAVE,
  createPassingChordCell,
  createChordCell,
  createChordNoteCell,
  createChordNotesCell,
  createChordTonePitches,
  getChordCellNotes,
  getChordEffectiveTonePitches,
  getDoowopPassingTargetChord,
  getPassingChordOptions,
  getChordVariantOptions,
  getChordToneRoots,
  getChordSpanStep,
  isChordGridPitch,
  isChordName,
  isChordRoot,
  isChordCellActive,
  isChordAddedNoteActive,
  toggleChordCell,
  toggleChordNoteCell,
} from '../src/domain/chordCells.js';

function getActiveChordGridLabels(cell) {
  return CHORD_GRID_PITCHES
    .filter((note) => isChordCellActive(cell, note.label))
    .map((note) => note.label);
}

test('chord roots cover the twelve editor notes', () => {
  assert.deepEqual(CHORD_ROOTS, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
  assert.equal(isChordRoot('C'), true);
  assert.equal(isChordRoot('A#'), true);
  assert.equal(isChordRoot('H'), false);
});

test('chord grid pitches cover three visual octaves from B down to C', () => {
  assert.deepEqual(CHORD_GRID_OCTAVES, [5, 4, 3]);
  assert.equal(DEFAULT_CHORD_GRID_OCTAVE, 4);
  assert.equal(CHORD_GRID_PITCHES.length, 36);
  assert.deepEqual(
    CHORD_GRID_PITCHES.map((pitch) => pitch.label).slice(0, 12),
    ['B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5', 'C5'],
  );
  assert.deepEqual(
    CHORD_GRID_PITCHES.map((pitch) => pitch.label).slice(12, 24),
    ['B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'],
  );
  assert.equal(CHORD_GRID_PITCHES.at(-1).label, 'C3');
  assert.equal(isChordGridPitch('C3'), true);
  assert.equal(isChordGridPitch('C4'), true);
  assert.equal(isChordGridPitch('C5'), true);
  assert.equal(isChordGridPitch('F#5'), true);
  assert.equal(isChordGridPitch('C2'), false);
  assert.equal(isChordGridPitch('C6'), false);
  assert.equal(isChordGridPitch('H4'), false);
});

test('getChordSpanStep maps four chord spans to matrix steps', () => {
  assert.equal(CHORD_SPAN, 4);
  assert.equal(STEPS_PER_BAR / CHORD_SPAN, 4);
  assert.deepEqual([0, 1, 2, 3].map(getChordSpanStep), [0, 4, 8, 12]);
  assert.equal(getChordSpanStep(-1), null);
  assert.equal(getChordSpanStep(4), null);
});

test('createChordCell normalizes valid roots and rejects invalid roots', () => {
  assert.deepEqual(createChordCell('C'), {
    type: 'chord',
    root: 'C',
    chordRoot: 'C',
    quality: 'maj',
    label: 'C',
    toneRoots: ['C', 'E', 'G'],
  });
  assert.deepEqual(createChordCell('F#'), {
    type: 'chord',
    root: 'F#',
    chordRoot: 'F#',
    quality: 'maj',
    label: 'F#',
    toneRoots: ['F#', 'A#', 'C#'],
  });
  assert.equal(createChordCell('H'), null);
});

test('chord definitions include template and variant chord colors', () => {
  assert.equal(isChordName('Cmaj7'), true);
  assert.equal(isChordName('Am9'), true);
  assert.equal(isChordName('Bdim'), true);
  assert.equal(isChordName('C/B'), true);
  assert.equal(isChordName('E7'), true);
  assert.equal(isChordName('Bø'), true);
  assert.equal(isChordName('F#ø'), true);
  assert.equal(isChordName('Bm7(no5)'), true);
  assert.equal(isChordName('G#'), true);
  assert.equal(isChordName('Hmaj7'), false);
  assert.deepEqual(getChordToneRoots('Cmaj7'), ['C', 'E', 'G', 'B']);
  assert.deepEqual(getChordToneRoots('Dm7'), ['D', 'F', 'A', 'C']);
  assert.deepEqual(getChordToneRoots('Bdim'), ['B', 'D', 'F']);
  assert.deepEqual(getChordToneRoots('C/B'), ['B', 'C', 'E', 'G']);
  assert.deepEqual(getChordToneRoots('Bø'), ['B', 'D', 'F', 'A']);
  assert.deepEqual(getChordToneRoots('F#ø'), ['F#', 'A', 'C', 'E']);
  assert.deepEqual(getChordToneRoots('Bm7(no5)'), ['B', 'D', 'A']);
  assert.deepEqual(createChordCell('Am9'), {
    type: 'chord',
    root: 'A',
    chordRoot: 'Am',
    quality: 'm9',
    label: 'Am9',
    toneRoots: ['A', 'C', 'E', 'G', 'B'],
  });
  assert.deepEqual(CHORD_TEMPLATES.doowop.chords, ['C', 'Am', 'F', 'G']);
  assert.equal(Object.keys(CHORD_TEMPLATES).length, 6);
});

test('chord helpers expose diatonic and context-aware passing option data', () => {
  assert.deepEqual(
    DIATONIC_CHORD_OPTIONS.map((option) => [option.name, option.roman]),
    [['C', 'I'], ['Dm', 'ii'], ['Em', 'iii'], ['F', 'IV'], ['G', 'V'], ['Am', 'vi'], ['Bdim', 'vii°']],
  );
  assert.deepEqual(Object.keys(PASSING_CHORD_OPTIONS), ['C→Am', 'Am→F', 'F→G', 'G→C']);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(PASSING_CHORD_OPTIONS).map(([key, options]) => [
        key,
        options.map((option) => [option.name, option.toneRoots]),
      ]),
    ),
    {
      'C→Am': [
        ['C/B', ['B', 'C', 'E', 'G']],
        ['E7', ['E', 'B', 'D', 'G#']],
        ['Bø', ['B', 'D', 'F', 'A']],
      ],
      'Am→F': [
        ['Am/G', ['G', 'A', 'C', 'E']],
        ['C7', ['C', 'E', 'G', 'A#']],
      ],
      'F→G': [
        ['D7', ['D', 'A', 'C', 'F#']],
        ['F#ø', ['F#', 'A', 'C', 'E']],
      ],
      'G→C': [
        ['G#', ['G#', 'C', 'D#']],
        ['Bm7(no5)', ['B', 'D', 'A']],
      ],
    },
  );
  assert.deepEqual(
    getPassingChordOptions('C', 'Am').map((option) => option.name),
    ['C/B', 'E7', 'Bø'],
  );
  assert.deepEqual(
    getPassingChordOptions('Am', 'F').map((option) => option.name),
    ['Am/G', 'C7'],
  );
  assert.deepEqual(
    getPassingChordOptions('F', 'G').map((option) => option.name),
    ['D7', 'F#ø'],
  );
  assert.deepEqual(
    getPassingChordOptions('G', 'C').map((option) => option.name),
    ['G#', 'Bm7(no5)'],
  );
  assert.deepEqual(
    getPassingChordOptions('C', 'F').map((option) => option.name),
    PASSING_CHORD_DEFAULT_OPTIONS.map((option) => option.name),
  );
  assert.deepEqual(
    getPassingChordOptions(null, null).map((option) => option.name),
    PASSING_CHORD_DEFAULT_OPTIONS.map((option) => option.name),
  );
});

test('doowop passing target logic cycles through the demo progression', () => {
  assert.equal(getDoowopPassingTargetChord('C'), 'Am');
  assert.equal(getDoowopPassingTargetChord('Am'), 'F');
  assert.equal(getDoowopPassingTargetChord('F'), 'G');
  assert.equal(getDoowopPassingTargetChord('G'), 'C');
  assert.equal(getDoowopPassingTargetChord('Cmaj7'), 'Am');
  assert.equal(getDoowopPassingTargetChord('Bdim'), null);
  assert.equal(getDoowopPassingTargetChord(null), null);
});

test('createPassingChordCell creates a short playable chord hit', () => {
  assert.deepEqual(createPassingChordCell('E7'), {
    type: 'chord',
    root: 'E',
    chordRoot: 'E',
    quality: '7',
    label: 'E7',
    toneRoots: ['E', 'B', 'D', 'G#'],
    duration: '16n',
    grooveTemplateId: 'passing-shortcut',
    sourceChordLabel: 'E7',
  });
  assert.deepEqual(createPassingChordCell('F#ø'), {
    type: 'chord',
    root: 'F#',
    chordRoot: 'F#dim',
    quality: 'half-dim7',
    label: 'F#ø',
    toneRoots: ['F#', 'A', 'C', 'E'],
    duration: '16n',
    grooveTemplateId: 'passing-shortcut',
    sourceChordLabel: 'F#ø',
  });
  assert.deepEqual(createPassingChordCell('Bm7(no5)'), {
    type: 'chord',
    root: 'B',
    chordRoot: 'Bm',
    quality: 'm7-no5',
    label: 'Bm7(no5)',
    toneRoots: ['B', 'D', 'A'],
    duration: '16n',
    grooveTemplateId: 'passing-shortcut',
    sourceChordLabel: 'Bm7(no5)',
  });
  assert.deepEqual(createPassingChordCell('G#'), {
    type: 'chord',
    root: 'G#',
    chordRoot: 'G#',
    quality: 'maj',
    label: 'G#',
    toneRoots: ['G#', 'C', 'D#'],
    duration: '16n',
    grooveTemplateId: 'passing-shortcut',
    sourceChordLabel: 'G#',
  });
  assert.equal(createPassingChordCell('Hmaj7'), null);
});

test('add chord panel exposes rich variants for supported chord roots', () => {
  assert.deepEqual(
    getChordVariantOptions('C').map((option) => option.name),
    ['Cmaj7', 'Csus2', 'Csus4', 'Cadd9'],
  );
  assert.deepEqual(
    getChordVariantOptions('Cmaj7').map((option) => option.name),
    ['Cmaj7', 'Csus2', 'Csus4', 'Cadd9'],
  );
  assert.deepEqual(getChordVariantOptions('Dm'), []);
  assert.deepEqual(getChordVariantOptions(null), []);
});

test('chord active tones light wherever the chord cell is placed', () => {
  const cCell = createChordCell('C');
  const g7Cell = createChordCell('G7');
  const fSharpCell = createChordCell('F#');
  const shortGrooveCell = {
    ...cCell,
    duration: '16n',
    grooveTemplateId: 'block-syncopated',
  };

  assert.deepEqual(getChordToneRoots('C'), ['C', 'E', 'G']);
  assert.deepEqual(getChordToneRoots('F#'), ['F#', 'A#', 'C#']);
  assert.deepEqual(getChordToneRoots('H'), []);
  assert.deepEqual(createChordTonePitches('F#', getChordToneRoots('F#')), ['F#4', 'A#4', 'C#4']);
  assert.deepEqual(getActiveChordGridLabels(g7Cell), ['B4', 'G4', 'F4', 'D4']);
  assert.deepEqual(getActiveChordGridLabels(fSharpCell), ['A#4', 'F#4', 'C#4']);
  assert.equal(isChordCellActive(g7Cell, 'D5'), false);
  assert.equal(isChordCellActive(g7Cell, 'F5'), false);
  assert.equal(isChordCellActive(g7Cell, 'D4'), true);
  assert.equal(isChordCellActive(g7Cell, 'F4'), true);
  assert.equal(isChordCellActive(cCell, 'C', 0), true);
  assert.equal(isChordCellActive(cCell, 'E', 0), true);
  assert.equal(isChordCellActive(cCell, 'G', 0), true);
  assert.equal(isChordCellActive(cCell, 'B', 0), false);
  assert.equal(isChordCellActive(cCell, 'C', 1), true);
  assert.equal(isChordCellActive(cCell, 'E', 1), true);
  assert.equal(isChordCellActive(cCell, 'C', 2), true);
  assert.equal(isChordCellActive(cCell, 'E', 3), true);
  assert.equal(isChordCellActive(shortGrooveCell, 'C', 2), true);
  assert.equal(isChordCellActive(shortGrooveCell, 'E', 3), true);
  assert.equal(isChordCellActive(null, 'C', 0), false);
});

test('passing shortcut chords light table tones in the fourth octave', () => {
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('C/B')), ['B4', 'G4', 'E4', 'C4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('E7')), ['B4', 'G#4', 'E4', 'D4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('Am/G')), ['A4', 'G4', 'E4', 'C4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('D7')), ['A4', 'F#4', 'D4', 'C4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('F#ø')), ['A4', 'F#4', 'E4', 'C4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('G#')), ['G#4', 'D#4', 'C4']);
  assert.deepEqual(getActiveChordGridLabels(createPassingChordCell('Bm7(no5)')), ['B4', 'A4', 'D4']);

  const e7 = createPassingChordCell('E7');
  assert.equal(isChordCellActive(e7, 'D5'), false);
  assert.equal(isChordCellActive(e7, 'G#5'), false);
  assert.equal(isChordCellActive(e7, 'D4'), true);
  assert.equal(isChordCellActive(e7, 'G#4'), true);
});

test('toggleChordCell clears matching roots and preserves added notes when replacing', () => {
  assert.deepEqual(toggleChordCell(null, 'D'), createChordCell('D'));
  assert.equal(toggleChordCell(createChordCell('D'), 'D'), null);
  assert.deepEqual(toggleChordCell({ ...createChordCell('D'), addedNotes: ['F'] }, 'A'), {
    ...createChordCell('A'),
    addedNotes: ['F'],
  });
  assert.equal(toggleChordCell(null, 'H'), null);
});

test('note cells support multi-select saved notes per column', () => {
  const cNote = createChordNoteCell('C#');

  assert.deepEqual(cNote, { type: 'notes', notes: ['C#'], label: 'C#' });
  assert.deepEqual(createChordNoteCell('C3'), { type: 'notes', notes: ['C3'], label: 'C3' });
  assert.deepEqual(createChordNoteCell('C4'), { type: 'notes', notes: ['C4'], label: 'C4' });
  assert.deepEqual(createChordNoteCell('C5'), { type: 'notes', notes: ['C5'], label: 'C5' });
  assert.deepEqual(createChordNoteCell('F#5'), { type: 'notes', notes: ['F#5'], label: 'F#5' });
  assert.equal(createChordNoteCell('C2'), null);
  assert.equal(createChordNoteCell('C6'), null);
  assert.equal(createChordNoteCell('H4'), null);
  assert.deepEqual(createChordNotesCell(['F', 'A', 'F']), { type: 'notes', notes: ['F', 'A'], label: 'F/A' });
  assert.deepEqual(createChordNotesCell(['F3', 'A5', 'F3']), { type: 'notes', notes: ['F3', 'A5'], label: 'F3/A5' });
  assert.equal(createChordNoteCell('H'), null);
  assert.deepEqual(getChordCellNotes({ type: 'note', note: 'C', label: 'C' }), ['C']);
  assert.deepEqual(getChordCellNotes({ type: 'note', note: 'C5', label: 'C5' }), ['C5']);
  assert.deepEqual(getChordCellNotes(createChordNotesCell(['D', 'F'])), ['D', 'F']);
  assert.deepEqual(getChordCellNotes(createChordNotesCell(['D3', 'F5'])), ['D3', 'F5']);
  assert.equal(isChordCellActive(cNote, 'C#', 2), true);
  assert.equal(isChordCellActive(cNote, 'C#4', 2), true);
  assert.equal(isChordCellActive(cNote, 'C#3', 2), false);
  assert.equal(isChordCellActive(cNote, 'C#', 1), true);
  assert.equal(isChordCellActive(cNote, 'D', 2), false);
  assert.equal(isChordAddedNoteActive(cNote, 'C#'), true);
  assert.equal(isChordAddedNoteActive(cNote, 'C#4'), true);
  assert.equal(isChordAddedNoteActive(cNote, 'C#5'), false);
  assert.deepEqual(toggleChordNoteCell(null, 'A'), createChordNoteCell('A'));
  assert.deepEqual(toggleChordNoteCell(null, 'A3'), createChordNoteCell('A3'));
  assert.deepEqual(toggleChordNoteCell(createChordNoteCell('A'), 'G'), createChordNotesCell(['A', 'G']));
  assert.deepEqual(toggleChordNoteCell(createChordNoteCell('A3'), 'G5'), createChordNotesCell(['A3', 'G5']));
  assert.deepEqual(toggleChordNoteCell(createChordNotesCell(['A', 'G']), 'A'), createChordNoteCell('G'));
  assert.deepEqual(toggleChordNoteCell(createChordNoteCell('A'), 'A4'), null);
  assert.equal(toggleChordNoteCell(createChordNoteCell('A'), 'A'), null);
});

test('chord cells can carry added notes without changing the main chord label', () => {
  const cCell = createChordCell('C');
  const enrichedCell = toggleChordNoteCell(cCell, 'D');

  assert.deepEqual(enrichedCell, {
    ...cCell,
    addedNotes: ['D'],
  });
  assert.equal(enrichedCell.label, 'C');
  assert.equal(isChordAddedNoteActive(enrichedCell, 'D'), true);
  assert.equal(isChordAddedNoteActive(enrichedCell, 'D4'), true);
  assert.equal(isChordAddedNoteActive(enrichedCell, 'D3'), false);
  assert.equal(isChordCellActive(enrichedCell, 'D', 0), false);
  assert.deepEqual(toggleChordNoteCell(enrichedCell, 'F').addedNotes, ['D', 'F']);
  assert.deepEqual(toggleChordNoteCell(enrichedCell, 'F5').addedNotes, ['D', 'F5']);
  assert.deepEqual(toggleChordNoteCell({ ...cCell, addedNotes: ['D'] }, 'D'), cCell);
});

test('chord tones can be muted and replaced with explicit octave notes', () => {
  const cCell = createChordCell('C');
  const mutedRootCell = toggleChordNoteCell(cCell, 'C4');

  assert.deepEqual(mutedRootCell, {
    ...cCell,
    removedTonePitches: ['C4'],
  });
  assert.deepEqual(getChordEffectiveTonePitches(mutedRootCell), ['E4', 'G4']);
  assert.equal(isChordCellActive(mutedRootCell, 'C4'), false);
  assert.equal(isChordCellActive(mutedRootCell, 'E4'), true);
  assert.equal(isChordCellActive(mutedRootCell, 'G4'), true);
  assert.deepEqual(toggleChordNoteCell(mutedRootCell, 'C4'), cCell);

  const replacedRootCell = toggleChordNoteCell(mutedRootCell, 'C5');

  assert.deepEqual(replacedRootCell, {
    ...cCell,
    removedTonePitches: ['C4'],
    addedNotes: ['C5'],
  });
  assert.equal(isChordCellActive(replacedRootCell, 'C4'), false);
  assert.equal(isChordAddedNoteActive(replacedRootCell, 'C5'), true);
  assert.deepEqual(getChordEffectiveTonePitches(replacedRootCell), ['E4', 'G4']);
});

test('clicking another octave does not automatically mute the fourth-octave tone', () => {
  const cCell = createChordCell('C');
  const cWithHighRoot = toggleChordNoteCell(cCell, 'C5');

  assert.deepEqual(cWithHighRoot, {
    ...cCell,
    addedNotes: ['C5'],
  });
  assert.equal(isChordCellActive(cWithHighRoot, 'C4'), true);
  assert.equal(isChordAddedNoteActive(cWithHighRoot, 'C5'), true);
});
