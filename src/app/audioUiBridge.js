import { DRUMS_INSTRUMENT_IDS } from '../domain/musicConstants.js';
import { dispatchCommand } from '../input/commandDispatcher.js';

const DEFAULT_DRUMS_PATTERN = Object.freeze([
  Object.freeze({ bar: 0, step: 0, instrument: 'kick' }),
  Object.freeze({ bar: 0, step: 0, instrument: 'hihat' }),
  Object.freeze({ bar: 0, step: 4, instrument: 'hihat' }),
  Object.freeze({ bar: 0, step: 8, instrument: 'snare' }),
  Object.freeze({ bar: 0, step: 8, instrument: 'hihat' }),
  Object.freeze({ bar: 0, step: 12, instrument: 'hihat' }),
]);

function createDefaultDrumsPattern() {
  return DEFAULT_DRUMS_PATTERN.map((event) => ({ ...event }));
}

function extractInstruments(cell) {
  if (!cell) return [];
  if (Array.isArray(cell.instruments)) {
    return cell.instruments.filter((instrument) => DRUMS_INSTRUMENT_IDS.includes(instrument));
  }
  if (DRUMS_INSTRUMENT_IDS.includes(cell.instrument)) return [cell.instrument];
  return [];
}

function areEqualInstruments(left, right) {
  return left.length === right.length
    && left.every((instrument, index) => instrument === right[index]);
}

function mergeInstrument(cell, instrument) {
  const instruments = extractInstruments(cell);
  if (!instruments.includes(instrument)) instruments.push(instrument);
  return instruments;
}

function seedDefaultDrumsPattern(store, pattern = createDefaultDrumsPattern()) {
  const state = store.getState?.();
  if (!state?.matrix?.drums || typeof state.setCell !== 'function') return;

  for (const event of pattern) {
    if (!DRUMS_INSTRUMENT_IDS.includes(event.instrument)) continue;

    const currentCell = store.getState().matrix.drums[event.bar]?.[event.step];
    const nextInstruments = mergeInstrument(currentCell, event.instrument);
    if (areEqualInstruments(extractInstruments(currentCell), nextInstruments)) continue;

    store.getState().setCell('drums', event.bar, event.step, {
      instruments: nextInstruments,
    });
  }
}

function createUiAudioDispatcher({ store, audio, dispatch = dispatchCommand }) {
  return (command) => dispatch(command, { store, audio });
}

export {
  createDefaultDrumsPattern,
  createUiAudioDispatcher,
  seedDefaultDrumsPattern,
};
