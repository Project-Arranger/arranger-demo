import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import {
  createTutorialState,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialPlayheadDrag,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  isTutorialStepComplete,
  resetTask3ForRetry,
  resetTutorialStepForRetry,
} from '../src/tutorial/drumsTutorialRuntime.js';
import { DRUMS_TUTORIAL_STEPS } from '../src/tutorial/drumsTutorialSteps.js';
import { TUTORIAL_STEP_IDS } from '../src/tutorial/tutorialStepIds.js';

function getStep(stepId) {
  return DRUMS_TUTORIAL_STEPS.find((step) => step.id === stepId);
}

function createClips(bars) {
  return {
    ids: bars.map((bar) => `drums-bar-${bar}`),
    byId: Object.fromEntries(bars.map((bar) => [
      `drums-bar-${bar}`,
      { id: `drums-bar-${bar}`, trackId: 'drums', bar },
    ])),
  };
}

test('track area tour requires opening the first drums clip and dragging the playhead', () => {
  const step = getStep(TUTORIAL_STEP_IDS.UI_TRACK_AREA);
  let progress = createTutorialState();
  const viewModel = getTutorialViewModel({
    clips: createClips([0]),
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step,
  });

  assert.equal(viewModel.canManualNext, false);
  assert.equal(viewModel.locked, true);
  assert.equal(viewModel.displayCopy, `${step.copy}（0/2）`);
  assert.deepEqual(viewModel.targets.timelineBars, [{ bar: 0, role: 'target' }]);
  assert.equal(viewModel.targets.playhead, null);

  const earlyDrag = handleTutorialPlayheadDrag({ progress, step });
  assert.equal(earlyDrag.allowed, false);
  assert.equal(earlyDrag.shouldAdvance, false);
  assert.equal(earlyDrag.nextProgress, progress);

  const wrongTrack = handleTutorialClipOpen({
    bar: 0,
    progress,
    step,
    trackId: 'bass',
  });
  assert.equal(wrongTrack.allowed, false);
  assert.equal(wrongTrack.shouldAdvance, false);

  const wrongBar = handleTutorialClipOpen({
    bar: 1,
    progress,
    step,
    trackId: 'drums',
  });
  assert.equal(wrongBar.allowed, false);
  assert.equal(wrongBar.shouldAdvance, false);

  const opened = handleTutorialClipOpen({
    bar: 0,
    progress,
    step,
    trackId: 'drums',
  });
  assert.equal(opened.allowed, true);
  assert.equal(opened.shouldAdvance, false);
  assert.equal(opened.nextProgress.trackAreaClipOpened, true);
  assert.equal(opened.nextProgress.trackAreaPlayheadDragged, false);
  progress = opened.nextProgress;

  const afterClipViewModel = getTutorialViewModel({
    clips: createClips([0]),
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step,
  });
  assert.equal(afterClipViewModel.displayCopy, `${step.copy}（1/2）`);
  assert.deepEqual(afterClipViewModel.targets.timelineBars, [{ bar: 0, role: 'completed' }]);
  assert.deepEqual(afterClipViewModel.targets.playhead, { role: 'target' });

  const dragged = handleTutorialPlayheadDrag({ progress, step });
  assert.equal(dragged.allowed, true);
  assert.equal(dragged.shouldAdvance, true);
  assert.equal(dragged.nextProgress.trackAreaPlayheadDragged, true);

  const completeViewModel = getTutorialViewModel({
    clips: createClips([0]),
    matrix: createInitialMatrix(),
    progress: dragged.nextProgress,
    selectedBar: 0,
    step,
  });
  assert.equal(completeViewModel.displayCopy, `${step.copy}（2/2）`);
});

test('track area retry reset clears progress and returns the playhead to start', () => {
  const step = getStep(TUTORIAL_STEP_IDS.UI_TRACK_AREA);
  const matrix = createInitialMatrix();
  const progress = {
    ...createTutorialState(),
    trackAreaClipOpened: true,
    trackAreaPlayheadDragged: true,
  };

  const reset = resetTutorialStepForRetry({ matrix, progress, step });

  assert.deepEqual(reset.nextMatrixPatch, []);
  assert.deepEqual(reset.nextTransportPosition, { bar: 0, step: 0 });
  assert.equal(reset.nextProgress.trackAreaClipOpened, false);
  assert.equal(reset.nextProgress.trackAreaPlayheadDragged, false);

  const viewModel = getTutorialViewModel({
    clips: createClips([0]),
    matrix,
    progress: reset.nextProgress,
    selectedBar: 0,
    step,
  });
  assert.equal(viewModel.displayCopy, `${step.copy}（0/2）`);
  assert.deepEqual(viewModel.targets.timelineBars, [{ bar: 0, role: 'target' }]);
  assert.equal(viewModel.targets.playhead, null);
});

