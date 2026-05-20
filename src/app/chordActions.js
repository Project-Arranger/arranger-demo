import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  CHORD_TEMPLATES,
  createChordCell,
  createChordNoteCell,
  getChordCellNotes,
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

function setChordCell(matrix, barIndex, spanIndex, root) {
  const step = getChordSpanStep(spanIndex);
  if (step === null) return matrix;
  const firstCell = createChordCellWithPreviousNotes(root, getMatrixChordStep(matrix, barIndex, step));
  const sustainCell = createChordCellWithPreviousNotes(root, getMatrixChordStep(matrix, barIndex, step + 1));
  if (!firstCell || !sustainCell) return matrix;

  return setChordStepCells(matrix, barIndex, {
    [step]: firstCell,
    [step + 1]: sustainCell,
  });
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

function getMatrixChordStep(matrix, barIndex, step) {
  return matrix?.chord?.[barIndex]?.[step] ?? null;
}

function createChordCellWithPreviousNotes(root, previousCell) {
  const cell = createChordCell(root);
  if (!cell) return null;

  const addedNotes = getChordCellNotes(previousCell);
  return addedNotes.length ? { ...cell, addedNotes } : cell;
}

function setChordStepCells(matrix, barIndex, cellsByStep) {
  if (!matrix?.chord?.[barIndex]) return matrix;

  const nextBar = [...matrix.chord[barIndex]];
  Object.entries(cellsByStep).forEach(([stepKey, cell]) => {
    const step = Number(stepKey);
    if (Number.isInteger(step) && step >= 0 && step < nextBar.length) {
      nextBar[step] = cell;
    }
  });

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

  return setChordStepCells(matrix, barIndex, {
    [step + columnIndex]: cell,
  });
}

function toggleChordNoteStep(matrix, barIndex, spanIndex, columnIndex, note) {
  const currentCell = getChordStepCell(matrix, barIndex, spanIndex, columnIndex);
  const nextCell = toggleChordNoteCell(currentCell, note);
  const step = getChordSpanStep(spanIndex);
  if (step === null || !Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= 4) return matrix;

  return setChordStepCells(matrix, barIndex, {
    [step + columnIndex]: nextCell,
  });
}

function clearChordCell(matrix, barIndex, spanIndex) {
  const step = getChordSpanStep(spanIndex);
  if (step === null) return matrix;

  return replaceChordBeat(matrix, barIndex, spanIndex, []);
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

function getChordBarDisplayLabel(matrix, barIndex) {
  return getChordSpanDisplayLabel(matrix, barIndex, 0);
}

function getChordSpanDisplayLabel(matrix, barIndex, spanIndex) {
  const mainCell = getChordCell(matrix, barIndex, spanIndex);
  if (mainCell?.type !== 'chord') return null;

  const addedNotes = Array.from({ length: 4 }, (_, columnIndex) => (
    getChordStepCell(matrix, barIndex, spanIndex, columnIndex)
  )).reduce((notes, cell) => {
    getChordCellNotes(cell).forEach((note) => {
      if (!notes.includes(note)) notes.push(note);
    });
    return notes;
  }, []);

  return addedNotes.length ? `${mainCell.label} + ${addedNotes.join('/')}` : mainCell.label;
}

export {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordStepCell,
  getChordCell,
  getChordBarDisplayLabel,
  getChordSpanDisplayLabel,
  getExistingChordClipBars,
  setChordCell,
  setChordNoteCell,
  toggleChordNoteStep,
};
