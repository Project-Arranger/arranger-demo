import {
  createDrumsCell,
  getDrumsCellInstruments,
} from '../domain/drumsCells.js';
import { createDrumsStepMovePatch } from '../domain/drumsStepMove.js';
import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  DRUMS_TASK_1_TARGET_STEPS,
  DRUMS_TASK_2_SOURCE_STEP,
  DRUMS_TASK_2_TARGET_STEP,
  DRUMS_TASK_3_TARGET_STEPS,
  DRUMS_TUTORIAL_FREE_BARS,
  DRUMS_TUTORIAL_INITIAL_BARS,
} from './drumsTutorialConstants.js';
import { TUTORIAL_STEP_IDS } from './tutorialStepIds.js';

const TASK_TOTALS = Object.freeze({
  [TUTORIAL_STEP_IDS.UI_TRACK_AREA]: 2,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: 2,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: 1,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: 1,
});

const TASK_COUNT_FIELDS = Object.freeze({
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: 'task1Count',
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: 'task2Count',
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: 'task3Count',
});

const TASK_GUIDED_BARS = Object.freeze({
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: 1,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: 2,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: 3,
});

const ALL_DRUM_STEPS = Object.freeze(Array.from({ length: STEPS_PER_BAR }, (_, step) => step));

function createTutorialState() {
  return {
    trackAreaClipOpened: false,
    trackAreaPlayheadDragged: false,
    task1Count: 0,
    task1EditedBars: [],
    task1EditedSteps: [],
    task2Count: 0,
    task2EditedBar: null,
    task3Count: 0,
    task3EditedBar: null,
    task3EditedStep: null,
    task4Complete: false,
  };
}

function createEmptyTargets() {
  return {
    drumCells: [],
    playhead: null,
    timelineBars: [],
  };
}

function getProgressCount(step, progress) {
  if (step?.id === TUTORIAL_STEP_IDS.UI_TRACK_AREA) {
    return Number(Boolean(progress?.trackAreaClipOpened))
      + Number(Boolean(progress?.trackAreaPlayheadDragged));
  }

  const field = TASK_COUNT_FIELDS[step?.id];
  return field ? progress?.[field] ?? 0 : 0;
}

function withProgressCount(copy, count, total) {
  if (!total) return copy;
  const progressText = `（${count}/${total}）`;
  if (/（\d+\/\d+）/.test(copy)) {
    return copy.replace(/（\d+\/\d+）/, progressText);
  }
  return `${copy}${progressText}`;
}

function uniqueSortedBars(bars) {
  return [...new Set(bars)].sort((left, right) => left - right);
}

function getTask1EditedSteps(progress) {
  return [...new Set(progress?.task1EditedSteps ?? [])].sort((left, right) => left - right);
}

function getTask2AvailableBars() {
  const targetBar = TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_2];
  return DRUMS_TUTORIAL_INITIAL_BARS.includes(targetBar) ? [targetBar] : [];
}

function getTask3TargetBar() {
  return TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_3];
}

function hasInstrument(matrix, bar, step, instrument) {
  return getDrumsCellInstruments(matrix?.drums?.[bar]?.[step]).includes(instrument);
}

function hasDrumsInstrumentInBar(matrix, bar, instrument) {
  return (matrix?.drums?.[bar] ?? []).some((cell) => (
    getDrumsCellInstruments(cell).includes(instrument)
  ));
}

function makeCellWithoutInstrument(cell, instrument) {
  const instruments = getDrumsCellInstruments(cell).filter((item) => item !== instrument);
  return createDrumsCell(instruments);
}

function makeCellWithInstrument(cell, instrument) {
  return createDrumsCell([...getDrumsCellInstruments(cell), instrument]);
}

function createRemoveKickPatches(matrix, bar, steps) {
  return steps.map((step) => ({
    bar,
    cell: makeCellWithoutInstrument(matrix?.drums?.[bar]?.[step] ?? null, 'kick'),
    step,
  }));
}

