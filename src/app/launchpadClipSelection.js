import { TOTAL_BARS } from '../domain/musicConstants.js';

const LAUNCHPAD_TRACK_IDS = Object.freeze(['drums', 'chord', 'melody']);

function isValidBar(bar) {
  return Number.isInteger(bar) && bar >= 0 && bar < TOTAL_BARS;
}

function hasActiveTrackClip(state, trackId) {
  const selectedClip = state.clips?.byId?.[state.selectedClipId];
  return state.activeTrackId === trackId && selectedClip?.trackId === trackId;
}

function selectLaunchpadTrackClip({
  bar,
  canSelectClip = () => true,
  dispatchSeek = () => {},
  store,
  trackId,
  withUndoCheckpoint = (callback) => callback(),
} = {}) {
  if (
    !isValidBar(bar)
    || !LAUNCHPAD_TRACK_IDS.includes(trackId)
    || typeof store?.getState !== 'function'
  ) {
    return { ok: false, reason: 'invalid-selection' };
  }

  const state = store.getState();
  if (!hasActiveTrackClip(state, trackId)) {
    return { ok: false, reason: `inactive-${trackId}` };
  }

  const existingClip = state.getClipForTrackBar(trackId, bar);
  const candidateClip = existingClip ?? { bar, trackId };
  if (canSelectClip(candidateClip) === false) {
    return { ok: false, reason: 'blocked' };
  }

  let selectedClip = existingClip;
  if (existingClip) {
    state.selectClip(existingClip.id);
  } else {
    withUndoCheckpoint(() => {
      selectedClip = store.getState().createClip(trackId, bar);
    });
  }

  if (!selectedClip) return { ok: false, reason: 'selection-failed' };

  const nextState = store.getState();
  if (nextState.currentBar !== bar || nextState.currentStep !== 0) {
    dispatchSeek(bar, 0);
  }

  return { ok: true, created: !existingClip, bar };
}

export { selectLaunchpadTrackClip };
