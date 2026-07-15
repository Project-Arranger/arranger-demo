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
    melody: matrix.melody.map((bar) => [...bar]),
  };
}

function isMelodyCellActive(matrix, bar, step, note) {
  return matrix?.melody?.[bar]?.[step]?.type === 'melody'
    && matrix.melody[bar][step].note === note
    && isValidMelodyNote(note);
}

function toggleMelodyCell(matrix, bar, step, note) {
  if (!matrix?.melody?.[bar] || !Number.isInteger(step) || step < 0 || step >= STEPS_PER_BAR) {
    return matrix;
  }

  const nextMatrix = cloneMelodyMatrix(matrix);
  nextMatrix.melody[bar][step] = isMelodyCellActive(matrix, bar, step, note)
    ? null
    : createMelodyCell(note);
  return nextMatrix;
}

function clearMelodyBar(matrix, bar) {
  if (!matrix?.melody?.[bar]) return matrix;

  const nextMatrix = cloneMelodyMatrix(matrix);
  nextMatrix.melody[bar] = nextMatrix.melody[bar].map(() => null);
  return nextMatrix;
}

export {
  clearMelodyBar,
  createMelodyCell,
  isMelodyCellActive,
  isValidMelodyNote,
  toggleMelodyCell,
};
