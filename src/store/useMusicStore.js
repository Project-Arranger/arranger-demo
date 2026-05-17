import { create } from 'zustand';
import {
  BEATS_PER_BAR,
  CHORD_SPAN,
  CORE_TRACK_IDS,
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  EIGHTH_STEPS_PER_BAR,
  OPTIONAL_TRACK_IDS,
  ROOT_KEY,
  SCALE,
  STEPS_PER_BAR,
  TOTAL_BARS,
  TRACK_IDS,
} from '../domain/musicConstants.js';
import createContextSlice from './slices/contextSlice.js';
import createMatrixSlice from './slices/matrixSlice.js';
import createTransportSlice from './slices/transportSlice.js';

const useMusicStore = create((set, get) => ({
  ...createTransportSlice(set, get),
  ...createMatrixSlice(set, get),
  ...createContextSlice(set, get),
}));

export {
  BEATS_PER_BAR,
  CHORD_SPAN,
  CORE_TRACK_IDS,
  DEFAULT_BPM,
  DRUMS_INSTRUMENT_IDS,
  EIGHTH_STEPS_PER_BAR,
  OPTIONAL_TRACK_IDS,
  ROOT_KEY,
  SCALE,
  STEPS_PER_BAR,
  TOTAL_BARS,
  TRACK_IDS,
};

export default useMusicStore;
