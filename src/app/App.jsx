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
import { TUTORIAL_STEP_IDS } from '../tutorial/tutorialStepIds.js';
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
  BAR_NUMBERS,
  getTrackUiByIds,
  OPTIONAL_TRACK_UI,
} from './uiShellData.js';

const TUTORIAL_AUTO_ADVANCE_MS = 450;
const EDITOR_RESIZE_MIN_HEIGHT = 180;
const EDITOR_RESIZE_WORKSPACE_MIN_HEIGHT = 180;
const EDITOR_RESIZE_KEYBOARD_STEP = 16;
const EDITOR_RESIZE_DEFAULT_HEIGHT = 300;

let tutorialAutoAdvanceTimerId = null;

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

function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function getTopbarHeight() {
  return document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
}

function getEditorResizeBounds() {
  const maxHeight = Math.max(
    EDITOR_RESIZE_MIN_HEIGHT,
    getViewportHeight() - getTopbarHeight() - EDITOR_RESIZE_WORKSPACE_MIN_HEIGHT,
  );

  return {
    maxHeight,
    minHeight: EDITOR_RESIZE_MIN_HEIGHT,
  };
}

function clampEditorHeight(height, bounds = getEditorResizeBounds()) {
  return Math.round(Math.max(bounds.minHeight, Math.min(bounds.maxHeight, height)));
}

