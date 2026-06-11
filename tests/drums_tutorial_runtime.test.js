import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import {
  completeTutorialPrimaryAction,
  createTutorialState,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialControlAction,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  handleTutorialPlaybackComplete,
  isTutorialStepComplete,
  resetTutorialStepForRetry,
} from '../src/tutorial/drumsTutorialRuntime.js';
import { DRUMS_TUTORIAL_STEPS } from '../src/tutorial/drumsTutorialSteps.js';
import { TUTORIAL_STEP_IDS } from '../src/tutorial/tutorialStepIds.js';

function getStep(stepId) {
  return DRUMS_TUTORIAL_STEPS.find((step) => step.id === stepId);
}

test('phase 1 starts by requiring the first drums clip to open', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP);
  const progress = createTutorialState();
  const viewModel = getTutorialViewModel({
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step,
  });

  assert.equal(viewModel.canManualNext, false);
  assert.equal(viewModel.locked, true);
  assert.equal(viewModel.displayCopy, step.copy);
  assert.deepEqual(viewModel.targets.timelineBars, [{ bar: 0, role: 'target' }]);

  const wrongTrack = handleTutorialClipOpen({
    bar: 0,
    progress,
    step,
    trackId: 'bass',
  });
  assert.equal(wrongTrack.allowed, false);

  const opened = handleTutorialClipOpen({
    bar: 0,
    progress,
    step,
    trackId: 'drums',
  });
  assert.equal(opened.allowed, true);
  assert.equal(opened.shouldAdvance, true);
  assert.equal(opened.nextProgress.firstDrumsClipOpened, true);
  assert.equal(isTutorialStepComplete(step, opened.nextProgress), true);
});

test('phase 1 highlights current-bar generation and playback completion controls', () => {
  const generateStep = getStep(TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR);
  const matrix = createInitialMatrix();
  let progress = {
    ...createTutorialState(),
    firstDrumsClipOpened: true,
  };

  const generateViewModel = getTutorialViewModel({
    matrix,
    progress,
    selectedBar: 0,
    step: generateStep,
  });
  assert.equal(generateViewModel.locked, true);
  assert.deepEqual(generateViewModel.targets.controls, [
    { name: 'generate-current-drums-bar', role: 'target' },
  ]);

  const wrongControl = handleTutorialControlAction({
    control: 'generate-all-drums-bars',
    progress,
    selectedBar: 0,
    step: generateStep,
  });
  assert.equal(wrongControl.allowed, false);

  const generated = handleTutorialControlAction({
    control: 'generate-current-drums-bar',
    progress,
    selectedBar: 0,
    step: generateStep,
  });
  assert.equal(generated.allowed, true);
  assert.equal(generated.shouldAdvance, true);
  assert.equal(generated.nextProgress.currentDrumsBarGenerated, true);
  progress = generated.nextProgress;

  const playbackStep = getStep(TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP);
  const playbackViewModel = getTutorialViewModel({
    matrix,
    progress,
    selectedBar: 0,
    step: playbackStep,
  });
  assert.deepEqual(playbackViewModel.targets.controls, [
    { name: 'transport-play', role: 'target' },
  ]);

  const earlyComplete = handleTutorialPlaybackComplete({
    bar: 1,
    progress,
    step: playbackStep,
    trackId: 'drums',
  });
  assert.equal(earlyComplete.allowed, false);

  const completed = handleTutorialPlaybackComplete({
    bar: 0,
    progress,
    step: playbackStep,
    trackId: 'drums',
  });
  assert.equal(completed.allowed, true);
  assert.equal(completed.shouldAdvance, true);
  assert.equal(completed.nextProgress.firstClipPlaybackComplete, true);
});

test('phase 1 tracks fill-clips and all-bars generation controls', () => {
  const fillStep = getStep(TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS);
  let progress = {
    ...createTutorialState(),
    currentDrumsBarGenerated: true,
    firstClipPlaybackComplete: true,
    firstDrumsClipOpened: true,
  };

  const fillViewModel = getTutorialViewModel({
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step: fillStep,
  });
  assert.deepEqual(fillViewModel.targets.controls, [
    { name: 'fill-empty-clips:drums', role: 'target' },
  ]);

  const filled = handleTutorialControlAction({
    control: 'fill-empty-clips:drums',
    progress,
    step: fillStep,
  });
  assert.equal(filled.allowed, true);
  assert.equal(filled.shouldAdvance, true);
  assert.equal(filled.nextProgress.drumsTrackClipsFilled, true);
  progress = filled.nextProgress;

  const allBarsStep = getStep(TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS);
  const allBarsViewModel = getTutorialViewModel({
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step: allBarsStep,
  });
  assert.deepEqual(allBarsViewModel.targets.controls, [
    { name: 'generate-all-drums-bars', role: 'target' },
  ]);

  const generatedAll = handleTutorialControlAction({
    control: 'generate-all-drums-bars',
    progress,
    step: allBarsStep,
  });
  assert.equal(generatedAll.allowed, true);
  assert.equal(generatedAll.shouldAdvance, true);
  assert.equal(generatedAll.nextProgress.allDrumsBarsGenerated, true);
});

