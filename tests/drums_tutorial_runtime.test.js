import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import {
  createTutorialState,
  getTutorialViewModel,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  isTutorialStepComplete,
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

test('task 1 only accepts highlighted kick targets and tracks two distinct bars', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_1);
  const matrix = createInitialMatrix();
  let progress = createTutorialState(step.id);

  const wrongInstrument = handleTutorialDrumToggle({
    instrument: 'snare',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(wrongInstrument.allowed, false);
  assert.equal(wrongInstrument.nextProgress, progress);

  const wrongStep = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 1,
  });
  assert.equal(wrongStep.allowed, false);
  assert.equal(wrongStep.nextProgress, progress);

  const first = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(first.allowed, true);
  assert.equal(first.shouldAdvance, false);
  assert.deepEqual(first.nextProgress.task1EditedBars, [0]);
  assert.equal(first.nextProgress.task1Count, 1);

  progress = first.nextProgress;
  const sameBarAgain = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 6,
  });
  assert.equal(sameBarAgain.allowed, false);
  assert.equal(sameBarAgain.nextProgress, progress);

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
  assert.deepEqual(second.nextProgress.task1EditedBars, [0, 1]);
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
    bar: 0,
    instrument: 'kick',
    role: 'completed',
    steps: [2, 6, 10, 14],
  });
});

test('task 2 only accepts moving a kick in an unedited bar two steps right', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_2);
  const matrix = createInitialMatrix();
  matrix.drums[2][0] = createDrumsCell(['kick']);
  const progress = {
    ...createTutorialState(step.id),
    task1EditedBars: [0, 1],
    task1Count: 2,
  };

  const viewModel = getTutorialViewModel({
    clips: createClips([0, 1, 2, 3]),
    matrix,
    progress,
    selectedBar: 2,
    step,
  });
  assert.deepEqual(viewModel.targets.timelineBars, [
    { bar: 2, role: 'target' },
    { bar: 3, role: 'target' },
  ]);
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 2, instrument: 'kick', role: 'source', steps: [0] },
    { bar: 2, instrument: 'kick', role: 'target', steps: [2] },
  ]);

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

test('task 3 accepts only step 5 or 13 in the final unedited bar', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_TASK_3);
  const matrix = createInitialMatrix();
  const progress = {
    ...createTutorialState(step.id),
    task1EditedBars: [0, 1],
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
});
