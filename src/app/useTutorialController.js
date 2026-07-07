import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useMusicStore from '../store/useMusicStore.js';
import {
  createTutorialState,
  getTutorialViewModel,
} from '../tutorial/drumsTutorialRuntime.js';
import { DRUMS_TUTORIAL_STEPS } from '../tutorial/drumsTutorialSteps.js';
import { createTutorialCheckpoint } from '../tutorial/tutorialCheckpoints.js';
import {
  TUTORIAL_DIRECTORY_ITEMS,
} from '../tutorial/tutorialStepIds.js';

const TUTORIAL_COUNT_IN_BEATS = Object.freeze([1, 2, 3]);
const TUTORIAL_COUNT_IN_BEAT_MULTIPLIER = 1.5;

function createInitialTutorialCheckpoints() {
  return {
    0: createTutorialCheckpoint({
      appState: useMusicStore.getState(),
      appliedTutorialSetups: new Set(),
      tutorialProgress: createTutorialState(),
    }),
  };
}

function createTutorialDirectoryItems(currentTutorialStepIndex) {
  return TUTORIAL_DIRECTORY_ITEMS.map((item, itemIndex) => {
    const stepIndex = DRUMS_TUTORIAL_STEPS.findIndex((step) => step.id === item.stepId);
    const nextDirectoryStepId = TUTORIAL_DIRECTORY_ITEMS[itemIndex + 1]?.stepId;
    const nextDirectoryStepIndex = nextDirectoryStepId
      ? DRUMS_TUTORIAL_STEPS.findIndex((step) => step.id === nextDirectoryStepId)
      : DRUMS_TUTORIAL_STEPS.length;

    return {
      ...item,
      active: stepIndex <= currentTutorialStepIndex && nextDirectoryStepIndex > currentTutorialStepIndex,
      disabled: false,
      stepIndex,
    };
  });
}

function useTutorialController({
  audioEngine,
  bpm,
  clips,
  dispatchAppCommand,
  matrix,
  selectedBar,
}) {
  const [currentTutorialStepIndex, setCurrentTutorialStepIndex] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState(() => createTutorialState());
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [tutorialModeActive, setTutorialModeActive] = useState(true);
  const [tutorialSidebarCollapsed, setTutorialSidebarCollapsed] = useState(false);
  const [appliedTutorialSetups, setAppliedTutorialSetups] = useState(() => new Set());
  const [tutorialStepCheckpoints, setTutorialStepCheckpoints] = useState(() => createInitialTutorialCheckpoints());
  const [tutorialCountInValue, setTutorialCountInValue] = useState(null);
  const tutorialCountInTimerIdsRef = useRef([]);

  const currentTutorialStep = DRUMS_TUTORIAL_STEPS[currentTutorialStepIndex];
  const tutorialViewModel = useMemo(() => getTutorialViewModel({
    clips,
    matrix,
    progress: tutorialProgress,
    selectedBar,
    step: currentTutorialStep,
  }), [clips, currentTutorialStep, matrix, selectedBar, tutorialProgress]);
  const tutorialActive = tutorialVisible && tutorialModeActive;
  const activeTutorialTarget = tutorialActive ? currentTutorialStep?.target?.name ?? null : null;
  const activeTutorialTargets = tutorialActive ? tutorialViewModel.targets : undefined;
  const activeTutorialLocked = tutorialActive && tutorialViewModel.locked;
  const tutorialDirectoryItems = useMemo(
    () => createTutorialDirectoryItems(currentTutorialStepIndex),
    [currentTutorialStepIndex],
  );

  const clearTutorialCountIn = useCallback(() => {
    tutorialCountInTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
    tutorialCountInTimerIdsRef.current = [];
    setTutorialCountInValue(null);
  }, []);

  const startTutorialCountInPlayback = useCallback(() => {
    clearTutorialCountIn();

    const secondsPerBeat = (60 / bpm) * TUTORIAL_COUNT_IN_BEAT_MULTIPLIER;
    const nextTimerIds = [];

    TUTORIAL_COUNT_IN_BEATS.forEach((beat, beatIndex) => {
      const timerId = window.setTimeout(() => {
        setTutorialCountInValue(beat);
        void audioEngine.triggerDrumsStep('hihat');
      }, Math.round(secondsPerBeat * beatIndex * 1000));
      nextTimerIds.push(timerId);
    });

    const playbackTimerId = window.setTimeout(() => {
      clearTutorialCountIn();
      void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
    }, Math.round(secondsPerBeat * TUTORIAL_COUNT_IN_BEATS.length * 1000));
    nextTimerIds.push(playbackTimerId);
    tutorialCountInTimerIdsRef.current = nextTimerIds;
  }, [audioEngine, bpm, clearTutorialCountIn, dispatchAppCommand]);

  return {
    activeTutorialLocked,
    activeTutorialTarget,
    activeTutorialTargets,
    appliedTutorialSetups,
    clearTutorialCountIn,
    currentTutorialStep,
    currentTutorialStepIndex,
    setAppliedTutorialSetups,
    setCurrentTutorialStepIndex,
    setTutorialModeActive,
    setTutorialProgress,
    setTutorialSidebarCollapsed,
    setTutorialStepCheckpoints,
    setTutorialVisible,
    startTutorialCountInPlayback,
    tutorialActive,
    tutorialCountInValue,
    tutorialDirectoryItems,
    tutorialModeActive,
    tutorialProgress,
    tutorialSidebarCollapsed,
    tutorialStepCheckpoints,
    tutorialViewModel,
    tutorialVisible,
  };
}

export {
  TUTORIAL_COUNT_IN_BEAT_MULTIPLIER,
  TUTORIAL_COUNT_IN_BEATS,
  useTutorialController,
};