test('task 1 only accepts two highlighted kick targets in bar 2', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_1);
  const matrix = createInitialMatrix();
  let progress = createTutorialState(step.id);

  const wrongInstrument = handleTutorialDrumToggle({
    instrument: 'snare',
    matrix,
    progress,
    selectedBar: 1,
    step,
    stepIndex: 2,
  });
  assert.equal(wrongInstrument.allowed, false);
  assert.equal(wrongInstrument.nextProgress, progress);

  const wrongStep = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 1,
    step,
    stepIndex: 1,
  });
  assert.equal(wrongStep.allowed, false);
  assert.equal(wrongStep.nextProgress, progress);

  const wrongBar = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(wrongBar.allowed, false);
  assert.equal(wrongBar.nextProgress, progress);

  const initialViewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 0,
    step,
  });
  assert.equal(initialViewModel.suggestedSelectedBar, 1);
  assert.deepEqual(initialViewModel.targets.timelineBars, [{ bar: 1, role: 'target' }]);

  const first = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 1,
    step,
    stepIndex: 2,
  });
  assert.equal(first.allowed, true);
  assert.equal(first.shouldAdvance, false);
  assert.deepEqual(first.nextProgress.task1EditedBars, [1]);
  assert.deepEqual(first.nextProgress.task1EditedSteps, [2]);
  assert.equal(first.nextProgress.task1Count, 1);

  const nextTargetViewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress: first.nextProgress,
    selectedBar: 1,
    step,
  });
  assert.equal(nextTargetViewModel.suggestedSelectedBar, null);

  progress = first.nextProgress;
  const sameStepAgain = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 1,
    step,
    stepIndex: 2,
  });
  assert.equal(sameStepAgain.allowed, false);
  assert.equal(sameStepAgain.nextProgress, progress);

  const second = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 1,
    step,
    stepIndex: 14,
  });
  assert.equal(second.allowed, true);
  assert.equal(second.shouldAdvance, true);
  assert.deepEqual(second.nextProgress.task1EditedBars, [1]);
  assert.deepEqual(second.nextProgress.task1EditedSteps, [2, 14]);
  assert.equal(second.nextProgress.task1Count, 2);
  assert.equal(isTutorialStepComplete(step, second.nextProgress), true);

  const viewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress: second.nextProgress,
    selectedBar: 1,
    step,
  });
  assert.match(viewModel.displayCopy, /（2\/2）/);
  assert.equal(viewModel.locked, true);
  assert.deepEqual(viewModel.targets.drumCells[0], {
    bar: 1,
    instrument: 'kick',
    role: 'completed',
    steps: [2, 6, 10, 14],
  });
  assert.equal(viewModel.suggestedSelectedBar, null);
});

test('autofill retry reset clears the generated initial drums bars', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_AUTOFILL);
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  matrix.drums[1][8] = createDrumsCell(['snare', 'hihat']);
  matrix.drums[2][12] = createDrumsCell(['hihat']);
  matrix.drums[3][2] = createDrumsCell(['kick']);

  const reset = resetTutorialStepForRetry({
    matrix,
    progress: createTutorialState(),
    step,
  });
  const patchByKey = new Map(reset.nextMatrixPatch.map((patch) => [
    `${patch.bar}:${patch.step}`,
    patch.cell,
  ]));

  assert.equal(reset.nextMatrixPatch.length, 64);
  assert.equal(patchByKey.get('0:0'), null);
  assert.equal(patchByKey.get('1:8'), null);
  assert.equal(patchByKey.get('2:12'), null);
  assert.equal(patchByKey.get('3:2'), null);
});

