import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CHORD_GROOVE_TEMPLATES,
  applyChordGrooveTemplateToExistingClips,
  createChordGroovePreviewEvents,
  getChordGrooveTemplate,
} from '../src/app/chordGrooveActions.js';
import {
  getChordBeatDisplaySegments,
  setChordCell,
} from '../src/app/chordActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

function createClips(...records) {
  return {
    ids: records.map((clip) => clip.id),
    byId: Object.fromEntries(records.map((clip) => [clip.id, clip])),
  };
}

test('chord groove templates expose the two block picker options in order', () => {
  assert.deepEqual(CHORD_GROOVE_TEMPLATES.map((template) => template.id), [
    'block-basic',
    'block-syncopated',
  ]);
  assert.equal(getChordGrooveTemplate('block-basic').name, '柱式音型基础律动');
  assert.equal(getChordGrooveTemplate('block-syncopated').hitLabel, '3 hits / bar');
  assert.equal(getChordGrooveTemplate('arp-basic'), null);
});

test('applyChordGrooveTemplateToExistingClips writes a short block hit to existing chord clips only', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 0, 0, 'C');
  matrix = setChordCell(matrix, 3, 0, 'Am');
  matrix = setChordCell(matrix, 4, 0, 'F');
  matrix.chord[0][6] = { type: 'notes', notes: ['D'], label: 'D' };
  matrix.drums[3][0] = { instruments: ['kick'] };
  const clips = createClips(
    { id: 'chord-bar-0', trackId: 'chord', bar: 0 },
    { id: 'drums-bar-1', trackId: 'drums', bar: 1 },
    { id: 'chord-bar-3', trackId: 'chord', bar: 3 },
    { id: 'chord-bar-5', trackId: 'chord', bar: 5 },
  );

  const nextMatrix = applyChordGrooveTemplateToExistingClips(matrix, clips, 'block-basic');

  assert.equal(nextMatrix.chord[0][0].label, 'C');
  assert.deepEqual(nextMatrix.chord[0][0].tonePitches, ['C3', 'E3', 'G3']);
  assert.equal(nextMatrix.chord[0][0].duration, '16n');
  assert.equal(nextMatrix.chord[0][0].grooveTemplateId, 'block-basic');
  assert.equal(nextMatrix.chord[0][0].sourceChordLabel, 'C');
  assert.equal(nextMatrix.chord[0][1], null);
  assert.equal(nextMatrix.chord[0][6], null);
  assert.equal(nextMatrix.chord[3][0].label, 'Am');
  assert.deepEqual(nextMatrix.chord[3][0].tonePitches, ['A3', 'C4', 'E3']);
  assert.equal(nextMatrix.chord[5][0].label, 'C');
  assert.equal(nextMatrix.chord[5][0].sourceChordLabel, 'C');
  assert.equal(nextMatrix.chord[4][0].label, 'F');
  assert.equal(getChordBeatDisplaySegments(nextMatrix, 0)[3].label, null);
  assert.deepEqual(nextMatrix.drums[3][0], { instruments: ['kick'] });
});

test('applyChordGrooveTemplateToExistingClips writes syncopated block hits and clears stale chord bar content', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 2, 0, 'G7');
  matrix = setChordCell(matrix, 2, 2, 'F');
  const clips = createClips({ id: 'chord-bar-2', trackId: 'chord', bar: 2 });

  const nextMatrix = applyChordGrooveTemplateToExistingClips(matrix, clips, 'block-syncopated');

  assert.deepEqual(
    nextMatrix.chord[2].map((cell, step) => (cell ? `${step}:${cell.label}:${cell.duration}` : null)).filter(Boolean),
    ['0:G7:16n', '6:G7:16n', '12:G7:16n'],
  );
  assert.deepEqual(getChordBeatDisplaySegments(nextMatrix, 2)[3], {
    startBeat: 3,
    span: 1,
    label: 'G7',
    hasValue: true,
    hasChord: true,
    mergeKey: null,
  });
});

test('removed arpeggio groove template no-ops when applied by legacy id', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 1, 0, 'Cmaj7');
  const clips = createClips({ id: 'chord-bar-1', trackId: 'chord', bar: 1 });

  const nextMatrix = applyChordGrooveTemplateToExistingClips(matrix, clips, 'arp-basic');

  assert.equal(nextMatrix, matrix);
});

test('createChordGroovePreviewEvents returns timed playable notes for the requested chord', () => {
  assert.deepEqual(createChordGroovePreviewEvents('block-syncopated', 'F'), [
    { step: 0, notes: ['F3', 'A3', 'C3'], duration: '16n' },
    { step: 6, notes: ['F3', 'A3', 'C3'], duration: '16n' },
    { step: 12, notes: ['F3', 'A3', 'C3'], duration: '16n' },
  ]);
  assert.deepEqual(createChordGroovePreviewEvents('arp-basic', 'C'), []);
  assert.deepEqual(createChordGroovePreviewEvents('missing', 'C'), []);
});