test('kick variation highlights blue green and yellow target classes until completion', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION);
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  const progress = {
    ...createTutorialState(),
    allDrumsBarsGenerated: true,
    drumsTrackClipsFilled: true,
  };

  const viewModel = getTutorialViewModel({
    matrix,
    progress,
    selectedBar: 0,
    step,
  });
  assert.equal(viewModel.locked, false);
  assert.equal(viewModel.primaryLabel, '完成添加');
  assert.equal(viewModel.primaryDisabled, true);
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 0, instrument: 'kick', role: 'target-blue', steps: [4, 12] },
    { bar: 0, instrument: 'kick', role: 'target-green', steps: [2, 6, 10, 14] },
    { bar: 0, instrument: 'kick', role: 'target-yellow', steps: [1, 3, 5, 7, 9, 11, 13, 15] },
  ]);

  const wrongInstrument = handleTutorialDrumToggle({
    instrument: 'snare',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(wrongInstrument.allowed, true);
  assert.equal(wrongInstrument.nextProgress.kickVariationEdited, false);

  const existingKickClick = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 0,
  });
  assert.equal(existingKickClick.allowed, true);
  assert.equal(existingKickClick.nextProgress.kickVariationEdited, false);
  assert.deepEqual(existingKickClick.nextProgress.kickVariationEditedCells, []);
  assert.deepEqual(existingKickClick.nextProgress.kickVariationOriginalRemovedCells, ['0:0']);

  matrix.drums[0][0] = createDrumsCell(['hihat']);
  const existingKickAddedBack = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress: existingKickClick.nextProgress,
    selectedBar: 0,
    step,
    stepIndex: 0,
  });
  assert.equal(existingKickAddedBack.allowed, true);
  assert.equal(existingKickAddedBack.nextProgress.kickVariationEdited, false);
  assert.deepEqual(existingKickAddedBack.nextProgress.kickVariationEditedCells, []);
  assert.deepEqual(existingKickAddedBack.nextProgress.kickVariationOriginalRemovedCells, []);

  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  const existingReaddedViewModel = getTutorialViewModel({
    matrix,
    progress: existingKickAddedBack.nextProgress,
    selectedBar: 0,
    step,
  });
  assert.deepEqual(existingReaddedViewModel.targets.drumCells, [
    { bar: 0, instrument: 'kick', role: 'target-blue', steps: [4, 12] },
    { bar: 0, instrument: 'kick', role: 'target-green', steps: [2, 6, 10, 14] },
    { bar: 0, instrument: 'kick', role: 'target-yellow', steps: [1, 3, 5, 7, 9, 11, 13, 15] },
  ]);

  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  const accepted = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(accepted.allowed, true);
  assert.equal(accepted.shouldAdvance, false);
  assert.equal(accepted.nextProgress.kickVariationEdited, true);
  assert.deepEqual(accepted.nextProgress.kickVariationEditedCells, ['0:2']);

  matrix.drums[0][2] = createDrumsCell(['kick']);
  const readyViewModel = getTutorialViewModel({
    matrix,
    progress: accepted.nextProgress,
    selectedBar: 0,
    step,
  });
  assert.equal(readyViewModel.primaryDisabled, false);
  assert.deepEqual(readyViewModel.targets.drumCells, [
    { bar: 0, instrument: 'kick', role: 'target-blue', steps: [4, 12] },
    { bar: 0, instrument: 'kick', role: 'completed-green', steps: [2] },
    { bar: 0, instrument: 'kick', role: 'target-green', steps: [6, 10, 14] },
    { bar: 0, instrument: 'kick', role: 'target-yellow', steps: [1, 3, 5, 7, 9, 11, 13, 15] },
  ]);

  const removed = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress: accepted.nextProgress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(removed.allowed, true);
  assert.equal(removed.nextProgress.kickVariationEdited, false);
  assert.deepEqual(removed.nextProgress.kickVariationEditedCells, []);

  const complete = completeTutorialPrimaryAction({
    progress: accepted.nextProgress,
    step,
  });
  assert.equal(complete.allowed, true);
  assert.equal(complete.shouldAdvance, true);
  assert.equal(complete.nextProgress.kickVariationComplete, true);
});

