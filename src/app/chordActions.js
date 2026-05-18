import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  createChordCell,
  getChordSpanStep,
} from '../domain/chordCells.js';

function getChordCell(matrix, barIndex, spanIndex) {
  const step = getChordSpanStep(spanIndex);
  if (step === null) return null;

  return matrix?.chord?.[barIndex]?.[step] ?? null;
}

function replaceChordStep(matrix, barIndex, stepIndex, cell) {
  if (!matrix?.chord?.[barIndex] || !Number.isInteger(stepIndex)) return matrix;

  const nextBar = [...matrix.chord[barIndex]];
  nextBar[stepIndex] = cell;

  const nextChord = [...matrix.chord];
  nextChord[barIndex] = nextBar;

  return {
    ...matrix,
    chord: nextChord,
  };
}

function setChordCell(matrix, barIndex, spanIndex, root) {
  const step = getChordSpanStep(spanIndex);
  const cell = createChordCell(root);
  if (step === null || !cell) return matrix;

  return replaceChordStep(matrix, barIndex, step, cell);
}

function clearChordCell(matrix, barIndex, spanIndex) {
  const step = getChordSpanStep(spanIndex);
  if (step === null) return matrix;

  return replaceChordStep(matrix, barIndex, step, null);
}

function clearChordBar(matrix, barIndex) {
  if (!matrix?.chord?.[barIndex]) return matrix;

  const nextChord = [...matrix.chord];
  nextChord[barIndex] = Array.from({ length: STEPS_PER_BAR }, () => null);

  return {
    ...matrix,
    chord: nextChord,
  };
}

export {
  clearChordBar,
  clearChordCell,
  getChordCell,
  setChordCell,
};
