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
  toggleMelodyCell,
} from '../src/app/melodyActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

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
