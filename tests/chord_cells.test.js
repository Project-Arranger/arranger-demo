import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHORD_SPAN, STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import {
  CHORD_TEMPLATES,
  CHORD_ROOTS,
  createChordCell,
  createChordNoteCell,
  getChordToneRoots,
  getChordSpanStep,
  isChordName,
  isChordRoot,
  isChordCellActive,
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
  assert.equal(isChordName('Hmaj7'), false);
  assert.deepEqual(getChordToneRoots('Cmaj7'), ['C', 'E', 'G', 'B']);
  assert.deepEqual(getChordToneRoots('Dm7'), ['D', 'F', 'A', 'C']);
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

test('chord active tones light the triad only in the first grid column', () => {
  const cCell = createChordCell('C');

  assert.deepEqual(getChordToneRoots('C'), ['C', 'E', 'G']);
  assert.deepEqual(getChordToneRoots('F#'), ['F#', 'A#', 'C#']);
  assert.deepEqual(getChordToneRoots('H'), []);
  assert.equal(isChordCellActive(cCell, 'C', 0), true);
  assert.equal(isChordCellActive(cCell, 'E', 0), true);
  assert.equal(isChordCellActive(cCell, 'G', 0), true);
  assert.equal(isChordCellActive(cCell, 'B', 0), false);
  assert.equal(isChordCellActive(cCell, 'C', 1), false);
  assert.equal(isChordCellActive(cCell, 'E', 1), false);
  assert.equal(isChordCellActive(null, 'C', 0), false);
});

test('toggleChordCell clears matching roots and replaces different roots', () => {
  assert.deepEqual(toggleChordCell(null, 'D'), createChordCell('D'));
  assert.equal(toggleChordCell(createChordCell('D'), 'D'), null);
  assert.deepEqual(
    toggleChordCell(createChordCell('D'), 'A'),
    createChordCell('A'),
  );
  assert.equal(toggleChordCell(null, 'H'), null);
});

test('note cells support one saved note per non-primary beat', () => {
  const cNote = createChordNoteCell('C#');

  assert.deepEqual(cNote, { type: 'note', note: 'C#', label: 'C#' });
  assert.equal(createChordNoteCell('H'), null);
  assert.equal(isChordCellActive(cNote, 'C#', 2), true);
  assert.equal(isChordCellActive(cNote, 'C#', 1), true);
  assert.equal(isChordCellActive(cNote, 'D', 2), false);
  assert.deepEqual(toggleChordNoteCell(null, 'A'), createChordNoteCell('A'));
  assert.equal(toggleChordNoteCell(createChordNoteCell('A'), 'A'), null);
  assert.deepEqual(toggleChordNoteCell(createChordNoteCell('A'), 'G'), createChordNoteCell('G'));
});
