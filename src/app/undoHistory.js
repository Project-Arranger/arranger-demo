const UNDO_HISTORY_LIMIT = 50;

const UNDO_APP_STATE_KEYS = Object.freeze([
  'activeTrackId',
  'bpm',
  'clips',
  'currentBar',
  'currentStep',
  'matrix',
  'melodyScaleId',
  'rootKey',
  'scale',
  'seekBar',
  'seekStep',
  'selectedBar',
  'selectedClipId',
  'visibleTrackIds',
  'volumes',
]);

const UNDO_TUTORIAL_STATE_KEYS = Object.freeze([
  'appliedTutorialSetups',
  'currentTutorialStepIndex',
  'tutorialModeActive',
  'tutorialProgress',
  'tutorialSidebarCollapsed',
  'tutorialStepCheckpoints',
  'tutorialVisible',
]);

function cloneValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Set) return new Set([...value].map(cloneValue));
  if (Array.isArray(value)) return value.map(cloneValue);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
  );
}

function pickStateKeys(source = {}, keys = []) {
  return Object.fromEntries(
    keys.map((key) => [key, cloneValue(source[key])]),
  );
}

function normalizeValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Set) {
    return {
      __type: 'Set',
      values: [...value].map(normalizeValue),
    };
  }
  if (Array.isArray(value)) return value.map(normalizeValue);

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, normalizeValue(value[key])]),
  );
}

function createUndoSnapshot({
  appState,
  tutorialState,
} = {}) {
  return {
    appState: pickStateKeys(appState, UNDO_APP_STATE_KEYS),
    tutorialState: pickStateKeys(tutorialState, UNDO_TUTORIAL_STATE_KEYS),
  };
}

function hasUndoSnapshotChanged(before, after) {
  return JSON.stringify(normalizeValue(before)) !== JSON.stringify(normalizeValue(after));
}

function pushUndoSnapshot(history = [], snapshot, limit = UNDO_HISTORY_LIMIT) {
  if (!snapshot) return history;
  const lastSnapshot = history.at(-1);
  if (lastSnapshot && !hasUndoSnapshotChanged(lastSnapshot, snapshot)) return history;

  return [...history, cloneValue(snapshot)].slice(-limit);
}

function restoreUndoSnapshot({
  setAppliedTutorialSetups,
  setCurrentTutorialStepIndex,
  setTutorialModeActive,
  setTutorialProgress,
  setTutorialSidebarCollapsed,
  setTutorialStepCheckpoints,
  setTutorialVisible,
  snapshot,
  store,
} = {}) {
  if (!snapshot) return false;

  store?.setState?.(cloneValue(snapshot.appState));
  setCurrentTutorialStepIndex?.(cloneValue(snapshot.tutorialState.currentTutorialStepIndex));
  setTutorialProgress?.(cloneValue(snapshot.tutorialState.tutorialProgress));
  setTutorialVisible?.(cloneValue(snapshot.tutorialState.tutorialVisible));
  setTutorialModeActive?.(cloneValue(snapshot.tutorialState.tutorialModeActive));
  setTutorialSidebarCollapsed?.(cloneValue(snapshot.tutorialState.tutorialSidebarCollapsed));
  setAppliedTutorialSetups?.(cloneValue(snapshot.tutorialState.appliedTutorialSetups));
  setTutorialStepCheckpoints?.(cloneValue(snapshot.tutorialState.tutorialStepCheckpoints));
  return true;
}

export {
  UNDO_HISTORY_LIMIT,
  createUndoSnapshot,
  hasUndoSnapshotChanged,
  pushUndoSnapshot,
  restoreUndoSnapshot,
};
