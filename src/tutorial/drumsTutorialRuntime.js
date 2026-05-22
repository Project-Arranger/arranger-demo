import {
  createDrumsCell,
  getDrumsCellInstruments,
} from '../domain/drumsCells.js';
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
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: 2,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: 1,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: 1,
});

const TASK_COUNT_FIELDS = Object.freeze({
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: 'task1Count',
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: 'task2Count',
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: 'task3Count',
});

function createTutorialState() {
  return {
    task1Count: 0,
    task1EditedBars: [],
    task2Count: 0,
    task2EditedBar: null,
    task3Count: 0,
    task3EditedBar: null,
    task4Complete: false,
  };
}

function createEmptyTargets() {
  return {
    drumCells: [],
    timelineBars: [],
  };
}

function getProgressCount(step, progress) {
  const field = TASK_COUNT_FIELDS[step?.id];
  return field ? progress?.[field] ?? 0 : 0;
}

function withProgressCount(copy, count, total) {
  if (!total) return copy;
  return copy.replace(/（\d+\/\d+）/, `（${count}/${total}）`);
}

function uniqueSortedBars(bars) {
  return [...new Set(bars)].sort((left, right) => left - right);
}

function getTask1EditedBars(progress) {
  return uniqueSortedBars(progress?.task1EditedBars ?? []);
}

function getTask2AvailableBars(progress) {
  const usedBars = new Set(getTask1EditedBars(progress));
  return DRUMS_TUTORIAL_INITIAL_BARS.filter((bar) => !usedBars.has(bar));
}

function getTask3TargetBar(progress) {
  const usedBars = new Set([
    ...getTask1EditedBars(progress),
    progress?.task2EditedBar,
  ].filter(Number.isInteger));
  return DRUMS_TUTORIAL_INITIAL_BARS.find((bar) => !usedBars.has(bar)) ?? null;
}

function hasInstrument(matrix, bar, step, instrument) {
  return getDrumsCellInstruments(matrix?.drums?.[bar]?.[step]).includes(instrument);
}

function makeCellWithoutInstrument(cell, instrument) {
  const instruments = getDrumsCellInstruments(cell).filter((item) => item !== instrument);
  return createDrumsCell(instruments);
}

function makeCellWithInstrument(cell, instrument) {
  return createDrumsCell([...getDrumsCellInstruments(cell), instrument]);
}

function getTutorialViewModel({
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

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_1) {
    locked = true;
    const editedBars = new Set(getTask1EditedBars(progress));
    const nextTargetBar = DRUMS_TUTORIAL_INITIAL_BARS.find((bar) => !editedBars.has(bar));
    targets.timelineBars = DRUMS_TUTORIAL_INITIAL_BARS.map((bar) => ({
      bar,
      role: editedBars.has(bar) ? 'completed' : 'target',
    }));
    targets.drumCells = DRUMS_TUTORIAL_INITIAL_BARS.map((bar) => ({
      bar,
      instrument: 'kick',
      role: editedBars.has(bar) ? 'completed' : 'target',
      steps: [...DRUMS_TASK_1_TARGET_STEPS],
    }));
    if (
      Number.isInteger(nextTargetBar)
      && count < TASK_TOTALS[TUTORIAL_STEP_IDS.DRUMS_TASK_1]
      && (editedBars.has(selectedBar) || !DRUMS_TUTORIAL_INITIAL_BARS.includes(selectedBar))
    ) {
      suggestedSelectedBar = nextTargetBar;
    }
  } else if (step.id === TUTORIAL_STEP_IDS.DRUMS_TASK_2) {
    locked = true;
    const availableBars = getTask2AvailableBars(progress);
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
    const targetBar = getTask3TargetBar(progress);
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
    targets.timelineBars = DRUMS_TUTORIAL_FREE_BARS.map((bar) => ({ bar, role: 'target' }));
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
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (!DRUMS_TUTORIAL_INITIAL_BARS.includes(selectedBar)) return createRejectedAction(progress);
  if (!DRUMS_TASK_1_TARGET_STEPS.includes(stepIndex)) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, stepIndex, 'kick')) return createRejectedAction(progress);

  const editedBars = getTask1EditedBars(progress);
  if (editedBars.includes(selectedBar)) return createRejectedAction(progress);

  const nextEditedBars = uniqueSortedBars([...editedBars, selectedBar]);
  const nextProgress = {
    ...progress,
    task1Count: Math.min(nextEditedBars.length, TASK_TOTALS[TUTORIAL_STEP_IDS.DRUMS_TASK_1]),
    task1EditedBars: nextEditedBars,
  };

  return {
    allowed: true,
    nextProgress,
    shouldAdvance: isTutorialStepComplete({ id: TUTORIAL_STEP_IDS.DRUMS_TASK_1 }, nextProgress),
  };
}

function handleTask3Toggle({ instrument, matrix, progress, selectedBar, stepIndex }) {
  const targetBar = getTask3TargetBar(progress);
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (selectedBar !== targetBar) return createRejectedAction(progress);
  if (!DRUMS_TASK_3_TARGET_STEPS.includes(stepIndex)) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, stepIndex, 'kick')) return createRejectedAction(progress);

  const nextProgress = {
    ...progress,
    task3Count: 1,
    task3EditedBar: selectedBar,
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
  if (step?.id !== TUTORIAL_STEP_IDS.DRUMS_TASK_2) return createRejectedAction(progress);
  if (instrument !== 'kick') return createRejectedAction(progress);
  if (!getTask2AvailableBars(progress).includes(selectedBar)) return createRejectedAction(progress);
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
  const sourceCell = matrix?.drums?.[selectedBar]?.[fromStep] ?? null;
  const targetCell = matrix?.drums?.[selectedBar]?.[toStep] ?? null;

  return {
    allowed: true,
    nextMatrixPatch: [
      { bar: selectedBar, cell: makeCellWithoutInstrument(sourceCell, 'kick'), step: fromStep },
      { bar: selectedBar, cell: makeCellWithInstrument(targetCell, 'kick'), step: toStep },
    ],
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

export {
  completeTutorialTask4,
  createTutorialState,
  getTutorialViewModel,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  isTutorialStepComplete,
};
