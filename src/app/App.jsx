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
  DRUMS_TUTORIAL_FREE_BARS,
  DRUMS_TUTORIAL_INITIAL_BARS,
} from '../tutorial/drumsTutorialConstants.js';
import {
  completeTutorialTask4,
  createTutorialState,
  getTutorialViewModel,
  handleTutorialClipOpen,
  handleTutorialDrumMove,
  handleTutorialDrumToggle,
  handleTutorialPlayheadDrag,
  resetTutorialStepForRetry,
} from '../tutorial/drumsTutorialRuntime.js';
import { DRUMS_TUTORIAL_STEPS } from '../tutorial/drumsTutorialSteps.js';
import { TUTORIAL_STEP_IDS } from '../tutorial/tutorialStepIds.js';
import { createUiAudioDispatcher } from './audioUiBridge.js';
import {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordCell,
  setChordCell,
  toggleChordNoteStep,
} from './chordActions.js';
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
import { getDrumsCellInstruments } from '../domain/drumsCells.js';
import { createDrumsStepMovePatch } from '../domain/drumsStepMove.js';
import {
  applyBasicDrumsAllBars,
  applyBasicDrumsBar,
  clearDrumsBar,
  createBasicDrumsBarWithoutKick,
  getDrumsClipBarIndexes,
} from './drumsPatternActions.js';
import { createTimelineTracks } from './timelineViewModels.js';
import { syncEditorToPlaybackBar } from './playbackEditorSync.js';
import { syncTrackScrollContainers } from './syncTrackScroll.js';
import { syncEditorToTutorialSuggestedBar } from './tutorialEditorSync.js';
import {
  BAR_NUMBERS,
  TRACK_UI,
} from './uiShellData.js';

const TUTORIAL_COMPLETION_STEP_BY_TASK = Object.freeze({
  [TUTORIAL_STEP_IDS.DRUMS_TASK_1]: TUTORIAL_STEP_IDS.DRUMS_TASK_1_COMPLETE,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_2]: TUTORIAL_STEP_IDS.DRUMS_TASK_2_COMPLETE,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_3]: TUTORIAL_STEP_IDS.DRUMS_TASK_3_COMPLETE,
  [TUTORIAL_STEP_IDS.DRUMS_TASK_4]: TUTORIAL_STEP_IDS.DRUMS_TASK_4_COMPLETE,
});

const TUTORIAL_AUTO_ADVANCE_MS = 450;
const TUTORIAL_BACK_TARGET_RESET_STEP_IDS = new Set([
  TUTORIAL_STEP_IDS.UI_TRACK_AREA,
  TUTORIAL_STEP_IDS.DRUMS_TASK_1,
  TUTORIAL_STEP_IDS.DRUMS_TASK_2,
  TUTORIAL_STEP_IDS.DRUMS_TASK_3,
  TUTORIAL_STEP_IDS.DRUMS_TASK_4,
]);

let tutorialAutoAdvanceTimerId = null;

