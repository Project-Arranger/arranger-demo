const CHECKPOINT_APP_STATE_KEYS = Object.freeze([
  'activeTrackId',
  'clips',
  'currentBar',
  'currentStep',
  'matrix',
  'seekBar',
  'seekStep',
  'selectedBar',
  'selectedClipId',
]);

function cloneValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Set) return new Set([...value].map(cloneValue));
  if (Array.isArray(value)) return value.map(cloneValue);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
  );
}

function pickCheckpointAppState(appState = {}) {
  return Object.fromEntries(
    CHECKPOINT_APP_STATE_KEYS.map((key) => [key, cloneValue(appState[key])]),
  );
}

function createTutorialCheckpoint({
  appState,
  appliedTutorialSetups = new Set(),
  tutorialProgress,
} = {}) {
  return {
    appState: pickCheckpointAppState(appState),
    appliedTutorialSetups: cloneValue(appliedTutorialSetups),
    tutorialProgress: cloneValue(tutorialProgress),
  };
}

function restoreTutorialCheckpoint({
  checkpoint,
  setAppliedTutorialSetups,
  setTutorialProgress,
  store,
} = {}) {
  if (!checkpoint) return false;

  store?.setState?.(cloneValue(checkpoint.appState));
  setTutorialProgress?.(cloneValue(checkpoint.tutorialProgress));
  setAppliedTutorialSetups?.(cloneValue(checkpoint.appliedTutorialSetups));
  return true;
}

function pruneTutorialCheckpoints(checkpoints = {}, fromIndex = 0) {
  return Object.fromEntries(
    Object.entries(checkpoints).filter(([index]) => Number(index) < fromIndex),
  );
}

export {
  createTutorialCheckpoint,
  pruneTutorialCheckpoints,
  restoreTutorialCheckpoint,
};
