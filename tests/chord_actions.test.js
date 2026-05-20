import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordStepCell,
  getChordCell,
  setChordCell,
  setChordNoteCell,
  toggleChordNoteStep,
} from '../src/app/chordActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

test('setChordCell writes only the selected chord span in the selected bar', () => {
  const matrix = createInitialMatrix();
  matrix.chord[0][0] = { type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj', label: 'C', toneRoots: ['C', 'E', 'G'] };
  matrix.drums[2][4] = { instruments: ['kick'] };

  const nextMatrix = setChordCell(matrix, 2, 0, 'G');

  assert.notEqual(nextMatrix, matrix);
  assert.notEqual(nextMatrix.chord, matrix.chord);
  assert.notEqual(nextMatrix.chord[2], matrix.chord[2]);
  assert.deepEqual(nextMatrix.chord[2][0], { type: 'chord', root: 'G', chordRoot: 'G', quality: 'maj', label: 'G', toneRoots: ['G', 'B', 'D'] });
  assert.deepEqual(nextMatrix.chord[2][1], { type: 'chord', root: 'G', chordRoot: 'G', quality: 'maj', label: 'G', toneRoots: ['G', 'B', 'D'] });
  assert.equal(nextMatrix.chord[2][2], null);
  assert.deepEqual(nextMatrix.chord[0][0], { type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj', label: 'C', toneRoots: ['C', 'E', 'G'] });
  assert.deepEqual(nextMatrix.drums[2][4], { instruments: ['kick'] });
  assert.equal(matrix.chord[2][0], null);
});

test('setChordCell updates Beat 1 columns 1-2 and preserves note enrichments', () => {
  let matrix = createInitialMatrix();
  matrix = setChordNoteCell(matrix, 2, 0, 0, 'F');
  matrix = setChordNoteCell(matrix, 2, 0, 1, 'D');
  matrix = setChordNoteCell(matrix, 2, 1, 2, 'E');

  const nextMatrix = setChordCell(matrix, 2, 0, 'Bdim');

  assert.deepEqual(nextMatrix.chord[2][0], {
    type: 'chord',
    root: 'B',
    chordRoot: 'Bdim',
    quality: 'dim',
    label: 'Bdim',
    toneRoots: ['B', 'D', 'F'],
    addedNotes: ['F'],
  });
  assert.deepEqual(nextMatrix.chord[2][1], {
    type: 'chord',
    root: 'B',
    chordRoot: 'Bdim',
    quality: 'dim',
    label: 'Bdim',
    toneRoots: ['B', 'D', 'F'],
    addedNotes: ['D'],
  });
  assert.equal(nextMatrix.chord[2][2], null);
  assert.equal(nextMatrix.chord[2][3], null);
  assert.deepEqual(nextMatrix.chord[2][6], { type: 'notes', notes: ['E'], label: 'E' });
});

test('setChordCell writes any selected beat first two columns and preserves columns 3-4', () => {
  let matrix = createInitialMatrix();
  matrix = setChordNoteCell(matrix, 1, 2, 2, 'E');
  matrix = setChordNoteCell(matrix, 1, 2, 3, 'A');
  matrix = setChordCell(matrix, 1, 2, 'F');

  assert.deepEqual(nextChordLabel(matrix, 1, 8), 'F');
  assert.deepEqual(nextChordLabel(matrix, 1, 9), 'F');
  assert.deepEqual(matrix.chord[1][10], { type: 'notes', notes: ['E'], label: 'E' });
  assert.deepEqual(matrix.chord[1][11], { type: 'notes', notes: ['A'], label: 'A' });
  assert.equal(matrix.chord[1][0], null);
});

test('getChordCell reads span start cells only', () => {
  const matrix = setChordCell(createInitialMatrix(), 3, 2, 'A#');

  assert.deepEqual(getChordCell(matrix, 3, 2), { type: 'chord', root: 'A#', chordRoot: 'A#', quality: 'maj', label: 'A#', toneRoots: ['A#', 'D', 'F'] });
  assert.equal(getChordCell(matrix, 3, 1), null);
  assert.equal(getChordCell(matrix, 8, 0), null);
});

function nextChordLabel(matrix, barIndex, step) {
  return matrix.chord[barIndex][step]?.label ?? null;
}

test('clearChordCell clears only one chord span', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 1, 0, 'C');
  matrix = setChordCell(matrix, 1, 2, 'F');
  matrix.bass[1][8] = { note: 'C2' };

  const nextMatrix = clearChordCell(matrix, 1, 0);

  assert.equal(nextMatrix.chord[1][0], null);
  assert.equal(nextMatrix.chord[1][1], null);
  assert.deepEqual(nextMatrix.chord[1][8], { type: 'chord', root: 'F', chordRoot: 'F', quality: 'maj', label: 'F', toneRoots: ['F', 'A', 'C'] });
  assert.deepEqual(nextMatrix.bass[1][8], { note: 'C2' });
});

test('clearChordBar clears the selected chord bar without touching other tracks', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 4, 0, 'C');
  matrix = setChordCell(matrix, 4, 1, 'D');
  matrix = setChordCell(matrix, 5, 0, 'E');
  matrix.lead[4][0] = { note: 'C4' };

  const nextMatrix = clearChordBar(matrix, 4);

  assert.equal(nextMatrix.chord[4].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.chord[5][0], { type: 'chord', root: 'E', chordRoot: 'E', quality: 'maj', label: 'E', toneRoots: ['E', 'G#', 'B'] });
  assert.deepEqual(nextMatrix.lead[4][0], { note: 'C4' });
});