function getTutorialViewModel({
  matrix,
  progress = createTutorialState(),
  selectedBar = 0,
  step,
} = {}) {
  if (!step) {
    return {
      canManualNext: false,
      displayCopy: '',
      locked: false,
      showCompleteButton: false,
      suggestedSelectedBar: null,
      targets: createEmptyTargets(),
    };
  }

  const count = getProgressCount(step, progress);
  const total = TASK_TOTALS[step.id] ?? 0;
  const targets = createEmptyTargets();
  let locked = false;
  let showCompleteButton = false;
  let suggestedSelectedBar = null;

  if (step.id === TUTORIAL_STEP_IDS.UI_TRACK_AREA) {
    locked = true;
    const clipRole = progress.trackAreaClipOpened ? 'completed' : 'target';
    targets.timelineBars = [{ bar: step.completion.bar, role: clipRole }];
    if (progress.trackAreaClipOpened) {
      targets.playhead = { role: progress.trackAreaPlayheadDragged ? 'completed' : 'target' };
    }
  } else if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_1) {
    locked = true;
    const targetBar = TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_1];
    const isComplete = count >= TASK_TOTALS[TUTORIAL_STEP_IDS.DRUMS_TASK_1];
    targets.timelineBars = [{ bar: targetBar, role: isComplete ? 'completed' : 'target' }];
    targets.drumCells = [{
      bar: targetBar,
      instrument: 'kick',
      role: isComplete ? 'completed' : 'target',
      steps: [...DRUMS_TASK_1_TARGET_STEPS],
    }];
    if (
      Number.isInteger(targetBar)
      && count < TASK_TOTALS[TUTORIAL_STEP_IDS.DRUMS_TASK_1]
      && selectedBar !== targetBar
    ) {
      suggestedSelectedBar = targetBar;
    }
  } else if (step.completion?.type === 'open-clip') {
    locked = true;
    targets.timelineBars = [{ bar: step.completion.bar, role: 'target' }];
  } else if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_2) {
    locked = true;
    const availableBars = getTask2AvailableBars();
    targets.timelineBars = availableBars.map((bar) => ({ bar, role: 'target' }));
    if (availableBars.length && !availableBars.includes(selectedBar)) {
      suggestedSelectedBar = availableBars[0];
    }
    if (availableBars.includes(selectedBar)) {
      targets.drumCells = [
        {
          bar: selectedBar,
          instrument: 'kick',
          role: 'source',
          steps: [DRUMS_TASK_2_SOURCE_STEP],
        },
        {
          bar: selectedBar,
          instrument: 'kick',
          role: 'target',
          steps: [DRUMS_TASK_2_TARGET_STEP],
        },
      ];
    }
  } else if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_3) {
    locked = true;
    const targetBar = getTask3TargetBar();
    targets.timelineBars = Number.isInteger(targetBar) ? [{ bar: targetBar, role: 'target' }] : [];
    if (Number.isInteger(targetBar) && selectedBar !== targetBar) {
      suggestedSelectedBar = targetBar;
    }
    if (selectedBar === targetBar) {
      targets.drumCells = [{
        bar: targetBar,
        instrument: 'kick',
        role: 'target',
        steps: [...DRUMS_TASK_3_TARGET_STEPS],
      }];
    }
  } else if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_4) {
    locked = true;
    showCompleteButton = true;
    targets.timelineBars = DRUMS_TUTORIAL_FREE_BARS.map((bar) => ({
      bar,
      role: hasDrumsInstrumentInBar(matrix, bar, 'kick') ? 'completed' : 'target',
    }));
    if (!DRUMS_TUTORIAL_FREE_BARS.includes(selectedBar)) {
      suggestedSelectedBar = DRUMS_TUTORIAL_FREE_BARS[0];
    }
    if (DRUMS_TUTORIAL_FREE_BARS.includes(selectedBar)) {
      targets.drumCells = [{
        bar: selectedBar,
        instrument: 'kick',
        role: 'target',
        steps: Array.from({ length: 16 }, (_, stepIndex) => stepIndex),
      }];
    }
  }

  return {
    canManualNext: !locked,
    displayCopy: withProgressCount(step.copy, count, total),
    locked,
    showCompleteButton,
    suggestedSelectedBar,
    targets,
  };
}

function isTutorialStepComplete(step, progress = createTutorialState()) {
  const total = TASK_TOTALS[step?.id];
  if (!total) return false;
  return getProgressCount(step, progress) >= total;
}

function createRejectedAction(progress) {
  return {
    allowed: false,
    nextProgress: progress,
    shouldAdvance: false,
  };
}

function handleTask1Toggle({ instrument, matrix, progress, selectedBar, stepIndex }) {
  const targetBar = TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_1];
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (selectedBar !== targetBar) return createRejectedAction(progress);
  if (!DRUMS_TASK_1_TARGET_STEPS.includes(stepIndex)) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, stepIndex, 'kick')) return createRejectedAction(progress);

  const editedSteps = getTask1EditedSteps(progress);
  if (editedSteps.includes(stepIndex)) return createRejectedAction(progress);

  const nextEditedSteps = uniqueSortedBars([...editedSteps, stepIndex]);
  const nextProgress = {
    ...progress,
    task1Count: Math.min(nextEditedSteps.length, TASK_TOTALS[TUTORIAL_STEP_IDS.DRUMS_TASK_1]),
    task1EditedBars: [targetBar],
    task1EditedSteps: nextEditedSteps,
  };

  return {
    allowed: true,
    nextProgress,
    shouldAdvance: isTutorialStepComplete({ id: TUTORIAL_STEP_IDS.DRUMS_TASK_1 }, nextProgress),
  };
}

