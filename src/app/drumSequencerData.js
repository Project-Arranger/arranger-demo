import {
  getDrumsCellInstruments,
  toggleDrumsCellInstrument,
} from '../domain/drumsCells.js';

const DRUM_SEQUENCER_ROWS = Object.freeze([
  Object.freeze({ id: 'kick', label: 'Kick' }),
  Object.freeze({ id: 'snare', label: 'Snare' }),
  Object.freeze({ id: 'hihat', label: 'Hi-Hat' }),
]);

function getDrumsStepInstruments(matrix, barIndex, stepIndex) {
  const cell = matrix?.drums?.[barIndex]?.[stepIndex];
  return getDrumsCellInstruments(cell);
}

function isDrumsStepActive(matrix, barIndex, stepIndex, instrument) {
  return getDrumsStepInstruments(matrix, barIndex, stepIndex).includes(instrument);
}

function toggleInstrumentInCell(cell, instrument) {
  return toggleDrumsCellInstrument(cell, instrument);
}

export {
  DRUM_SEQUENCER_ROWS,
  getDrumsStepInstruments,
  isDrumsStepActive,
  toggleInstrumentInCell,
};
