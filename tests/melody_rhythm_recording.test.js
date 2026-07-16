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
  getMelodyRecordingMode,
  getRecordedMelodyDurationSteps,
  hasMelodyBarNotes,
  MELODY_RECORDING_MODES,
  recordTemplateMelodyNote,
} from '../src/app/useMelodyRecordingController.js';
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
});
