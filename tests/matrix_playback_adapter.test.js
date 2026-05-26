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
  assert.deepEqual(createChordNotes('Cmaj7'), ['C4', 'E4', 'G4', 'B4']);
  assert.deepEqual(createChordNotes('Am9'), ['A4', 'C5', 'E5', 'G5', 'B5']);
  assert.deepEqual(createChordNotes('H'), []);
});

test('extractChordEvent reads chord cells into playable chord events', () => {
  assert.equal(extractChordEvent(null, 0, 0), null);
  assert.deepEqual(extractChordEvent({ type: 'note', note: 'C', label: 'C' }, 2, 6), {
    type: 'chord',
    trackId: 'chord',
    bar: 2,
    step: 6,
    root: null,
    quality: 'notes',
    label: 'C',
    notes: ['C4'],
    duration: '16n',
  });
  assert.deepEqual(extractChordEvent({ type: 'note', note: 'C5', label: 'C5' }, 2, 6), {
    type: 'chord',
    trackId: 'chord',
    bar: 2,
    step: 6,
    root: null,
    quality: 'notes',
    label: 'C5',
    notes: ['C5'],
    duration: '16n',
  });
  assert.deepEqual(extractChordEvent({ type: 'notes', notes: ['D', 'F'], label: 'D/F' }, 2, 6), {
    type: 'chord',
    trackId: 'chord',
    bar: 2,
    step: 6,
    root: null,
    quality: 'notes',
    label: 'D/F',
    notes: ['D4', 'F4'],
    duration: '16n',
  });
  assert.deepEqual(extractChordEvent({ type: 'notes', notes: ['D3', 'F5'], label: 'D3/F5' }, 2, 6), {
    type: 'chord',
    trackId: 'chord',
    bar: 2,
    step: 6,
    root: null,
    quality: 'notes',
    label: 'D3/F5',
    notes: ['D3', 'F5'],
    duration: '16n',
  });
  assert.deepEqual(
    extractChordEvent({ type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj7', label: 'Cmaj7', toneRoots: ['C', 'E', 'G', 'B'], addedNotes: ['D'] }, 2, 4),
    {
      type: 'chord',
      trackId: 'chord',
      bar: 2,
      step: 4,
      root: 'C',
      quality: 'maj7',
      label: 'Cmaj7',
      notes: ['C4', 'E4', 'G4', 'B4', 'D5'],
      duration: '4n',
    },
  );
  assert.deepEqual(
    extractChordEvent({ type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj7', label: 'Cmaj7', toneRoots: ['C', 'E', 'G', 'B'], addedNotes: ['D3', 'F5'] }, 2, 4),
    {
      type: 'chord',
      trackId: 'chord',
      bar: 2,
      step: 4,
      root: 'C',
      quality: 'maj7',
      label: 'Cmaj7',
      notes: ['C4', 'E4', 'G4', 'B4', 'D3', 'F5'],
      duration: '4n',
    },
  );
});

test('matrix playback adapter treats Beat 1 column 2 as sustain and plays multi-notes separately', () => {
  const matrix = createInitialMatrix();
  matrix.drums[0][4] = { instruments: ['hihat'] };
  matrix.chord[0][4] = { type: 'chord', root: 'G', chordRoot: 'G', quality: '7', label: 'G7', toneRoots: ['G', 'B', 'D', 'F'] };
  matrix.chord[0][5] = { type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj', label: 'C', toneRoots: ['C', 'E', 'G'] };
  matrix.chord[0][6] = { type: 'notes', notes: ['D', 'F'], label: 'D/F' };

  const adapter = createMatrixPlaybackAdapter(() => matrix);

  assert.deepEqual(adapter.getEventsForStep(0, 4), [
    { type: 'drums', trackId: 'drums', bar: 0, step: 4, instrument: 'hihat' },
    {
      type: 'chord',
      trackId: 'chord',
      bar: 0,
      step: 4,
      root: 'G',
      quality: '7',
      label: 'G7',
      notes: ['G4', 'B4', 'D5', 'F5'],
      duration: '4n',
    },
  ]);
  assert.deepEqual(adapter.getEventsForStep(0, 5), []);
  assert.deepEqual(adapter.getEventsForStep(0, 6), [
    {
      type: 'chord',
      trackId: 'chord',
      bar: 0,
      step: 6,
      root: null,
      quality: 'notes',
      label: 'D/F',
      notes: ['D4', 'F4'],
      duration: '16n',
    },
  ]);
});

test('matrix playback adapter plays groove-authored short chord hits on any sixteenth step', () => {
  const matrix = createInitialMatrix();
  matrix.chord[0][6] = {
    type: 'chord',
    root: 'G',
    chordRoot: 'G',
    quality: '7',
    label: 'G7',
    toneRoots: ['G', 'B', 'D', 'F'],
    duration: '16n',
    grooveTemplateId: 'block-syncopated',
    sourceChordLabel: 'G7',
  };

  const adapter = createMatrixPlaybackAdapter(() => matrix);

  assert.deepEqual(adapter.getEventsForStep(0, 6), [
    {
      type: 'chord',
      trackId: 'chord',
      bar: 0,
      step: 6,
      root: 'G',
      quality: '7',
      label: 'G7',
      notes: ['G4', 'B4', 'D5', 'F5'],
      duration: '16n',
    },
  ]);
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