function handleTask3Toggle({ instrument, matrix, progress, selectedBar, stepIndex }) {
  const targetBar = getTask3TargetBar();
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (selectedBar !== targetBar) return createRejectedAction(progress);
  if (!DRUMS_TASK_3_TARGET_STEPS.includes(stepIndex)) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, stepIndex, 'kick')) return createRejectedAction(progress);

  const nextProgress = {
    ...progress,
    task3Count: 1,
    task3EditedBar: selectedBar,
    task3EditedStep: stepIndex,
  };

  return {
    allowed: true,
    nextProgress,
    shouldAdvance: true,
  };
}

function handleTask4Toggle({ instrument, progress, selectedBar }) {
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (!DRUMS_TUTORIAL_FREE_BARS.includes(selectedBar)) return createRejectedAction(progress);

  return {
    allowed: true,
    nextProgress: progress,
    shouldAdvance: false,
  };
}

function handleTutorialClipOpen({
  bar,
  progress = createTutorialState(),
  step,
  trackId,
} = {}) {
  if (step?.id === TUTORIAL_STEP_IDS.UI_TRACK_AREA) {
    const allowed = trackId === step.completion.trackId && bar === step.completion.bar;
    if (!allowed) return createRejectedAction(progress);

    const nextProgress = {
      ...progress,
      trackAreaClipOpened: true,
    };

    return {
      allowed: true,
      nextProgress,
      shouldAdvance: Boolean(nextProgress.trackAreaPlayheadDragged),
    };
  }

  if (step?.completion?.type !== 'open-clip') {
    return {
      allowed: true,
      nextProgress: progress,
      shouldAdvance: false,
    };
  }

  const allowed = trackId === step.completion.trackId && bar === step.completion.bar;
  return {
    allowed,
    nextProgress: progress,
    shouldAdvance: allowed,
  };
}

function handleTutorialPlayheadDrag({
  progress = createTutorialState(),
  step,
} = {}) {
  if (step?.id !== TUTORIAL_STEP_IDS.UI_TRACK_AREA) {
    return {
      allowed: true,
      nextProgress: progress,
      shouldAdvance: false,
    };
  }
  if (!progress.trackAreaClipOpened) return createRejectedAction(progress);

  const nextProgress = {
    ...progress,
    trackAreaPlayheadDragged: true,
  };

  return {
    allowed: true,
    nextProgress,
    shouldAdvance: !progress.trackAreaPlayheadDragged,
  };
}

function handleTutorialDrumToggle({
  instrument,
  matrix,
  progress = createTutorialState(),
  selectedBar,
  step,
  stepIndex,
}) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_1) {
    return handleTask1Toggle({ instrument, matrix, progress, selectedBar, stepIndex });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_2) {
    return createRejectedAction(progress);
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_3) {
    return handleTask3Toggle({ instrument, matrix, progress, selectedBar, stepIndex });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_4) {
    return handleTask4Toggle({ instrument, progress, selectedBar });
  }

  return {
    allowed: true,
    nextProgress: progress,
    shouldAdvance: false,
  };
}

function handleTutorialDrumMove({
  fromStep,
  instrument,
  matrix,
  progress = createTutorialState(),
  selectedBar,
  step,
  toStep,
}) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_4) {
    if (instrument !== 'kick') return createRejectedAction(progress);
    if (!DRUMS_TUTORIAL_FREE_BARS.includes(selectedBar)) return createRejectedAction(progress);

    const movePatch = createDrumsStepMovePatch({
      bar: selectedBar,
      fromStep,
      instrument,
      matrix,
      toStep,
    });
    if (!movePatch.allowed) return createRejectedAction(progress);

    return {
      allowed: true,
      nextMatrixPatch: movePatch.nextMatrixPatch,
      nextProgress: progress,
      shouldAdvance: false,
    };
  }

  if (step?.id !== TUTORIAL_STEP_IDS.DRUMS_TASK_2) return createRejectedAction(progress);
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (!getTask2AvailableBars().includes(selectedBar)) return createRejectedAction(progress);
  if (fromStep !== DRUMS_TASK_2_SOURCE_STEP || toStep !== DRUMS_TASK_2_TARGET_STEP) {
    return createRejectedAction(progress);
  }
  if (!hasInstrument(matrix, selectedBar, fromStep, 'kick')) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, toStep, 'kick')) return createRejectedAction(progress);

  const nextProgress = {
    ...progress,
    task2Count: 1,
    task2EditedBar: selectedBar,
  };
  const movePatch = createDrumsStepMovePatch({
    bar: selectedBar,
    fromStep,
    instrument,
    matrix,
    toStep,
  });
  if (!movePatch.allowed) return createRejectedAction(progress);

  return {
    allowed: true,
    nextMatrixPatch: movePatch.nextMatrixPatch,
    nextProgress,
    shouldAdvance: true,
  };
}

