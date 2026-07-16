import { MELODY_NOTE_IDS } from '../data/melodyScales.js';
import { STEPS_PER_BAR } from '../domain/musicConstants.js';

function isValidMelodyNote(note) {
  return MELODY_NOTE_IDS.includes(note);
}

function normalizeMelodyDurationSteps(durationSteps, maxDurationSteps = STEPS_PER_BAR) {
  if (!Number.isFinite(durationSteps)) return 1;
  return Math.max(1, Math.min(maxDurationSteps, Math.round(durationSteps)));
}

function createMelodyCell(note, durationSteps = 1) {
  if (!isValidMelodyNote(note)) return null;
  const normalizedDuration = normalizeMelodyDurationSteps(durationSteps);
  return normalizedDuration === 1
    ? { type: 'melody', note }
    : { type: 'melody', note, durationSteps: normalizedDuration };
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

function getMelodyCellDurationSteps(cell, startStep = 0) {
  if (cell?.type !== 'melody') return 0;
  return normalizeMelodyDurationSteps(
    cell.durationSteps ?? 1,
    STEPS_PER_BAR - startStep,
  );
}

function getMelodyCellRenderState(matrix, bar, step, note) {
  const melodyBar = matrix?.melody?.[bar];
  if (!Array.isArray(melodyBar) || !Number.isInteger(step)) {
    return { active: false, durationSteps: 0, start: false, startStep: null };
  }

  for (let startStep = step; startStep >= 0; startStep -= 1) {
    const cell = melodyBar[startStep];
    if (cell?.type !== 'melody' || cell.note !== note) continue;
    const durationSteps = getMelodyCellDurationSteps(cell, startStep);
    if (startStep + durationSteps <= step) continue;
    return {
      active: true,
      durationSteps,
      start: startStep === step,
      startStep,
    };
  }

  return { active: false, durationSteps: 0, start: false, startStep: null };
}

function setMelodyCell(matrix, bar, step, note, durationSteps = 1) {
  if (!matrix?.melody?.[bar] || !Number.isInteger(step) || step < 0 || step >= STEPS_PER_BAR) {
    return matrix;
  }

  const cell = createMelodyCell(note, normalizeMelodyDurationSteps(
    durationSteps,
    STEPS_PER_BAR - step,
  ));
  if (!cell) return matrix;

  const nextMatrix = cloneMelodyMatrix(matrix);
  nextMatrix.melody[bar][step] = cell;
  return nextMatrix;
}

function setMelodyCellDuration(matrix, bar, step, durationSteps) {
  const cell = matrix?.melody?.[bar]?.[step];
  if (cell?.type !== 'melody') return matrix;
  return setMelodyCell(matrix, bar, step, cell.note, durationSteps);
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
  getMelodyCellDurationSteps,
  getMelodyCellRenderState,
  isMelodyCellActive,
  isValidMelodyNote,
  normalizeMelodyDurationSteps,
  setMelodyCell,
  setMelodyCellDuration,
  toggleMelodyCell,
};
