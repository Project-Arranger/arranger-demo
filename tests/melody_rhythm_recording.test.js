import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyMelodyRhythmTemplateToBar,
  applyMelodyRhythmTemplateToExistingClips,
  clearMelodyRhythmTemplateFromBar,
  clearMelodyRhythmTemplates,
  getMelodyClipTemplateId,
  MELODY_RHYTHM_TEMPLATES,
} from '../src/app/melodyRhythmTemplates.js';
import {
  appendMelodySequenceNote,
  captureMelodySequenceNote,
  createTemplateRecordingState,
  getMelodyRecordingMode,
  getMelodyRecordingRestState,
  getRecordedMelodyDurationSteps,
  hasMelodyBarNotes,
  hasMelodyNotesInRange,
  getMelodyWriteBarRange,
  MELODY_RECORDING_MODES,
  MELODY_RECORDING_PHASES,
  recordTemplateMelodyNote,
  registerActiveMelodyInput,
  releaseActiveMelodyInput,
} from '../src/app/useMelodyRecordingController.js';
import { replaceMelodyBarWithSequence } from '../src/app/melodyActions.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

function createClips() {
  const melodyClips = [0, 2, 5].map((bar) => ({
    id: `melody-bar-${bar}`,
    trackId: 'melody',
    bar,
    name: `Melody ${bar + 1}`,
    melodyRhythmTemplateId: null,
  }));
  const drumsClip = {
    id: 'drums-bar-0',
    trackId: 'drums',
    bar: 0,
    name: 'Drum 01',
  };
  const allClips = [drumsClip, ...melodyClips];
  return {
    ids: allClips.map(({ id }) => id),
    byId: Object.fromEntries(allClips.map((clip) => [clip.id, clip])),
  };
}

test('melody rhythm templates expose the five requested one-based patterns', () => {
  assert.deepEqual(
    MELODY_RHYTHM_TEMPLATES.map(({ name, steps }) => ({
      name,
      steps: steps.map((step) => step + 1),
    })),
    [
      { name: '切分', steps: [1, 7, 13] },
      { name: '跳跃切分', steps: [1, 7, 9, 13] },
      { name: '二八', steps: [2, 8] },
      { name: '四十六', steps: [1, 5, 9, 13] },
      { name: '附点', steps: [1, 13] },
    ],
  );
  assert.deepEqual(
    createTemplateRecordingState('syncopation', MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE, {
      currentBar: 5,
      endBar: 7,
      startBar: 5,
      totalBars: 3,
    }),
    {
      barRecordedNotes: 0,
      completedBars: [],
      countInBeat: null,
      currentBar: 5,
      endBar: 7,
      mode: MELODY_RECORDING_MODES.TEMPLATE,
      phase: MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE,
      recordedNotes: 0,
      selectedStep: null,
      sequenceNotes: [],
      startBar: 5,
      templateId: 'syncopation',
      totalBars: 3,
      totalNotes: 9,
    },
  );
});

test('melody rhythm templates apply per clip or to existing Melody clips only', () => {
  const clips = createClips();
  const oneBar = applyMelodyRhythmTemplateToBar(clips, 2, 'syncopation');
  assert.equal(getMelodyClipTemplateId(oneBar, 0), null);
  assert.equal(getMelodyClipTemplateId(oneBar, 2), 'syncopation');
  assert.equal(oneBar.byId['drums-bar-0'], clips.byId['drums-bar-0']);

  const allMelody = applyMelodyRhythmTemplateToExistingClips(oneBar, 'dotted');
  assert.deepEqual([0, 2, 5].map((bar) => getMelodyClipTemplateId(allMelody, bar)), [
    'dotted',
    'dotted',
    'dotted',
  ]);
  assert.equal(allMelody.ids.includes('melody-bar-1'), false);

  const clearedBar = clearMelodyRhythmTemplateFromBar(allMelody, 2);
  assert.equal(getMelodyClipTemplateId(clearedBar, 2), null);
  assert.equal(getMelodyClipTemplateId(clearedBar, 0), 'dotted');
  const clearedTrack = clearMelodyRhythmTemplates(clearedBar);
  assert.deepEqual([0, 2, 5].map((bar) => getMelodyClipTemplateId(clearedTrack, bar)), [
    null,
    null,
    null,
  ]);
});

