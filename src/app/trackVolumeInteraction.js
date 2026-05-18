import {
  DEFAULT_TRACK_VOLUME_DB,
  MAX_TRACK_VOLUME_DB,
  MIN_TRACK_VOLUME_DB,
  clampTrackVolume,
} from '../domain/trackVolume.js';

function getTrackVolumeFromClientX(clientX, rect) {
  if (!rect || rect.width <= 0) return DEFAULT_TRACK_VOLUME_DB;

  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const volume = MIN_TRACK_VOLUME_DB + ratio * (MAX_TRACK_VOLUME_DB - MIN_TRACK_VOLUME_DB);
  return clampTrackVolume(Math.round(volume));
}

export {
  MAX_TRACK_VOLUME_DB,
  MIN_TRACK_VOLUME_DB,
  getTrackVolumeFromClientX,
};
