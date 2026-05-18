import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearChordBar,
  clearChordCell,
  getChordCell,
  setChordCell,
} from '../src/app/chordActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('setChordCell writes only the selected chord span in the selected bar', () => {
  const matrix = createInitialMatrix();
  matrix.chord[0][0] = { root: 'C', quality: 'maj', label: 'C' };
  matrix.drums[2][4] = { instruments: ['kick'] };

  const nextMatrix = setChordCell(matrix, 2, 1, 'G');

  assert.notEqual(nextMatrix, matrix);
  assert.notEqual(nextMatrix.chord, matrix.chord);
  assert.notEqual(nextMatrix.chord[2], matrix.chord[2]);
  assert.deepEqual(nextMatrix.chord[2][4], { root: 'G', quality: 'maj', label: 'G' });
  assert.equal(nextMatrix.chord[2][0], null);
  assert.deepEqual(nextMatrix.chord[0][0], { root: 'C', quality: 'maj', label: 'C' });
  assert.deepEqual(nextMatrix.drums[2][4], { instruments: ['kick'] });
  assert.equal(matrix.chord[2][4], null);
});

test('getChordCell reads span start cells only', () => {
  const matrix = setChordCell(createInitialMatrix(), 3, 2, 'A#');

  assert.deepEqual(getChordCell(matrix, 3, 2), { root: 'A#', quality: 'maj', label: 'A#' });
  assert.equal(getChordCell(matrix, 3, 1), null);
  assert.equal(getChordCell(matrix, 8, 0), null);
});

test('clearChordCell clears only one chord span', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 1, 0, 'C');
  matrix = setChordCell(matrix, 1, 2, 'F');
  matrix.bass[1][8] = { note: 'C2' };

  const nextMatrix = clearChordCell(matrix, 1, 0);

  assert.equal(nextMatrix.chord[1][0], null);
  assert.deepEqual(nextMatrix.chord[1][8], { root: 'F', quality: 'maj', label: 'F' });
  assert.deepEqual(nextMatrix.bass[1][8], { note: 'C2' });
});

test('clearChordBar clears the selected chord bar without touching other tracks', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 4, 0, 'C');
  matrix = setChordCell(matrix, 4, 1, 'D');
  matrix = setChordCell(matrix, 5, 0, 'E');
  matrix.lead[4][0] = { note: 'C4' };

  const nextMatrix = clearChordBar(matrix, 4);

  assert.equal(nextMatrix.chord[4].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.chord[5][0], { root: 'E', quality: 'maj', label: 'E' });
  assert.deepEqual(nextMatrix.lead[4][0], { note: 'C4' });
});