test('kick variation keeps non-recommended added kicks out of tutorial completion', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION);
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  const progress = {
    ...createTutorialState(),
    allDrumsBarsGenerated: true,
    drumsTrackClipsFilled: true,
  };

  const added = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 8,
  });
  assert.equal(added.allowed, true);
  assert.equal(added.nextProgress.kickVariationEdited, false);
  assert.deepEqual(added.nextProgress.kickVariationEditedCells, []);

  matrix.drums[0][8] = createDrumsCell(['kick', 'snare', 'hihat']);
  const viewModel = getTutorialViewModel({
    matrix,
    progress: added.nextProgress,
    selectedBar: 0,
    step,
  });
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 0, instrument: 'kick', role: 'target-blue', steps: [4, 12] },
    { bar: 0, instrument: 'kick', role: 'target-green', steps: [2, 6, 10, 14] },
    { bar: 0, instrument: 'kick', role: 'target-yellow', steps: [1, 3, 5, 7, 9, 11, 13, 15] },
  ]);
  assert.equal(viewModel.primaryDisabled, true);
});

test('kick drag step prepares source and target cells and completes by primary action', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK);
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['kick', 'hihat']);
  const progress = {
    ...createTutorialState(),
    kickVariationComplete: true,
    kickVariationEdited: true,
  };

  const viewModel = getTutorialViewModel({
    matrix,
    progress,
    selectedBar: 0,
    step,
  });
  assert.equal(viewModel.locked, false);
  assert.equal(viewModel.primaryLabel, '完成拖拽');
  assert.equal(viewModel.primaryDisabled, true);
  assert.deepEqual(viewModel.targets.drumCells, [
    { bar: 0, instrument: 'kick', role: 'source', steps: [0] },
    { bar: 0, instrument: 'kick', role: 'target', steps: [2] },
  ]);

  const clicked = handleTutorialDrumToggle({
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    stepIndex: 2,
  });
  assert.equal(clicked.allowed, true);
  assert.equal(clicked.shouldAdvance, false);

  const moved = handleTutorialDrumMove({
    fromStep: 0,
    instrument: 'kick',
    matrix,
    progress,
    selectedBar: 0,
    step,
    toStep: 2,
  });
  assert.equal(moved.allowed, true);
  assert.equal(moved.shouldAdvance, false);
  assert.equal(moved.nextProgress.kickDragMoved, true);
  assert.deepEqual(moved.nextMatrixPatch, [
    { bar: 0, cell: { instruments: ['hihat'] }, step: 0 },
    { bar: 0, cell: { instruments: ['kick'] }, step: 2 },
  ]);

  const complete = completeTutorialPrimaryAction({
    progress: moved.nextProgress,
    step,
  });
  assert.equal(complete.allowed, true);
  assert.equal(complete.shouldAdvance, true);
  assert.equal(complete.nextProgress.kickDragComplete, true);
});

test('free create step keeps editor open and advances only from continue exploration', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_FREE_CREATE);
  const progress = {
    ...createTutorialState(),
    kickDragComplete: true,
  };
  const viewModel = getTutorialViewModel({
    matrix: createInitialMatrix(),
    progress,
    selectedBar: 0,
    step,
  });

  assert.equal(viewModel.locked, false);
  assert.equal(viewModel.primaryLabel, '继续探索');
  assert.equal(viewModel.primaryDisabled, false);
  assert.deepEqual(viewModel.targets, {
    controls: [],
    drumCells: [],
    playhead: null,
    timelineBars: [],
  });
});

test('retry reset for drag step restores source and target kicks', () => {
  const step = getStep(TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK);
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['hihat']);
  matrix.drums[0][2] = createDrumsCell(['kick', 'snare']);
  const progress = {
    ...createTutorialState(),
    kickDragMoved: true,
  };

  const reset = resetTutorialStepForRetry({ matrix, progress, step });

  assert.deepEqual(reset.nextProgress, {
    ...progress,
    kickDragMoved: false,
    kickDragComplete: false,
  });
  assert.deepEqual(reset.nextMatrixPatch, [
    { bar: 0, cell: { instruments: ['kick', 'hihat'] }, step: 0 },
    { bar: 0, cell: { instruments: ['snare'] }, step: 2 },
  ]);
});