test('task 2 only accepts moving a kick in an unedited bar two steps right', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_2);
  const matrix = createInitialMatrix();
  matrix.drums[2][0] = createDrumsCell(['kick']);
  const progress = {
    ...createTutorialState(step.id),
    task1EditedBars: [1],
    task1EditedSteps: [2, 14],
    task1Count: 2,
  };

  const viewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 2,
    step,
  });
  assert.deepEqual(viewModel.targets.timelineBars, [{ bar: 2, role: 'target' }]);
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 2, instrument: 'kick', role: 'source', steps: [0] },
    { bar: 2, instrument: 'kick', role: 'target', steps: [2] },
  ]);
  const reselectionViewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 1,
    step,
  });
  assert.equal(reselectionViewModel.suggestedSelectedBar, 2);

  const clickInsteadOfDrag = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 2,
    step,
    stepIndex: 2,
  });
  assert.equal(clickInsteadOfDrag.allowed, false);

  const wrongBar = handleTutorialDrumMove({
    fromStep: 0,
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    toStep: 2,
  });
  assert.equal(wrongBar.allowed, false);

  const wrongTarget = handleTutorialDrumMove({
    fromStep: 0,
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 2,
    step,
    toStep: 3,
  });
  assert.equal(wrongTarget.allowed, false);

  const moved = handleTutorialDrumMove({
    fromStep: 0,
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 2,
    step,
    toStep: 2,
  });
  assert.equal(moved.allowed, true);
  assert.equal(moved.shouldAdvance, true);
  assert.equal(moved.nextProgress.task2Count, 1);
  assert.equal(moved.nextProgress.task2EditedBar, 2);
  assert.deepEqual(moved.nextMatrixPatch, [
    { bar: 2, cell: null, step: 0 },
    { bar: 2, cell: { instruments: ['kick'] }, step: 2 },
  ]);
});

test('task 1 retry reset removes added kicks and clears progress', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_1);
  const matrix = createInitialMatrix();
  matrix.drums[1][2] = createDrumsCell(['kick', 'hihat']);
  matrix.drums[1][14] = createDrumsCell(['kick']);
  const progress = {
    ...createTutorialState(),
    task1Count: 2,
    task1EditedBars: [1],
    task1EditedSteps: [2, 14],
  };

  const reset = resetTutorialStepForRetry({ matrix, progress, step });

  assert.deepEqual(reset.nextProgress, {
    ...progress,
    task1Count: 0,
    task1EditedBars: [],
    task1EditedSteps: [],
  });
  assert.deepEqual(reset.nextMatrixPatch, [
    { bar: 1, cell: { instruments: ['hihat'] }, step: 2 },
    { bar: 1, cell: null, step: 14 },
  ]);
});

test('task 2 retry reset moves the kick back to the source step', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_2);
  const matrix = createInitialMatrix();
  matrix.drums[2][0] = createDrumsCell(['hihat']);
  matrix.drums[2][2] = createDrumsCell(['kick', 'snare']);
  const progress = {
    ...createTutorialState(),
    task2Count: 1,
    task2EditedBar: 2,
  };

  const reset = resetTutorialStepForRetry({ matrix, progress, step });

  assert.deepEqual(reset.nextProgress, {
    ...progress,
    task2Count: 0,
    task2EditedBar: null,
  });
  assert.deepEqual(reset.nextMatrixPatch, [
    { bar: 2, cell: { instruments: ['kick', 'hihat'] }, step: 0 },
    { bar: 2, cell: { instruments: ['snare'] }, step: 2 },
  ]);
});

test('task 3 accepts only step 5 or 13 in the final unedited bar', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_3);
  const matrix = createInitialMatrix();
  const progress = {
    ...createTutorialState(step.id),
    task1EditedBars: [1],
    task1EditedSteps: [2, 14],
    task1Count: 2,
    task2EditedBar: 2,
    task2Count: 1,
  };

  const viewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 3,
    step,
  });
  assert.deepEqual(viewModel.targets.timelineBars, [{ bar: 3, role: 'target' }]);
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 3, instrument: 'kick', role: 'target', steps: [4, 12] },
  ]);
  const reselectionViewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 2,
    step,
  });
  assert.equal(reselectionViewModel.suggestedSelectedBar, 3);

  const wrongStep = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 3,
    step,
    stepIndex: 8,
  });
  assert.equal(wrongStep.allowed, false);

  const accepted = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 3,
    step,
    stepIndex: 12,
  });
  assert.equal(accepted.allowed, true);
  assert.equal(accepted.shouldAdvance, true);
  assert.equal(accepted.nextProgress.task3Count, 1);
  assert.equal(accepted.nextProgress.task3EditedBar, 3);
  assert.equal(accepted.nextProgress.task3EditedStep, 12);
});

