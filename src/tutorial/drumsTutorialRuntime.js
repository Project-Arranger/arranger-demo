import {
  createDrumsCell,
  getDrumsCellInstruments,
} from '../domain/drumsCells.js';
import { createDrumsStepMovePatch } from '../domain/drumsStepMove.js';
import {
  DRUMS_DRAG_SOURCE_STEP,
  DRUMS_DRAG_TARGET_STEP,
  DRUMS_KICK_BLUE_STEPS,
  DRUMS_KICK_GREEN_STEPS,
  DRUMS_KICK_YELLOW_STEPS,
  DRUMS_TUTORIAL_FIRST_BAR,
  TUTORIAL_CONTROL_TARGETS,
} from './drumsTutorialConstants.js';
import { TUTORIAL_STEP_IDS } from './tutorialStepIds.js';

const STEP_COMPLETION_FIELDS = Object.freeze({
  [TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP]: 'firstDrumsClipOpened',
  [TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR]: 'currentDrumsBarGenerated',
  [TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP]: 'firstClipPlaybackComplete',
  [TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS]: 'drumsTrackClipsFilled',
  [TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS]: 'allDrumsBarsGenerated',
  [TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION]: 'kickVariationComplete',
  [TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK]: 'kickDragComplete',
});

const LOCKED_STEP_IDS = new Set([
  TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP,
  TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR,
  TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP,
  TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS,
  TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS,
]);

const KICK_RECOMMENDATION_GROUPS = Object.freeze([
  Object.freeze({ color: 'blue', steps: DRUMS_KICK_BLUE_STEPS }),
  Object.freeze({ color: 'green', steps: DRUMS_KICK_GREEN_STEPS }),
  Object.freeze({ color: 'yellow', steps: DRUMS_KICK_YELLOW_STEPS }),
]);

function getKickRecommendationColor(step) {
  return KICK_RECOMMENDATION_GROUPS.find((group) => group.steps.includes(step))?.color ?? null;
}

function createTutorialState() {
  return {
    firstDrumsClipOpened: false,
    currentDrumsBarGenerated: false,
    firstClipPlaybackComplete: false,
    drumsTrackClipsFilled: false,
    allDrumsBarsGenerated: false,
    kickVariationEdited: false,
    kickVariationEditedCells: [],
    kickVariationOriginalRemovedCells: [],
    kickVariationComplete: false,
    kickDragMoved: false,
    kickDragComplete: false,
  };
}

function createEmptyTargets() {
  return {
    controls: [],
    drumCells: [],
    playhead: null,
    timelineBars: [],
  };
}

function createRejectedAction(progress) {
  return {
    allowed: false,
    nextProgress: progress,
    shouldAdvance: false,
  };
}

function createAllowedAction(nextProgress, shouldAdvance = false, extra = {}) {
  return {
    allowed: true,
    nextProgress,
    shouldAdvance,
    ...extra,
  };
}

function hasInstrument(matrix, bar, step, instrument) {
  return getDrumsCellInstruments(matrix?.drums?.[bar]?.[step]).includes(instrument);
}

function createCellKey(bar, step) {
  return `${bar}:${step}`;
}

function addDrumCellTarget(targets, { bar, instrument = 'kick', role, step }) {
  const target = targets.find((item) => (
    item.bar === bar
    && item.instrument === instrument
    && item.role === role
  ));

  if (target) {
    target.steps.push(step);
    return;
  }

  targets.push({
    bar,
    instrument,
    role,
    steps: [step],
  });
}

function makeCellWithoutInstrument(cell, instrument) {
  const instruments = getDrumsCellInstruments(cell).filter((item) => item !== instrument);
  return createDrumsCell(instruments);
}

function makeCellWithInstrument(cell, instrument) {
  return createDrumsCell([...getDrumsCellInstruments(cell), instrument]);
}

function isTutorialStepComplete(step, progress = createTutorialState()) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_FREE_CREATE) return false;
  const field = STEP_COMPLETION_FIELDS[step?.id];
  return field ? Boolean(progress?.[field]) : false;
}

function getTutorialControlRole(tutorialTargets, controlName) {
  return tutorialTargets?.controls?.find((target) => target.name === controlName)?.role ?? null;
}

function getPrimaryState(step, progress) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION) {
    return {
      primaryDisabled: !progress.kickVariationEdited,
      primaryLabel: step.primaryLabel,
      showCompleteButton: true,
    };
  }

  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK) {
    return {
      primaryDisabled: !progress.kickDragMoved,
      primaryLabel: step.primaryLabel,
      showCompleteButton: true,
    };
  }

  return {
    primaryDisabled: false,
    primaryLabel: step?.primaryLabel ?? '下一步',
    showCompleteButton: false,
  };
}

