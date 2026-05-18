import {
  BEATS_PER_BAR,
  CHORD_SPAN,
} from './musicConstants.js';

const CHORD_ROOTS = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);

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

function isChordCellActive(cell, root) {
  return cell?.root === root;
}

export {
  CHORD_ROOTS,
  createChordCell,
  getChordSpanStep,
  isChordCellActive,
  isChordRoot,
  isChordSpan,
  toggleChordCell,
};
