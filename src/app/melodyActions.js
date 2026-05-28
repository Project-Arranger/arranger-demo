import { MELODY_NOTE_IDS } from '../data/melodyScales.js';

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

export {
  clearMelodyBar,
  createMelodyCell,
  isMelodyCellActive,
  isValidMelodyNote,
  toggleMelodyCell,
};
