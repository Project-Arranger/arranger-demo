import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import audioEngine from '../audio/audioEngineSingleton.js';
import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useKeyboardCommands from '../input/useKeyboardCommands.js';
import useMusicStore from '../store/useMusicStore.js';
import {
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
} from './audioUiBridge.js';
import {
  clearChordBar,
  clearChordCell,
  getChordCell,
  setChordCell,
} from './chordActions.js';
import { BottomEditor } from './components/BottomEditor.jsx';
import { Timeline } from './components/Timeline.jsx';
import { TopBar } from './components/TopBar.jsx';
import { TracksColumn } from './components/TracksColumn.jsx';
import { toggleInstrumentInCell } from './drumSequencerData.js';
import {
  getChordSpanStep,
  toggleChordCell,
} from '../domain/chordCells.js';
import {
  applyBasicDrumsAllBars,
  applyBasicDrumsBar,
  clearDrumsBar,
  getDrumsClipBarIndexes,
} from './drumsPatternActions.js';
import { createTimelineTracks } from './timelineViewModels.js';
import { syncTrackScrollContainers } from './syncTrackScroll.js';
import {
  BAR_NUMBERS,
  TRACK_UI,
} from './uiShellData.js';

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
  const tracksScrollRef = useRef(null);
  const timelineScrollRef = useRef(null);

  const dispatchAppCommand = useMemo(
    () => createUiAudioDispatcher({ store: useMusicStore, audio: audioEngine }),
    [],
  );

  useKeyboardCommands({ dispatch: dispatchAppCommand });

  useEffect(() => {
    seedDefaultDrumsPattern(useMusicStore);
  }, []);

  useEffect(() => (
    syncTrackScrollContainers(tracksScrollRef.current, timelineScrollRef.current)
  ), []);

  useEffect(() => {
    audioEngine.onPositionChange = (bar, step) => {
      useMusicStore.getState().setPosition(bar, step);
    };

    return () => {
      audioEngine.onPositionChange = null;
    };
  }, []);

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
    selectedBar,
    trackUi: TRACK_UI,
    volumes,
  }), [clips, selectedBar, volumes]);

  const handleTrackSelect = useCallback((trackId) => {
    const state = useMusicStore.getState();
    const clip = state.getClipForTrackBar(trackId, selectedBar);
    if (clip) {
      state.selectClip(clip.id);
      return;
    }

    const { setActiveTrackId, setSelectedBar, setSelectedClipId } = state;
    setActiveTrackId(trackId);
    setSelectedBar(selectedBar);
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

  const handleDrumsStepToggle = useCallback((instrument, step) => {
    const state = useMusicStore.getState();
    const currentCell = state.matrix.drums[selectedBar]?.[step] ?? null;
    state.setCell('drums', selectedBar, step, toggleInstrumentInCell(currentCell, instrument));
    void dispatchAppCommand({
      type: APP_COMMAND_TYPES.DRUMS_TOGGLE,
      bar: selectedBar,
      step,
      instrument,
    });
  }, [dispatchAppCommand, selectedBar]);

  const handleChordCellSelect = useCallback((spanIndex, root) => {
    const state = useMusicStore.getState();
    const step = getChordSpanStep(spanIndex);
    if (step === null) return;

    const currentCell = getChordCell(state.matrix, selectedBar, spanIndex);
    const nextCell = toggleChordCell(currentCell, root);

    if (nextCell) {
      const nextMatrix = setChordCell(state.matrix, selectedBar, spanIndex, root);
      state.setCell('chord', selectedBar, step, nextMatrix.chord[selectedBar][step]);
      void dispatchAppCommand({
        type: APP_COMMAND_TYPES.CHORD_SET_CELL,
        bar: selectedBar,
        span: spanIndex,
        root,
      });
      return;
    }

    const nextMatrix = clearChordCell(state.matrix, selectedBar, spanIndex);
    state.setCell('chord', selectedBar, step, nextMatrix.chord[selectedBar][step]);
    void dispatchAppCommand({
      type: APP_COMMAND_TYPES.CHORD_CLEAR_CELL,
      bar: selectedBar,
      span: spanIndex,
    });
  }, [dispatchAppCommand, selectedBar]);

  const handleClearChordBar = useCallback(() => {
    const state = useMusicStore.getState();
    const nextMatrix = clearChordBar(state.matrix, selectedBar);

    nextMatrix.chord[selectedBar].forEach((cell, step) => {
      state.setCell('chord', selectedBar, step, cell);
    });
  }, [selectedBar]);

  return (
    <div className="app" data-screen-label="Main" aria-label="Project Arranger workspace">
      {createElement(TopBar, {
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
          activeTrackId,
          currentBar,
          currentStep,
          onAddClip: handleAddClip,
          onMoveClip: handleMoveClip,
          onOpenClip: handleOpenClip,
          ref: timelineScrollRef,
          selectedClipId,
          tracks,
        })}
      </main>
      {createElement(BottomEditor, {
        activeTrackId,
        matrix,
        onChordCellSelect: handleChordCellSelect,
        onClearCurrentDrumsBar: handleClearCurrentDrumsBar,
        onClearChordBar: handleClearChordBar,
        onClearDrums: handleClearDrums,
        onGenerateAllDrumsBars: handleGenerateAllDrumsBars,
        onGenerateCurrentDrumsBar: handleGenerateCurrentDrumsBar,
        onDrumsStepToggle: handleDrumsStepToggle,
        rootKey,
        selectedBar,
      })}
    </div>
  );
}
