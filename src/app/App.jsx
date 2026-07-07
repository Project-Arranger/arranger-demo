import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import audioEngine from '../audio/audioEngineSingleton.js';
import { createChordNotes } from '../audio/matrixPlaybackAdapter.js';
import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useKeyboardCommands from '../input/useKeyboardCommands.js';
import useMusicStore from '../store/useMusicStore.js';
import {
  DRUMS_DRAG_SOURCE_STEP,
  DRUMS_DRAG_TARGET_STEP,
  DRUMS_TUTORIAL_FIRST_BAR,
  TUTORIAL_CONTROL_TARGETS,
} from '../tutorial/drumsTutorialConstants.js';
import {
  completeTutorialPrimaryAction,
  createTutorialState,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialControlAction,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  handleTutorialPlaybackComplete,
  handleTutorialPlaybackPosition,
} from '../tutorial/drumsTutorialRuntime.js';
import { DRUMS_TUTORIAL_STEPS } from '../tutorial/drumsTutorialSteps.js';
import {
  createTutorialCheckpoint,
  pruneTutorialCheckpoints,
  restoreTutorialCheckpoint,
} from '../tutorial/tutorialCheckpoints.js';
import { createTutorialDirectoryCheckpoint } from '../tutorial/tutorialDirectoryCheckpoints.js';
import {
  TUTORIAL_DIRECTORY_ITEMS,
  TUTORIAL_STEP_IDS,
} from '../tutorial/tutorialStepIds.js';
import { createUiAudioDispatcher } from './audioUiBridge.js';
import {
  applyBassGrooveTemplateToExistingClips,
  clearBassBar,
  createBassPreviewEvents,
  toggleBassCell,
} from './bassActions.js';
import {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordCell,
  hasExistingChordClipContent,
  setChordCell,
  setChordEnrichTarget,
  setChordStepChord,
  toggleChordNoteStep,
} from './chordActions.js';
import {
  applyChordGrooveTemplateToExistingClips,
  createChordGroovePreviewEvents,
  getSourceChordLabel,
} from './chordGrooveActions.js';
import {
  clearMelodyBar,
  toggleMelodyCell,
} from './melodyActions.js';
import { BottomEditor } from './components/BottomEditor.jsx';
import { Timeline } from './components/Timeline.jsx';
import { TopBar } from './components/TopBar.jsx';
import { TracksColumn } from './components/TracksColumn.jsx';
import { TutorialOverlay } from './components/TutorialOverlay.jsx';
import { toggleInstrumentInCell } from './drumSequencerData.js';
import {
  getChordSpanStep,
  toggleChordCell,
} from '../domain/chordCells.js';
import { createDrumsCell, getDrumsCellInstruments } from '../domain/drumsCells.js';
import { createDrumsStepMovePatch } from '../domain/drumsStepMove.js';
import {
  applyBasicDrumsAllBars,
  applyBasicDrumsBar,
  clearDrumsBar,
  getDrumsClipBarIndexes,
} from './drumsPatternActions.js';
import {
  canPageTrackClipBars,
  getAdjacentTrackClipBar,
} from './trackBarPaging.js';
import { createTimelineTracks } from './timelineViewModels.js';
import { syncEditorToPlaybackBar } from './playbackEditorSync.js';
import { syncTrackScrollContainers } from './syncTrackScroll.js';
import { syncEditorToTutorialSuggestedBar } from './tutorialEditorSync.js';
import {
  EDITOR_RESIZE_MIN_HEIGHT,
  useEditorResize,
} from './useEditorResize.js';
import { useClipClipboardActions } from './useClipClipboardActions.js';
import {
  createRedoTransition,
  createUndoSnapshot,
  createUndoTransition,
  hasUndoSnapshotChanged,
  pushHistoryCheckpoint,
  restoreUndoSnapshot,
} from './undoHistory.js';
import {
  BAR_NUMBERS,
  getTrackUiByIds,
  OPTIONAL_TRACK_UI,
} from './uiShellData.js';

const TUTORIAL_AUTO_ADVANCE_MS = 450;
const TUTORIAL_COUNT_IN_BEATS = Object.freeze([1, 2, 3]);
const TUTORIAL_COUNT_IN_BEAT_MULTIPLIER = 1.5;

let tutorialAutoAdvanceTimerId = null;
let tutorialCountInTimerIds = [];

function clearTutorialAutoAdvanceTimer() {
  if (tutorialAutoAdvanceTimerId === null) return;

  window.clearTimeout(tutorialAutoAdvanceTimerId);
  tutorialAutoAdvanceTimerId = null;
}

function scheduleTutorialAutoAdvance(callback) {
  clearTutorialAutoAdvanceTimer();
  tutorialAutoAdvanceTimerId = window.setTimeout(() => {
    tutorialAutoAdvanceTimerId = null;
    callback();
  }, TUTORIAL_AUTO_ADVANCE_MS);
}

