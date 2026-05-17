import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOTAL_BARS } from '../src/domain/musicConstants.js';
import {
  applyBasicDrumsAllBars,
  applyBasicDrumsBar,
  clearDrumsBar,
  createBasicDrumsBar,
} from '../src/app/drumsPatternActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('createBasicDrumsBar returns the default sixteen-step drums groove', () => {
  const bar = createBasicDrumsBar();

  assert.equal(bar.length, 16);
  assert.deepEqual(bar[0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(bar[4], { instruments: ['hihat'] });
  assert.deepEqual(bar[8], { instruments: ['snare', 'hihat'] });
  assert.deepEqual(bar[12], { instruments: ['hihat'] });
  assert.equal(bar[1], null);
  assert.equal(bar[15], null);
  assert.notEqual(createBasicDrumsBar()[0], createBasicDrumsBar()[0]);
});

test('applyBasicDrumsBar only writes the requested drums bar', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['snare'] };
  matrix.bass[2][0] = { note: 'C2' };

  const nextMatrix = applyBasicDrumsBar(matrix, 2);

  assert.notEqual(nextMatrix, matrix);
  assert.notEqual(nextMatrix.drums, matrix.drums);
  assert.deepEqual(nextMatrix.drums[2][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(nextMatrix.drums[2][8], { instruments: ['snare', 'hihat'] });
  assert.deepEqual(nextMatrix.drums[0][0], { instruments: ['snare'] });
  assert.equal(nextMatrix.drums[1][0], null);
  assert.deepEqual(nextMatrix.bass[2][0], { note: 'C2' });
  assert.equal(matrix.drums[2][0], null);
});

test('applyBasicDrumsAllBars writes the default groove to every drums bar only', () => {
  const matrix = createInitialMatrix();
  matrix.chord[0][0] = { chord: 'C' };

  const nextMatrix = applyBasicDrumsAllBars(matrix);

  assert.equal(nextMatrix.drums.length, TOTAL_BARS);
  assert.deepEqual(
    nextMatrix.drums.map((bar) => bar[0]),
    Array.from({ length: TOTAL_BARS }, () => ({ instruments: ['kick', 'hihat'] })),
  );
  assert.deepEqual(nextMatrix.chord[0][0], { chord: 'C' });
  assert.equal(matrix.drums[7][0], null);
});

test('clearDrumsBar only clears the requested drums bar', () => {
  const matrix = applyBasicDrumsAllBars(createInitialMatrix());
  matrix.lead[3][4] = { note: 'E4' };

  const nextMatrix = clearDrumsBar(matrix, 3);

  assert.equal(nextMatrix.drums[3].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.drums[2][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(nextMatrix.drums[4][8], { instruments: ['snare', 'hihat'] });
  assert.deepEqual(nextMatrix.lead[3][4], { note: 'E4' });
});
