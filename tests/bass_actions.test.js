import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyBassGrooveTemplateToBar,
  BASS_GROOVE_TEMPLATES,
  clearBassBar,
  createBassPreviewEvents,
  isBassCellActive,
  toggleBassCell,
} from '../src/app/bassActions.js';
import { BASS_NOTES } from '../src/data/bassNotes.js';
import {
  CHORD_GRID_PITCHES,
  DEFAULT_CHORD_GRID_OCTAVE,
  createChordCell,
} from '../src/domain/chordCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('bass notes expose the chord three-octave pitch rail from B5 down to C3', () => {
  assert.equal(BASS_NOTES.length, 36);
  assert.deepEqual(
    BASS_NOTES.map((note) => note.note),
    CHORD_GRID_PITCHES.map((pitch) => pitch.label),
  );
  assert.deepEqual(BASS_NOTES.map((note) => note.label).slice(0, 12), [
    'B5',
    'A#5',
    'A5',
    'G#5',
    'G5',
    'F#5',
    'F5',
    'E5',
    'D#5',
    'D5',
    'C#5',
    'C5',
  ]);
  assert.equal(BASS_NOTES.at(12).note, 'B4');
  assert.equal(BASS_NOTES.at(23).note, 'C4');
  assert.equal(BASS_NOTES.at(-1).note, 'C3');
  assert.equal(BASS_NOTES.filter((note) => note.root).length, 3);
});

test('toggleBassCell writes replaces and clears one bass note per sixteenth step', () => {
  const matrix = createInitialMatrix();

  const withC = toggleBassCell(matrix, 2, 5, 'C4');
  assert.deepEqual(withC.bass[2][5], { type: 'bass', note: 'C4', duration: '16n' });
  assert.equal(isBassCellActive(withC, 2, 5, 'C4'), true);

  const withD = toggleBassCell(withC, 2, 5, 'F#3');
  assert.deepEqual(withD.bass[2][5], { type: 'bass', note: 'F#3', duration: '16n' });
  assert.equal(isBassCellActive(withD, 2, 5, 'C4'), false);
  assert.equal(isBassCellActive(withD, 2, 5, 'F#3'), true);

  const cleared = toggleBassCell(withD, 2, 5, 'F#3');
  assert.equal(cleared.bass[2][5], null);
});

test('clearBassBar clears only the selected bass bar', () => {
  const matrix = createInitialMatrix();
  matrix.bass[1][0] = { type: 'bass', note: 'C4', duration: '16n' };
  matrix.bass[1][4] = { type: 'bass', note: 'G4', duration: '16n' };
  matrix.bass[2][0] = { type: 'bass', note: 'F#3', duration: '16n' };
  matrix.drums[1][0] = { instruments: ['kick'] };

  const nextMatrix = clearBassBar(matrix, 1);

  assert.equal(nextMatrix.bass[1].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.bass[2][0], { type: 'bass', note: 'F#3', duration: '16n' });
  assert.deepEqual(nextMatrix.drums[1][0], { instruments: ['kick'] });
});

test('bass groove templates match the three reference picker options', () => {
  assert.deepEqual(BASS_GROOVE_TEMPLATES.map((template) => template.id), [
    'bass-8th-basic',
    'bass-8th-swing',
    'bass-16th-swing',
  ]);
  assert.deepEqual(BASS_GROOVE_TEMPLATES.map((template) => template.steps), [
    [0, 4, 8, 12],
    [0, 4, 10, 14],
    [0, 3, 6, 8, 12],
  ]);
  assert.deepEqual(BASS_GROOVE_TEMPLATES.map((template) => template.duration), [
    '8n',
    '8n',
    '16n',
  ]);
});

test('applyBassGrooveTemplateToBar writes current bass clip from same-beat chord roots only', () => {
  const matrix = createInitialMatrix();
  matrix.bass[1][0] = { type: 'bass', note: 'D4', duration: '16n' };
  matrix.bass[2][15] = { type: 'bass', note: 'B4', duration: '16n' };
  matrix.chord[2][0] = createChordCell('C');
  matrix.chord[2][4] = createChordCell('G');
  matrix.chord[2][8] = createChordCell('Am');
  matrix.chord[2][12] = createChordCell('F');

  const nextMatrix = applyBassGrooveTemplateToBar(matrix, 2, 'bass-8th-basic');

  assert.deepEqual(nextMatrix.bass[2][0], {
    type: 'bass',
    note: 'C4',
    duration: '8n',
    grooveTemplateId: 'bass-8th-basic',
  });
  assert.deepEqual(nextMatrix.bass[2][4], {
    type: 'bass',
    note: 'G4',
    duration: '8n',
    grooveTemplateId: 'bass-8th-basic',
  });
  assert.deepEqual(nextMatrix.bass[2][8], {
    type: 'bass',
    note: 'A4',
    duration: '8n',
    grooveTemplateId: 'bass-8th-basic',
  });
  assert.deepEqual(nextMatrix.bass[2][12], {
    type: 'bass',
    note: 'F4',
    duration: '8n',
    grooveTemplateId: 'bass-8th-basic',
  });
  assert.equal(nextMatrix.bass[2][15], null);
  assert.deepEqual(nextMatrix.bass[1][0], { type: 'bass', note: 'D4', duration: '16n' });
});

test('bass groove templates fall back to the first bar chord and then C4', () => {
  const matrix = createInitialMatrix();
  matrix.chord[3][0] = createChordCell('D');
  matrix.chord[3][8] = createChordCell('A#');

  const withChords = applyBassGrooveTemplateToBar(matrix, 3, 'bass-16th-swing');
  assert.equal(withChords.bass[3][0].note, `D${DEFAULT_CHORD_GRID_OCTAVE}`);
  assert.equal(withChords.bass[3][3].note, `D${DEFAULT_CHORD_GRID_OCTAVE}`);
  assert.equal(withChords.bass[3][6].note, `D${DEFAULT_CHORD_GRID_OCTAVE}`);
  assert.equal(withChords.bass[3][8].note, `A#${DEFAULT_CHORD_GRID_OCTAVE}`);
  assert.equal(withChords.bass[3][12].note, `D${DEFAULT_CHORD_GRID_OCTAVE}`);

  const withoutChords = applyBassGrooveTemplateToBar(createInitialMatrix(), 4, 'bass-8th-swing');
  assert.deepEqual(withoutChords.bass[4].filter(Boolean).map((cell) => cell.note), [
    'C4',
    'C4',
    'C4',
    'C4',
  ]);
});

test('createBassPreviewEvents returns timed playable root-note events', () => {
  const matrix = createInitialMatrix();
  matrix.chord[2][0] = createChordCell('C');
  matrix.chord[2][4] = createChordCell('F#');
  matrix.chord[2][8] = createChordCell('G');
  matrix.chord[2][12] = createChordCell('Am');

  assert.deepEqual(createBassPreviewEvents(matrix, 2, 'bass-8th-swing'), [
    { step: 0, note: 'C4', duration: '8n' },
    { step: 4, note: 'F#4', duration: '8n' },
    { step: 10, note: 'G4', duration: '8n' },
    { step: 14, note: 'A4', duration: '8n' },
  ]);
});
