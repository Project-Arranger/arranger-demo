import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createChordNotes,
  createMatrixPlaybackAdapter,
  extractChordEvent,
  extractDrumsInstruments,
} from '../src/audio/matrixPlaybackAdapter.js';
import { STEPS_PER_BAR, TOTAL_BARS } from '../src/domain/musicConstants.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('extractDrumsInstruments reads drums cells', () => {
  assert.deepEqual(extractDrumsInstruments(null), []);
  assert.deepEqual(extractDrumsInstruments({ instruments: ['kick', 'tom', 'hihat'] }), ['kick', 'hihat']);
  assert.deepEqual(extractDrumsInstruments({ instrument: 'snare' }), ['snare']);
});

test('matrix playback adapter returns drums events for a matrix step', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick', 'hihat'] };
  matrix.drums[1][4] = { instrument: 'snare' };
  matrix.bass[0][0] = { note: 'C1' };

  const adapter = createMatrixPlaybackAdapter(() => matrix);

  assert.deepEqual(adapter.getEventsForStep(0, 0), [
    { type: 'drums', trackId: 'drums', bar: 0, step: 0, instrument: 'kick' },
    { type: 'drums', trackId: 'drums', bar: 0, step: 0, instrument: 'hihat' },
  ]);
  assert.deepEqual(adapter.getEventsForStep(1, 4), [
    { type: 'drums', trackId: 'drums', bar: 1, step: 4, instrument: 'snare' },
  ]);
  assert.deepEqual(adapter.getEventsForStep(0, 1), []);
});

test('createChordNotes maps major chord roots to playable triads', () => {
  assert.deepEqual(createChordNotes('C'), ['C4', 'E4', 'G4']);
  assert.deepEqual(createChordNotes('F#'), ['F#4', 'A#4', 'C#5']);
  assert.deepEqual(createChordNotes('A#'), ['A#4', 'D5', 'F5']);
  assert.deepEqual(createChordNotes('H'), []);
});

test('extractChordEvent reads chord cells into playable chord events', () => {
  assert.equal(extractChordEvent(null, 0, 0), null);
  assert.deepEqual(
    extractChordEvent({ root: 'D#', quality: 'maj', label: 'D#' }, 2, 4),
    {
      type: 'chord',
      trackId: 'chord',
      bar: 2,
      step: 4,
      root: 'D#',
      quality: 'maj',
      label: 'D#',
      notes: ['D#4', 'G4', 'A#4'],
      duration: '4n',
    },
  );
});

test('matrix playback adapter returns chord events for chord span starts only', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][4] = { instruments: ['hihat'] };
  matrix.chord[0][4] = { root: 'G', quality: 'maj', label: 'G' };
  matrix.chord[0][5] = { root: 'C', quality: 'maj', label: 'C' };

  const adapter = createMatrixPlaybackAdapter(() => matrix);

  assert.deepEqual(adapter.getEventsForStep(0, 4), [
    { type: 'drums', trackId: 'drums', bar: 0, step: 4, instrument: 'hihat' },
    {
      type: 'chord',
      trackId: 'chord',
      bar: 0,
      step: 4,
      root: 'G',
      quality: 'maj',
      label: 'G',
      notes: ['G4', 'B4', 'D5'],
      duration: '4n',
    },
  ]);
  assert.deepEqual(adapter.getEventsForStep(0, 5), []);
});

test('matrix playback adapter wraps flat transport steps across eight bars', () => {
  const matrix = createInitialMatrix();
  matrix.drums[7][15] = { instruments: ['kick'] };

  const adapter = createMatrixPlaybackAdapter(matrix);
  const lastFlatStep = TOTAL_BARS * STEPS_PER_BAR - 1;

  assert.deepEqual(adapter.getPositionForFlatStep(lastFlatStep), { bar: 7, step: 15 });
  assert.deepEqual(adapter.getPositionForFlatStep(lastFlatStep + 1), { bar: 0, step: 0 });
  assert.deepEqual(adapter.getEventsForFlatStep(lastFlatStep), [
    { type: 'drums', trackId: 'drums', bar: 7, step: 15, instrument: 'kick' },
  ]);
});
