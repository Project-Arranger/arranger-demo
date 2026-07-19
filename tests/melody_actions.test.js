import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getMelodyScaleNoteIds,
  getMelodyScalePreviewNotes,
  isMelodyNoteInScale,
  isMelodyScalePitchClass,
  MELODY_NOTES,
  MELODY_NOTE_IDS,
  MELODY_PITCH_CLASSES,
  MELODY_SCALES,
} from '../src/data/melodyScales.js';
import {
  getMelodyInputCellByCode,
  getMelodyInputCellByLaunchpadNote,
  getMelodyInputGrid,
  isMelodyInputAreaVisible,
  MELODY_INPUT_ROWS,
} from '../src/input/melodyInputLayout.js';
import {
  clearMelodyBar,
  createMelodyCell,
  getMelodyCellRenderState,
  isMelodyCellActive,
  isValidMelodyNote,
  setMelodyCell,
  setMelodyCellDuration,
  toggleMelodyCell,
} from '../src/app/melodyActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('melody input layout maps three QWERTY and Launchpad rows to dynamic scale octaves', () => {
  assert.deepEqual(MELODY_PITCH_CLASSES, [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  ]);
  assert.deepEqual(MELODY_INPUT_ROWS.map(({ octave }) => octave), [5, 4, 3]);
  assert.deepEqual(MELODY_INPUT_ROWS.map(({ launchpadNoteStart }) => launchpadNoteStart), [51, 41, 31]);
  assert.deepEqual(getMelodyInputGrid('major').map((row) => row.map(({ note }) => note)), [
    ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', null],
    ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', null],
    ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', null],
  ]);
  assert.deepEqual(getMelodyInputGrid('pentatonic').map((row) => row.map(({ note }) => note)), [
    ['C5', 'D5', 'E5', 'G5', 'A5', null, null, null],
    ['C4', 'D4', 'E4', 'G4', 'A4', null, null, null],
    ['C3', 'D3', 'E3', 'G3', 'A3', null, null, null],
  ]);
  assert.equal(getMelodyInputCellByCode('KeyQ', 'major').note, 'C5');
  assert.equal(getMelodyInputCellByCode('Comma', 'major').note, null);
  assert.equal(getMelodyInputCellByLaunchpadNote(47, 'major').note, 'B4');
  assert.equal(getMelodyInputCellByLaunchpadNote(48, 'major').note, null);
  assert.equal(getMelodyInputCellByCode('Digit1', 'major'), null);
});

test('melody input visibility follows template workflow phases', () => {
  assert.equal(isMelodyInputAreaVisible({ hasTemplate: false, phase: 'idle' }), true);
  assert.equal(isMelodyInputAreaVisible({ hasTemplate: true, phase: 'idle' }), false);
  assert.equal(isMelodyInputAreaVisible({ hasTemplate: true, phase: 'overview' }), false);
  assert.equal(isMelodyInputAreaVisible({ hasTemplate: true, phase: 'confirm' }), false);
  ['audition', 'step-edit', 'sequence-capture', 'count-in', 'recording'].forEach((phase) => {
    assert.equal(isMelodyInputAreaVisible({ hasTemplate: true, phase }), true);
  });
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
  assert.equal(getMelodyScaleNoteIds('major').length, 21);
  assert.equal(getMelodyScaleNoteIds('pentatonic').length, 15);
  assert.equal(getMelodyScaleNoteIds('major').includes('C3'), true);
  assert.equal(getMelodyScaleNoteIds('major').includes('B5'), true);
  assert.equal(isMelodyNoteInScale('pentatonic', 'G5'), true);
  assert.equal(isMelodyNoteInScale('pentatonic', 'F5'), false);
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

test('melody cells store quantized durations and expose continuation render state', () => {
  const matrix = createInitialMatrix();
  const withNote = setMelodyCell(matrix, 0, 4, 'C4', 5);

  assert.deepEqual(withNote.melody[0][4], {
    type: 'melody',
    note: 'C4',
    durationSteps: 5,
  });
  assert.deepEqual(getMelodyCellRenderState(withNote, 0, 4, 'C4'), {
    active: true,
    durationSteps: 5,
    start: true,
    startStep: 4,
  });
  assert.deepEqual(getMelodyCellRenderState(withNote, 0, 8, 'C4'), {
    active: true,
    durationSteps: 5,
    start: false,
    startStep: 4,
  });
  assert.equal(getMelodyCellRenderState(withNote, 0, 9, 'C4').active, false);

  const clamped = setMelodyCellDuration(withNote, 0, 4, 99);
  assert.equal(clamped.melody[0][4].durationSteps, 12);
  assert.deepEqual(createMelodyCell('D4', 1), { type: 'melody', note: 'D4' });
});
