import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CHORD_GROOVE_TEMPLATES,
  CHORD_SOURCE_CELL_TYPE,
  CUSTOM_CHORD_GROOVE_ID,
  applyChordGrooveTemplateToExistingClips,
  applyChordTemplateWorkspaceToBar,
  applyChordTemplateWorkspaceToExistingClips,
  clearChordRhythmBar,
  createChordGroovePreviewEvents,
  createChordTemplateWorkspacePreviewEvents,
  getAppliedChordProgressionTemplateId,
  getChordGrooveTemplate,
  getChordRhythmSteps,
  getChordSelectedGrooveTemplateId,
  toggleChordRhythmStep,
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

test('workspace preview combines the pending four-chord progression with the basic groove', () => {
  const events = createChordTemplateWorkspacePreviewEvents({
    progressionTemplateId: 'doowop',
    grooveTemplateId: 'block-basic',
  });

  assert.deepEqual(events, [
    { step: 0, notes: ['C3', 'E3', 'G3'], duration: '16n' },
    { step: 16, notes: ['A3', 'C4', 'E3'], duration: '16n' },
    { step: 32, notes: ['F3', 'A3', 'C3'], duration: '16n' },
    { step: 48, notes: ['G3', 'B3', 'D4'], duration: '16n' },
  ]);
});

test('workspace preview repeats syncopated hits across all four clips and rejects invalid ids', () => {
  const events = createChordTemplateWorkspacePreviewEvents({
    progressionTemplateId: 'axis',
    grooveTemplateId: 'block-syncopated',
  });

  assert.equal(events.length, 12);
  assert.deepEqual(events.map((event) => event.step), [
    0, 6, 12,
    16, 22, 28,
    32, 38, 44,
    48, 54, 60,
  ]);
  assert.deepEqual(events.slice(3, 6).map((event) => event.notes), [
    ['G3', 'B3', 'D4'],
    ['G3', 'B3', 'D4'],
    ['G3', 'B3', 'D4'],
  ]);
  assert.deepEqual(createChordTemplateWorkspacePreviewEvents({
    progressionTemplateId: 'missing',
    grooveTemplateId: 'block-basic',
  }), []);
  assert.deepEqual(createChordTemplateWorkspacePreviewEvents({
    progressionTemplateId: 'axis',
    grooveTemplateId: 'missing',
  }), []);
});

test('applyChordTemplateWorkspaceToBar applies both selections using sparse clip order', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 0, 0, 'F');
  matrix = setChordCell(matrix, 3, 0, 'G');
  matrix = setChordCell(matrix, 7, 0, 'Am');
  const clips = createClips(
    { id: 'chord-bar-0', trackId: 'chord', bar: 0 },
    { id: 'chord-bar-3', trackId: 'chord', bar: 3 },
    { id: 'chord-bar-7', trackId: 'chord', bar: 7 },
  );

  const nextMatrix = applyChordTemplateWorkspaceToBar(matrix, clips, 3, {
    progressionTemplateId: 'doowop',
    grooveTemplateId: 'block-syncopated',
  });

  assert.equal(nextMatrix.chord[0][0].label, 'F');
  assert.equal(nextMatrix.chord[7][0].label, 'Am');
  assert.deepEqual(getChordRhythmSteps(nextMatrix, 3), [0, 6, 12]);
  assert.equal(nextMatrix.chord[3][0].sourceChordLabel, 'Am');
  assert.equal(nextMatrix.chord[3][0].progressionTemplateId, 'doowop');
  assert.equal(nextMatrix.chord[3][0].selectedGrooveTemplateId, 'block-syncopated');
});

test('applyChordTemplateWorkspaceToExistingClips cycles sixteenth-note grooves across chord clips only', () => {
  const matrix = createInitialMatrix();
  matrix.drums[3][0] = { instruments: ['kick'] };
  const clips = createClips(
    { id: 'chord-bar-0', trackId: 'chord', bar: 0 },
    { id: 'drums-bar-1', trackId: 'drums', bar: 1 },
    { id: 'chord-bar-3', trackId: 'chord', bar: 3 },
    { id: 'chord-bar-7', trackId: 'chord', bar: 7 },
  );

  const nextMatrix = applyChordTemplateWorkspaceToExistingClips(matrix, clips, {
    progressionTemplateId: 'axis',
    grooveTemplateId: 'block-basic',
  });

  assert.deepEqual(
    [0, 3, 7].map((bar) => nextMatrix.chord[bar][0].sourceChordLabel),
    ['C', 'G', 'Dm'],
  );
  assert.deepEqual([0, 3, 7].map((bar) => getChordRhythmSteps(nextMatrix, bar)), [[0], [0], [0]]);
  assert.equal(nextMatrix.chord[1].every((cell) => cell === null), true);
  assert.deepEqual(nextMatrix.drums[3][0], { instruments: ['kick'] });
  assert.equal(getAppliedChordProgressionTemplateId(nextMatrix, clips, 3), 'axis');
});

test('workspace apply helpers no-op for invalid templates or non-clip bars', () => {
  const matrix = createInitialMatrix();
  const clips = createClips({ id: 'chord-bar-0', trackId: 'chord', bar: 0 });

  assert.equal(applyChordTemplateWorkspaceToBar(matrix, clips, 1, {
    progressionTemplateId: 'doowop',
    grooveTemplateId: 'block-basic',
  }), matrix);
  assert.equal(applyChordTemplateWorkspaceToExistingClips(matrix, clips, {
    progressionTemplateId: 'missing',
    grooveTemplateId: 'block-basic',
  }), matrix);
});

test('toggleChordRhythmStep creates custom playable hits and retains a silent source when emptied', () => {
  let matrix = createInitialMatrix();
  matrix = setChordCell(matrix, 2, 0, 'F');

  matrix = toggleChordRhythmStep(matrix, 2, 6);
  assert.deepEqual(getChordRhythmSteps(matrix, 2), [0, 6]);
  assert.equal(matrix.chord[2][6].grooveTemplateId, CUSTOM_CHORD_GROOVE_ID);
  assert.equal(matrix.chord[2][6].duration, '16n');
  assert.equal(matrix.chord[2][6].sourceChordLabel, 'F');

  matrix = toggleChordRhythmStep(matrix, 2, 0);
  matrix = toggleChordRhythmStep(matrix, 2, 6);

  assert.deepEqual(getChordRhythmSteps(matrix, 2), []);
  assert.equal(matrix.chord[2][0].type, CHORD_SOURCE_CELL_TYPE);
  assert.equal(matrix.chord[2][0].sourceChordLabel, 'F');
  assert.equal(getChordSelectedGrooveTemplateId(matrix, 2), CUSTOM_CHORD_GROOVE_ID);
});

test('clearChordRhythmBar preserves progression metadata without leaving playable hits', () => {
  const clips = createClips({ id: 'chord-bar-4', trackId: 'chord', bar: 4 });
  let matrix = applyChordTemplateWorkspaceToBar(createInitialMatrix(), clips, 4, {
    progressionTemplateId: 'andalusian',
    grooveTemplateId: 'block-syncopated',
  });

  matrix = clearChordRhythmBar(matrix, 4);

  assert.deepEqual(getChordRhythmSteps(matrix, 4), []);
  assert.equal(matrix.chord[4][0].type, CHORD_SOURCE_CELL_TYPE);
  assert.equal(matrix.chord[4][0].sourceChordLabel, 'Am');
  assert.equal(matrix.chord[4][0].progressionTemplateId, 'andalusian');
  assert.equal(matrix.chord[4][0].selectedGrooveTemplateId, 'block-syncopated');
});
