import { STEPS_PER_BAR, TOTAL_BARS } from '../domain/musicConstants.js';
import { createDrumsCell } from '../domain/drumsCells.js';

const BASIC_DRUMS_STEPS = Object.freeze([
  Object.freeze({ step: 0, instruments: Object.freeze(['kick', 'hihat']) }),
  Object.freeze({ step: 4, instruments: Object.freeze(['hihat']) }),
  Object.freeze({ step: 8, instruments: Object.freeze(['snare', 'hihat']) }),
  Object.freeze({ step: 12, instruments: Object.freeze(['hihat']) }),
]);

function createCell(instruments) {
  return createDrumsCell(instruments);
}

function createEmptyDrumsBar() {
  return Array.from({ length: STEPS_PER_BAR }, () => null);
}

function createBasicDrumsBar() {
  const bar = createEmptyDrumsBar();

  for (const event of BASIC_DRUMS_STEPS) {
    bar[event.step] = createCell(event.instruments);
  }

  return bar;
}

function createDefaultDrumsPattern() {
  return BASIC_DRUMS_STEPS.flatMap((event) => (
    event.instruments.map((instrument) => ({
      bar: 0,
      step: event.step,
      instrument,
    }))
  ));
}

function isValidBarIndex(barIndex) {
  return Number.isInteger(barIndex) && barIndex >= 0 && barIndex < TOTAL_BARS;
}

function replaceDrumsBar(matrix, barIndex, bar) {
  if (!matrix?.drums || !isValidBarIndex(barIndex)) return matrix;

  const nextDrums = [...matrix.drums];
  nextDrums[barIndex] = bar;

  return {
    ...matrix,
    drums: nextDrums,
  };
}

function applyBasicDrumsBar(matrix, barIndex) {
  return replaceDrumsBar(matrix, barIndex, createBasicDrumsBar());
}

function applyBasicDrumsAllBars(matrix) {
  if (!matrix?.drums) return matrix;

  return {
    ...matrix,
    drums: Array.from({ length: TOTAL_BARS }, () => createBasicDrumsBar()),
  };
}

function clearDrumsBar(matrix, barIndex) {
  return replaceDrumsBar(matrix, barIndex, createEmptyDrumsBar());
}

export {
  applyBasicDrumsAllBars,
  applyBasicDrumsBar,
  clearDrumsBar,
  createBasicDrumsBar,
  createDefaultDrumsPattern,
  createEmptyDrumsBar,
};
