import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMelodyKeyNote,
  getMelodyScalePreviewNotes,
  isMelodyScalePitchClass,
  MELODY_KEY_SEQUENCE,
  MELODY_NOTES,
  MELODY_NOTE_IDS,
  MELODY_PITCH_CLASSES,
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

test('melody keyboard maps 1 through plus to a fixed chromatic octave', () => {
  assert.deepEqual(MELODY_KEY_SEQUENCE, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+']);
  assert.deepEqual(MELODY_PITCH_CLASSES, [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  ]);
  assert.deepEqual(MELODY_KEY_SEQUENCE.map(getMelodyKeyNote), [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
    'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  ]);
  assert.equal(getMelodyKeyNote('='), 'B4');
  assert.equal(getMelodyKeyNote('·'), null);
  assert.equal(getMelodyKeyNote('missing'), null);
});

test('melody scale templates derive highlights and previews from the chromatic octave', () => {
  assert.deepEqual(MELODY_SCALES.major.highlightedPitchClasses, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(MELODY_SCALES.pentatonic.highlightedPitchClasses, ['C', 'D', 'E', 'G', 'A']);
  assert.deepEqual(getMelodyScalePreviewNotes('major'), ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']);
  assert.deepEqual(getMelodyScalePreviewNotes('pentatonic'), ['C4', 'D4', 'E4', 'G4', 'A4']);
  assert.deepEqual(getMelodyScalePreviewNotes('missing'), getMelodyScalePreviewNotes('major'));
  assert.equal(isMelodyScalePitchClass('major', 'F'), true);
  assert.equal(isMelodyScalePitchClass('pentatonic', 'F'), false);
  assert.equal(isMelodyScalePitchClass('pentatonic', 'F#'), false);
});

test('melody piano roll exposes three chromatic octaves with C4-B4 as its default window', () => {
  assert.equal(MELODY_NOTES.length, 36);
  assert.deepEqual(MELODY_NOTES.slice(12, 24).map(({ note }) => note), [
    'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4',
    'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4',
  ]);
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

  assert.equal(isValidMelodyNote('B2'), false);
  assert.equal(isValidMelodyNote('C6'), false);
  assert.equal(createMelodyCell('B2'), null);
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

test('melody actions leave the matrix unchanged for invalid positions', () => {
  const matrix = createInitialMatrix();

  assert.equal(toggleMelodyCell(matrix, 0, -1, 'C4'), matrix);
  assert.equal(toggleMelodyCell(matrix, 0, 16, 'C4'), matrix);
  assert.equal(toggleMelodyCell(matrix, 0, 1.5, 'C4'), matrix);
  assert.equal(toggleMelodyCell(matrix, 99, 0, 'C4'), matrix);
  assert.equal(clearMelodyBar(matrix, 99), matrix);
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