function completeTutorialTask4(progress = createTutorialState()) {
  return {
    ...progress,
    task4Complete: true,
  };
}

function createEmptyReset(progress) {
  return {
    nextMatrixPatch: [],
    nextProgress: progress,
  };
}

function resetTrackAreaForRetry({ progress }) {
  return {
    nextMatrixPatch: [],
    nextProgress: {
      ...progress,
      trackAreaClipOpened: false,
      trackAreaPlayheadDragged: false,
    },
    nextTransportPosition: { bar: 0, step: 0 },
  };
}

function resetTask1ForRetry({ matrix, progress }) {
  const targetBar = TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_1];
  const stepsToReset = getTask1EditedSteps(progress);

  return {
    nextMatrixPatch: createRemoveKickPatches(matrix, targetBar, stepsToReset),
    nextProgress: {
      ...progress,
      task1Count: 0,
      task1EditedBars: [],
      task1EditedSteps: [],
    },
  };
}

function resetTask2ForRetry({ matrix, progress }) {
  const targetBar = progress?.task2EditedBar ?? TASK_GUIDED_BARS[TUTORIAL_STEP_IDS.DRUMS_TASK_2];
  const sourceCell = matrix?.drums?.[targetBar]?.[DRUMS_TASK_2_SOURCE_STEP] ?? null;
  const targetCell = matrix?.drums?.[targetBar]?.[DRUMS_TASK_2_TARGET_STEP] ?? null;

  return {
    nextMatrixPatch: [
      {
        bar: targetBar,
        cell: makeCellWithInstrument(sourceCell, 'kick'),
        step: DRUMS_TASK_2_SOURCE_STEP,
      },
      {
        bar: targetBar,
        cell: makeCellWithoutInstrument(targetCell, 'kick'),
        step: DRUMS_TASK_2_TARGET_STEP,
      },
    ],
    nextProgress: {
      ...progress,
      task2Count: 0,
      task2EditedBar: null,
    },
  };
}

function resetTask3ForRetry({ matrix, progress = createTutorialState() } = {}) {
  const targetBar = getTask3TargetBar();
  const stepsToReset = Number.isInteger(progress?.task3EditedStep)
    ? [progress.task3EditedStep]
    : [...DRUMS_TASK_3_TARGET_STEPS];

  return {
    nextMatrixPatch: createRemoveKickPatches(matrix, targetBar, stepsToReset),
    nextProgress: {
      ...progress,
      task3Count: 0,
      task3EditedBar: null,
      task3EditedStep: null,
    },
  };
}

function resetTask4ForRetry({ matrix, progress }) {
  return {
    nextMatrixPatch: DRUMS_TUTORIAL_FREE_BARS.flatMap((bar) => (
      createRemoveKickPatches(matrix, bar, ALL_DRUM_STEPS)
    )),
    nextProgress: {
      ...progress,
      task4Complete: false,
    },
  };
}

function resetInitialDrumsForRetry({ progress }) {
  return {
    nextMatrixPatch: DRUMS_TUTORIAL_INITIAL_BARS.flatMap((bar) => (
      ALL_DRUM_STEPS.map((step) => ({ bar, cell: null, step }))
    )),
    nextProgress: progress,
  };
}

function resetTutorialStepForRetry({
  matrix,
  progress = createTutorialState(),
  step,
} = {}) {
  if (step?.id === TUTORIAL_STEP_IDS.UI_TRACK_AREA) {
    return resetTrackAreaForRetry({ progress });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_AUTOFILL) {
    return resetInitialDrumsForRetry({ progress });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_1) {
    return resetTask1ForRetry({ matrix, progress });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_2) {
    return resetTask2ForRetry({ matrix, progress });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_3) {
    return resetTask3ForRetry({ matrix, progress });
  }
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_TASK_4) {
    return resetTask4ForRetry({ matrix, progress });
  }

  return createEmptyReset(progress);
}

export {
  completeTutorialTask4,
  createTutorialState,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialPlayheadDrag,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  isTutorialStepComplete,
  resetTask3ForRetry,
  resetTutorialStepForRetry,
};