test('template recording fills highlighted steps in order and completes at the last slot', () => {
  let matrix = createInitialMatrix();
  let cursor = 0;
  const recorded = [];

  for (const note of ['C4', 'D4', 'E4']) {
    const result = recordTemplateMelodyNote(
      matrix,
      0,
      'syncopation',
      cursor,
      note,
    );
    matrix = result.matrix;
    cursor = result.cursor;
    recorded.push({ complete: result.complete, step: result.step });
  }

  assert.deepEqual(recorded, [
    { complete: false, step: 0 },
    { complete: false, step: 6 },
    { complete: true, step: 12 },
  ]);
  assert.deepEqual(matrix.melody[0].map((cell, step) => cell ? [step, cell.note] : null).filter(Boolean), [
    [0, 'C4'],
    [6, 'D4'],
    [12, 'E4'],
  ]);
  assert.equal(recordTemplateMelodyNote(matrix, 0, 'syncopation', cursor, 'G4').recorded, false);
});

test('free recording helpers quantize duration and choose mode from clip template state', () => {
  assert.equal(getMelodyRecordingMode(null), MELODY_RECORDING_MODES.FREE);
  assert.equal(getMelodyRecordingMode('four-sixteen'), MELODY_RECORDING_MODES.TEMPLATE);
  assert.equal(getRecordedMelodyDurationSteps({
    bpm: 120,
    endedAt: 375,
    startedAt: 0,
  }), 3);
  assert.equal(getRecordedMelodyDurationSteps({
    bpm: 120,
    endedAt: 10,
    maxDurationSteps: 1,
    startedAt: 0,
  }), 1);

  const matrix = createInitialMatrix();
  assert.equal(hasMelodyBarNotes(matrix, 0), false);
  matrix.melody[0][4] = { type: 'melody', note: 'C4' };
  assert.equal(hasMelodyBarNotes(matrix, 0), true);
  assert.deepEqual(getMelodyWriteBarRange(5), [5, 6, 7]);
  assert.deepEqual(getMelodyWriteBarRange(-1), []);
  assert.equal(hasMelodyNotesInRange(matrix, 0, 7), true);
  assert.equal(hasMelodyNotesInRange(matrix, 1, 7), false);
});

test('template workflow exposes overview, step-edit, and capture state', () => {
  const templateClip = {
    id: 'melody-bar-0',
    trackId: 'melody',
    melodyRhythmTemplateId: 'syncopation',
  };
  assert.equal(getMelodyRecordingRestState({
    activeTrackId: 'melody',
    selectedClip: templateClip,
  }).phase, MELODY_RECORDING_PHASES.OVERVIEW);
  assert.equal(getMelodyRecordingRestState({
    activeTrackId: 'drums',
    selectedClip: templateClip,
  }).phase, MELODY_RECORDING_PHASES.IDLE);
  assert.deepEqual(
    createTemplateRecordingState('syncopation', MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE),
    {
      barRecordedNotes: 0,
      completedBars: [],
      countInBeat: null,
      currentBar: null,
      endBar: null,
      mode: MELODY_RECORDING_MODES.TEMPLATE,
      phase: MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE,
      recordedNotes: 0,
      selectedStep: null,
      sequenceNotes: [],
      startBar: null,
      templateId: 'syncopation',
      totalBars: 1,
      totalNotes: 3,
    },
  );
  assert.equal(MELODY_RECORDING_PHASES.AUDITION, undefined);
  assert.equal(MELODY_RECORDING_PHASES.PREVIEW, undefined);
});

