import {
  BEATS_PER_BAR,
  STEPS_PER_BAR,
} from '../domain/musicConstants.js';
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
  if (!firstCell) return matrix;

  const nextCells = {
    [step]: firstCell,
  };
  const staleSecondCell = getMatrixChordStep(matrix, barIndex, step + 1);
  if (staleSecondCell?.type === 'chord' && !staleSecondCell.grooveTemplateId) {
    nextCells[step + 1] = null;
  }

  return setChordStepCells(matrix, barIndex, nextCells);
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
  return getChordSpanDisplayLabel(matrix, barIndex, 0)
    ?? getChordBeatDisplaySegments(matrix, barIndex).find((segment) => segment.label)?.label
    ?? null;
}

function getChordSpanDisplayLabel(matrix, barIndex, spanIndex) {
  const cells = getChordBeatCells(matrix, barIndex, spanIndex);
  const sourceLabel = getChordBeatSourceLabel(cells);
  if (sourceLabel) return sourceLabel;

  const mainCell = getChordCell(matrix, barIndex, spanIndex);
  if (mainCell?.type !== 'chord') return null;

  const addedNotes = cells.reduce((notes, cell) => {
    getChordCellNotes(cell).forEach((note) => {
      if (!notes.includes(note)) notes.push(note);
    });
    return notes;
  }, []);

  return addedNotes.length ? `${mainCell.label} + ${addedNotes.join('/')}` : mainCell.label;
}

function getChordBeatCells(matrix, barIndex, spanIndex) {
  return Array.from({ length: 4 }, (_, columnIndex) => (
    getChordStepCell(matrix, barIndex, spanIndex, columnIndex)
  ));
}

function getChordBeatSourceLabel(cells) {
  return cells.find((cell) => cell?.sourceChordLabel)?.sourceChordLabel ?? null;
}

function getChordBeatFallbackNoteLabel(cells) {
  const noteLabels = cells.reduce((notes, cell) => {
    if (cell?.sourceChordLabel) return notes;
    getChordCellNotes(cell).forEach((note) => {
      if (!notes.includes(note)) notes.push(note);
    });
    return notes;
  }, []);

  return noteLabels.length ? noteLabels.join('/') : null;
}

function getChordBeatMergeKey(cells, label) {
  if (!label) return null;

  const arpeggioCell = cells.find((cell) => (
    cell?.type === 'notes' && cell.sourceChordLabel && cell.grooveTemplateId
  ));
  return arpeggioCell ? `${arpeggioCell.grooveTemplateId}:${label}` : null;
}

function getChordBeatDisplayInfo(matrix, barIndex, spanIndex) {
  const cells = getChordBeatCells(matrix, barIndex, spanIndex);
  const chordCell = getChordCell(matrix, barIndex, spanIndex);
  const chordLabel = getChordSpanDisplayLabel(matrix, barIndex, spanIndex);
  const label = chordLabel ?? getChordBeatFallbackNoteLabel(cells);

  return {
    hasChord: chordCell?.type === 'chord',
    hasValue: Boolean(label),
    label,
    mergeKey: getChordBeatMergeKey(cells, label),
  };
}

function getChordBeatDisplaySegments(matrix, barIndex) {
  const beatInfos = Array.from({ length: BEATS_PER_BAR }, (_, spanIndex) => (
    getChordBeatDisplayInfo(matrix, barIndex, spanIndex)
  ));
  const segments = [];

  beatInfos.forEach((info, spanIndex) => {
    const previous = segments[segments.length - 1];
    if (info.mergeKey && previous?.mergeKey === info.mergeKey) {
      previous.span += 1;
      return;
    }

    segments.push({
      startBeat: spanIndex,
      span: 1,
      label: info.label,
      hasValue: info.hasValue,
      hasChord: info.hasChord,
      mergeKey: info.mergeKey,
    });
  });

  return segments;
}

export {
  applyChordTemplateToExistingClips,
  clearChordBar,
  clearChordCell,
  getChordBeatDisplaySegments,
  getChordStepCell,
  getChordCell,
  getChordBarDisplayLabel,
  getChordSpanDisplayLabel,
  getExistingChordClipBars,
  setChordCell,
  setChordNoteCell,
  toggleChordNoteStep,
};
