import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  CHORD_TEMPLATES,
  createChordCell,
  createChordNoteCell,
  getChordSpanStep,
  toggleChordNoteCell,
} from '../domain/chordCells.js';

function getChordCell(matrix, barIndex, spanIndex) {
  const step = getChordSpanStep(spanIndex);
  if (step === null) return null;

  return matrix?.chord?.[barIndex]?.[step] ?? null;
}

function getChordStepCell(matrix, barIndex, spanIndex, columnIndex) {
  const step = getChordSpanStep(spanIndex);
  if (step === null || !Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= 4) return null;

  return matrix?.chord?.[barIndex]?.[step + columnIndex] ?? null;
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

function replaceChordBeat(matrix, barIndex, spanIndex, cells) {
  const step = getChordSpanStep(spanIndex);
  if (step === null || !matrix?.chord?.[barIndex]) return matrix;

  const nextBar = [...matrix.chord[barIndex]];
  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    nextBar[step + columnIndex] = cells[columnIndex] ?? null;
  }

  const nextChord = [...matrix.chord];
  nextChord[barIndex] = nextBar;

  return {
    ...matrix,
    chord: nextChord,
  };
}

function setChordNoteCell(matrix, barIndex, spanIndex, columnIndex, note) {
  const step = getChordSpanStep(spanIndex);
  const cell = createChordNoteCell(note);
  if (step === null || !cell || !Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= 4) {
    return matrix;
  }

  const cells = Array.from({ length: 4 }, () => null);
  cells[columnIndex] = cell;

  return replaceChordBeat(matrix, barIndex, spanIndex, cells);
}

function toggleChordNoteStep(matrix, barIndex, spanIndex, columnIndex, note) {
  const currentCell = getChordStepCell(matrix, barIndex, spanIndex, columnIndex);
  const nextCell = toggleChordNoteCell(currentCell, note);

  if (!nextCell) return replaceChordBeat(matrix, barIndex, spanIndex, []);
  return setChordNoteCell(matrix, barIndex, spanIndex, columnIndex, note);
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

function getExistingChordClipBars(clips) {
  return (clips?.ids ?? [])
    .map((id) => clips.byId?.[id])
    .filter((clip) => clip?.trackId === 'chord')
    .map((clip) => clip.bar)
    .sort((a, b) => a - b);
}

function applyChordTemplateToExistingClips(matrix, clips, templateId) {
  const template = CHORD_TEMPLATES[templateId];
  if (!template) return matrix;

  return getExistingChordClipBars(clips).reduce((nextMatrix, barIndex, index) => (
    setChordCell(nextMatrix, barIndex, 0, template.chords[index % template.chords.length])
  ), matrix);
}

export {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordStepCell,
  getChordCell,
  getExistingChordClipBars,
  setChordCell,
  setChordNoteCell,
  toggleChordNoteStep,
};
