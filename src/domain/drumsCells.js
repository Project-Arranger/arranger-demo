import { DRUMS_INSTRUMENT_IDS } from './musicConstants.js';

const DRUMS_INSTRUMENT_SET = new Set(DRUMS_INSTRUMENT_IDS);

function getDrumsCellInstruments(cell) {
  if (!cell) return [];

  // Keep supporting the legacy single-instrument cell shape while new code writes arrays.
  const instruments = Array.isArray(cell.instruments)
    ? cell.instruments
    : [cell.instrument].filter(Boolean);

  return instruments.filter((instrument) => DRUMS_INSTRUMENT_SET.has(instrument));
}

function createDrumsCell(instruments) {
  const selected = new Set(instruments.filter((instrument) => DRUMS_INSTRUMENT_SET.has(instrument)));
  const ordered = DRUMS_INSTRUMENT_IDS.filter((instrument) => selected.has(instrument));

  return ordered.length ? { instruments: ordered } : null;
}

function mergeDrumsCellInstrument(cell, instrument) {
  return createDrumsCell([...getDrumsCellInstruments(cell), instrument]);
}

function toggleDrumsCellInstrument(cell, instrument) {
  if (!DRUMS_INSTRUMENT_SET.has(instrument)) return createDrumsCell(getDrumsCellInstruments(cell));

  const instruments = new Set(getDrumsCellInstruments(cell));
  if (instruments.has(instrument)) {
    instruments.delete(instrument);
  } else {
    instruments.add(instrument);
  }

  return createDrumsCell([...instruments]);
}

function areSameDrumsInstruments(left, right) {
  return left.length === right.length
    && left.every((instrument, index) => instrument === right[index]);
}

export {
  areSameDrumsInstruments,
  createDrumsCell,
  getDrumsCellInstruments,
  mergeDrumsCellInstrument,
  toggleDrumsCellInstrument,
};
