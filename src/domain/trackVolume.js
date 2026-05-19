const MIN_TRACK_VOLUME_DB = -24;
const MAX_TRACK_VOLUME_DB = 6;
const DEFAULT_TRACK_VOLUME_DB = 0;

function clampTrackVolume(volume) {
  const numericVolume = Number(volume);
  if (!Number.isFinite(numericVolume)) return DEFAULT_TRACK_VOLUME_DB;
  return Math.min(MAX_TRACK_VOLUME_DB, Math.max(MIN_TRACK_VOLUME_DB, numericVolume));
}

export {
  DEFAULT_TRACK_VOLUME_DB,
  MAX_TRACK_VOLUME_DB,
  MIN_TRACK_VOLUME_DB,
  clampTrackVolume,
};
