import { DRUMS_INSTRUMENT_IDS } from '../domain/musicConstants.js';

const DRUM_SEQUENCER_ROWS = Object.freeze([
  Object.freeze({ id: 'kick', label: 'Kick' }),
  Object.freeze({ id: 'snare', label: 'Snare' }),
  Object.freeze({ id: 'hihat', label: 'Hi-Hat' }),
]);

function getDrumsStepInstruments(matrix, barIndex, stepIndex) {
  const cell = matrix?.drums?.[barIndex]?.[stepIndex];
  if (!cell) return [];

  if (Array.isArray(cell.instruments)) {
    return cell.instruments.filter((instrument) => DRUMS_INSTRUMENT_IDS.includes(instrument));
  }

  if (DRUMS_INSTRUMENT_IDS.includes(cell.instrument)) return [cell.instrument];
  return [];
}

function isDrumsStepActive(matrix, barIndex, stepIndex, instrument) {
  return getDrumsStepInstruments(matrix, barIndex, stepIndex).includes(instrument);
}

function toggleInstrumentInCell(cell, instrument) {
  if (!DRUMS_INSTRUMENT_IDS.includes(instrument)) return cell ?? null;

  const instruments = new Set(getDrumsStepInstruments({ drums: [[cell]] }, 0, 0));
  if (instruments.has(instrument)) {
    instruments.delete(instrument);
  } else {
    instruments.add(instrument);
  }

  const nextInstruments = DRUMS_INSTRUMENT_IDS.filter((id) => instruments.has(id));
  return nextInstruments.length ? { instruments: nextInstruments } : null;
}

export {
  DRUM_SEQUENCER_ROWS,
  getDrumsStepInstruments,
  isDrumsStepActive,
  toggleInstrumentInCell,
};