test('setChordNoteCell stores multi-note cells inside one step and preserves other steps', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 1, 0, 'C');
  matrix = setChordNoteCell(matrix, 1, 2, 3, 'A#');

  const movedNoteMatrix = setChordNoteCell(matrix, 1, 2, 1, 'F');

  assert.deepEqual(getChordStepCell(matrix, 1, 2, 3), { type: 'notes', notes: ['A#'], label: 'A#' });
  assert.deepEqual(movedNoteMatrix.chord[1][0], { type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj', label: 'C', toneRoots: ['C', 'E', 'G'] });
  assert.deepEqual(movedNoteMatrix.chord[1][1], { type: 'chord', root: 'C', chordRoot: 'C', quality: 'maj', label: 'C', toneRoots: ['C', 'E', 'G'] });
  assert.equal(movedNoteMatrix.chord[1][10], null);
  assert.deepEqual(getChordStepCell(movedNoteMatrix, 1, 2, 3), { type: 'notes', notes: ['A#'], label: 'A#' });
  assert.deepEqual(getChordStepCell(movedNoteMatrix, 1, 2, 1), { type: 'notes', notes: ['F'], label: 'F' });
});

test('toggleChordNoteStep toggles notes without clearing sibling columns', () => {
  let matrix = createInitialMatrix();
  matrix = toggleChordNoteStep(matrix, 2, 3, 2, 'D#');
  assert.deepEqual(getChordStepCell(matrix, 2, 3, 2), { type: 'notes', notes: ['D#'], label: 'D#' });

  matrix = toggleChordNoteStep(matrix, 2, 3, 1, 'G');
  assert.deepEqual(getChordStepCell(matrix, 2, 3, 2), { type: 'notes', notes: ['D#'], label: 'D#' });
  assert.deepEqual(getChordStepCell(matrix, 2, 3, 1), { type: 'notes', notes: ['G'], label: 'G' });

  matrix = toggleChordNoteStep(matrix, 2, 3, 1, 'A');
  assert.deepEqual(getChordStepCell(matrix, 2, 3, 1), { type: 'notes', notes: ['G', 'A'], label: 'G/A' });

  matrix = toggleChordNoteStep(matrix, 2, 3, 1, 'G');
  assert.deepEqual(getChordStepCell(matrix, 2, 3, 1), { type: 'notes', notes: ['A'], label: 'A' });
});

test('applyChordTemplateToExistingClips only writes existing chord clips', () => {
  let matrix = createInitialMatrix();
  matrix = setChordNoteCell(matrix, 0, 1, 2, 'E');
  matrix = setChordCell(matrix, 4, 0, 'F');
  matrix.bass[2][0] = { note: 'C2' };
  const clips = {
    ids: ['chord-bar-0', 'drums-bar-1', 'chord-bar-3', 'chord-bar-5'],
    byId: {
      'chord-bar-0': { id: 'chord-bar-0', trackId: 'chord', bar: 0 },
      'drums-bar-1': { id: 'drums-bar-1', trackId: 'drums', bar: 1 },
      'chord-bar-3': { id: 'chord-bar-3', trackId: 'chord', bar: 3 },
      'chord-bar-5': { id: 'chord-bar-5', trackId: 'chord', bar: 5 },
    },
  };

  const nextMatrix = applyChordTemplateToExistingClips(matrix, clips, 'doowop');

  assert.deepEqual(nextMatrix.chord[0][0].label, 'C');
  assert.deepEqual(nextMatrix.chord[0][1].label, 'C');
  assert.deepEqual(nextMatrix.chord[3][0].label, 'Am');
  assert.deepEqual(nextMatrix.chord[3][1].label, 'Am');
  assert.deepEqual(nextMatrix.chord[5][0].label, 'F');
  assert.deepEqual(nextMatrix.chord[5][1].label, 'F');
  assert.deepEqual(nextMatrix.chord[0][6], { type: 'notes', notes: ['E'], label: 'E' });
  assert.deepEqual(nextMatrix.chord[4][0].label, 'F');
  assert.deepEqual(nextMatrix.bass[2][0], { note: 'C2' });
});
