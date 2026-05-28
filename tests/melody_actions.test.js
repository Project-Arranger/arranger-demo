import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMelodyKeyNote,
  MELODY_KEY_SEQUENCE,
  MELODY_SCALES,
} from '../src/data/melodyScales.js';
import {
  clearMelodyBar,
  isMelodyCellActive,
  recordMelodyKeyInput,
  toggleMelodyCell,
} from '../src/app/melodyActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

function createRecordingStore(initial = {}) {
  const calls = [];
  const state = {
    activeTrackId: 'lead',
    clips: {
      ids: ['lead-bar-2'],
      byId: {
        'lead-bar-2': {
          id: 'lead-bar-2',
          trackId: 'lead',
          bar: 2,
          name: 'Melody 03',
        },
      },
    },
    currentBar: 2,
    currentStep: 5,
    isPlaying: false,
    matrix: createInitialMatrix(),
    selectedBar: 2,
    selectedClipId: 'lead-bar-2',
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

test('melody scales map the fixed keyboard row to major and pentatonic notes', () => {
  assert.deepEqual(MELODY_KEY_SEQUENCE, ['.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=']);
  assert.deepEqual(MELODY_SCALES.major.keyNotes, [
    'G3',
    'A3',
    'B3',
    'C4',
    'D4',
    'E4',
    'F4',
    'G4',
    'A4',
    'B4',
    'C5',
    'D5',
    'E5',
  ]);
  assert.deepEqual(MELODY_SCALES.pentatonic.keyNotes, [
    'D3',
    'E3',
    'G3',
    'A3',
    'C4',
    'D4',
    'E4',
    'G4',
    'A4',
    'C5',
    'D5',
    'E5',
    'G5',
  ]);
  assert.equal(getMelodyKeyNote('major', '.'), 'G3');
  assert.equal(getMelodyKeyNote('major', '='), 'E5');
  assert.equal(getMelodyKeyNote('pentatonic', '4'), 'C4');
  assert.equal(getMelodyKeyNote('missing', '4'), 'D4');
});

test('toggleMelodyCell writes replaces and clears one note per sixteenth step', () => {
  const matrix = createInitialMatrix();

  const withC = toggleMelodyCell(matrix, 2, 5, 'C4');
  assert.deepEqual(withC.lead[2][5], { type: 'melody', note: 'C4' });
  assert.equal(isMelodyCellActive(withC, 2, 5, 'C4'), true);

  const withD = toggleMelodyCell(withC, 2, 5, 'D4');
  assert.deepEqual(withD.lead[2][5], { type: 'melody', note: 'D4' });
  assert.equal(isMelodyCellActive(withD, 2, 5, 'C4'), false);
  assert.equal(isMelodyCellActive(withD, 2, 5, 'D4'), true);

  const cleared = toggleMelodyCell(withD, 2, 5, 'D4');
  assert.equal(cleared.lead[2][5], null);
});

test('clearMelodyBar clears only the selected lead bar', () => {
  const matrix = createInitialMatrix();
  matrix.lead[1][0] = { type: 'melody', note: 'C4' };
  matrix.lead[1][4] = { type: 'melody', note: 'D4' };
  matrix.lead[2][0] = { type: 'melody', note: 'E4' };
  matrix.drums[1][0] = { instruments: ['kick'] };

  const nextMatrix = clearMelodyBar(matrix, 1);

  assert.equal(nextMatrix.lead[1].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.lead[2][0], { type: 'melody', note: 'E4' });
  assert.deepEqual(nextMatrix.drums[1][0], { instruments: ['kick'] });
});

test('recordMelodyKeyInput writes and replaces the current melody step', () => {
  const store = createRecordingStore();
  store.getState().matrix.lead[2][5] = { type: 'melody', note: 'D4' };

  assert.equal(recordMelodyKeyInput(store, 'E4'), true);
  assert.deepEqual(store.getState().matrix.lead[2][5], { type: 'melody', note: 'E4' });
  assert.deepEqual(store.calls, [
    ['setCell', 'lead', 2, 5, { type: 'melody', note: 'E4' }],
    ['seek', 2, 6],
  ]);

  assert.equal(recordMelodyKeyInput(store, 'E4'), true);
  assert.deepEqual(store.getState().matrix.lead[2][6], { type: 'melody', note: 'E4' });
});

test('recordMelodyKeyInput stops auto-step at the end of the open melody clip', () => {
  const store = createRecordingStore({ currentStep: 15 });

  assert.equal(recordMelodyKeyInput(store, 'C4'), true);
  assert.deepEqual(store.calls, [
    ['setCell', 'lead', 2, 15, { type: 'melody', note: 'C4' }],
    ['seek', 2, 15],
  ]);
});

test('recordMelodyKeyInput does not step the transport while playing', () => {
  const store = createRecordingStore({ currentStep: 8, isPlaying: true });

  assert.equal(recordMelodyKeyInput(store, 'G4'), true);
  assert.deepEqual(store.calls, [
    ['setCell', 'lead', 2, 8, { type: 'melody', note: 'G4' }],
  ]);
});

test('recordMelodyKeyInput refuses invalid editor states without writing', () => {
  const cases = [
    createRecordingStore({ selectedClipId: null }),
    createRecordingStore({ activeTrackId: 'chord' }),
    createRecordingStore({
      clips: {
        ids: ['drums-bar-2'],
        byId: {
          'drums-bar-2': {
            id: 'drums-bar-2',
            trackId: 'drums',
            bar: 2,
            name: 'Drum 03',
          },
        },
      },
      selectedClipId: 'drums-bar-2',
    }),
    createRecordingStore({ currentStep: 16 }),
  ];

  cases.forEach((store) => {
    assert.equal(recordMelodyKeyInput(store, 'C4'), false);
    assert.deepEqual(store.calls, []);
  });
});
