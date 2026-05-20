import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import audioEngine from '../audio/audioEngineSingleton.js';
import { createChordNotes } from '../audio/matrixPlaybackAdapter.js';
import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useKeyboardCommands from '../input/useKeyboardCommands.js';
import useMusicStore from '../store/useMusicStore.js';
import {
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
} from './audioUiBridge.js';
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
          onTrackSelect: handleTrackSelect,
          ref: timelineScrollRef,
          selectedClipId,
          tracks,
        })}
      </main>
      {createElement(BottomEditor, {
        activeTrackId,
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
        onDrumsStepToggle: handleDrumsStepToggle,
        rootKey,
        selectedBar,
        selectedClipId,
      })}
    </div>
  );
}
