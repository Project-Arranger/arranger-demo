import {
  BEATS_PER_BAR,
  CHORD_SPAN,
} from './musicConstants.js';

const CHORD_ROOTS = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const MAJOR_TRIAD_INTERVALS = Object.freeze([0, 4, 7]);

function isChordRoot(root) {
  return CHORD_ROOTS.includes(root);
}

function isChordSpan(spanIndex) {
  return Number.isInteger(spanIndex) && spanIndex >= 0 && spanIndex < BEATS_PER_BAR;
}

function getChordSpanStep(spanIndex) {
  if (!isChordSpan(spanIndex)) return null;
  return spanIndex * CHORD_SPAN;
}

function createChordCell(root) {
  if (!isChordRoot(root)) return null;

  return {
    root,
    quality: 'maj',
    label: root,
  };
}

function toggleChordCell(cell, root) {
  if (!isChordRoot(root)) return null;
  if (cell?.root === root) return null;

  return createChordCell(root);
}

function getChordToneRoots(root) {
  if (!isChordRoot(root)) return [];

  const rootIndex = CHORD_ROOTS.indexOf(root);
  return MAJOR_TRIAD_INTERVALS.map((interval) => (
    CHORD_ROOTS[(rootIndex + interval) % CHORD_ROOTS.length]
  ));
}

function isChordCellActive(cell, root, columnIndex = 0) {
  if (columnIndex !== 0) return false;
  return getChordToneRoots(cell?.root).includes(root);
}

export {
  CHORD_ROOTS,
  createChordCell,
  getChordToneRoots,
  getChordSpanStep,
  isChordCellActive,
  isChordRoot,
  isChordSpan,
  toggleChordCell,
};
