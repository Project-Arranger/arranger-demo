import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { isMelodyNoteInScale } from '../data/melodyScales.js';
import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import { APP_COMMAND_TYPES } from '../input/appCommands.js';
import useMusicStore from '../store/useMusicStore.js';
import {
  clearMelodyBar,
  normalizeMelodyDurationSteps,
  setMelodyCell,
  setMelodyCellDuration,
} from './melodyActions.js';
import { getMelodyRhythmTemplate } from './melodyRhythmTemplates.js';

const MELODY_RECORDING_PHASES = Object.freeze({
  COUNT_IN: 'count-in',
  CONFIRM: 'confirm',
  IDLE: 'idle',
  RECORDING: 'recording',
});

const MELODY_RECORDING_MODES = Object.freeze({
  FREE: 'free',
  TEMPLATE: 'template',
});

const IDLE_MELODY_RECORDING_STATE = Object.freeze({
  countInBeat: null,
  mode: null,
  phase: MELODY_RECORDING_PHASES.IDLE,
  recordedNotes: 0,
  totalNotes: 0,
});

function nowMilliseconds() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function hasMelodyBarNotes(matrix, bar) {
  return matrix?.melody?.[bar]?.some((cell) => cell?.type === 'melody') ?? false;
}

function getMelodyRecordingMode(templateId) {
  return getMelodyRhythmTemplate(templateId)
    ? MELODY_RECORDING_MODES.TEMPLATE
    : MELODY_RECORDING_MODES.FREE;
}

function getRecordedMelodyDurationSteps({
  bpm,
  endedAt,
  maxDurationSteps = STEPS_PER_BAR,
  startedAt,
}) {
  const normalizedBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 120;
  const sixteenthMilliseconds = 60000 / normalizedBpm / 4;
  const elapsedMilliseconds = Math.max(0, endedAt - startedAt);
  return normalizeMelodyDurationSteps(
    elapsedMilliseconds / sixteenthMilliseconds,
    maxDurationSteps,
  );
}

function recordTemplateMelodyNote(matrix, bar, templateId, cursor, note) {
  const template = getMelodyRhythmTemplate(templateId);
  const step = template?.steps?.[cursor];
  if (!Number.isInteger(step)) {
    return {
      complete: Boolean(template && cursor >= template.steps.length),
      cursor,
      matrix,
      recorded: false,
      step: null,
    };
  }

  const nextMatrix = setMelodyCell(matrix, bar, step, note, 1);
  const nextCursor = nextMatrix === matrix ? cursor : cursor + 1;
  return {
    complete: nextCursor >= template.steps.length,
    cursor: nextCursor,
    matrix: nextMatrix,
    recorded: nextMatrix !== matrix,
    step,
  };
}