test('task 3 retry reset removes the added kick and clears progress', () => {
  const matrix = createInitialMatrix();
  matrix.drums[3][4] = createDrumsCell(['kick', 'hihat']);
  matrix.drums[3][12] = createDrumsCell(['kick', 'hihat']);
  const progress = {
    ...createTutorialState(),
    task3Count: 1,
    task3EditedBar: 3,
    task3EditedStep: 12,
  };

  const reset = resetTask3ForRetry({ matrix, progress });

  assert.deepEqual(reset.nextProgress, {
    ...progress,
    task3Count: 0,
    task3EditedBar: null,
    task3EditedStep: null,
  });
  assert.deepEqual(reset.nextMatrixPatch, [
    { bar: 3, cell: { instruments: ['hihat'] }, step: 12 },
  ]);
});

test('task 4 allows free kick edits in free bars and exposes a complete action', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_4);
  const matrix = createInitialMatrix();
  const progress = createTutorialState(step.id);

  const viewModel = getTutorialViewModel({
    clips: createClips([4, 5, 6, 7]),
    matrix,
    progress,
    selectedBar: 5,
    step,
  });
  assert.equal(viewModel.locked, true);
  assert.equal(viewModel.showCompleteButton, true);
  assert.deepEqual(viewModel.targets.timelineBars, [
    { bar: 4, role: 'target' },
    { bar: 5, role: 'target' },
    { bar: 6, role: 'target' },
    { bar: 7, role: 'target' },
  ]);

  const wrongInstrument = handleTutorialDrumToggle({
    instrument: 'snare',
    matrix,
    progress,
    selectedBar: 5,
    step,
    stepIndex: 4,
  });
  assert.equal(wrongInstrument.allowed, false);

  const accepted = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 5,
    step,
    stepIndex: 4,
  });
  assert.equal(accepted.allowed, true);
  assert.equal(accepted.shouldAdvance, false);

  matrix.drums[5][0] = createDrumsCell(['kick', 'hihat']);
  const moved = handleTutorialDrumMove({
    fromStep: 0,
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 5,
    step,
    toStep: 2,
  });
  assert.equal(moved.allowed, true);
  assert.equal(moved.shouldAdvance, false);
  assert.deepEqual(moved.nextMatrixPatch, [
    { bar: 5, cell: { instruments: ['hihat'] }, step: 0 },
    { bar: 5, cell: { instruments: ['kick'] }, step: 2 },
  ]);
});

test('task 4 stops timeline bounce only for bars with kick content', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_4);
  const matrix = createInitialMatrix();
  matrix.drums[4][0] = createDrumsCell(['hihat']);
  matrix.drums[5][8] = createDrumsCell(['snare', 'hihat']);
  matrix.drums[6][2] = createDrumsCell(['kick']);
  matrix.drums[7][12] = createDrumsCell(['kick', 'hihat']);

  const viewModel = getTutorialViewModel({
    clips: createClips([4, 5, 6, 7]),
    matrix,
    progress: createTutorialState(step.id),
    selectedBar: 4,
    step,
  });

  assert.deepEqual(viewModel.targets.timelineBars, [
    { bar: 4, role: 'target' },
    { bar: 5, role: 'target' },
    { bar: 6, role: 'completed' },
    { bar: 7, role: 'completed' },
  ]);
});

test('task 4 retry reset removes free kicks but keeps matched snare and hihat', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_4);
  const matrix = createInitialMatrix();
  matrix.drums[4][0] = createDrumsCell(['kick', 'hihat']);
  matrix.drums[4][8] = createDrumsCell(['kick', 'snare', 'hihat']);
  matrix.drums[5][2] = createDrumsCell(['kick']);
  const progress = {
    ...createTutorialState(),
    task4Complete: true,
  };

  const reset = resetTutorialStepForRetry({ matrix, progress, step });
  const patchByKey = new Map(reset.nextMatrixPatch.map((patch) => [
    `${patch.bar}:${patch.step}`,
    patch.cell,
  ]));

  assert.equal(reset.nextProgress.task4Complete, false);
  assert.deepEqual(patchByKey.get('4:0'), { instruments: ['hihat'] });
  assert.deepEqual(patchByKey.get('4:8'), { instruments: ['snare', 'hihat'] });
  assert.equal(patchByKey.get('5:2'), null);
});
