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
  replaceMelodyBarWithSequence,
  setMelodyCell,
  setMelodyCellDuration,
} from './melodyActions.js';
import { getMelodyRhythmTemplate } from './melodyRhythmTemplates.js';

const MELODY_RECORDING_PHASES = Object.freeze({
  AUDITION: 'audition',
  COUNT_IN: 'count-in',
  CONFIRM: 'confirm',
  IDLE: 'idle',
  OVERVIEW: 'overview',
  RECORDING: 'recording',
  SEQUENCE_CAPTURE: 'sequence-capture',
  STEP_EDIT: 'step-edit',
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
  selectedStep: null,
  sequenceNotes: Object.freeze([]),
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

function createTemplateRecordingState(templateId, phase, overrides = {}) {
  const template = getMelodyRhythmTemplate(templateId);
  if (!template) return { ...IDLE_MELODY_RECORDING_STATE };

  return {
    countInBeat: null,
    mode: MELODY_RECORDING_MODES.TEMPLATE,
    phase,
    recordedNotes: 0,
    selectedStep: null,
    sequenceNotes: [],
    totalNotes: template.steps.length,
    ...overrides,
  };
}

function getMelodyRecordingRestState({ activeTrackId, selectedClip } = {}) {
  const templateId = activeTrackId === 'melody' && selectedClip?.trackId === 'melody'
    ? selectedClip.melodyRhythmTemplateId
    : null;
  return getMelodyRhythmTemplate(templateId)
    ? createTemplateRecordingState(templateId, MELODY_RECORDING_PHASES.OVERVIEW)
    : { ...IDLE_MELODY_RECORDING_STATE };
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

function appendMelodySequenceNote(sequenceNotes, note, totalNotes) {
  const currentNotes = Array.isArray(sequenceNotes) ? sequenceNotes : [];
  if (
    typeof note !== 'string'
    || !Number.isInteger(totalNotes)
    || totalNotes <= 0
    || currentNotes.length >= totalNotes
  ) {
    return { accepted: false, complete: false, sequenceNotes: currentNotes };
  }

  const nextNotes = [...currentNotes, note];
  return {
    accepted: true,
    complete: nextNotes.length === totalNotes,
    sequenceNotes: nextNotes,
  };
}

function captureMelodySequenceNote(session, note) {
  if (
    !session
    || session.completed
    || !Array.isArray(session.templateSteps)
  ) {
    return { accepted: false, complete: false, sequenceNotes: session?.sequenceNotes ?? [] };
  }

  const appendResult = appendMelodySequenceNote(
    session.sequenceNotes,
    note,
    session.templateSteps.length,
  );
  if (!appendResult.accepted) return appendResult;

  session.sequenceNotes = appendResult.sequenceNotes;
  session.completed = appendResult.complete;
  return appendResult;
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
  const activeFreeNoteRef = useRef(null);
  const activeInputNotesRef = useRef(new Set());
  const countInTimerRef = useRef(null);
  const freeStopTimerRef = useRef(null);
  const generationRef = useRef(0);
  const pendingSessionRef = useRef(null);
  const recordingStateRef = useRef(recordingState);
  const sessionRef = useRef(null);
  const contextKeyRef = useRef(`${activeTrackId}:${selectedClip?.id ?? ''}`);
  const scaleIdRef = useRef(melodyScaleId);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const updateRecordingState = useCallback((nextStateOrUpdater) => {
    const nextState = typeof nextStateOrUpdater === 'function'
      ? nextStateOrUpdater(recordingStateRef.current)
      : nextStateOrUpdater;
    recordingStateRef.current = nextState;
    setRecordingState(nextState);
    return nextState;
  }, []);

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

  const clearActiveNotes = useCallback(() => {
    activeInputNotesRef.current.clear();
  }, []);

  const stopActiveNotes = useCallback(() => {
    clearActiveNotes();
    if (typeof audioEngine.stopMelodyVoices === 'function') {
      audioEngine.stopMelodyVoices();
      return;
    }
    audioEngine.releaseAllMelodyInputNotes?.();
  }, [audioEngine, clearActiveNotes]);

  const finalizeActiveNote = useCallback(({
    endedAt = nowMilliseconds(),
    maxDurationSteps,
  } = {}) => {
    const activeNote = activeFreeNoteRef.current;
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
    activeFreeNoteRef.current = null;
    return true;
  }, [writeMelodyMatrix]);

  const getCurrentRestState = useCallback(() => {
    const state = useMusicStore.getState();
    return getMelodyRecordingRestState({
      activeTrackId: state.activeTrackId,
      selectedClip: state.clips.byId[state.selectedClipId],
    });
  }, []);

  const pauseTransport = useCallback(async () => {
    if (!useMusicStore.getState().isPlaying) return;
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
  }, [dispatchAppCommand]);

  const stopRecording = useCallback(({
    stopTransport = true,
  } = {}) => {
    const currentPhase = recordingStateRef.current.phase;
    const session = sessionRef.current;
    generationRef.current += 1;
    clearTimers();
    if (session?.mode === MELODY_RECORDING_MODES.FREE) finalizeActiveNote();
    if (
      stopTransport
      && [
        MELODY_RECORDING_PHASES.COUNT_IN,
        MELODY_RECORDING_PHASES.RECORDING,
      ].includes(currentPhase)
    ) {
      void pauseTransport();
    }
    activeFreeNoteRef.current = null;
    pendingSessionRef.current = null;
    sessionRef.current = null;
    clearActiveNotes();
    updateRecordingState(getCurrentRestState());
  }, [
    clearActiveNotes,
    clearTimers,
    finalizeActiveNote,
    getCurrentRestState,
    pauseTransport,
    updateRecordingState,
  ]);

  const prepareMelodyBar = useCallback((bar) => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = clearMelodyBar(state.matrix, bar);
      state.setTrackMatrix('melody', nextMatrix.melody);
    }, { force: true });
  }, [withUndoCheckpoint]);

  const beginTemplateSequenceCapture = useCallback((pendingSession) => {
    const template = getMelodyRhythmTemplate(pendingSession.templateId);
    if (!template) return;

    generationRef.current += 1;
    clearTimers();
    clearActiveNotes();
    sessionRef.current = {
      bar: pendingSession.bar,
      bpm: pendingSession.bpm,
      completed: false,
      mode: MELODY_RECORDING_MODES.TEMPLATE,
      sequenceNotes: [],
      templateId: template.id,
      templateSteps: [...template.steps],
    };
    updateRecordingState(createTemplateRecordingState(
      template.id,
      MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE,
    ));
  }, [clearActiveNotes, clearTimers, updateRecordingState]);

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
    updateRecordingState({
      ...IDLE_MELODY_RECORDING_STATE,
      mode: MELODY_RECORDING_MODES.FREE,
      phase: MELODY_RECORDING_PHASES.RECORDING,
    });
    await dispatchAppCommand({ type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY });
    if (generationRef.current !== generation) return;

    const barDurationMilliseconds = (60000 / pendingSession.bpm) * 4;
    freeStopTimerRef.current = window.setTimeout(() => {
      finalizeActiveNote({
        maxDurationSteps: activeFreeNoteRef.current
          ? STEPS_PER_BAR - activeFreeNoteRef.current.startStep
          : STEPS_PER_BAR,
      });
      stopRecording();
    }, barDurationMilliseconds);
  }, [dispatchAppCommand, finalizeActiveNote, prepareMelodyBar, stopRecording, updateRecordingState]);

  const beginCountIn = useCallback(async (pendingSession) => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    await pauseTransport();
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

      updateRecordingState({
        ...IDLE_MELODY_RECORDING_STATE,
        countInBeat: beat,
        mode: MELODY_RECORDING_MODES.FREE,
        phase: MELODY_RECORDING_PHASES.COUNT_IN,
      });
      void audioEngine.triggerDrumsStep(beat === 4 ? ['kick', 'hihat'] : 'hihat');
      countInTimerRef.current = window.setTimeout(() => tick(beat - 1), beatDurationMilliseconds);
    };

    tick(4);
  }, [audioEngine, beginFreeRecording, dispatchAppCommand, pauseTransport, updateRecordingState]);

  const startPendingSession = useCallback(() => {
    const pendingSession = pendingSessionRef.current;
    if (!pendingSession) return;
    pendingSessionRef.current = null;
    if (pendingSession.mode === MELODY_RECORDING_MODES.TEMPLATE) {
      beginTemplateSequenceCapture(pendingSession);
      return;
    }
    void beginCountIn(pendingSession);
  }, [beginCountIn, beginTemplateSequenceCapture]);

  const setTemplateOverview = useCallback(() => {
    const state = useMusicStore.getState();
    const clip = state.clips.byId[state.selectedClipId];
    const template = state.activeTrackId === 'melody' && clip?.trackId === 'melody'
      ? getMelodyRhythmTemplate(clip.melodyRhythmTemplateId)
      : null;
    if (!template) return false;

    generationRef.current += 1;
    clearTimers();
    pendingSessionRef.current = null;
    sessionRef.current = null;
    clearActiveNotes();
    updateRecordingState(createTemplateRecordingState(
      template.id,
      MELODY_RECORDING_PHASES.OVERVIEW,
    ));
    return true;
  }, [clearActiveNotes, clearTimers, updateRecordingState]);

  const toggleAudition = useCallback(() => {
    const currentPhase = recordingStateRef.current.phase;
    if (currentPhase === MELODY_RECORDING_PHASES.AUDITION) {
      return setTemplateOverview();
    }
    if (currentPhase !== MELODY_RECORDING_PHASES.OVERVIEW) return false;

    const state = useMusicStore.getState();
    const clip = state.clips.byId[state.selectedClipId];
    const template = state.activeTrackId === 'melody' && clip?.trackId === 'melody'
      ? getMelodyRhythmTemplate(clip.melodyRhythmTemplateId)
      : null;
    if (!template) return false;

    generationRef.current += 1;
    clearTimers();
    pendingSessionRef.current = null;
    sessionRef.current = null;
    clearActiveNotes();
    updateRecordingState(createTemplateRecordingState(
      template.id,
      MELODY_RECORDING_PHASES.AUDITION,
    ));
    return true;
  }, [clearActiveNotes, clearTimers, setTemplateOverview, updateRecordingState]);

  const requestWriteToggle = useCallback(() => {
    const currentPhase = recordingStateRef.current.phase;
    if (currentPhase === MELODY_RECORDING_PHASES.CONFIRM) {
      startPendingSession();
      return;
    }
    if (currentPhase === MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE) {
      setTemplateOverview();
      return;
    }
    if (
      currentPhase === MELODY_RECORDING_PHASES.COUNT_IN
      || currentPhase === MELODY_RECORDING_PHASES.RECORDING
    ) {
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
    clearActiveNotes();

    if (
      pendingSession.mode === MELODY_RECORDING_MODES.TEMPLATE
      && [
        MELODY_RECORDING_PHASES.AUDITION,
        MELODY_RECORDING_PHASES.OVERVIEW,
        MELODY_RECORDING_PHASES.STEP_EDIT,
      ].includes(currentPhase)
    ) {
      pendingSessionRef.current = pendingSession;
      if (hasMelodyBarNotes(state.matrix, clip.bar)) {
        updateRecordingState(createTemplateRecordingState(
          templateId,
          MELODY_RECORDING_PHASES.CONFIRM,
        ));
        return;
      }
      startPendingSession();
      return;
    }

    if (currentPhase !== MELODY_RECORDING_PHASES.IDLE) return;
    pendingSessionRef.current = pendingSession;
    if (hasMelodyBarNotes(state.matrix, clip.bar)) {
      updateRecordingState({
        ...IDLE_MELODY_RECORDING_STATE,
        mode: pendingSession.mode,
        phase: MELODY_RECORDING_PHASES.CONFIRM,
      });
      return;
    }
    startPendingSession();
  }, [
    bpm,
    clearActiveNotes,
    setTemplateOverview,
    startPendingSession,
    stopRecording,
    updateRecordingState,
  ]);

  const confirmRecord = useCallback(() => {
    if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.CONFIRM) return;
    startPendingSession();
  }, [startPendingSession]);

  const cancelRecord = useCallback(() => {
    if (recordingStateRef.current.phase !== MELODY_RECORDING_PHASES.CONFIRM) return;
    pendingSessionRef.current = null;
    if (recordingStateRef.current.mode === MELODY_RECORDING_MODES.TEMPLATE) {
      setTemplateOverview();
      return;
    }
    updateRecordingState({ ...IDLE_MELODY_RECORDING_STATE });
  }, [setTemplateOverview, updateRecordingState]);

  const selectTemplateStep = useCallback((bar, step) => {
    const state = useMusicStore.getState();
    const clip = state.clips.byId[state.selectedClipId];
    const template = getMelodyRhythmTemplate(clip?.melodyRhythmTemplateId);
    const currentPhase = recordingStateRef.current.phase;
    if (
      state.activeTrackId !== 'melody'
      || clip?.trackId !== 'melody'
      || clip.bar !== bar
      || !template?.steps.includes(step)
      || [
        MELODY_RECORDING_PHASES.CONFIRM,
        MELODY_RECORDING_PHASES.COUNT_IN,
        MELODY_RECORDING_PHASES.RECORDING,
        MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE,
      ].includes(currentPhase)
    ) {
      return false;
    }

    clearActiveNotes();
    if (
      currentPhase === MELODY_RECORDING_PHASES.STEP_EDIT
      && recordingStateRef.current.selectedStep === step
    ) {
      updateRecordingState(createTemplateRecordingState(
        template.id,
        MELODY_RECORDING_PHASES.OVERVIEW,
      ));
      return true;
    }

    updateRecordingState(createTemplateRecordingState(
      template.id,
      MELODY_RECORDING_PHASES.STEP_EDIT,
      { selectedStep: step },
    ));
    return true;
  }, [clearActiveNotes, updateRecordingState]);

  const commitTemplateSequence = useCallback((session, sequenceNotes) => {
    withUndoCheckpoint(() => {
      const state = useMusicStore.getState();
      const nextMatrix = replaceMelodyBarWithSequence(
        state.matrix,
        session.bar,
        session.templateSteps,
        sequenceNotes,
      );
      state.setTrackMatrix('melody', nextMatrix.melody);
    }, { force: true });

    generationRef.current += 1;
    sessionRef.current = null;
    clearActiveNotes();
    updateRecordingState(createTemplateRecordingState(
      session.templateId,
      MELODY_RECORDING_PHASES.OVERVIEW,
    ));
    void (async () => {
      await pauseTransport();
      await dispatchAppCommand({
        type: APP_COMMAND_TYPES.TRANSPORT_SEEK,
        bar: session.bar,
        step: 0,
      });
    })();
  }, [clearActiveNotes, dispatchAppCommand, pauseTransport, updateRecordingState, withUndoCheckpoint]);

  const handleNoteOn = useCallback((note) => {
    const activeInputNotes = activeInputNotesRef.current;
    if (activeInputNotes.has(note)) return { recorded: false };
    const current = recordingStateRef.current;
    activeInputNotes.add(note);
    void audioEngine.triggerMelodyInputOneShot(note);

    if (!isMelodyNoteInScale(melodyScaleId, note)) return { recorded: false };

    if (current.phase === MELODY_RECORDING_PHASES.STEP_EDIT) {
      const state = useMusicStore.getState();
      const clip = state.clips.byId[state.selectedClipId];
      const template = getMelodyRhythmTemplate(clip?.melodyRhythmTemplateId);
      if (
        clip?.trackId !== 'melody'
        || !Number.isInteger(current.selectedStep)
        || !template?.steps.includes(current.selectedStep)
      ) {
        return { recorded: false };
      }

      withUndoCheckpoint(() => {
        const latestState = useMusicStore.getState();
        const nextMatrix = setMelodyCell(
          latestState.matrix,
          clip.bar,
          current.selectedStep,
          note,
          1,
        );
        latestState.setTrackMatrix('melody', nextMatrix.melody);
      });
      clearActiveNotes();
      updateRecordingState(createTemplateRecordingState(
        template.id,
        MELODY_RECORDING_PHASES.OVERVIEW,
      ));
      return { recorded: true, step: current.selectedStep };
    }

    if (
      current.phase === MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE
      && sessionRef.current?.mode === MELODY_RECORDING_MODES.TEMPLATE
    ) {
      const session = sessionRef.current;
      const appendResult = captureMelodySequenceNote(session, note);
      if (!appendResult.accepted) return { recorded: false };
      const { sequenceNotes } = appendResult;
      const recordedNotes = sequenceNotes.length;
      updateRecordingState((state) => ({
        ...state,
        recordedNotes,
        sequenceNotes: [...sequenceNotes],
      }));
      if (appendResult.complete) {
        commitTemplateSequence(session, sequenceNotes);
      }
      return {
        recorded: true,
        step: session.templateSteps[recordedNotes - 1],
      };
    }

    const session = sessionRef.current;
    if (
      current.phase !== MELODY_RECORDING_PHASES.RECORDING
      || session?.mode !== MELODY_RECORDING_MODES.FREE
    ) {
      return { recorded: false };
    }

    const state = useMusicStore.getState();
    if (state.currentBar !== session.bar) return { recorded: false };
    const step = Math.max(0, Math.min(STEPS_PER_BAR - 1, state.currentStep));
    if (activeFreeNoteRef.current) {
      const previousStartStep = activeFreeNoteRef.current.startStep;
      finalizeActiveNote({
        maxDurationSteps: Math.max(1, step - previousStartStep),
      });
    }
    const currentState = useMusicStore.getState();
    const nextMatrix = setMelodyCell(currentState.matrix, session.bar, step, note, 1);
    writeMelodyMatrix(nextMatrix);
    activeFreeNoteRef.current = {
      note,
      startedAt: nowMilliseconds(),
      startStep: step,
    };
    updateRecordingState((stateValue) => ({
      ...stateValue,
      recordedNotes: stateValue.recordedNotes + 1,
    }));
    return { recorded: true, step };
  }, [
    audioEngine,
    clearActiveNotes,
    commitTemplateSequence,
    finalizeActiveNote,
    melodyScaleId,
    updateRecordingState,
    withUndoCheckpoint,
    writeMelodyMatrix,
  ]);

  const handleNoteOff = useCallback((note) => {
    activeInputNotesRef.current.delete(note);
    const activeNote = activeFreeNoteRef.current;
    if (!activeNote || activeNote.note !== note) return { recorded: false };
    finalizeActiveNote();
    return { recorded: true, step: activeNote.startStep };
  }, [finalizeActiveNote]);

  useEffect(() => {
    const contextKey = `${activeTrackId}:${selectedClip?.id ?? ''}`;
    if (contextKeyRef.current === contextKey) return;
    contextKeyRef.current = contextKey;
    stopRecording();
  }, [activeTrackId, selectedClip?.id, stopRecording]);

  useEffect(() => {
    if (scaleIdRef.current === melodyScaleId) return;
    scaleIdRef.current = melodyScaleId;
    clearActiveNotes();
  }, [clearActiveNotes, melodyScaleId]);

  useEffect(() => () => {
    generationRef.current += 1;
    clearTimers();
    stopActiveNotes();
  }, [clearTimers, stopActiveNotes]);

  return {
    cancelRecord,
    confirmRecord,
    handleNoteOff,
    handleNoteOn,
    recordingState,
    clearActiveNotes,
    requestWriteToggle,
    selectTemplateStep,
    toggleAudition,
    stopRecording,
  };
}

export {
  appendMelodySequenceNote,
  captureMelodySequenceNote,
  createTemplateRecordingState,
  getMelodyRecordingMode,
  getMelodyRecordingRestState,
  getRecordedMelodyDurationSteps,
  hasMelodyBarNotes,
  IDLE_MELODY_RECORDING_STATE,
  MELODY_RECORDING_MODES,
  MELODY_RECORDING_PHASES,
  recordTemplateMelodyNote,
  useMelodyRecordingController,
};
