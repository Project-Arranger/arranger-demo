import assert from 'node:assert/strict';
import { test } from 'node:test';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import { seedDefaultDrumsPattern } from '../src/app/audioUiBridge.js';
import {
  DRUM_SEQUENCER_ROWS,
  getDrumsStepInstruments,
  isDrumsStepActive,
  toggleInstrumentInCell,
} from '../src/app/drumSequencerData.js';

test('drum sequencer exposes the three supported drums rows', () => {
  assert.deepEqual(DRUM_SEQUENCER_ROWS.map((row) => row.id), ['kick', 'snare', 'hihat']);
  assert.deepEqual(DRUM_SEQUENCER_ROWS.map((row) => row.label), ['Kick', 'Snare', 'Hi-Hat']);
});

test('drum sequencer reads highlighted steps from the current matrix', () => {
  const state = {
    matrix: createInitialMatrix(),
    setCell(trackId, bar, step, cell) {
      state.matrix[trackId][bar][step] = cell;
    },
  };
  const store = { getState: () => state };

  seedDefaultDrumsPattern(store);

  assert.deepEqual(getDrumsStepInstruments(state.matrix, 0, 0), ['kick', 'hihat']);
  assert.equal(isDrumsStepActive(state.matrix, 0, 0, 'kick'), true);
  assert.equal(isDrumsStepActive(state.matrix, 0, 0, 'snare'), false);
  assert.equal(isDrumsStepActive(state.matrix, 0, 8, 'snare'), true);
});

test('toggleInstrumentInCell adds and removes one drums instrument without corrupting others', () => {
  assert.deepEqual(toggleInstrumentInCell(null, 'kick'), { instruments: ['kick'] });
  assert.deepEqual(
    toggleInstrumentInCell({ instruments: ['kick'] }, 'hihat'),
    { instruments: ['kick', 'hihat'] },
  );
  assert.deepEqual(
    toggleInstrumentInCell({ instruments: ['kick', 'hihat'] }, 'kick'),
    { instruments: ['hihat'] },
  );
  assert.equal(toggleInstrumentInCell({ instruments: ['snare'] }, 'snare'), null);
});
