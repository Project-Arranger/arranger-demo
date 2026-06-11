import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMelodyScaleRailNotes,
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

test('melody scale rail notes mirror keyboard strip notes from high to low', () => {
  assert.deepEqual(
    getMelodyScaleRailNotes('major').map(({ label, note, rootName, octave, root, sharp }) => ({
      label,
      note,
      rootName,
      octave,
      root,
      sharp,
    })),
    [
      { label: 'E5', note: 'E5', rootName: 'E', octave: 5, root: false, sharp: false },
      { label: 'D5', note: 'D5', rootName: 'D', octave: 5, root: false, sharp: false },
      { label: 'C5', note: 'C5', rootName: 'C', octave: 5, root: true, sharp: false },
      { label: 'B4', note: 'B4', rootName: 'B', octave: 4, root: false, sharp: false },
      { label: 'A4', note: 'A4', rootName: 'A', octave: 4, root: false, sharp: false },
      { label: 'G4', note: 'G4', rootName: 'G', octave: 4, root: false, sharp: false },
      { label: 'F4', note: 'F4', rootName: 'F', octave: 4, root: false, sharp: false },
      { label: 'E4', note: 'E4', rootName: 'E', octave: 4, root: false, sharp: false },
      { label: 'D4', note: 'D4', rootName: 'D', octave: 4, root: false, sharp: false },
      { label: 'C4', note: 'C4', rootName: 'C', octave: 4, root: true, sharp: false },
      { label: 'B3', note: 'B3', rootName: 'B', octave: 3, root: false, sharp: false },
      { label: 'A3', note: 'A3', rootName: 'A', octave: 3, root: false, sharp: false },
      { label: 'G3', note: 'G3', rootName: 'G', octave: 3, root: false, sharp: false },
    ],
  );
  assert.deepEqual(
    getMelodyScaleRailNotes('pentatonic').map(({ label, note, rootName, octave }) => ({
      label,
      note,
      rootName,
      octave,
    })),
    [
      { label: 'G5', note: 'G5', rootName: 'G', octave: 5 },
      { label: 'E5', note: 'E5', rootName: 'E', octave: 5 },
      { label: 'D5', note: 'D5', rootName: 'D', octave: 5 },
      { label: 'C5', note: 'C5', rootName: 'C', octave: 5 },
      { label: 'A4', note: 'A4', rootName: 'A', octave: 4 },
      { label: 'G4', note: 'G4', rootName: 'G', octave: 4 },
      { label: 'E4', note: 'E4', rootName: 'E', octave: 4 },
      { label: 'D4', note: 'D4', rootName: 'D', octave: 4 },
      { label: 'C4', note: 'C4', rootName: 'C', octave: 4 },
      { label: 'A3', note: 'A3', rootName: 'A', octave: 3 },
      { label: 'G3', note: 'G3', rootName: 'G', octave: 3 },
      { label: 'E3', note: 'E3', rootName: 'E', octave: 3 },
      { label: 'D3', note: 'D3', rootName: 'D', octave: 3 },
    ],
  );

  const majorNotes = getMelodyScaleRailNotes('major').map(({ note }) => note);
  assert.equal(majorNotes.includes('C5'), true);
  assert.equal(majorNotes.includes('C2'), false);
  assert.equal(majorNotes.some((note) => note.includes('#')), false);
  assert.deepEqual(majorNotes, ['E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3']);
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
