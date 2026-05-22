import assert from 'node:assert/strict';
import { test } from 'node:test';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import { createDrumsStepMovePatch } from '../src/domain/drumsStepMove.js';

test('createDrumsStepMovePatch moves one drums instrument and preserves stacked notes', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick', 'hihat'] };
  matrix.drums[0][2] = { instruments: ['snare'] };

  const move = createDrumsStepMovePatch({
    bar: 0,
    fromStep: 0,
    instrument: 'kick',
    matrix,
    toStep: 2,
  });

  assert.equal(move.allowed, true);
  assert.deepEqual(move.nextMatrixPatch, [
    { bar: 0, cell: { instruments: ['hihat'] }, step: 0 },
    { bar: 0, cell: { instruments: ['kick', 'snare'] }, step: 2 },
  ]);
  assert.deepEqual(matrix.drums[0][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(matrix.drums[0][2], { instruments: ['snare'] });
});

test('createDrumsStepMovePatch rejects inactive, duplicate, and same-step moves', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick'] };
  matrix.drums[0][2] = { instruments: ['kick'] };

  assert.equal(createDrumsStepMovePatch({
    bar: 0,
    fromStep: 1,
    instrument: 'kick',
    matrix,
    toStep: 3,
  }).allowed, false);

  assert.equal(createDrumsStepMovePatch({
    bar: 0,
    fromStep: 0,
    instrument: 'kick',
    matrix,
    toStep: 2,
  }).allowed, false);

  assert.equal(createDrumsStepMovePatch({
    bar: 0,
    fromStep: 0,
    instrument: 'kick',
    matrix,
    toStep: 0,
  }).allowed, false);
});