export default function App() {
  const bpm = useMusicStore((state) => state.bpm);
  const rootKey = useMusicStore((state) => state.rootKey);
  const scale = useMusicStore((state) => state.scale);
  const currentBar = useMusicStore((state) => state.currentBar);
  const currentStep = useMusicStore((state) => state.currentStep);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const matrix = useMusicStore((state) => state.matrix);
  const activeTrackId = useMusicStore((state) => state.activeTrackId);
  const melodyScaleId = useMusicStore((state) => state.melodyScaleId);
  const selectedBar = useMusicStore((state) => state.selectedBar);
  const selectedClipId = useMusicStore((state) => state.selectedClipId);
  const clips = useMusicStore((state) => state.clips);
  const volumes = useMusicStore((state) => state.volumes);
  const visibleTrackIds = useMusicStore((state) => state.visibleTrackIds);
  const melodyEditorIsOpen = activeTrackId === 'melody' && selectedClipId;
  const [currentTutorialStepIndex, setCurrentTutorialStepIndex] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState(() => createTutorialState());
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [tutorialModeActive, setTutorialModeActive] = useState(true);
  const [tutorialSidebarCollapsed, setTutorialSidebarCollapsed] = useState(false);
  const [appliedTutorialSetups, setAppliedTutorialSetups] = useState(() => new Set());
  const [tutorialStepCheckpoints, setTutorialStepCheckpoints] = useState(() => ({
    0: createTutorialCheckpoint({
      appState: useMusicStore.getState(),
      appliedTutorialSetups: new Set(),
      tutorialProgress: createTutorialState(),
    }),
  }));
  const [undoHistory, setUndoHistory] = useState(() => []);
  const [redoHistory, setRedoHistory] = useState(() => []);
  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
  const [tutorialCountInValue, setTutorialCountInValue] = useState(null);
  const tracksScrollRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const volumeUndoSnapshotRef = useRef(null);
  const {
    currentEditorResizeValue,
    editorHeightPx,
    editorResizeMaxHeight,
    handleEditorResizeKeyDown,
    handleEditorResizePointerDown,
    isEditorResizing,
  } = useEditorResize({ activeTrackId, selectedClipId });
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
  const tutorialDirectoryItems = useMemo(() => (
    TUTORIAL_DIRECTORY_ITEMS.map((item, itemIndex) => {
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
    })
  ), [currentTutorialStepIndex]);
  const shouldConfirmChordTemplateApply = useMemo(() => (
    hasExistingChordClipContent(matrix, clips)
  ), [clips, matrix]);

  const dispatchAppCommand = useMemo(
    () => createUiAudioDispatcher({ store: useMusicStore, audio: audioEngine }),
    [],
  );

  const clearTutorialCountIn = useCallback(() => {
    tutorialCountInTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    tutorialCountInTimerIds = [];
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
    tutorialCountInTimerIds = nextTimerIds;
  }, [bpm, clearTutorialCountIn, dispatchAppCommand]);

  const createCurrentUndoSnapshot = useCallback(() => createUndoSnapshot({
    appState: useMusicStore.getState(),
    tutorialState: {
      appliedTutorialSetups,
      currentTutorialStepIndex,
      tutorialModeActive,
      tutorialProgress,
      tutorialSidebarCollapsed,
      tutorialStepCheckpoints,
      tutorialVisible,
    },
  }), [
    appliedTutorialSetups,
    currentTutorialStepIndex,
    tutorialModeActive,
    tutorialProgress,
    tutorialSidebarCollapsed,
    tutorialStepCheckpoints,
    tutorialVisible,
  ]);

  const recordUndoSnapshot = useCallback((snapshot) => {
    setUndoHistory((history) => pushHistoryCheckpoint({ undoHistory: history, snapshot }).undoHistory);
    setRedoHistory(() => []);
  }, []);

  const withUndoCheckpoint = useCallback((action, options = {}) => {
    const beforeSnapshot = createCurrentUndoSnapshot();
    const result = action();
    const shouldRecord = options.force === true
      || hasUndoSnapshotChanged(beforeSnapshot, createCurrentUndoSnapshot());

    if (shouldRecord) recordUndoSnapshot(beforeSnapshot);
    return result;
  }, [createCurrentUndoSnapshot, recordUndoSnapshot]);

  const restoreHistorySnapshot = useCallback((snapshot) => {
    if (!snapshot) return;

    clearTutorialAutoAdvanceTimer();
    clearTutorialCountIn();
    void (async () => {
      await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
      restoreUndoSnapshot({
        setAppliedTutorialSetups,
        setCurrentTutorialStepIndex,
        setTutorialModeActive,
        setTutorialProgress,
        setTutorialSidebarCollapsed,
        setTutorialStepCheckpoints,
        setTutorialVisible,
        snapshot,
        store: useMusicStore,
      });
    })();
  }, [clearTutorialCountIn, dispatchAppCommand]);

  const handleUndo = useCallback(() => {
    const transition = createUndoTransition({
      currentSnapshot: createCurrentUndoSnapshot(),
      redoHistory,
      undoHistory,
    });
    if (!transition.snapshot) return;

    setUndoHistory(transition.undoHistory);
    setRedoHistory(transition.redoHistory);
    restoreHistorySnapshot(transition.snapshot);
  }, [createCurrentUndoSnapshot, redoHistory, restoreHistorySnapshot, undoHistory]);

  const handleRedo = useCallback(() => {
    const transition = createRedoTransition({
      currentSnapshot: createCurrentUndoSnapshot(),
      redoHistory,
      undoHistory,
    });
    if (!transition.snapshot) return;

    setUndoHistory(transition.undoHistory);
    setRedoHistory(transition.redoHistory);
    restoreHistorySnapshot(transition.snapshot);
  }, [createCurrentUndoSnapshot, redoHistory, restoreHistorySnapshot, undoHistory]);

  const resetTutorialTransportToStart = useCallback(async () => {
    clearTutorialCountIn();
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
  }, [clearTutorialCountIn, dispatchAppCommand]);

  const stopTutorialPreviewPlayback = useCallback(() => {
    clearTutorialCountIn();
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [clearTutorialCountIn, dispatchAppCommand]);

  const {
    canCopyClip,
    canPasteClip,
    cancelClipPaste,
    clearClipClipboardState,
    confirmClipPaste,
    handleCopySelectedClip,
    handlePasteClipRequest,
    pendingClipPaste,
    selectedClip,
  } = useClipClipboardActions({
    activeTrackId,
    clips,
    matrix,
    selectedBar,
    selectedClipId,
    withUndoCheckpoint,
  });

  useEffect(() => {
    if (!melodyEditorIsOpen) return;
    void audioEngine.startAudio();
  }, [melodyEditorIsOpen]);

  useEffect(() => () => {
    clearTutorialAutoAdvanceTimer();
    clearTutorialCountIn();
  }, [clearTutorialCountIn]);

  useEffect(() => {
    audioEngine.setVolumeSource?.(() => useMusicStore.getState().volumes);

    return () => {
      audioEngine.setVolumeSource?.(null);
    };
  }, []);

  useEffect(() => (
    syncTrackScrollContainers(tracksScrollRef.current, timelineScrollRef.current)
  ), []);

  useEffect(() => {
    syncEditorToPlaybackBar(useMusicStore.getState(), currentBar);
  }, [activeTrackId, currentBar, isPlaying, selectedBar]);

  const handleBackToStart = useCallback(() => {
    clearTutorialCountIn();
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
  }, [clearTutorialCountIn, dispatchAppCommand]);

  const handleStop = useCallback(() => {
    clearTutorialCountIn();
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [clearTutorialCountIn, dispatchAppCommand]);

  const handleNewSong = useCallback(() => {
    withUndoCheckpoint(() => {
      const initialAppState = useMusicStore.getInitialState();
      const initialTutorialProgress = createTutorialState();

      clearTutorialAutoAdvanceTimer();
      stopTutorialPreviewPlayback();
      clearClipClipboardState();
      useMusicStore.setState(initialAppState, true);
      setCurrentTutorialStepIndex(0);
      setTutorialProgress(initialTutorialProgress);
      setAppliedTutorialSetups(() => new Set());
      setTutorialStepCheckpoints(() => ({
        0: createTutorialCheckpoint({
          appState: initialAppState,
          appliedTutorialSetups: new Set(),
          tutorialProgress: initialTutorialProgress,
        }),
      }));
      setTutorialModeActive(false);
      setTutorialSidebarCollapsed(true);
      setTutorialVisible(true);
    }, { force: true });
  }, [clearClipClipboardState, stopTutorialPreviewPlayback, withUndoCheckpoint]);

  const requestNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(true);
  }, []);

  const cancelNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
  }, []);

  const confirmNewSong = useCallback(() => {
    setIsNewSongConfirmOpen(false);
    handleNewSong();
  }, [handleNewSong]);

  const visibleTrackUi = useMemo(() => getTrackUiByIds(visibleTrackIds), [visibleTrackIds]);
  const availableAddTrackOptions = useMemo(() => (
    OPTIONAL_TRACK_UI.filter((track) => !visibleTrackIds.includes(track.id))
  ), [visibleTrackIds]);
  const tracks = useMemo(() => createTimelineTracks({
    barNumbers: BAR_NUMBERS,
    clips,
    matrix,
    selectedBar,
    trackUi: visibleTrackUi,
    volumes,
  }), [clips, matrix, selectedBar, visibleTrackUi, volumes]);
  const canPageBars = useMemo(() => (
    canPageTrackClipBars(clips, activeTrackId)
    && getAdjacentTrackClipBar(clips, activeTrackId, selectedBar, 'next') !== null
  ), [activeTrackId, clips, selectedBar]);

  const handleTrackSelect = useCallback((trackId, barIndex = selectedBar) => {
    const state = useMusicStore.getState();
    const clip = state.getClipForTrackBar(trackId, barIndex);
    if (clip) {
      state.selectClip(clip.id);
      return;
    }

    const { setActiveTrackId, setSelectedBar, setSelectedClipId } = state;
    setActiveTrackId(trackId);
    setSelectedBar(barIndex);
    setSelectedClipId(null);
  }, [selectedBar]);

  const handleAddClip = useCallback((trackId, barIndex) => {
    const state = useMusicStore.getState();
    if (state.getClipForTrackBar(trackId, barIndex)) {
      state.createClip(trackId, barIndex);
      return;
    }

    withUndoCheckpoint(() => {
      state.createClip(trackId, barIndex);
    });
  }, [withUndoCheckpoint]);

  const applyTutorialStepSetup = useCallback((step, knownAppliedSetups = appliedTutorialSetups) => {
    const setupType = step?.setup?.type;
    if (!setupType || knownAppliedSetups?.has?.(step.id)) return;

    const state = useMusicStore.getState();

    if (setupType === 'prepare-kick-drag') {
      const targetBar = state.selectedBar ?? DRUMS_TUTORIAL_FIRST_BAR;
      const sourceCell = state.matrix.drums[targetBar]?.[DRUMS_DRAG_SOURCE_STEP] ?? null;
      const targetCell = state.matrix.drums[targetBar]?.[DRUMS_DRAG_TARGET_STEP] ?? null;
      state.setCell('drums', targetBar, DRUMS_DRAG_SOURCE_STEP, createDrumsCell([
        ...getDrumsCellInstruments(sourceCell),
        'kick',
      ]));
      state.setCell('drums', targetBar, DRUMS_DRAG_TARGET_STEP, createDrumsCell(
        getDrumsCellInstruments(targetCell).filter((instrument) => instrument !== 'kick'),
      ));
    }

    setAppliedTutorialSetups((setups) => {
      if (setups.has(step.id)) return setups;
      return new Set(setups).add(step.id);
    });
  }, [appliedTutorialSetups]);

  const enterTutorialStepIndex = useCallback((
    requestedStepIndex,
    checkpointProgress = tutorialProgress,
  ) => {
    const nextStepIndex = Math.max(
      0,
      Math.min(requestedStepIndex, DRUMS_TUTORIAL_STEPS.length - 1),
    );
    const nextStep = DRUMS_TUTORIAL_STEPS[nextStepIndex];
    const nextStepCheckpoint = createTutorialCheckpoint({
      appState: useMusicStore.getState(),
      appliedTutorialSetups,
      tutorialProgress: checkpointProgress,
    });

    setTutorialStepCheckpoints((checkpoints) => ({
      ...checkpoints,
      [nextStepIndex]: nextStepCheckpoint,
    }));
    applyTutorialStepSetup(nextStep);
    setCurrentTutorialStepIndex(nextStepIndex);
  }, [appliedTutorialSetups, applyTutorialStepSetup, tutorialProgress]);

  const advanceTutorialToNextStep = useCallback((
    checkpointProgress = tutorialProgress,
    options = {},
  ) => {
    void (async () => {
      await resetTutorialTransportToStart();
      enterTutorialStepIndex(currentTutorialStepIndex + 1, checkpointProgress);
      if (options.startPlaybackAfterAdvance) {
        startTutorialCountInPlayback();
      }
    })();
  }, [
    currentTutorialStepIndex,
    enterTutorialStepIndex,
    resetTutorialTransportToStart,
    startTutorialCountInPlayback,
    tutorialProgress,
  ]);

  const ensureTutorialStepCheckpoint = useCallback((targetStepIndex) => {
    const existingCheckpoint = tutorialStepCheckpoints[targetStepIndex];
    if (existingCheckpoint) return existingCheckpoint;

    const targetStep = DRUMS_TUTORIAL_STEPS[targetStepIndex];
    const targetCheckpoint = createTutorialDirectoryCheckpoint({
      initialState: useMusicStore.getInitialState(),
      stepId: targetStep?.id,
    });
    if (!targetCheckpoint) return null;

    setTutorialStepCheckpoints((checkpoints) => ({
      ...checkpoints,
      [targetStepIndex]: targetCheckpoint,
    }));

    return targetCheckpoint;
  }, [tutorialStepCheckpoints]);

  const applyTutorialActionProgress = useCallback((tutorialAction) => {
    setTutorialProgress(tutorialAction.nextProgress);
    if (tutorialAction.shouldCompleteTutorial) {
      clearTutorialAutoAdvanceTimer();
      clearTutorialCountIn();
      stopTutorialPreviewPlayback();
      resetTutorialTransportToStart();
      setTutorialModeActive(false);
      setTutorialSidebarCollapsed(true);
      return;
    }
    if (tutorialAction.shouldEnd) {
      clearTutorialAutoAdvanceTimer();
      clearTutorialCountIn();
      setTutorialVisible(false);
      return;
    }
    if (tutorialAction.shouldAdvance) {
      scheduleTutorialAutoAdvance(() => advanceTutorialToNextStep(
        tutorialAction.nextProgress,
        { startPlaybackAfterAdvance: tutorialAction.shouldStartPlaybackAfterAdvance },
      ));
    }
  }, [
    advanceTutorialToNextStep,
    clearTutorialCountIn,
    resetTutorialTransportToStart,
    stopTutorialPreviewPlayback,
  ]);

  const handleFillEmptyTrackClips = useCallback((trackId) => {
    let tutorialAction = null;
    if (tutorialActive) {
      tutorialAction = handleTutorialControlAction({
        control: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:${trackId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const hasEmptyClipSlot = BAR_NUMBERS.some((_, barIndex) => (
      !state.getClipForTrackBar(trackId, barIndex)
    ));
    if (!hasEmptyClipSlot && !tutorialAction) {
      state.createEmptyClipsForTrack(trackId);
      return;
    }

    withUndoCheckpoint(() => {
      state.createEmptyClipsForTrack(trackId);
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleAddTrack = useCallback((trackId) => {
    withUndoCheckpoint(() => {
      useMusicStore.getState().addVisibleTrack(trackId);
    });
  }, [withUndoCheckpoint]);

  const handleTrackVolumeChange = useCallback((trackId, volume) => {
    useMusicStore.getState().setTrackVolume(trackId, volume);
  }, []);

  const handleTrackVolumeChangeStart = useCallback(() => {
    if (volumeUndoSnapshotRef.current) return;
    volumeUndoSnapshotRef.current = createCurrentUndoSnapshot();
  }, [createCurrentUndoSnapshot]);

  const handleTrackVolumeChangeEnd = useCallback(() => {
    const beforeSnapshot = volumeUndoSnapshotRef.current;
    volumeUndoSnapshotRef.current = null;
    if (!beforeSnapshot) return;
    if (hasUndoSnapshotChanged(beforeSnapshot, createCurrentUndoSnapshot())) {
      recordUndoSnapshot(beforeSnapshot);
    }
  }, [createCurrentUndoSnapshot, recordUndoSnapshot]);

  const handleMoveClip = useCallback((clipId, targetBar) => {
    const state = useMusicStore.getState();
    const sourceClip = state.clips.byId[clipId];
    if (!sourceClip || sourceClip.bar === targetBar) {
      state.moveClipToBar(clipId, targetBar);
      return;
    }

    withUndoCheckpoint(() => {
      state.moveClipToBar(clipId, targetBar);
    });
  }, [withUndoCheckpoint]);

  const handleOpenClip = useCallback((clipId) => {
    useMusicStore.getState().selectClip(clipId);
  }, []);

  const handleCloseEditor = useCallback(() => {
    useMusicStore.getState().setSelectedClipId(null);
  }, []);

  const handleRenameClip = useCallback((name) => {
    if (!selectedClipId) return;
    const state = useMusicStore.getState();
    const clip = state.clips.byId[selectedClipId];
    if (!clip || clip.name === name) return;

    withUndoCheckpoint(() => {
      state.renameClip(selectedClipId, name);
    });
  }, [selectedClipId, withUndoCheckpoint]);

  const writeDrumsBars = useCallback((nextMatrix, barIndexes) => {
    const state = useMusicStore.getState();
    for (const barIndex of barIndexes) {
      nextMatrix.drums[barIndex].forEach((cell, step) => {
        state.setCell('drums', barIndex, step, cell);
      });
    }
  }, []);

  const handleGenerateCurrentDrumsBar = useCallback(() => {
    let tutorialAction = null;
    if (tutorialActive) {
      tutorialAction = handleTutorialControlAction({
        control: TUTORIAL_CONTROL_TARGETS.GENERATE_CURRENT_DRUMS_BAR,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = applyBasicDrumsBar(state.matrix, selectedBar);
      writeDrumsBars(nextMatrix, [selectedBar]);
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
    writeDrumsBars,
  ]);

  const handleGenerateAllDrumsBars = useCallback(() => {
    let tutorialAction = null;
    if (tutorialActive) {
      tutorialAction = handleTutorialControlAction({
        control: TUTORIAL_CONTROL_TARGETS.GENERATE_ALL_DRUMS_BARS,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const drumsClipBars = getDrumsClipBarIndexes(state.clips);
      const nextMatrix = applyBasicDrumsAllBars(state.matrix, drumsClipBars);
      writeDrumsBars(nextMatrix, BAR_NUMBERS.map((_, barIndex) => barIndex));
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
    writeDrumsBars,
  ]);

  const handleClearCurrentDrumsBar = useCallback(() => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearDrumsBar(state.matrix, selectedBar);
      writeDrumsBars(nextMatrix, [selectedBar]);
    });
  }, [selectedBar, withUndoCheckpoint, writeDrumsBars]);

  const handleClearDrums = useCallback(() => {
    withUndoCheckpoint(() => {
      useMusicStore.getState().clearTrack('drums');
    });
  }, [withUndoCheckpoint]);

  const handlePageTrackBar = useCallback((direction) => {
    const state = useMusicStore.getState();
    const nextBar = getAdjacentTrackClipBar(
      state.clips,
      state.activeTrackId,
      state.selectedBar,
      direction,
    );
    if (nextBar === null) return;

    const clip = state.getClipForTrackBar(state.activeTrackId, nextBar);
    if (clip) state.selectClip(clip.id);
  }, []);

  const handlePreviousBar = useCallback(() => {
    handlePageTrackBar('previous');
  }, [handlePageTrackBar]);

  const handleNextBar = useCallback(() => {
    handlePageTrackBar('next');
  }, [handlePageTrackBar]);

  const handleTransportSeek = useCallback((bar, step) => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar, step });
  }, [dispatchAppCommand]);

  const handlePlayToggle = useCallback(() => {
    if (tutorialActive) {
      const tutorialAction = handleTutorialControlAction({
        control: TUTORIAL_CONTROL_TARGETS.TRANSPORT_PLAY,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
      if (tutorialAction.nextProgress !== tutorialProgress) {
        applyTutorialActionProgress(tutorialAction);
      }
    }

    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialActive,
    tutorialProgress,
  ]);

  const dispatchKeyboardCommand = useCallback((command) => {
    if (command?.type === APP_COMMAND_TYPES.APP_UNDO) {
      handleUndo();
      return;
    }

    if (command?.type === APP_COMMAND_TYPES.APP_REDO) {
      handleRedo();
      return;
    }

    if (command?.type === APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY) {
      handlePlayToggle();
      return;
    }

    if (command?.type === APP_COMMAND_TYPES.CLIP_COPY_SELECTED) {
      handleCopySelectedClip();
      return;
    }

    if (command?.type === APP_COMMAND_TYPES.CLIP_PASTE) {
      handlePasteClipRequest();
      return;
    }

    if (command?.type === APP_COMMAND_TYPES.CLIP_DELETE_SELECTED) {
      withUndoCheckpoint(() => {
        useMusicStore.getState().deleteSelectedClip();
      });
      return;
    }

    void dispatchAppCommand(command);
  }, [
    dispatchAppCommand,
    handleCopySelectedClip,
    handlePasteClipRequest,
    handlePlayToggle,
    handleRedo,
    handleUndo,
    withUndoCheckpoint,
  ]);

  useKeyboardCommands({ dispatch: dispatchKeyboardCommand });

  useEffect(() => {
    audioEngine.onPositionChange = (bar, step) => {
      useMusicStore.getState().setTransportPosition(bar, step);

      if (
        tutorialActive
        && currentTutorialStep?.id === TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP
        && bar > DRUMS_TUTORIAL_FIRST_BAR
        && step === 0
      ) {
        const tutorialAction = handleTutorialPlaybackComplete({
          bar: DRUMS_TUTORIAL_FIRST_BAR,
          progress: tutorialProgress,
          step: currentTutorialStep,
          trackId: 'drums',
        });
        if (tutorialAction.allowed) applyTutorialActionProgress(tutorialAction);
      }

      if (
        tutorialActive
        && currentTutorialStep?.completion?.type === 'playback-loop-complete'
      ) {
        setTutorialProgress((progress) => {
          const tutorialAction = handleTutorialPlaybackPosition({
            bar,
            progress,
            step: currentTutorialStep,
            stepIndex: step,
            trackId: currentTutorialStep.completion.trackId,
          });

          if (!tutorialAction.allowed) return progress;
          return tutorialAction.nextProgress;
        });
      }
    };

    return () => {
      audioEngine.onPositionChange = null;
    };
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    tutorialActive,
    tutorialProgress,
  ]);

  useEffect(() => {
    if (!tutorialActive) return;

    const suggestedBar = tutorialViewModel.suggestedSelectedBar;
    syncEditorToTutorialSuggestedBar(useMusicStore.getState(), suggestedBar, { isPlaying });
  }, [isPlaying, selectedBar, tutorialActive, tutorialViewModel.suggestedSelectedBar]);

  useEffect(() => {
    const playback = currentTutorialStep?.playback;
    if (!playback?.autoStart || !playback.bars?.length) return undefined;

    const firstBar = playback.bars[0];
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: firstBar, step: 0 });
    if (!useMusicStore.getState().isPlaying) {
      void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
    }

    const beats = playback.bars.length * 4;
    const stopDelayMs = Math.max(1200, Math.round((60 / bpm) * beats * 1000));
    const playbackTimer = window.setTimeout(() => {
      void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
    }, stopDelayMs);

    return () => {
      window.clearTimeout(playbackTimer);
    };
  }, [bpm, currentTutorialStep, dispatchAppCommand]);

  const handleDrumsStepToggle = useCallback((instrument, step) => {
    const state = useMusicStore.getState();
    const tutorialAction = tutorialActive ? handleTutorialDrumToggle({
      instrument,
      matrix: state.matrix,
      progress: tutorialProgress,
      selectedBar,
      step: currentTutorialStep,
      stepIndex: step,
    }) : { allowed: true, nextProgress: tutorialProgress, shouldAdvance: false };

    if (!tutorialAction.allowed) return;

    withUndoCheckpoint(() => {
      const currentCell = state.matrix.drums[selectedBar]?.[step] ?? null;
      const nextCell = toggleInstrumentInCell(currentCell, instrument);
      state.setCell('drums', selectedBar, step, nextCell);
      void dispatchAppCommand({
        type: APP_COMMAND_TYPES.DRUMS_TOGGLE,
        bar: selectedBar,
        step,
        instrument,
        previewInstruments: getDrumsCellInstruments(nextCell),
      });

      applyTutorialActionProgress(tutorialAction);
    }, { force: tutorialActive });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleDrumsStepMove = useCallback((instrument, fromStep, toStep) => {
    const state = useMusicStore.getState();
    const tutorialAction = tutorialActive
      ? handleTutorialDrumMove({
        fromStep,
        instrument,
        matrix: state.matrix,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
        toStep,
      })
      : null;
    const moveAction = tutorialAction ?? createDrumsStepMovePatch({
      bar: selectedBar,
      fromStep,
      instrument,
      matrix: state.matrix,
      toStep,
    });

    if (!moveAction.allowed) return;

    withUndoCheckpoint(() => {
      moveAction.nextMatrixPatch.forEach((patch) => {
        state.setCell('drums', patch.bar, patch.step, patch.cell);
      });
      const targetPatch = moveAction.nextMatrixPatch.find((patch) => (
        patch.bar === selectedBar && patch.step === toStep
      ));
      void dispatchAppCommand({
        type: APP_COMMAND_TYPES.DRUMS_TOGGLE,
        bar: selectedBar,
        step: toStep,
        instrument,
        previewInstruments: getDrumsCellInstruments(targetPatch?.cell ?? null),
      });

      if (tutorialAction) {
        applyTutorialActionProgress(tutorialAction);
      }
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleChordCellSelect = useCallback((spanIndex, root) => {
    const state = useMusicStore.getState();
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    const currentCell = getChordCell(state.matrix, selectedBar, spanIndex);
    const nextCell = toggleChordCell(currentCell, root);

    if (nextCell) {
      withUndoCheckpoint(() => {
        const nextMatrix = setChordCell(state.matrix, selectedBar, spanIndex, root);
        for (let offset = 0; offset < 2; offset += 1) {
          state.setCell('chord', selectedBar, step + offset, nextMatrix.chord[selectedBar][step + offset]);
        }
        void dispatchAppCommand({
          type: APP_COMMAND_TYPES.CHORD_SET_CELL,
          bar: selectedBar,
          span: spanIndex,
          root,
        });
      });
      return;
    }

    withUndoCheckpoint(() => {
      const nextMatrix = clearChordCell(state.matrix, selectedBar, spanIndex);
      for (let offset = 0; offset < 4; offset += 1) {
        state.setCell('chord', selectedBar, step + offset, nextMatrix.chord[selectedBar][step + offset]);
      }
      void dispatchAppCommand({
        type: APP_COMMAND_TYPES.CHORD_CLEAR_CELL,
        bar: selectedBar,
        span: spanIndex,
      });
    });
  }, [dispatchAppCommand, selectedBar, withUndoCheckpoint]);

  const handleChordPick = useCallback((spanIndex, root) => {
    const state = useMusicStore.getState();
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    const nextMatrix = setChordEnrichTarget(state.matrix, selectedBar, spanIndex, root);
    const changedOffsets = [];
    for (let offset = 0; offset < 4; offset += 1) {
      const nextCell = nextMatrix.chord[selectedBar][step + offset];
      if (nextCell !== state.matrix.chord[selectedBar][step + offset]) {
        changedOffsets.push(offset);
      }
    }
    if (!changedOffsets.length) return;

    const tutorialAction = tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_ENRICH_HARMONY
      ? handleTutorialControlAction({
        control: `chord-enrich-button:${spanIndex}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      })
      : null;
    if (tutorialAction && !tutorialAction.allowed) return;

    withUndoCheckpoint(() => {
      changedOffsets.forEach((offset) => {
        const nextCell = nextMatrix.chord[selectedBar][step + offset];
        state.setCell('chord', selectedBar, step + offset, nextCell);
      });
      void dispatchAppCommand({
        type: APP_COMMAND_TYPES.CHORD_SET_CELL,
        bar: selectedBar,
        span: spanIndex,
        root,
      });
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handlePassingChordPick = useCallback((stepIndex, chordName) => {
    const state = useMusicStore.getState();
    const nextMatrix = setChordStepChord(state.matrix, selectedBar, stepIndex, chordName);
    if (nextMatrix === state.matrix) return;

    const tutorialAction = tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_ADD_PASSING
      ? handleTutorialControlAction({
        control: 'chord-passing-button',
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      })
      : null;
    if (tutorialAction && !tutorialAction.allowed) return;

    withUndoCheckpoint(() => {
      state.setCell('chord', selectedBar, stepIndex, nextMatrix.chord[selectedBar][stepIndex]);
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const previewChordNames = useCallback((chordNames) => {
    const noteGroups = chordNames
      .map((chordName) => createChordNotes(chordName))
      .filter((notes) => notes.length);

    if (!noteGroups.length) return;
    void audioEngine.previewChordSequence(noteGroups);
  }, []);

  const handleChordPreview = useCallback((chordName) => {
    previewChordNames([chordName]);
  }, [previewChordNames]);

  const handlePassingChordPreview = useCallback((chordNames) => {
    previewChordNames(chordNames);
  }, [previewChordNames]);

  const handleChordTemplatePreview = useCallback((chords) => {
    previewChordNames(chords);
  }, [previewChordNames]);

  const handleChordGrooveTemplatePreview = useCallback((templateId) => {
    const state = useMusicStore.getState();
    const sourceChordLabel = getSourceChordLabel(state.matrix, selectedBar);
    const events = createChordGroovePreviewEvents(templateId, sourceChordLabel);
    if (!events.length) return;

    void audioEngine.previewChordPattern(events);
  }, [selectedBar]);

  const handleChordNoteSelect = useCallback((spanIndex, columnIndex, note) => {
    const state = useMusicStore.getState();
    const nextMatrix = toggleChordNoteStep(state.matrix, selectedBar, spanIndex, columnIndex, note);
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    withUndoCheckpoint(() => {
      state.setCell('chord', selectedBar, step + columnIndex, nextMatrix.chord[selectedBar][step + columnIndex]);
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleChordTemplateApply = useCallback((templateId) => {
    let tutorialAction = null;
    if (tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_SELECT_PROGRESSION_TEMPLATE) {
      tutorialAction = handleTutorialControlAction({
        control: `chord-template-card:${templateId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const nextMatrix = applyChordTemplateToExistingClips(state.matrix, state.clips, templateId);

    withUndoCheckpoint(() => {
      state.clips.ids
        .map((id) => state.clips.byId[id])
        .filter((clip) => clip?.trackId === 'chord')
        .forEach((clip) => {
          state.setCell('chord', clip.bar, 0, nextMatrix.chord[clip.bar][0]);
          state.setCell('chord', clip.bar, 1, nextMatrix.chord[clip.bar][1]);
        });
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleChordGrooveTemplateApply = useCallback((templateId) => {
    let tutorialAction = null;
    if (tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_SELECT_GROOVE_TEMPLATE) {
      tutorialAction = handleTutorialControlAction({
        control: `chord-groove-card:${templateId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const nextMatrix = applyChordGrooveTemplateToExistingClips(state.matrix, state.clips, templateId);

    withUndoCheckpoint(() => {
      state.clips.ids
        .map((id) => state.clips.byId[id])
        .filter((clip) => clip?.trackId === 'chord')
        .forEach((clip) => {
          nextMatrix.chord[clip.bar].forEach((cell, step) => {
            state.setCell('chord', clip.bar, step, cell);
          });
        });
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleClearChordBar = useCallback(() => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearChordBar(state.matrix, selectedBar);

      nextMatrix.chord[selectedBar].forEach((cell, step) => {
        state.setCell('chord', selectedBar, step, cell);
      });
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleClearChord = useCallback(() => {
    withUndoCheckpoint(() => {
      useMusicStore.getState().clearTrack('chord');
    });
  }, [withUndoCheckpoint]);

  const handleBassStepToggle = useCallback((step, note) => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = toggleBassCell(state.matrix, selectedBar, step, note);
      state.setCell('bass', selectedBar, step, nextMatrix.bass[selectedBar][step]);
      void audioEngine.triggerBassNote(note, '16n');
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleBassPreview = useCallback((note) => {
    void audioEngine.triggerBassNote(note, '16n');
  }, []);

  const handleBassGrooveTemplatePreview = useCallback((templateId) => {
    const state = useMusicStore.getState();
    const events = createBassPreviewEvents(state.matrix, selectedBar, templateId);
    if (!events.length) return;

    void audioEngine.previewBassPattern(events);
  }, [selectedBar]);

  const handleBassGrooveTemplateApply = useCallback((templateId) => {
    let tutorialAction = null;
    if (tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.BASS_SELECT_GROOVE_TEMPLATE) {
      tutorialAction = handleTutorialControlAction({
        control: `bass-groove-card:${templateId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const nextMatrix = applyBassGrooveTemplateToExistingClips(state.matrix, state.clips, templateId);
    if (nextMatrix === state.matrix) return;

    withUndoCheckpoint(() => {
      state.setTrackMatrix('bass', nextMatrix.bass);
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleClearBassBar = useCallback(() => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearBassBar(state.matrix, selectedBar);

      nextMatrix.bass[selectedBar].forEach((cell, step) => {
        state.setCell('bass', selectedBar, step, cell);
      });
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleClearBass = useCallback(() => {
    withUndoCheckpoint(() => {
      useMusicStore.getState().clearTrack('bass');
    });
  }, [withUndoCheckpoint]);

  const handleMelodyStepToggle = useCallback((step, note) => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = toggleMelodyCell(state.matrix, selectedBar, step, note);
      state.setCell('melody', selectedBar, step, nextMatrix.melody[selectedBar][step]);
      void audioEngine.triggerMelodyNote(note, '16n');
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleMelodyPreview = useCallback((noteOrNotes) => {
    if (Array.isArray(noteOrNotes)) {
      void audioEngine.previewMelodySequence(noteOrNotes);
      return;
    }

    void audioEngine.triggerMelodyNote(noteOrNotes, '16n');
  }, []);

  const handleMelodyScaleChange = useCallback((scaleId) => {
    let tutorialAction = null;
    if (tutorialActive && currentTutorialStep?.id === TUTORIAL_STEP_IDS.MELODY_SELECT_SCALE) {
      tutorialAction = handleTutorialControlAction({
        control: `melody-scale-card:${scaleId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    withUndoCheckpoint(() => {
      useMusicStore.getState().setMelodyScaleId(scaleId);
      if (tutorialAction) applyTutorialActionProgress(tutorialAction);
    }, { force: Boolean(tutorialAction) });
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleClearMelodyBar = useCallback(() => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearMelodyBar(state.matrix, selectedBar);

      nextMatrix.melody[selectedBar].forEach((cell, step) => {
        state.setCell('melody', selectedBar, step, cell);
      });
    });
  }, [selectedBar, withUndoCheckpoint]);

  const handleClearMelody = useCallback(() => {
    withUndoCheckpoint(() => {
      useMusicStore.getState().clearTrack('melody');
    });
  }, [withUndoCheckpoint]);

  const handleTutorialNext = useCallback(() => {
    if (!tutorialViewModel.canManualNext) return;
    withUndoCheckpoint(() => {
      clearTutorialAutoAdvanceTimer();
      clearTutorialCountIn();
      advanceTutorialToNextStep(tutorialProgress);
    }, { force: true });
  }, [
    advanceTutorialToNextStep,
    clearTutorialCountIn,
    tutorialProgress,
    tutorialViewModel.canManualNext,
    withUndoCheckpoint,
  ]);

  const handleTutorialOpenClip = useCallback((clip) => {
    if (!tutorialActive) return true;

    const tutorialAction = handleTutorialClipOpen({
      bar: clip?.bar,
      progress: tutorialProgress,
      step: currentTutorialStep,
      trackId: clip?.trackId,
    });
    if (!tutorialAction.allowed) return false;

    withUndoCheckpoint(() => {
      setTutorialProgress(tutorialAction.nextProgress);

      if (tutorialAction.shouldAdvance) {
        if (clip?.id) useMusicStore.getState().selectClip(clip.id);
        advanceTutorialToNextStep(tutorialAction.nextProgress);
      }
    }, { force: true });

    return true;
  }, [
    advanceTutorialToNextStep,
    currentTutorialStep,
    tutorialActive,
    tutorialProgress,
    withUndoCheckpoint,
  ]);

  const handleTutorialBack = useCallback(() => {
    clearTutorialAutoAdvanceTimer();
    clearTutorialCountIn();
    stopTutorialPreviewPlayback();
    const targetStepIndex = Math.max(currentTutorialStepIndex - 1, 0);
    const targetCheckpoint = ensureTutorialStepCheckpoint(targetStepIndex);
    if (!targetCheckpoint) return;

    restoreTutorialCheckpoint({
      checkpoint: targetCheckpoint,
      setAppliedTutorialSetups,
      setTutorialProgress,
      store: useMusicStore,
    });
    applyTutorialStepSetup(
      DRUMS_TUTORIAL_STEPS[targetStepIndex],
      targetCheckpoint?.appliedTutorialSetups,
    );
    setTutorialStepCheckpoints((checkpoints) => pruneTutorialCheckpoints(
      checkpoints,
      targetStepIndex + 1,
    ));
    setCurrentTutorialStepIndex(targetStepIndex);
  }, [
    applyTutorialStepSetup,
    clearTutorialCountIn,
    currentTutorialStepIndex,
    ensureTutorialStepCheckpoint,
    stopTutorialPreviewPlayback,
  ]);

  const handleTutorialJumpToSection = useCallback((targetStepIndex) => {
    clearTutorialAutoAdvanceTimer();
    clearTutorialCountIn();
    stopTutorialPreviewPlayback();
    const targetCheckpoint = ensureTutorialStepCheckpoint(targetStepIndex);
    if (!targetCheckpoint) return;

    restoreTutorialCheckpoint({
      checkpoint: targetCheckpoint,
      setAppliedTutorialSetups,
      setTutorialProgress,
      store: useMusicStore,
    });
    applyTutorialStepSetup(
      DRUMS_TUTORIAL_STEPS[targetStepIndex],
      targetCheckpoint?.appliedTutorialSetups,
    );
    setCurrentTutorialStepIndex(targetStepIndex);
    setTutorialModeActive(true);
    setTutorialSidebarCollapsed(false);
    setTutorialVisible(true);
  }, [
    applyTutorialStepSetup,
    clearTutorialCountIn,
    ensureTutorialStepCheckpoint,
    stopTutorialPreviewPlayback,
  ]);

  const handleTutorialSkip = useCallback(() => {
    withUndoCheckpoint(() => {
      clearTutorialAutoAdvanceTimer();
      clearTutorialCountIn();
      stopTutorialPreviewPlayback();
      useMusicStore.setState(useMusicStore.getInitialState(), true);
      setCurrentTutorialStepIndex(0);
      setTutorialProgress(createTutorialState());
      setAppliedTutorialSetups(() => new Set());
      setTutorialStepCheckpoints(() => ({
        0: createTutorialCheckpoint({
          appState: useMusicStore.getInitialState(),
          appliedTutorialSetups: new Set(),
          tutorialProgress: createTutorialState(),
        }),
      }));
      setTutorialModeActive(false);
      setTutorialSidebarCollapsed(true);
      setTutorialVisible(true);
    }, { force: true });
  }, [clearTutorialCountIn, stopTutorialPreviewPlayback, withUndoCheckpoint]);

  const handleTutorialSidebarToggle = useCallback(() => {
    setTutorialSidebarCollapsed((collapsed) => {
      if (collapsed) setTutorialModeActive(true);
      return !collapsed;
    });
  }, []);

  const handleTutorialCompleteTask = useCallback(() => {
    const tutorialAction = completeTutorialPrimaryAction({
      progress: tutorialProgress,
      step: currentTutorialStep,
    });
    if (!tutorialAction.allowed) return;
    withUndoCheckpoint(() => {
      applyTutorialActionProgress(tutorialAction);
    }, { force: true });
  }, [applyTutorialActionProgress, currentTutorialStep, tutorialProgress, withUndoCheckpoint]);

  const appClassName = [
    'app',
    tutorialVisible && !tutorialSidebarCollapsed ? 'tutorial-sidebar-open' : '',
    tutorialVisible && tutorialSidebarCollapsed ? 'tutorial-sidebar-collapsed' : '',
    isEditorResizing ? 'editor-resizing' : '',
  ].filter(Boolean).join(' ');
  const workspaceClassName = [
    'workspace',
    tutorialVisible && !tutorialSidebarCollapsed ? 'tutorial-sidebar-open' : '',
    tutorialVisible && tutorialSidebarCollapsed ? 'tutorial-sidebar-collapsed' : '',
  ].filter(Boolean).join(' ');
  const appStyle = editorHeightPx === null ? undefined : {
    '--app-editor-height': `${editorHeightPx}px`,
  };
  const canRedo = redoHistory.length > 0;
  const canUndo = undoHistory.length > 0;

  return (
    <div
      className={appClassName}
      data-screen-label="Main"
      aria-label="Project Arranger workspace"
      style={appStyle}
    >
      <div className="app-main">
        {createElement(TopBar, {
          activeTutorialTarget,
          bpm,
          canCopyClip,
          canPasteClip,
          canRedo,
          canUndo,
          currentBar,
          currentStep,
          isPlaying,
          onBackToStart: handleBackToStart,
          onCopyClip: handleCopySelectedClip,
          onNewSong: requestNewSong,
          onPasteClip: handlePasteClipRequest,
          onPlayToggle: handlePlayToggle,
          onStop: handleStop,
          onTutorialToggle: handleTutorialSidebarToggle,
          onRedo: handleRedo,
          onUndo: handleUndo,
          rootKey,
          scale,
          showTutorialToggle: tutorialVisible,
          tutorialCollapsed: tutorialSidebarCollapsed,
          tutorialTargets: activeTutorialTargets,
        })}
        {isNewSongConfirmOpen ? (
          <div className="new-song-confirm-overlay" role="presentation">
            <section
              className="new-song-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-song-confirm-title"
              aria-describedby="new-song-confirm-copy"
            >
              <span className="new-song-confirm-kicker">NEW MOVEMENT</span>
              <h2 className="new-song-confirm-title" id="new-song-confirm-title">
                创建新的乐章？
              </h2>
              <p className="new-song-confirm-copy" id="new-song-confirm-copy">
                是否放弃当前进度创建新的乐章？当前编曲、教程进度和未保存的编辑都会被重置。
              </p>
              <div className="new-song-confirm-actions">
                <button className="new-song-confirm-cancel" type="button" onClick={cancelNewSong}>
                  取消
                </button>
                <button className="new-song-confirm-apply" type="button" onClick={confirmNewSong}>
                  创建新乐章
                </button>
              </div>
            </section>
          </div>
        ) : null}
        {pendingClipPaste ? (
          <div className="clip-paste-confirm-overlay" role="presentation">
            <section
              className="clip-paste-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="clip-paste-confirm-title"
              aria-describedby="clip-paste-confirm-copy"
            >
              <span className="clip-paste-confirm-kicker">CLIP PASTE</span>
              <h2 className="clip-paste-confirm-title" id="clip-paste-confirm-title">
                确认覆盖这个 clip？
              </h2>
              <p className="clip-paste-confirm-copy" id="clip-paste-confirm-copy">
                目标小节 {pendingClipPaste.targetBar + 1} 已有
                {' '}
                {pendingClipPaste.targetClip?.name ?? 'clip'}
                ，继续粘贴会替换它的内容。
              </p>
              <div className="clip-paste-confirm-actions">
                <button className="clip-paste-confirm-cancel" type="button" onClick={cancelClipPaste}>
                  取消
                </button>
                <button className="clip-paste-confirm-apply" type="button" onClick={confirmClipPaste}>
                  覆盖粘贴
                </button>
              </div>
            </section>
          </div>
        ) : null}
        <main className={workspaceClassName}>
          {createElement(TracksColumn, {
            activeTrackId,
            addTrackOptions: availableAddTrackOptions,
            onAddTrack: handleAddTrack,
            onFillEmptyTrackClips: handleFillEmptyTrackClips,
            onTrackSelect: handleTrackSelect,
            onVolumeChange: handleTrackVolumeChange,
            onVolumeChangeEnd: handleTrackVolumeChangeEnd,
            onVolumeChangeStart: handleTrackVolumeChangeStart,
            ref: tracksScrollRef,
            tutorialLocked: activeTutorialLocked,
            tutorialTargets: activeTutorialTargets,
            tracks,
          })}
          {createElement(Timeline, {
            activeTutorialTarget,
            activeTrackId,
            currentBar,
            currentStep,
            onAddClip: handleAddClip,
            onMoveClip: handleMoveClip,
            onOpenClip: handleOpenClip,
            onTransportSeek: handleTransportSeek,
            onTutorialOpenClip: handleTutorialOpenClip,
            onTrackSelect: handleTrackSelect,
            ref: timelineScrollRef,
            selectedClipId,
            tutorialLocked: activeTutorialLocked,
            tutorialTargets: activeTutorialTargets,
            tracks,
          })}
          {tutorialVisible ? createElement(TutorialOverlay, {
            canGoBack: currentTutorialStepIndex > 0,
            canManualNext: tutorialViewModel.canManualNext,
            collapsed: tutorialSidebarCollapsed,
            countInValue: tutorialCountInValue,
            directoryItems: tutorialDirectoryItems,
            displayCopy: tutorialViewModel.displayCopy,
            onBack: handleTutorialBack,
            onCompleteTask: handleTutorialCompleteTask,
            onDirectorySelect: handleTutorialJumpToSection,
            onPrimaryAction: handleTutorialNext,
            onSkip: handleTutorialSkip,
            primaryDisabled: tutorialViewModel.primaryDisabled,
            primaryLabel: tutorialViewModel.primaryLabel,
            showCompleteButton: tutorialViewModel.showCompleteButton,
            step: currentTutorialStep,
          }) : null}
        </main>
        <div
          className="editor-resizer"
          role="separator"
          aria-label="调整上下屏幕大小"
          aria-orientation="horizontal"
          aria-valuemin={EDITOR_RESIZE_MIN_HEIGHT}
          aria-valuemax={editorResizeMaxHeight}
          aria-valuenow={currentEditorResizeValue}
          tabIndex={0}
          onPointerDown={handleEditorResizePointerDown}
          onKeyDown={handleEditorResizeKeyDown}
        >
          <span className="editor-resizer-grip" aria-hidden="true" />
        </div>
        {createElement(BottomEditor, {
          activeTrackId,
          activeTutorialTarget,
          tutorialLocked: activeTutorialLocked,
          tutorialTargets: activeTutorialTargets,
          matrix,
          clips,
          melodyScaleId,
          selectedClipName: selectedClip?.name ?? '',
          onChordCellSelect: handleChordCellSelect,
          onChordNoteSelect: handleChordNoteSelect,
          onChordPick: handleChordPick,
          onChordPreview: handleChordPreview,
          onChordGrooveTemplatePreview: handleChordGrooveTemplatePreview,
          onChordGrooveTemplateApply: handleChordGrooveTemplateApply,
          onChordTemplatePreview: handleChordTemplatePreview,
          onChordTemplateApply: handleChordTemplateApply,
          shouldConfirmChordTemplateApply,
          onPassingChordPick: handlePassingChordPick,
          onPassingChordPreview: handlePassingChordPreview,
          onBassPreview: handleBassPreview,
          onBassStepToggle: handleBassStepToggle,
          onBassGrooveTemplatePreview: handleBassGrooveTemplatePreview,
          onBassGrooveTemplateApply: handleBassGrooveTemplateApply,
          onCloseEditor: handleCloseEditor,
          onClearBass: handleClearBass,
          onClearBassBar: handleClearBassBar,
          onClearMelody: handleClearMelody,
          onClearMelodyBar: handleClearMelodyBar,
          onMelodyPreview: handleMelodyPreview,
          onMelodyScaleChange: handleMelodyScaleChange,
          onMelodyStepToggle: handleMelodyStepToggle,
          onRenameClip: handleRenameClip,
          onClearCurrentDrumsBar: handleClearCurrentDrumsBar,
          onClearChordBar: handleClearChordBar,
          onClearChord: handleClearChord,
          onClearDrums: handleClearDrums,
          canPageBars,
          onGenerateAllDrumsBars: handleGenerateAllDrumsBars,
          onGenerateCurrentDrumsBar: handleGenerateCurrentDrumsBar,
          onNextBar: handleNextBar,
          onPreviousBar: handlePreviousBar,
          onDrumsStepMove: handleDrumsStepMove,
          onDrumsStepToggle: handleDrumsStepToggle,
          selectedBar,
          selectedClipId,
        })}
      </div>
    </div>
  );
}
