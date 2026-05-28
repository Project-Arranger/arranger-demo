import assert from 'node:assert/strict';
import { test } from 'node:test';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import {
  createDefaultDrumsPattern,
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
} from '../src/app/audioUiBridge.js';

function createMockStore(initial = {}) {
  const calls = [];
  const state = {
    matrix: createInitialMatrix(),
    bpm: 120,
    currentBar: 0,
    currentStep: 0,
    isPlaying: false,
    activeTrackId: 'drums',
    clips: { ids: [], byId: {} },
    selectedBar: 0,
    selectedClipId: null,
    play: () => calls.push(['play']),
    stop: () => calls.push(['stop']),
    setCell: (trackId, bar, step, cell) => {
      calls.push(['setCell', trackId, bar, step, cell]);
      state.matrix[trackId][bar][step] = cell;
    },
    setTransportPosition: (bar, step) => {
      calls.push(['seek', bar, step]);
      state.currentBar = bar;
      state.currentStep = step;
    },
    ...initial,
  };

  return {
    calls,
    getState: () => state,
  };
}

test('seedDefaultDrumsPattern writes an audible one-bar drums pattern', () => {
  const store = createMockStore();

  seedDefaultDrumsPattern(store);

  assert.deepEqual(store.getState().matrix.drums[0][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(store.getState().matrix.drums[0][4], { instruments: ['hihat'] });
  assert.deepEqual(store.getState().matrix.drums[0][8], { instruments: ['snare', 'hihat'] });
  assert.deepEqual(store.getState().matrix.drums[0][12], { instruments: ['hihat'] });
  assert.equal(store.getState().matrix.bass[0][0], null);
  assert.equal(createDefaultDrumsPattern().length, 6);
});

test('seedDefaultDrumsPattern is idempotent and keeps non-pattern cells intact', () => {
  const store = createMockStore();
  store.getState().matrix.drums[0][2] = { instruments: ['kick'] };

  seedDefaultDrumsPattern(store);
  seedDefaultDrumsPattern(store);

  assert.deepEqual(store.getState().matrix.drums[0][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(store.getState().matrix.drums[0][2], { instruments: ['kick'] });
});

test('createUiAudioDispatcher connects transport commands and drums preview audio', async () => {
  const store = createMockStore({ bpm: 98, currentBar: 1, currentStep: 4 });
  const audioCalls = [];
  const dispatch = createUiAudioDispatcher({
    store,
    audio: {
      play: (options) => audioCalls.push([
        'play',
        options.bpm,
        options.bar,
        options.step,
        options.matrixSource(),
      ]),
      stop: () => audioCalls.push(['stop']),
      triggerDrumsStep: (instruments) => audioCalls.push(['preview', instruments]),
    },
  });

  await dispatch({ type: 'transport.togglePlay' });
  await dispatch({
    type: 'drums.toggle',
    bar: 0,
    step: 0,
    instrument: 'kick',
    previewInstruments: ['kick', 'hihat'],
  });
  await dispatch({ type: 'transport.stop' });

  assert.deepEqual(store.calls, [
    ['play'],
    ['stop'],
  ]);
  assert.equal(audioCalls[0][0], 'play');
  assert.equal(audioCalls[0][1], 98);
  assert.equal(audioCalls[0][2], 1);
  assert.equal(audioCalls[0][3], 4);
  assert.equal(audioCalls[0][4], store.getState().matrix);
  assert.deepEqual(audioCalls.slice(1), [
    ['preview', ['kick', 'hihat']],
    ['stop'],
  ]);
});

test('createUiAudioDispatcher records lead key presses while keeping note preview', async () => {
  const store = createMockStore({
    activeTrackId: 'lead',
    clips: {
      ids: ['lead-bar-1'],
      byId: {
        'lead-bar-1': {
          id: 'lead-bar-1',
          trackId: 'lead',
          bar: 1,
          name: 'Melody 02',
        },
      },
    },
    currentBar: 1,
    currentStep: 5,
    selectedBar: 1,
    selectedClipId: 'lead-bar-1',
  });
  const audioCalls = [];
  const dispatch = createUiAudioDispatcher({
    store,
    audio: {
      triggerLeadNote: (note, duration) => audioCalls.push(['lead', note, duration]),
    },
  });

  await dispatch({ type: 'lead.noteOn', note: 'C4' });
  await dispatch({ type: 'lead.noteOff', note: 'C4' });

  assert.deepEqual(store.getState().matrix.lead[1][5], { type: 'melody', note: 'C4' });
  assert.deepEqual(store.calls, [
    ['setCell', 'lead', 1, 5, { type: 'melody', note: 'C4' }],
    ['seek', 1, 6],
  ]);
  assert.deepEqual(audioCalls, [
    ['lead', 'C4', '16n'],
  ]);
});

test('createUiAudioDispatcher still previews lead notes when recording is unavailable', async () => {
  const store = createMockStore({ activeTrackId: 'chord' });
  const audioCalls = [];
  const dispatch = createUiAudioDispatcher({
    store,
    audio: {
      triggerLeadNote: (note, duration) => audioCalls.push(['lead', note, duration]),
    },
  });

  await dispatch({ type: 'lead.noteOn', note: 'D4' });

  assert.deepEqual(store.calls, []);
  assert.deepEqual(audioCalls, [
    ['lead', 'D4', '16n'],
  ]);
});
