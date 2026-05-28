import { MELODY_NOTE_IDS } from '../data/melodyScales.js';
import { STEPS_PER_BAR } from '../domain/musicConstants.js';

function isValidMelodyNote(note) {
  return MELODY_NOTE_IDS.includes(note);
}

function createMelodyCell(note) {
  if (!isValidMelodyNote(note)) return null;
  return { type: 'melody', note };
}

function cloneMelodyMatrix(matrix) {
  return {
    ...matrix,
    lead: matrix.lead.map((bar) => [...bar]),
  };
}

function isMelodyCellActive(matrix, bar, step, note) {
  return matrix?.lead?.[bar]?.[step]?.type === 'melody'
    && matrix.lead[bar][step].note === note;
}

function toggleMelodyCell(matrix, bar, step, note) {
  const nextCell = isMelodyCellActive(matrix, bar, step, note)
    ? null
    : createMelodyCell(note);

  const nextMatrix = cloneMelodyMatrix(matrix);
  nextMatrix.lead[bar][step] = nextCell;
  return nextMatrix;
}

function clearMelodyBar(matrix, bar) {
  const nextMatrix = cloneMelodyMatrix(matrix);
  nextMatrix.lead[bar] = nextMatrix.lead[bar].map(() => null);
  return nextMatrix;
}

function getOpenMelodyClip(state) {
  const clip = state?.clips?.byId?.[state.selectedClipId];
  if (state?.activeTrackId !== 'lead' || clip?.trackId !== 'lead') return null;
  return clip;
}

function recordMelodyKeyInput(store, note) {
  const state = store?.getState?.();
  const clip = getOpenMelodyClip(state);
  const step = state?.currentStep;
  const nextCell = createMelodyCell(note);

  if (
    !clip
    || !nextCell
    || !Number.isInteger(step)
    || step < 0
    || step >= STEPS_PER_BAR
    || typeof state.setCell !== 'function'
  ) {
    return false;
  }

  state.setCell('lead', clip.bar, step, nextCell);

  if (!state.isPlaying && typeof store.getState().setTransportPosition === 'function') {
    store.getState().setTransportPosition(clip.bar, Math.min(step + 1, STEPS_PER_BAR - 1));
  }

  return true;
}

export {
  clearMelodyBar,
  createMelodyCell,
  isMelodyCellActive,
  isValidMelodyNote,
  recordMelodyKeyInput,
  toggleMelodyCell,
};