function createKickVariationTargets({ matrix, progress, selectedBar }) {
  const targets = [];
  const editedCells = new Set(progress?.kickVariationEditedCells ?? []);
  const originalRemovedCells = new Set(progress?.kickVariationOriginalRemovedCells ?? []);

  for (const group of KICK_RECOMMENDATION_GROUPS) {
    for (const step of group.steps) {
      const cellKey = createCellKey(selectedBar, step);
      const hasKick = hasInstrument(matrix, selectedBar, step, 'kick');
      const edited = editedCells.has(cellKey);
      const originalRemoved = originalRemovedCells.has(cellKey);
      if (hasKick && !edited) continue;
      if (!hasKick && originalRemoved) continue;

      addDrumCellTarget(targets, {
        bar: selectedBar,
        role: `${hasKick ? 'completed' : 'target'}-${group.color}`,
        step,
      });
    }
  }

  return targets;
}

function getTutorialViewModel({
  matrix = null,
  progress = createTutorialState(),
  selectedBar = DRUMS_TUTORIAL_FIRST_BAR,
  step,
} = {}) {
  if (!step) {
    return {
      canManualNext: false,
      displayCopy: '',
      locked: false,
      primaryDisabled: true,
      primaryLabel: '下一步',
      showCompleteButton: false,
      suggestedSelectedBar: null,
      targets: createEmptyTargets(),
    };
  }

  const targets = createEmptyTargets();
  let suggestedSelectedBar = null;

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP) {
    targets.timelineBars = [{
      bar: step.completion.bar,
      role: progress.firstDrumsClipOpened ? 'completed' : 'target',
    }];
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR) {
    targets.controls = [{ name: TUTORIAL_CONTROL_TARGETS.GENERATE_CURRENT_DRUMS_BAR, role: 'target' }];
    if (selectedBar !== DRUMS_TUTORIAL_FIRST_BAR) suggestedSelectedBar = DRUMS_TUTORIAL_FIRST_BAR;
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP) {
    targets.controls = [{ name: TUTORIAL_CONTROL_TARGETS.TRANSPORT_PLAY, role: 'target' }];
    if (selectedBar !== DRUMS_TUTORIAL_FIRST_BAR) suggestedSelectedBar = DRUMS_TUTORIAL_FIRST_BAR;
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS) {
    targets.controls = [{
      name: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:drums`,
      role: 'target',
    }];
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS) {
    targets.controls = [{ name: TUTORIAL_CONTROL_TARGETS.GENERATE_ALL_DRUMS_BARS, role: 'target' }];
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION) {
    targets.drumCells = createKickVariationTargets({ matrix, progress, selectedBar });
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK) {
    targets.drumCells = [
      {
        bar: selectedBar,
        instrument: 'kick',
        role: 'source',
        steps: [DRUMS_DRAG_SOURCE_STEP],
      },
      {
        bar: selectedBar,
        instrument: 'kick',
        role: 'target',
        steps: [DRUMS_DRAG_TARGET_STEP],
      },
    ];
  }

  const primaryState = getPrimaryState(step, progress);
  const locked = LOCKED_STEP_IDS.has(step.id);

  return {
    canManualNext: !locked && !primaryState.showCompleteButton,
    displayCopy: step.copy,
    locked,
    ...primaryState,
    suggestedSelectedBar,
    targets,
  };
}

function handleTutorialClipOpen({
  bar,
  progress = createTutorialState(),
  step,
  trackId,
} = {}) {
  if (step?.completion?.type !== 'open-clip') {
    return createAllowedAction(progress);
  }

  const allowed = trackId === step.completion.trackId && bar === step.completion.bar;
  if (!allowed) return createRejectedAction(progress);

  return createAllowedAction({
    ...progress,
    firstDrumsClipOpened: true,
  }, true);
}

function handleTutorialControlAction({
  control,
  progress = createTutorialState(),
  selectedBar = DRUMS_TUTORIAL_FIRST_BAR,
  step,
} = {}) {
  if (!step?.completion?.control) {
    return LOCKED_STEP_IDS.has(step?.id) ? createRejectedAction(progress) : createAllowedAction(progress);
  }

  if (control !== step.completion.control) return createRejectedAction(progress);

  if (
    step.id === TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR
    && selectedBar !== step.completion.bar
  ) {
    return createRejectedAction(progress);
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR) {
    return createAllowedAction({
      ...progress,
      currentDrumsBarGenerated: true,
    }, true);
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS) {
    return createAllowedAction({
      ...progress,
      drumsTrackClipsFilled: true,
    }, true);
  }

  if (step.id === TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS) {
    return createAllowedAction({
      ...progress,
      allDrumsBarsGenerated: true,
    }, true);
  }

  return createAllowedAction(progress);
}

function handleTutorialPlaybackComplete({
  bar,
  progress = createTutorialState(),
  step,
  trackId,
} = {}) {
  if (step?.completion?.type !== 'playback-complete') {
    return createAllowedAction(progress);
  }

  const allowed = trackId === step.completion.trackId && bar === step.completion.bar;
  if (!allowed) return createRejectedAction(progress);

  return createAllowedAction({
    ...progress,
    firstClipPlaybackComplete: true,
  }, true);
}

function handleTutorialDrumToggle({
  instrument,
  matrix,
  progress = createTutorialState(),
  selectedBar,
  step,
  stepIndex,
}) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION && instrument === 'kick') {
    const cellKey = createCellKey(selectedBar, stepIndex);
    const editedCellSet = new Set(progress.kickVariationEditedCells ?? []);
    const originalRemovedCellSet = new Set(progress.kickVariationOriginalRemovedCells ?? []);
    const nextHasKick = !hasInstrument(matrix, selectedBar, stepIndex, 'kick');
    const recommendationColor = getKickRecommendationColor(stepIndex);

    if (nextHasKick) {
      if (originalRemovedCellSet.has(cellKey)) {
        originalRemovedCellSet.delete(cellKey);
      } else if (recommendationColor) {
        editedCellSet.add(cellKey);
      }
    } else {
      if (editedCellSet.has(cellKey)) {
        editedCellSet.delete(cellKey);
      } else if (recommendationColor) {
        originalRemovedCellSet.add(cellKey);
      }
    }

    const editedCells = [...editedCellSet];
    const originalRemovedCells = [...originalRemovedCellSet];

    return createAllowedAction({
      ...progress,
      kickVariationEdited: editedCells.length > 0,
      kickVariationEditedCells: editedCells,
      kickVariationOriginalRemovedCells: originalRemovedCells,
    });
  }

  return createAllowedAction(progress);
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
  if (step?.id !== TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK) {
    const movePatch = createDrumsStepMovePatch({
      bar: selectedBar,
      fromStep,
      instrument,
      matrix,
      toStep,
    });
    if (!movePatch.allowed) return createRejectedAction(progress);
    return createAllowedAction(progress, false, { nextMatrixPatch: movePatch.nextMatrixPatch });
  }

  if (instrument !== 'kick') return createRejectedAction(progress);
  if (fromStep !== DRUMS_DRAG_SOURCE_STEP || toStep !== DRUMS_DRAG_TARGET_STEP) {
    return createRejectedAction(progress);
  }
  if (!hasInstrument(matrix, selectedBar, fromStep, 'kick')) return createRejectedAction(progress);
  if (hasInstrument(matrix, selectedBar, toStep, 'kick')) return createRejectedAction(progress);

  const movePatch = createDrumsStepMovePatch({
    bar: selectedBar,
    fromStep,
    instrument,
    matrix,
    toStep,
  });
  if (!movePatch.allowed) return createRejectedAction(progress);

  return createAllowedAction({
    ...progress,
    kickDragMoved: true,
  }, false, { nextMatrixPatch: movePatch.nextMatrixPatch });
}

function completeTutorialPrimaryAction({
  progress = createTutorialState(),
  step,
} = {}) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION) {
    if (!progress.kickVariationEdited) return createRejectedAction(progress);
    return createAllowedAction({
      ...progress,
      kickVariationComplete: true,
    }, true);
  }

  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK) {
    if (!progress.kickDragMoved) return createRejectedAction(progress);
    return createAllowedAction({
      ...progress,
      kickDragComplete: true,
    }, true);
  }

  return createAllowedAction(progress, true);
}

function resetTutorialStepForRetry({
  matrix,
  progress = createTutorialState(),
  step,
} = {}) {
  if (step?.id === TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK) {
    const targetBar = DRUMS_TUTORIAL_FIRST_BAR;
    const sourceCell = matrix?.drums?.[targetBar]?.[DRUMS_DRAG_SOURCE_STEP] ?? null;
    const targetCell = matrix?.drums?.[targetBar]?.[DRUMS_DRAG_TARGET_STEP] ?? null;
    return {
      nextMatrixPatch: [
        {
          bar: targetBar,
          cell: makeCellWithInstrument(sourceCell, 'kick'),
          step: DRUMS_DRAG_SOURCE_STEP,
        },
        {
          bar: targetBar,
          cell: makeCellWithoutInstrument(targetCell, 'kick'),
          step: DRUMS_DRAG_TARGET_STEP,
        },
      ],
      nextProgress: {
        ...progress,
        kickDragMoved: false,
        kickDragComplete: false,
      },
    };
  }

  return {
    nextMatrixPatch: [],
    nextProgress: progress,
  };
}

export {
  completeTutorialPrimaryAction,
  createTutorialState,
  getTutorialControlRole,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialControlAction,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  handleTutorialPlaybackComplete,
  isTutorialStepComplete,
  resetTutorialStepForRetry,
};
