import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMelodyKeyNote,
  MELODY_KEY_SEQUENCE,
  MELODY_NOTES,
  MELODY_NOTE_IDS,
  MELODY_SCALES,
} from '../src/data/melodyScales.js';
import {
  clearMelodyBar,
  createMelodyCell,
  isMelodyCellActive,
  isValidMelodyNote,
  toggleMelodyCell,
} from '../src/app/melodyActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('melody scales map the fixed keyboard row to major and pentatonic notes', () => {
  assert.deepEqual(MELODY_KEY_SEQUENCE, ['·', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=']);
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
  assert.equal(getMelodyKeyNote('major', '·'), 'G3');
  assert.equal(getMelodyKeyNote('major', '`'), 'G3');
  assert.equal(getMelodyKeyNote('major', '~'), 'G3');
  assert.equal(getMelodyKeyNote('major', '.'), null);
  assert.equal(getMelodyKeyNote('major', '='), 'E5');
  assert.equal(getMelodyKeyNote('pentatonic', '4'), 'C4');
  assert.equal(getMelodyKeyNote('missing', '4'), 'D4');
});

test('melody piano roll exposes every semitone from B5 down to C3', () => {
  assert.equal(MELODY_NOTES.length, 36);
  assert.deepEqual(
    MELODY_NOTES.slice(12, 24).map(({ note }) => note),
    [
      'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4',
      'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4',
    ],
  );
  assert.equal(MELODY_NOTES.at(0).note, 'B5');
  assert.equal(MELODY_NOTES.at(-1).note, 'C3');
  assert.deepEqual(MELODY_NOTE_IDS, MELODY_NOTES.map(({ note }) => note));
  assert.equal(MELODY_NOTES.filter(({ root }) => root).length, 3);
  assert.equal(MELODY_NOTES.filter(({ sharp }) => sharp).length, 15);
});

test('every melody piano-roll semitone can be written and out-of-range notes are rejected', () => {
  MELODY_NOTE_IDS.forEach((note) => {
    assert.equal(isValidMelodyNote(note), true);
    assert.deepEqual(createMelodyCell(note), { type: 'melody', note });
    const matrix = toggleMelodyCell(createInitialMatrix(), 0, 0, note);
    assert.deepEqual(matrix.melody[0][0], { type: 'melody', note });
  });

  assert.equal(isValidMelodyNote('C2'), false);
  assert.equal(isValidMelodyNote('C6'), false);
  assert.equal(createMelodyCell('C2'), null);
  assert.equal(createMelodyCell('C6'), null);
});

test('toggleMelodyCell writes replaces and clears one note per sixteenth step', () => {
  const matrix = createInitialMatrix();

  const withC = toggleMelodyCell(matrix, 2, 5, 'C4');
  assert.deepEqual(withC.melody[2][5], { type: 'melody', note: 'C4' });
  assert.equal(isMelodyCellActive(withC, 2, 5, 'C4'), true);

  const withD = toggleMelodyCell(withC, 2, 5, 'D4');
  assert.deepEqual(withD.melody[2][5], { type: 'melody', note: 'D4' });
  assert.equal(isMelodyCellActive(withD, 2, 5, 'C4'), false);
  assert.equal(isMelodyCellActive(withD, 2, 5, 'D4'), true);

  const cleared = toggleMelodyCell(withD, 2, 5, 'D4');
  assert.equal(cleared.melody[2][5], null);
});

test('clearMelodyBar clears only the selected melody bar', () => {
  const matrix = createInitialMatrix();
  matrix.melody[1][0] = { type: 'melody', note: 'C4' };
  matrix.melody[1][4] = { type: 'melody', note: 'D4' };
  matrix.melody[2][0] = { type: 'melody', note: 'E4' };
  matrix.drums[1][0] = { instruments: ['kick'] };

  const nextMatrix = clearMelodyBar(matrix, 1);

  assert.equal(nextMatrix.melody[1].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.melody[2][0], { type: 'melody', note: 'E4' });
  assert.deepEqual(nextMatrix.drums[1][0], { instruments: ['kick'] });
});
