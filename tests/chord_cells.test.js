import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHORD_SPAN, STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import {
  DIATONIC_CHORD_OPTIONS,
  PASSING_CHORD_DEFAULT_OPTIONS,
  PASSING_CHORD_OPTIONS,
  CHORD_TEMPLATES,
  CHORD_ROOTS,
  createChordCell,
  createChordNoteCell,
  createChordNotesCell,
  getChordCellNotes,
  getPassingChordOptions,
  getChordVariantOptions,
  getChordToneRoots,
  getChordSpanStep,
  isChordName,
  isChordRoot,
  isChordCellActive,
  isChordAddedNoteActive,
  toggleChordCell,
  toggleChordNoteCell,
} from '../src/domain/chordCells.js';

test('chord roots cover the twelve editor notes', () => {
  assert.deepEqual(CHORD_ROOTS, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
  assert.equal(isChordRoot('C'), true);
  assert.equal(isChordRoot('A#'), true);
  assert.equal(isChordRoot('H'), false);
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
  assert.equal(isChordName('Hmaj7'), false);
  assert.deepEqual(getChordToneRoots('Cmaj7'), ['C', 'E', 'G', 'B']);
  assert.deepEqual(getChordToneRoots('Dm7'), ['D', 'F', 'A', 'C']);
  assert.deepEqual(getChordToneRoots('Bdim'), ['B', 'D', 'F']);
  assert.deepEqual(getChordToneRoots('C/B'), ['C', 'E', 'G']);
  assert.deepEqual(getChordToneRoots('Bø'), ['B', 'D', 'F', 'A']);
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

test('add chord panel exposes diatonic and context-aware passing options', () => {
  assert.deepEqual(
    DIATONIC_CHORD_OPTIONS.map((option) => [option.name, option.roman]),
    [['C', 'I'], ['Dm', 'ii'], ['Em', 'iii'], ['F', 'IV'], ['G', 'V'], ['Am', 'vi'], ['Bdim', 'vii°']],
  );
  assert.deepEqual(
    PASSING_CHORD_OPTIONS['C→Am'].map((option) => option.name),
    ['C/B', 'E7', 'Bø'],
  );
  assert.deepEqual(
    getPassingChordOptions('C', 'F').map((option) => option.name),
    ['C7', 'F/C', 'Em'],
  );
  assert.deepEqual(
    getPassingChordOptions(null, null).map((option) => option.name),
    PASSING_CHORD_DEFAULT_OPTIONS.map((option) => option.name),
  );
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

test('chord active tones light the sustained chord range only', () => {
  const cCell = createChordCell('C');

  assert.deepEqual(getChordToneRoots('C'), ['C', 'E', 'G']);
  assert.deepEqual(getChordToneRoots('F#'), ['F#', 'A#', 'C#']);
  assert.deepEqual(getChordToneRoots('H'), []);
  assert.equal(isChordCellActive(cCell, 'C', 0), true);
  assert.equal(isChordCellActive(cCell, 'E', 0), true);
  assert.equal(isChordCellActive(cCell, 'G', 0), true);
  assert.equal(isChordCellActive(cCell, 'B', 0), false);
  assert.equal(isChordCellActive(cCell, 'C', 1), true);
  assert.equal(isChordCellActive(cCell, 'E', 1), true);
  assert.equal(isChordCellActive(cCell, 'C', 2), false);
  assert.equal(isChordCellActive(null, 'C', 0), false);
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
  assert.deepEqual(createChordNotesCell(['F', 'A', 'F']), { type: 'notes', notes: ['F', 'A'], label: 'F/A' });
  assert.equal(createChordNoteCell('H'), null);
  assert.deepEqual(getChordCellNotes({ type: 'note', note: 'C', label: 'C' }), ['C']);
  assert.deepEqual(getChordCellNotes(createChordNotesCell(['D', 'F'])), ['D', 'F']);
  assert.equal(isChordCellActive(cNote, 'C#', 2), true);
  assert.equal(isChordCellActive(cNote, 'C#', 1), true);
  assert.equal(isChordCellActive(cNote, 'D', 2), false);
  assert.equal(isChordAddedNoteActive(cNote, 'C#'), true);
  assert.deepEqual(toggleChordNoteCell(null, 'A'), createChordNoteCell('A'));
  assert.deepEqual(toggleChordNoteCell(createChordNoteCell('A'), 'G'), createChordNotesCell(['A', 'G']));
  assert.deepEqual(toggleChordNoteCell(createChordNotesCell(['A', 'G']), 'A'), createChordNoteCell('G'));
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
  assert.equal(isChordCellActive(enrichedCell, 'D', 0), false);
  assert.deepEqual(toggleChordNoteCell(enrichedCell, 'F').addedNotes, ['D', 'F']);
  assert.deepEqual(toggleChordNoteCell({ ...cCell, addedNotes: ['D'] }, 'D'), cCell);
});