function getTutorialStepIndex(stepId) {
  return DRUMS_TUTORIAL_STEPS.findIndex((step) => step.id === stepId);
}

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
  const selectedBar = useMusicStore((state) => state.selectedBar);
  const selectedClipId = useMusicStore((state) => state.selectedClipId);
  const clips = useMusicStore((state) => state.clips);
  const volumes = useMusicStore((state) => state.volumes);
  const [currentTutorialStepIndex, setCurrentTutorialStepIndex] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState(() => createTutorialState());
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [appliedTutorialSetups, setAppliedTutorialSetups] = useState(() => new Set());
  const tracksScrollRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const currentTutorialStep = DRUMS_TUTORIAL_STEPS[currentTutorialStepIndex];
  const tutorialViewModel = useMemo(() => getTutorialViewModel({
    clips,
    matrix,
    progress: tutorialProgress,
    selectedBar,
    step: currentTutorialStep,
  }), [clips, currentTutorialStep, matrix, selectedBar, tutorialProgress]);
  const activeTutorialTarget = currentTutorialStep?.target?.name ?? null;

  const dispatchAppCommand = useMemo(
    () => createUiAudioDispatcher({ store: useMusicStore, audio: audioEngine }),
    [],
  );

  useKeyboardCommands({ dispatch: dispatchAppCommand });

  const advanceTutorialToStep = useCallback((stepId) => {
    const stepIndex = getTutorialStepIndex(stepId);
    if (stepIndex >= 0) {
      setCurrentTutorialStepIndex(stepIndex);
    }
  }, []);

  const advanceTutorialAfterTask = useCallback((step, nextProgress) => {
    setTutorialProgress(nextProgress);
    scheduleTutorialAutoAdvance(() => {
      const nextStepId = TUTORIAL_COMPLETION_STEP_BY_TASK[step?.id];
      if (nextStepId) advanceTutorialToStep(nextStepId);
    });
  }, [advanceTutorialToStep]);

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
    audioEngine.onPositionChange = (bar, step) => {
      useMusicStore.getState().setTransportPosition(bar, step);
    };

    return () => {
      audioEngine.onPositionChange = null;
    };
  }, []);

  useEffect(() => {
    syncEditorToPlaybackBar(useMusicStore.getState(), currentBar);
  }, [activeTrackId, currentBar, isPlaying, selectedBar]);

  const handleBackToStart = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar: 0, step: 0 });
  }, [dispatchAppCommand]);

  const handleStop = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [dispatchAppCommand]);

  const handlePlayToggle = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
  }, [dispatchAppCommand]);

  const tracks = useMemo(() => createTimelineTracks({
    barNumbers: BAR_NUMBERS,
    clips,
    matrix,
    selectedBar,
    trackUi: TRACK_UI,
    volumes,
  }), [clips, matrix, selectedBar, volumes]);
  const selectedClip = selectedClipId ? clips.byId[selectedClipId] : null;

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
    const state = useMusicStore.getState();
    const nextMatrix = applyBasicDrumsBar(state.matrix, selectedBar);
    writeDrumsBars(nextMatrix, [selectedBar]);
  }, [selectedBar, writeDrumsBars]);

  const handleGenerateAllDrumsBars = useCallback(() => {
    const state = useMusicStore.getState();
    const drumsClipBars = getDrumsClipBarIndexes(state.clips);
    const nextMatrix = applyBasicDrumsAllBars(state.matrix, drumsClipBars);
    writeDrumsBars(nextMatrix, BAR_NUMBERS.map((_, barIndex) => barIndex));
  }, [writeDrumsBars]);

  const handleClearCurrentDrumsBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearDrumsBar(state.matrix, selectedBar);
    writeDrumsBars(nextMatrix, [selectedBar]);
  }, [selectedBar, writeDrumsBars]);

  const handleClearDrums = useCallback(() => {
    useMusicStore.getState().clearTrack('drums');
  }, []);

  const applyTutorialStepSetup = useCallback((step) => {
    const setupType = step?.setup?.type;
    if (!setupType || appliedTutorialSetups.has(step.id)) return;

    const state = useMusicStore.getState();

    if (setupType === 'generate-initial-drums') {
      DRUMS_TUTORIAL_INITIAL_BARS.forEach((barIndex) => {
        state.createClip('drums', barIndex);
      });
      const nextMatrix = applyBasicDrumsAllBars(state.matrix, DRUMS_TUTORIAL_INITIAL_BARS);
      writeDrumsBars(nextMatrix, DRUMS_TUTORIAL_INITIAL_BARS);
      state.selectClip(state.getClipForTrackBar('drums', DRUMS_TUTORIAL_INITIAL_BARS[0])?.id);
    }

    if (setupType === 'create-free-drums-bars') {
      DRUMS_TUTORIAL_FREE_BARS.forEach((barIndex) => {
        state.createClip('drums', barIndex);
        createBasicDrumsBarWithoutKick().forEach((cell, step) => {
          state.setCell('drums', barIndex, step, cell);
        });
      });
      state.selectClip(state.getClipForTrackBar('drums', DRUMS_TUTORIAL_FREE_BARS[0])?.id);
    }

    setAppliedTutorialSetups((setups) => {
      if (setups.has(step.id)) return setups;
      return new Set(setups).add(step.id);
    });
  }, [appliedTutorialSetups, writeDrumsBars]);

  const handleTransportSeek = useCallback((bar, step) => {
    if (tutorialVisible) {
      const tutorialAction = handleTutorialPlayheadDrag({
        progress: tutorialProgress,
        step: currentTutorialStep,
      });
      if (!tutorialAction.allowed) return;

      if (tutorialAction.shouldAdvance) {
        setTutorialProgress(tutorialAction.nextProgress);
        scheduleTutorialAutoAdvance(() => {
          const nextStepIndex = Math.min(currentTutorialStepIndex + 1, DRUMS_TUTORIAL_STEPS.length - 1);
          applyTutorialStepSetup(DRUMS_TUTORIAL_STEPS[nextStepIndex]);
          setCurrentTutorialStepIndex(nextStepIndex);
        });
      } else if (tutorialAction.nextProgress !== tutorialProgress) {
        setTutorialProgress(tutorialAction.nextProgress);
      }
    }

    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_SEEK, bar, step });
  }, [
    applyTutorialStepSetup,
    currentTutorialStep,
    currentTutorialStepIndex,
    dispatchAppCommand,
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

    if (tutorialAction.shouldAdvance) {
      advanceTutorialAfterTask(currentTutorialStep, tutorialAction.nextProgress);
    } else {
      setTutorialProgress(tutorialAction.nextProgress);
    }
  }, [
    advanceTutorialAfterTask,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleDrumsStepMove = useCallback((instrument, fromStep, toStep) => {
    const state = useMusicStore.getState();
    const tutorialAction = tutorialVisible && tutorialViewModel.locked
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
      if (tutorialAction.shouldAdvance) {
        advanceTutorialAfterTask(currentTutorialStep, tutorialAction.nextProgress);
      } else {
        setTutorialProgress(tutorialAction.nextProgress);
      }
    }
  }, [
    advanceTutorialAfterTask,
    currentTutorialStep,
    dispatchAppCommand,
    selectedBar,
    tutorialProgress,
    tutorialViewModel.locked,
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
  }, [dispatchAppCommand, selectedBar]);

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

  const handleChordTemplatePreview = useCallback((chords) => {
    previewChordNames(chords);
  }, [previewChordNames]);

  const handleChordNoteSelect = useCallback((spanIndex, columnIndex, note) => {
    const state = useMusicStore.getState();
    const nextMatrix = toggleChordNoteStep(state.matrix, selectedBar, spanIndex, columnIndex, note);
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    state.setCell('chord', selectedBar, step + columnIndex, nextMatrix.chord[selectedBar][step + columnIndex]);
  }, [selectedBar]);

  const handleChordTemplateApply = useCallback((templateId) => {
    const state = useMusicStore.getState();
    const nextMatrix = applyChordTemplateToExistingClips(state.matrix, state.clips, templateId);

    state.clips.ids
      .map((id) => state.clips.byId[id])
      .filter((clip) => clip?.trackId === 'chord')
      .forEach((clip) => {
        state.setCell('chord', clip.bar, 0, nextMatrix.chord[clip.bar][0]);
        state.setCell('chord', clip.bar, 1, nextMatrix.chord[clip.bar][1]);
      });
  }, []);

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

  const stopTutorialPreviewPlayback = useCallback(() => {
    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
  }, [dispatchAppCommand]);

  const resetTutorialStepsForBack = useCallback((steps) => {
    const state = useMusicStore.getState();
    let nextProgress = tutorialProgress;
    const resetStepIds = new Set();

    steps.forEach((step) => {
      if (!step || resetStepIds.has(step.id)) return;
      resetStepIds.add(step.id);

      const reset = resetTutorialStepForRetry({
        matrix: useMusicStore.getState().matrix,
        progress: nextProgress,
        step,
      });

      reset.nextMatrixPatch.forEach(({ bar, cell, step: stepIndex }) => {
        state.setCell('drums', bar, stepIndex, cell);
      });
      if (reset.nextTransportPosition) {
        void dispatchAppCommand({
          type: APP_COMMAND_TYPES.TRANSPORT_SEEK,
          bar: reset.nextTransportPosition.bar,
          step: reset.nextTransportPosition.step,
        });
      }
      nextProgress = reset.nextProgress;
    });

    if (currentTutorialStep?.setup) {
      setAppliedTutorialSetups((setups) => {
        if (!setups.has(currentTutorialStep.id)) return setups;
        const nextSetups = new Set(setups);
        nextSetups.delete(currentTutorialStep.id);
        return nextSetups;
      });
    }

    setTutorialProgress(nextProgress);
  }, [currentTutorialStep, dispatchAppCommand, tutorialProgress]);

  const handleTutorialNext = useCallback(() => {
    if (!tutorialViewModel.canManualNext) return;
    clearTutorialAutoAdvanceTimer();
    stopTutorialPreviewPlayback();
    const nextStepIndex = Math.min(currentTutorialStepIndex + 1, DRUMS_TUTORIAL_STEPS.length - 1);
    applyTutorialStepSetup(DRUMS_TUTORIAL_STEPS[nextStepIndex]);
    setCurrentTutorialStepIndex(nextStepIndex);
  }, [
    applyTutorialStepSetup,
    currentTutorialStepIndex,
    stopTutorialPreviewPlayback,
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
      const nextStepIndex = Math.min(currentTutorialStepIndex + 1, DRUMS_TUTORIAL_STEPS.length - 1);
      applyTutorialStepSetup(DRUMS_TUTORIAL_STEPS[nextStepIndex]);
      setCurrentTutorialStepIndex(nextStepIndex);
    }

    return true;
  }, [
    applyTutorialStepSetup,
    currentTutorialStep,
    currentTutorialStepIndex,
    tutorialProgress,
    tutorialVisible,
  ]);

  const handleTutorialBack = useCallback(() => {
    clearTutorialAutoAdvanceTimer();
    stopTutorialPreviewPlayback();
    const nextStepIndex = Math.max(currentTutorialStepIndex - 1, 0);
    const nextStep = DRUMS_TUTORIAL_STEPS[nextStepIndex];
    const stepsToReset = [currentTutorialStep];

    if (TUTORIAL_BACK_TARGET_RESET_STEP_IDS.has(nextStep?.id)) {
      stepsToReset.push(nextStep);
    }

    resetTutorialStepsForBack(stepsToReset);
    setCurrentTutorialStepIndex(nextStepIndex);
  }, [
    currentTutorialStep,
    currentTutorialStepIndex,
    resetTutorialStepsForBack,
    stopTutorialPreviewPlayback,
  ]);

  const handleTutorialSkip = useCallback(() => {
    clearTutorialAutoAdvanceTimer();
    stopTutorialPreviewPlayback();
    setTutorialVisible(false);
  }, [stopTutorialPreviewPlayback]);

  const handleTutorialCompleteTask = useCallback(() => {
    if (currentTutorialStep?.id !== TUTORIAL_STEP_IDS.DRUMS_TASK_4) return;
    const nextProgress = completeTutorialTask4(tutorialProgress);
    setTutorialProgress(nextProgress);
    advanceTutorialToStep(TUTORIAL_STEP_IDS.DRUMS_TASK_4_COMPLETE);
  }, [advanceTutorialToStep, currentTutorialStep, tutorialProgress]);

  return (
    <div className="app" data-screen-label="Main" aria-label="Project Arranger workspace">
      {createElement(TopBar, {
        activeTutorialTarget,
        bpm,
        currentBar,
        currentStep,
        isPlaying,
        onBackToStart: handleBackToStart,
        onPlayToggle: handlePlayToggle,
        onStop: handleStop,
        rootKey,
        scale,
      })}
      <main className="workspace">
        {createElement(TracksColumn, {
          activeTrackId,
          onTrackSelect: handleTrackSelect,
          onVolumeChange: handleTrackVolumeChange,
          ref: tracksScrollRef,
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
          tutorialLocked: tutorialViewModel.locked,
          tutorialTargets: tutorialViewModel.targets,
          tracks,
        })}
      </main>
      {createElement(BottomEditor, {
        activeTrackId,
        activeTutorialTarget,
        tutorialLocked: tutorialViewModel.locked,
        tutorialTargets: tutorialViewModel.targets,
        matrix,
        selectedClipName: selectedClip?.name ?? '',
        onChordCellSelect: handleChordCellSelect,
        onChordNoteSelect: handleChordNoteSelect,
        onChordPick: handleChordPick,
        onChordPreview: handleChordPreview,
        onChordTemplatePreview: handleChordTemplatePreview,
        onChordTemplateApply: handleChordTemplateApply,
        onCloseEditor: handleCloseEditor,
        onRenameClip: handleRenameClip,
        onClearCurrentDrumsBar: handleClearCurrentDrumsBar,
        onClearChordBar: handleClearChordBar,
        onClearChord: handleClearChord,
        onClearDrums: handleClearDrums,
        onGenerateAllDrumsBars: handleGenerateAllDrumsBars,
        onGenerateCurrentDrumsBar: handleGenerateCurrentDrumsBar,
        onDrumsStepMove: handleDrumsStepMove,
        onDrumsStepToggle: handleDrumsStepToggle,
        rootKey,
        selectedBar,
        selectedClipId,
      })}
      {tutorialVisible ? createElement(TutorialOverlay, {
        canGoBack: currentTutorialStepIndex > 0,
        canManualNext: tutorialViewModel.canManualNext,
        displayCopy: tutorialViewModel.displayCopy,
        isLastStep: currentTutorialStepIndex === DRUMS_TUTORIAL_STEPS.length - 1,
        onBack: handleTutorialBack,
        onCompleteTask: handleTutorialCompleteTask,
        onPrimaryAction: handleTutorialNext,
        onSkip: handleTutorialSkip,
        showCompleteButton: tutorialViewModel.showCompleteButton,
        step: currentTutorialStep,
        targetName: activeTutorialTarget,
      }) : null}
    </div>
  );
}