function useMelodyRecordingController({
  activeTrackId,
  audioEngine,
  bpm,
  dispatchAppCommand,
  melodyScaleId,
  selectedClip,
  withUndoCheckpoint,
}) {
  const [recordingState, setRecordingState] = useState(IDLE_MELODY_RECORDING_STATE);
  const activeNoteRef = useRef(null);
  const countInTimerRef = useRef(null);
  const freeStopTimerRef = useRef(null);
  const generationRef = useRef(0);
  const pendingSessionRef = useRef(null);
  const recordingStateRef = useRef(recordingState);
  const sessionRef = useRef(null);
  const contextKeyRef = useRef(`${activeTrackId}:${selectedClip?.id ?? ''}:${melodyScaleId}`);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const clearTimers = useCallback(() => {
    if (countInTimerRef.current !== null) {
      window.clearTimeout(countInTimerRef.current);
      countInTimerRef.current = null;
    }
    if (freeStopTimerRef.current !== null) {
      window.clearTimeout(freeStopTimerRef.current);
      freeStopTimerRef.current = null;
    }
  }, []);

  const writeMelodyMatrix = useCallback((nextMatrix) => {
    useMusicStore.getState().setTrackMatrix('melody', nextMatrix.melody);
  }, []);

  const finalizeActiveNote = useCallback(({
    endedAt = nowMilliseconds(),
    maxDurationSteps,
  } = {}) => {
    const activeNote = activeNoteRef.current;
    const session = sessionRef.current;
    if (!activeNote || session?.mode !== MELODY_RECORDING_MODES.FREE) return false;

    const durationSteps = getRecordedMelodyDurationSteps({
      bpm: session.bpm,
      endedAt,
      maxDurationSteps: maxDurationSteps
        ?? STEPS_PER_BAR - activeNote.startStep,
      startedAt: activeNote.startedAt,
    });
    const state = useMusicStore.getState();
    const nextMatrix = setMelodyCellDuration(
      state.matrix,
      session.bar,
      activeNote.startStep,
      durationSteps,
    );
    if (nextMatrix !== state.matrix) writeMelodyMatrix(nextMatrix);
    activeNoteRef.current = null;
    return true;
  }, [writeMelodyMatrix]);

  const stopRecording = useCallback(({
    stopTransport = true,
  } = {}) => {
    const session = sessionRef.current;
    generationRef.current += 1;
    clearTimers();
    if (session?.mode === MELODY_RECORDING_MODES.FREE) {
      finalizeActiveNote();
      if (stopTransport) {
        void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
      }
    }
    activeNoteRef.current = null;
    pendingSessionRef.current = null;
    sessionRef.current = null;
    setRecordingState(IDLE_MELODY_RECORDING_STATE);
  }, [clearTimers, dispatchAppCommand, finalizeActiveNote]);

  const prepareMelodyBar = useCallback((bar) => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearMelodyBar(state.matrix, bar);
      state.setTrackMatrix('melody', nextMatrix.melody);
    }, { force: true });
  }, [withUndoCheckpoint]);

  const beginTemplateRecording = useCallback((pendingSession) => {
    const template = getMelodyRhythmTemplate(pendingSession.templateId);
    if (!template) return;

    void dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
    prepareMelodyBar(pendingSession.bar);
    sessionRef.current = {
      bar: pendingSession.bar,
      bpm: pendingSession.bpm,
      cursor: 0,
      mode: MELODY_RECORDING_MODES.TEMPLATE,
      templateId: template.id,
      templateSteps: template.steps,
    };
    setRecordingState({
      countInBeat: null,
      mode: MELODY_RECORDING_MODES.TEMPLATE,
      phase: MELODY_RECORDING_PHASES.RECORDING,
      recordedNotes: 0,
      totalNotes: template.steps.length,
    });
  }, [dispatchAppCommand, prepareMelodyBar]);

  const beginFreeRecording = useCallback(async (pendingSession, generation) => {
    if (generationRef.current !== generation) return;
    prepareMelodyBar(pendingSession.bar);
    await dispatchAppCommand({
      type: APP_COMMAND_TYPES.TRANSPORT_SEEK,
      bar: pendingSession.bar,
      step: 0,
    });
    if (generationRef.current !== generation) return;

    sessionRef.current = {
      bar: pendingSession.bar,
      bpm: pendingSession.bpm,
      mode: MELODY_RECORDING_MODES.FREE,
      startedAt: nowMilliseconds(),
    };
    setRecordingState({
      countInBeat: null,
      mode: MELODY_RECORDING_MODES.FREE,
      phase: MELODY_RECORDING_PHASES.RECORDING,
      recordedNotes: 0,
      totalNotes: 0,
    });
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
    if (generationRef.current !== generation) return;

    const barDurationMilliseconds = (60000 / pendingSession.bpm) * 4;
    freeStopTimerRef.current = window.setTimeout(() => {
      finalizeActiveNote({
        maxDurationSteps: activeNoteRef.current
          ? STEPS_PER_BAR - activeNoteRef.current.startStep
          : STEPS_PER_BAR,
      });
      stopRecording();
    }, barDurationMilliseconds);
  }, [dispatchAppCommand, finalizeActiveNote, prepareMelodyBar, stopRecording]);

  const beginCountIn = useCallback(async (pendingSession) => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_STOP });
    await dispatchAppCommand({
      type: APP_COMMAND_TYPES.TRANSPORT_SEEK,
      bar: pendingSession.bar,
      step: 0,
    });
    if (generationRef.current !== generation) return;

    const beatDurationMilliseconds = 60000 / pendingSession.bpm;
    const tick = (beat) => {
      if (generationRef.current !== generation) return;
      if (beat === 0) {
        countInTimerRef.current = null;
        void beginFreeRecording(pendingSession, generation);
        return;
      }

      setRecordingState({
        countInBeat: beat,
        mode: MELODY_RECORDING_MODES.FREE,
        phase: MELODY_RECORDING_PHASES.COUNT_IN,
        recordedNotes: 0,
        totalNotes: 0,
      });
      void audioEngine.triggerDrumsStep(beat === 4 ? ['kick', 'hihat'] : 'hihat');
      countInTimerRef.current = window.setTimeout(() => tick(beat - 1), beatDurationMilliseconds);
    };

    tick(4);
  }, [audioEngine, beginFreeRecording, dispatchAppCommand]);

  const startPendingSession = useCallback(() => {
    const pendingSession = pendingSessionRef.current;
    if (!pendingSession) return;
    pendingSessionRef.current = null;
    if (pendingSession.mode === MELODY_RECORDING_MODES.TEMPLATE) {
      beginTemplateRecording(pendingSession);
      return;
    }
    void beginCountIn(pendingSession);
  }, [beginCountIn, beginTemplateRecording]);

  const requestRecordToggle = useCallback(() => {
    if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.IDLE) {
      if (recordingStateRef.current.phase === MELODY_RECORDING_PHASES.CONFIRM) {
        pendingSessionRef.current = null;
        setRecordingState(IDLE_MELODY_RECORDING_STATE);
        return;
      }
      stopRecording();
      return;
    }

    const state = useMusicStore.getState();
    const clip = state.clips.byId[state.selectedClipId];
    if (state.activeTrackId !== 'melody' || clip?.trackId !== 'melody') return;
    const templateId = clip.melodyRhythmTemplateId ?? null;
    const pendingSession = {
      bar: clip.bar,
      bpm: Number.isFinite(state.bpm) && state.bpm > 0 ? state.bpm : bpm,
      mode: getMelodyRecordingMode(templateId),
      templateId,
    };
    pendingSessionRef.current = pendingSession;

    if (hasMelodyBarNotes(state.matrix, clip.bar)) {
      setRecordingState({
        countInBeat: null,
        mode: pendingSession.mode,
        phase: MELODY_RECORDING_PHASES.CONFIRM,
        recordedNotes: 0,
        totalNotes: getMelodyRhythmTemplate(templateId)?.steps.length ?? 0,
      });
      return;
    }
    startPendingSession();
  }, [bpm, startPendingSession, stopRecording]);

  const confirmRecord = useCallback(() => {
    if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.CONFIRM) return;
    startPendingSession();
  }, [startPendingSession]);

  const cancelRecord = useCallback(() => {
    if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.CONFIRM) return;
    pendingSessionRef.current = null;
    setRecordingState(IDLE_MELODY_RECORDING_STATE);
  }, []);

  const handleNoteOn = useCallback((note) => {
    void audioEngine.triggerMelodyNote(note, '16n');
    const session = sessionRef.current;
    if (
      recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.RECORDING
      || !session
      || !isMelodyNoteInScale(melodyScaleId, note)
    ) {
      return { recorded: false };
    }

    if (session.mode === MELODY_RECORDING_MODES.TEMPLATE) {
      const state = useMusicStore.getState();
      const result = recordTemplateMelodyNote(
        state.matrix,
        session.bar,
        session.templateId,
        session.cursor,
        note,
      );
      if (!result.recorded) return { recorded: false };
      writeMelodyMatrix(result.matrix);
      session.cursor = result.cursor;
      const recordedNotes = result.cursor;
      const totalNotes = session.templateSteps.length;
      setRecordingState((current) => ({ ...current, recordedNotes, totalNotes }));
      if (result.complete) {
        window.setTimeout(() => stopRecording({ stopTransport: false }), 0);
      }
      return { recorded: true, step: result.step };
    }

    const state = useMusicStore.getState();
    if (state.currentBar !== session.bar) return { recorded: false };
    const step = Math.max(0, Math.min(STEPS_PER_BAR - 1, state.currentStep));
    if (activeNoteRef.current) {
      const previousStartStep = activeNoteRef.current.startStep;
      finalizeActiveNote({
        maxDurationSteps: Math.max(1, step - previousStartStep),
      });
    }
    const currentState = useMusicStore.getState();
    const nextMatrix = setMelodyCell(currentState.matrix, session.bar, step, note, 1);
    writeMelodyMatrix(nextMatrix);
    activeNoteRef.current = {
      note,
      startedAt: nowMilliseconds(),
      startStep: step,
    };
    setRecordingState((current) => ({
      ...current,
      recordedNotes: current.recordedNotes + 1,
    }));
    return { recorded: true, step };
  }, [audioEngine, finalizeActiveNote, melodyScaleId, stopRecording, writeMelodyMatrix]);

  const handleNoteOff = useCallback((note) => {
    const activeNote = activeNoteRef.current;
    if (!activeNote || activeNote.note !== note) return { recorded: false };
    finalizeActiveNote();
    return { recorded: true, step: activeNote.startStep };
  }, [finalizeActiveNote]);

  useEffect(() => {
    const contextKey = `${activeTrackId}:${selectedClip?.id ?? ''}:${melodyScaleId}`;
    if (contextKeyRef.current !== contextKey) {
      contextKeyRef.current = contextKey;
      if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.IDLE) {
        stopRecording();
      }
    }
  }, [activeTrackId, melodyScaleId, selectedClip?.id, stopRecording]);

  useEffect(() => () => {
    generationRef.current += 1;
    clearTimers();
  }, [clearTimers]);

  return {
    cancelRecord,
    confirmRecord,
    handleNoteOff,
    handleNoteOn,
    recordingState,
    requestRecordToggle,
    stopRecording,
  };
}

export {
  getMelodyRecordingMode,
  getRecordedMelodyDurationSteps,
  hasMelodyBarNotes,
  IDLE_MELODY_RECORDING_STATE,
  MELODY_RECORDING_MODES,
  MELODY_RECORDING_PHASES,
  recordTemplateMelodyNote,
  useMelodyRecordingController,
};