function getCurrentEditorHeight(fallbackHeight = EDITOR_RESIZE_DEFAULT_HEIGHT) {
  return Math.round(
    document.querySelector('.track-editor-target')?.getBoundingClientRect().height
      ?? fallbackHeight,
  );
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
  const [tutorialSidebarCollapsed, setTutorialSidebarCollapsed] = useState(false);
  const [appliedTutorialSetups, setAppliedTutorialSetups] = useState(() => new Set());
  const [tutorialStepCheckpoints, setTutorialStepCheckpoints] = useState(() => ({
    0: createTutorialCheckpoint({
      appState: useMusicStore.getState(),
      appliedTutorialSetups: new Set(),
      tutorialProgress: createTutorialState(),
    }),
  }));
  const [editorHeightPx, setEditorHeightPx] = useState(null);
  const [editorResizeMaxHeight, setEditorResizeMaxHeight] = useState(EDITOR_RESIZE_DEFAULT_HEIGHT);
  const [currentEditorResizeValue, setCurrentEditorResizeValue] = useState(EDITOR_RESIZE_DEFAULT_HEIGHT);
  const [isEditorResizing, setIsEditorResizing] = useState(false);
  const tracksScrollRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const editorResizeDragRef = useRef(null);
  const editorResizeCleanupRef = useRef(null);
  const currentTutorialStep = DRUMS_TUTORIAL_STEPS[currentTutorialStepIndex];
  const tutorialViewModel = useMemo(() => getTutorialViewModel({
    clips,
    matrix,
    progress: tutorialProgress,
    selectedBar,
    step: currentTutorialStep,
  }), [clips, currentTutorialStep, matrix, selectedBar, tutorialProgress]);
  const activeTutorialTarget = tutorialVisible ? currentTutorialStep?.target?.name ?? null : null;
  const activeTutorialTargets = tutorialVisible ? tutorialViewModel.targets : undefined;
  const activeTutorialLocked = tutorialVisible && tutorialViewModel.locked;
  const shouldConfirmChordTemplateApply = useMemo(() => (
    hasExistingChordClipContent(matrix, clips)
  ), [clips, matrix]);

  const dispatchAppCommand = useMemo(
    () => createUiAudioDispatcher({ store: useMusicStore, audio: audioEngine }),
    [],
  );

  const resetTutorialTransportToStart = useCallback(() => {
    void (async () => {
      await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
      await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
    })();
  }, [dispatchAppCommand]);

  useKeyboardCommands({ dispatch: dispatchAppCommand });

  useEffect(() => {
    if (!melodyEditorIsOpen) return;
    void audioEngine.startAudio();
  }, [melodyEditorIsOpen]);

  useEffect(() => () => {
    clearTutorialAutoAdvanceTimer();
  }, []);

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

  const commitEditorHeight = useCallback((height) => {
    const bounds = getEditorResizeBounds();
    const nextHeight = clampEditorHeight(height, bounds);

    setEditorResizeMaxHeight(bounds.maxHeight);
    setCurrentEditorResizeValue(nextHeight);
    setEditorHeightPx(nextHeight);
    return nextHeight;
  }, []);

  const readEditorHeight = useCallback(() => (
    editorHeightPx ?? getCurrentEditorHeight(currentEditorResizeValue)
  ), [currentEditorResizeValue, editorHeightPx]);

  useEffect(() => {
    const syncEditorResizeMetrics = () => {
      const bounds = getEditorResizeBounds();
      setEditorResizeMaxHeight(bounds.maxHeight);

      if (editorHeightPx === null) {
        setCurrentEditorResizeValue(clampEditorHeight(getCurrentEditorHeight(), bounds));
        return;
      }

      const nextHeight = clampEditorHeight(editorHeightPx, bounds);
      setCurrentEditorResizeValue(nextHeight);
      if (nextHeight !== editorHeightPx) setEditorHeightPx(nextHeight);
    };

    syncEditorResizeMetrics();
    window.addEventListener('resize', syncEditorResizeMetrics);
    return () => window.removeEventListener('resize', syncEditorResizeMetrics);
  }, [activeTrackId, editorHeightPx, selectedClipId]);

  useEffect(() => () => {
    editorResizeCleanupRef.current?.();
  }, []);

  const handleEditorResizePointerDown = useCallback((event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    editorResizeCleanupRef.current?.();

    const resizeHandle = event.currentTarget;
    const dragSession = {
      startHeight: readEditorHeight(),
      startY: event.clientY,
    };
    editorResizeDragRef.current = dragSession;
    setIsEditorResizing(true);

    const handlePointerMove = (moveEvent) => {
      commitEditorHeight(dragSession.startHeight + dragSession.startY - moveEvent.clientY);
    };

    const handlePointerUp = () => {
      resizeHandle.releasePointerCapture?.(event.pointerId);
      editorResizeDragRef.current = null;
      editorResizeCleanupRef.current?.();
      editorResizeCleanupRef.current = null;
      setIsEditorResizing(false);
    };

    editorResizeCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [commitEditorHeight, readEditorHeight]);

  const handleEditorResizeKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        commitEditorHeight(readEditorHeight() + EDITOR_RESIZE_KEYBOARD_STEP);
        break;
      case 'ArrowDown':
        event.preventDefault();
        commitEditorHeight(readEditorHeight() - EDITOR_RESIZE_KEYBOARD_STEP);
        break;
      case 'Home':
        event.preventDefault();
        commitEditorHeight(EDITOR_RESIZE_MIN_HEIGHT);
        break;
      case 'End':
        event.preventDefault();
        commitEditorHeight(getEditorResizeBounds().maxHeight);
        break;
      default:
        break;
    }
  }, [commitEditorHeight, readEditorHeight]);

  const handleBackToStart = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
  }, [dispatchAppCommand]);

  const handleStop = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [dispatchAppCommand]);

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
  const selectedClip = selectedClipId ? clips.byId[selectedClipId] : null;
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
    useMusicStore.getState().createClip(trackId, barIndex);
  }, []);

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

  const advanceTutorialToNextStep = useCallback((checkpointProgress = tutorialProgress) => {
    resetTutorialTransportToStart();
    enterTutorialStepIndex(currentTutorialStepIndex + 1, checkpointProgress);
  }, [
    currentTutorialStepIndex,
    enterTutorialStepIndex,
    resetTutorialTransportToStart,
    tutorialProgress,
  ]);

  const applyTutorialActionProgress = useCallback((tutorialAction) => {
    setTutorialProgress(tutorialAction.nextProgress);
    if (tutorialAction.shouldEnd) {
      clearTutorialAutoAdvanceTimer();
      setTutorialVisible(false);
      return;
    }
    if (tutorialAction.shouldAdvance) {
      scheduleTutorialAutoAdvance(() => advanceTutorialToNextStep(tutorialAction.nextProgress));
    }
  }, [advanceTutorialToNextStep]);

  const handleFillEmptyTrackClips = useCallback((trackId) => {
    let tutorialAction = null;
    if (tutorialVisible) {
      tutorialAction = handleTutorialControlAction({
        control: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:${trackId}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    useMusicStore.getState().createEmptyClipsForTrack(trackId);
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleAddTrack = useCallback((trackId) => {
    useMusicStore.getState().addVisibleTrack(trackId);
  }, []);

  const handleTrackVolumeChange = useCallback((trackId, volume) => {
    useMusicStore.getState().setTrackVolume(trackId, volume);
  }, []);

  const handleMoveClip = useCallback((clipId, targetBar) => {
    useMusicStore.getState().moveClipToBar(clipId, targetBar);
  }, []);

  const handleOpenClip = useCallback((clipId) => {
    useMusicStore.getState().selectClip(clipId);
  }, []);

  const handleCloseEditor = useCallback(() => {
    useMusicStore.getState().setSelectedClipId(null);
  }, []);

  const handleRenameClip = useCallback((name) => {
    if (!selectedClipId) return;
    useMusicStore.getState().renameClip(selectedClipId, name);
  }, [selectedClipId]);

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
    if (tutorialVisible) {
      tutorialAction = handleTutorialControlAction({
        control: TUTORIAL_CONTROL_TARGETS.GENERATE_CURRENT_DRUMS_BAR,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const nextMatrix = applyBasicDrumsBar(state.matrix, selectedBar);
    writeDrumsBars(nextMatrix, [selectedBar]);
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
    writeDrumsBars,
  ]);

  const handleGenerateAllDrumsBars = useCallback(() => {
    let tutorialAction = null;
    if (tutorialVisible) {
      tutorialAction = handleTutorialControlAction({
        control: TUTORIAL_CONTROL_TARGETS.GENERATE_ALL_DRUMS_BARS,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;
    }

    const state = useMusicStore.getState();
    const drumsClipBars = getDrumsClipBarIndexes(state.clips);
    const nextMatrix = applyBasicDrumsAllBars(state.matrix, drumsClipBars);
    writeDrumsBars(nextMatrix, BAR_NUMBERS.map((_, barIndex) => barIndex));
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
    writeDrumsBars,
  ]);

  const handleClearCurrentDrumsBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearDrumsBar(state.matrix, selectedBar);
    writeDrumsBars(nextMatrix, [selectedBar]);
  }, [selectedBar, writeDrumsBars]);

  const handleClearDrums = useCallback(() => {
    useMusicStore.getState().clearTrack('drums');
  }, []);

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
    if (tutorialVisible) {
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
    tutorialProgress,
    tutorialVisible,
  ]);

  useEffect(() => {
    audioEngine.onPositionChange = (bar, step) => {
      useMusicStore.getState().setTransportPosition(bar, step);

      if (
        tutorialVisible
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
        tutorialVisible
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
    tutorialProgress,
    tutorialVisible,
  ]);

  useEffect(() => {
    if (!tutorialVisible) return;

    const suggestedBar = tutorialViewModel.suggestedSelectedBar;
    syncEditorToTutorialSuggestedBar(useMusicStore.getState(), suggestedBar, { isPlaying });
  }, [isPlaying, selectedBar, tutorialViewModel.suggestedSelectedBar, tutorialVisible]);

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
    const tutorialAction = tutorialVisible ? handleTutorialDrumToggle({
      instrument,
      matrix: state.matrix,
      progress: tutorialProgress,
      selectedBar,
      step: currentTutorialStep,
      stepIndex: step,
    }) : { allowed: true, nextProgress: tutorialProgress, shouldAdvance: false };

    if (!tutorialAction.allowed) return;

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
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleDrumsStepMove = useCallback((instrument, fromStep, toStep) => {
    const state = useMusicStore.getState();
    const tutorialAction = tutorialVisible
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
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleChordCellSelect = useCallback((spanIndex, root) => {
    const state = useMusicStore.getState();
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    const currentCell = getChordCell(state.matrix, selectedBar, spanIndex);
    const nextCell = toggleChordCell(currentCell, root);

    if (nextCell) {
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
      return;
    }

    const nextMatrix = clearChordCell(state.matrix, selectedBar, spanIndex);
    for (let offset = 0; offset < 4; offset += 1) {
      state.setCell('chord', selectedBar, step + offset, nextMatrix.chord[selectedBar][step + offset]);
    }
    void dispatchAppCommand({
      type: APP_COMMAND_TYPES.CHORD_CLEAR_CELL,
      bar: selectedBar,
      span: spanIndex,
    });
  }, [dispatchAppCommand, selectedBar]);

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

    const tutorialAction = tutorialVisible && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_ENRICH_HARMONY
      ? handleTutorialControlAction({
        control: `chord-enrich-button:${spanIndex}`,
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      })
      : null;
    if (tutorialAction && !tutorialAction.allowed) return;

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
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handlePassingChordPick = useCallback((stepIndex, chordName) => {
    const state = useMusicStore.getState();
    const nextMatrix = setChordStepChord(state.matrix, selectedBar, stepIndex, chordName);
    if (nextMatrix === state.matrix) return;

    const tutorialAction = tutorialVisible && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_ADD_PASSING
      ? handleTutorialControlAction({
        control: 'chord-passing-button',
        progress: tutorialProgress,
        selectedBar,
        step: currentTutorialStep,
      })
      : null;
    if (tutorialAction && !tutorialAction.allowed) return;

    state.setCell('chord', selectedBar, stepIndex, nextMatrix.chord[selectedBar][stepIndex]);
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
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

    state.setCell('chord', selectedBar, step + columnIndex, nextMatrix.chord[selectedBar][step + columnIndex]);
  }, [selectedBar]);

  const handleChordTemplateApply = useCallback((templateId) => {
    let tutorialAction = null;
    if (tutorialVisible && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_SELECT_PROGRESSION_TEMPLATE) {
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

    state.clips.ids
      .map((id) => state.clips.byId[id])
      .filter((clip) => clip?.trackId === 'chord')
      .forEach((clip) => {
        state.setCell('chord', clip.bar, 0, nextMatrix.chord[clip.bar][0]);
        state.setCell('chord', clip.bar, 1, nextMatrix.chord[clip.bar][1]);
      });
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleChordGrooveTemplateApply = useCallback((templateId) => {
    let tutorialAction = null;
    if (tutorialVisible && currentTutorialStep?.id === TUTORIAL_STEP_IDS.CHORD_SELECT_GROOVE_TEMPLATE) {
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

    state.clips.ids
      .map((id) => state.clips.byId[id])
      .filter((clip) => clip?.trackId === 'chord')
      .forEach((clip) => {
        nextMatrix.chord[clip.bar].forEach((cell, step) => {
          state.setCell('chord', clip.bar, step, cell);
        });
      });
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleClearChordBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearChordBar(state.matrix, selectedBar);

    nextMatrix.chord[selectedBar].forEach((cell, step) => {
      state.setCell('chord', selectedBar, step, cell);
    });
  }, [selectedBar]);

  const handleClearChord = useCallback(() => {
    useMusicStore.getState().clearTrack('chord');
  }, []);

  const handleBassStepToggle = useCallback((step, note) => {
    const state = useMusicStore.getState();
    const nextMatrix = toggleBassCell(state.matrix, selectedBar, step, note);
    state.setCell('bass', selectedBar, step, nextMatrix.bass[selectedBar][step]);
    void audioEngine.triggerBassNote(note, '16n');
  }, [selectedBar]);

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
    if (tutorialVisible && currentTutorialStep?.id === TUTORIAL_STEP_IDS.BASS_SELECT_GROOVE_TEMPLATE) {
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

    state.clips.ids
      .map((id) => state.clips.byId[id])
      .filter((clip) => clip?.trackId === 'bass')
      .forEach((clip) => {
        nextMatrix.bass[clip.bar].forEach((cell, step) => {
          state.setCell('bass', clip.bar, step, cell);
        });
      });
    if (tutorialAction) applyTutorialActionProgress(tutorialAction);
  }, [
    applyTutorialActionProgress,
    currentTutorialStep,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleClearBassBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearBassBar(state.matrix, selectedBar);

    nextMatrix.bass[selectedBar].forEach((cell, step) => {
      state.setCell('bass', selectedBar, step, cell);
    });
  }, [selectedBar]);

  const handleClearBass = useCallback(() => {
    useMusicStore.getState().clearTrack('bass');
  }, []);

  const handleMelodyStepToggle = useCallback((step, note) => {
    const state = useMusicStore.getState();
    const nextMatrix = toggleMelodyCell(state.matrix, selectedBar, step, note);
    state.setCell('melody', selectedBar, step, nextMatrix.melody[selectedBar][step]);
    void audioEngine.triggerMelodyNote(note, '16n');
  }, [selectedBar]);

  const handleMelodyPreview = useCallback((noteOrNotes) => {
    if (Array.isArray(noteOrNotes)) {
      void audioEngine.previewMelodySequence(noteOrNotes);
      return;
    }

    void audioEngine.triggerMelodyNote(noteOrNotes, '16n');
  }, []);

  const handleMelodyScaleChange = useCallback((scaleId) => {
    useMusicStore.getState().setMelodyScaleId(scaleId);
  }, []);

  const handleClearMelodyBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearMelodyBar(state.matrix, selectedBar);

    nextMatrix.melody[selectedBar].forEach((cell, step) => {
      state.setCell('melody', selectedBar, step, cell);
    });
  }, [selectedBar]);

  const handleClearMelody = useCallback(() => {
    useMusicStore.getState().clearTrack('melody');
  }, []);

  const stopTutorialPreviewPlayback = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [dispatchAppCommand]);

  const handleTutorialNext = useCallback(() => {
    if (!tutorialViewModel.canManualNext) return;
    clearTutorialAutoAdvanceTimer();
    advanceTutorialToNextStep(tutorialProgress);
  }, [
    advanceTutorialToNextStep,
    tutorialProgress,
    tutorialViewModel.canManualNext,
  ]);

  const handleTutorialOpenClip = useCallback((clip) => {
    if (!tutorialVisible) return true;

    const tutorialAction = handleTutorialClipOpen({
      bar: clip?.bar,
      progress: tutorialProgress,
      step: currentTutorialStep,
      trackId: clip?.trackId,
    });
    if (!tutorialAction.allowed) return false;

    setTutorialProgress(tutorialAction.nextProgress);

    if (tutorialAction.shouldAdvance) {
      if (clip?.id) useMusicStore.getState().selectClip(clip.id);
      advanceTutorialToNextStep(tutorialAction.nextProgress);
    }

    return true;
  }, [
    advanceTutorialToNextStep,
    currentTutorialStep,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleTutorialBack = useCallback(() => {
    clearTutorialAutoAdvanceTimer();
    stopTutorialPreviewPlayback();
    const targetStepIndex = Math.max(currentTutorialStepIndex - 1, 0);
    const targetCheckpoint = tutorialStepCheckpoints[targetStepIndex];
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
    currentTutorialStepIndex,
    stopTutorialPreviewPlayback,
    tutorialStepCheckpoints,
  ]);

  const handleTutorialSkip = useCallback(() => {
    clearTutorialAutoAdvanceTimer();
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
    setTutorialSidebarCollapsed(false);
    setTutorialVisible(false);
  }, [stopTutorialPreviewPlayback]);

  const handleTutorialSidebarToggle = useCallback(() => {
    setTutorialSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const handleTutorialCompleteTask = useCallback(() => {
    const tutorialAction = completeTutorialPrimaryAction({
      progress: tutorialProgress,
      step: currentTutorialStep,
    });
    if (!tutorialAction.allowed) return;
    applyTutorialActionProgress(tutorialAction);
  }, [applyTutorialActionProgress, currentTutorialStep, tutorialProgress]);

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
          currentBar,
          currentStep,
          isPlaying,
          onBackToStart: handleBackToStart,
          onPlayToggle: handlePlayToggle,
          onStop: handleStop,
          onTutorialToggle: handleTutorialSidebarToggle,
          rootKey,
          scale,
          showTutorialToggle: tutorialVisible,
          tutorialCollapsed: tutorialSidebarCollapsed,
          tutorialTargets: activeTutorialTargets,
        })}
        <main className={workspaceClassName}>
          {createElement(TracksColumn, {
            activeTrackId,
            addTrackOptions: availableAddTrackOptions,
            onAddTrack: handleAddTrack,
            onFillEmptyTrackClips: handleFillEmptyTrackClips,
            onTrackSelect: handleTrackSelect,
            onVolumeChange: handleTrackVolumeChange,
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
            displayCopy: tutorialViewModel.displayCopy,
            onBack: handleTutorialBack,
            onCompleteTask: handleTutorialCompleteTask,
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
