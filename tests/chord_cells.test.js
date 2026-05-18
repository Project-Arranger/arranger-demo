import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHORD_SPAN, STEPS_PER_BAR } from '../src/domain/musicConstants.js';
import {
  CHORD_ROOTS,
  createChordCell,
  getChordToneRoots,
  getChordSpanStep,
  isChordRoot,
  isChordCellActive,
  toggleChordCell,
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
  assert.deepEqual(createChordCell('C'), { root: 'C', quality: 'maj', label: 'C' });
  assert.deepEqual(createChordCell('F#'), { root: 'F#', quality: 'maj', label: 'F#' });
  assert.equal(createChordCell('H'), null);
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
  assert.deepEqual(toggleChordCell(null, 'D'), { root: 'D', quality: 'maj', label: 'D' });
  assert.equal(toggleChordCell({ root: 'D', quality: 'maj', label: 'D' }, 'D'), null);
  assert.deepEqual(
    toggleChordCell({ root: 'D', quality: 'maj', label: 'D' }, 'A'),
    { root: 'A', quality: 'maj', label: 'A' },
  );
  assert.equal(toggleChordCell(null, 'H'), null);
});
