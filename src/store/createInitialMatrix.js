import { STEPS_PER_BAR, TOTAL_BARS, TRACK_IDS } from '../domain/musicConstants.js';

function createEmptyBar() {
  return Array.from({ length: STEPS_PER_BAR }, () => null);
}

function createEmptyTrack() {
  return Array.from({ length: TOTAL_BARS }, () => createEmptyBar());
}

export default function createInitialMatrix() {
  return Object.fromEntries(TRACK_IDS.map((trackId) => [trackId, createEmptyTrack()]));
}