test('sequence capture keeps the matrix unchanged until one atomic bar replacement', () => {
  const matrix = createInitialMatrix();
  matrix.melody[0][3] = { type: 'melody', note: 'A4', durationSteps: 4 };
  const originalBar = matrix.melody[0];

  const incomplete = replaceMelodyBarWithSequence(
    matrix,
    0,
    [0, 6, 12],
    ['C4', 'D4'],
  );
  assert.equal(incomplete, matrix);
  assert.equal(incomplete.melody[0], originalBar);

  const complete = replaceMelodyBarWithSequence(
    matrix,
    0,
    [0, 6, 12],
    ['C4', 'D4', 'E4'],
  );
  assert.notEqual(complete, matrix);
  assert.deepEqual(
    complete.melody[0]
      .map((cell, step) => cell ? [step, cell] : null)
      .filter(Boolean),
    [
      [0, { type: 'melody', note: 'C4' }],
      [6, { type: 'melody', note: 'D4' }],
      [12, { type: 'melody', note: 'E4' }],
    ],
  );
  assert.deepEqual(matrix.melody[0][3], {
    type: 'melody',
    note: 'A4',
    durationSteps: 4,
  });
});

test('sequence capture accepts overlapping new presses and keeps duplicates', () => {
  const first = appendMelodySequenceNote([], 'C4', 3);
  assert.deepEqual(first, {
    accepted: true,
    complete: false,
    sequenceNotes: ['C4'],
  });
  const duplicate = appendMelodySequenceNote(first.sequenceNotes, 'C4', 3);
  assert.deepEqual(duplicate.sequenceNotes, ['C4', 'C4']);
  assert.equal(appendMelodySequenceNote(duplicate.sequenceNotes, 'G4', 3).complete, true);
});

test('sequence capture session records four rapid events synchronously and commits once', () => {
  const session = {
    completed: false,
    sequenceNotes: [],
    templateSteps: [0, 4, 8, 12],
  };

  const results = ['C4', 'E4', 'G4', 'C5']
    .map((note) => captureMelodySequenceNote(session, note));

  assert.deepEqual(results.map(({ accepted, complete }) => ({ accepted, complete })), [
    { accepted: true, complete: false },
    { accepted: true, complete: false },
    { accepted: true, complete: false },
    { accepted: true, complete: true },
  ]);
  assert.deepEqual(session.sequenceNotes, ['C4', 'E4', 'G4', 'C5']);
  assert.equal(session.completed, true);
  assert.deepEqual(captureMelodySequenceNote(session, 'D5'), {
    accepted: false,
    complete: false,
    sequenceNotes: ['C4', 'E4', 'G4', 'C5'],
  });
});

test('active melody inputs reference-count the same note across sources', () => {
  const activeInputs = new Map();
  assert.deepEqual(registerActiveMelodyInput(activeInputs, 'keyboard:KeyA', 'C4'), {
    accepted: true,
    firstSourceForNote: true,
  });
  assert.deepEqual(registerActiveMelodyInput(activeInputs, 'launchpad:41', 'C4'), {
    accepted: true,
    firstSourceForNote: false,
  });
  assert.deepEqual(registerActiveMelodyInput(activeInputs, 'keyboard:KeyA', 'C4'), {
    accepted: false,
    firstSourceForNote: false,
  });
  assert.deepEqual(releaseActiveMelodyInput(activeInputs, 'keyboard:KeyA'), {
    accepted: true,
    note: 'C4',
    noteStillActive: true,
  });
  assert.deepEqual(releaseActiveMelodyInput(activeInputs, 'launchpad:41'), {
    accepted: true,
    note: 'C4',
    noteStillActive: false,
  });
  assert.deepEqual(releaseActiveMelodyInput(activeInputs, 'launchpad:41'), {
    accepted: false,
    note: null,
    noteStillActive: false,
  });
});
