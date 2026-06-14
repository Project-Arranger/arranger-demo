import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import { createTutorialState } from '../src/tutorial/drumsTutorialRuntime.js';
import {
  UNDO_HISTORY_LIMIT,
  createUndoSnapshot,
  hasUndoSnapshotChanged,
  pushUndoSnapshot,
  restoreUndoSnapshot,
} from '../src/app/undoHistory.js';

function createAppState() {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = createDrumsCell(['kick']);

  return {
    activeTrackId: 'drums',
    bpm: 120,
    clips: {
      ids: ['drums-bar-0'],
      byId: {
        'drums-bar-0': {
          id: 'drums-bar-0',
          name: 'Drum 01',
          trackId: 'drums',
          bar: 0,
        },
      },
    },
    currentBar: 1,
    currentStep: 4,
    isPlaying: true,
    matrix,
    melodyScaleId: 'major',
    rootKey: 'C',
    scale: 'major',
    seekBar: 1,
    seekStep: 4,
    selectedBar: 0,
    selectedClipId: 'drums-bar-0',
    visibleTrackIds: ['drums', 'chord', 'bass', 'melody'],
    volumes: {
      drums: -2,
      chord: 0,
      bass: -4,
      melody: 1,
    },
  };
}

function createTutorialSnapshotState() {
  return {
    appliedTutorialSetups: new Set(['drums-drag-kick']),
    currentTutorialStepIndex: 6,
    tutorialModeActive: true,
    tutorialProgress: {
      ...createTutorialState(),
      kickVariationEdited: true,
      kickVariationEditedCells: ['0:2'],
    },
    tutorialSidebarCollapsed: false,
    tutorialStepCheckpoints: {
      6: {
        appState: createAppState(),
        appliedTutorialSetups: new Set(['drums-drag-kick']),
        tutorialProgress: createTutorialState(),
      },
    },
    tutorialVisible: true,
  };
}

test('createUndoSnapshot captures editable app and tutorial state deeply without playback state', () => {
  const appState = createAppState();
  const tutorialState = createTutorialSnapshotState();
  const snapshot = createUndoSnapshot({ appState, tutorialState });

  appState.matrix.drums[0][0] = createDrumsCell(['snare']);
  appState.clips.byId['drums-bar-0'].name = 'Mutated';
  tutorialState.tutorialProgress.kickVariationEditedCells.push('0:6');
  tutorialState.appliedTutorialSetups.add('later-step');

  assert.equal(Object.hasOwn(snapshot.appState, 'isPlaying'), false);
  assert.deepEqual(snapshot.appState.matrix.drums[0][0], { instruments: ['kick'] });
  assert.equal(snapshot.appState.clips.byId['drums-bar-0'].name, 'Drum 01');
  assert.deepEqual(snapshot.tutorialState.tutorialProgress.kickVariationEditedCells, ['0:2']);
  assert.deepEqual([...snapshot.tutorialState.appliedTutorialSetups], ['drums-drag-kick']);
});

test('pushUndoSnapshot skips duplicate snapshots and enforces the history limit', () => {
  const baseSnapshot = createUndoSnapshot({
    appState: createAppState(),
    tutorialState: createTutorialSnapshotState(),
  });

  let history = pushUndoSnapshot([], baseSnapshot);
  history = pushUndoSnapshot(history, createUndoSnapshot({
    appState: createAppState(),
    tutorialState: createTutorialSnapshotState(),
  }));
  assert.equal(history.length, 1);

  for (let index = 0; index < UNDO_HISTORY_LIMIT + 4; index += 1) {
    const appState = createAppState();
    appState.selectedBar = index;
    history = pushUndoSnapshot(history, createUndoSnapshot({
      appState,
      tutorialState: createTutorialSnapshotState(),
    }));
  }

  assert.equal(history.length, UNDO_HISTORY_LIMIT);
  assert.equal(history[0].appState.selectedBar, 4);
  assert.equal(history.at(-1).appState.selectedBar, UNDO_HISTORY_LIMIT + 3);
});

test('hasUndoSnapshotChanged compares normalized nested state', () => {
  const before = createUndoSnapshot({
    appState: createAppState(),
    tutorialState: createTutorialSnapshotState(),
  });
  const same = createUndoSnapshot({
    appState: createAppState(),
    tutorialState: createTutorialSnapshotState(),
  });
  const changedState = createAppState();
  changedState.matrix.drums[0][2] = createDrumsCell(['kick']);
  const changed = createUndoSnapshot({
    appState: changedState,
    tutorialState: createTutorialSnapshotState(),
  });

  assert.equal(hasUndoSnapshotChanged(before, same), false);
  assert.equal(hasUndoSnapshotChanged(before, changed), true);
});

test('restoreUndoSnapshot restores app store and tutorial state', () => {
  const snapshot = createUndoSnapshot({
    appState: createAppState(),
    tutorialState: createTutorialSnapshotState(),
  });
  const calls = [];
  const store = {
    state: null,
    setState(nextState) {
      calls.push(['store.setState', Object.hasOwn(nextState, 'isPlaying')]);
      this.state = nextState;
    },
  };
  const restored = {};

  const didRestore = restoreUndoSnapshot({
    setAppliedTutorialSetups: (value) => {
      restored.appliedTutorialSetups = value;
    },
    setCurrentTutorialStepIndex: (value) => {
      restored.currentTutorialStepIndex = value;
    },
    setTutorialModeActive: (value) => {
      restored.tutorialModeActive = value;
    },
    setTutorialProgress: (value) => {
      restored.tutorialProgress = value;
    },
    setTutorialSidebarCollapsed: (value) => {
      restored.tutorialSidebarCollapsed = value;
    },
    setTutorialStepCheckpoints: (value) => {
      restored.tutorialStepCheckpoints = value;
    },
    setTutorialVisible: (value) => {
      restored.tutorialVisible = value;
    },
    snapshot,
    store,
  });

  assert.equal(didRestore, true);
  assert.deepEqual(calls, [['store.setState', false]]);
  assert.deepEqual(store.state.matrix.drums[0][0], { instruments: ['kick'] });
  assert.equal(restored.currentTutorialStepIndex, 6);
  assert.equal(restored.tutorialProgress.kickVariationEdited, true);
  assert.deepEqual([...restored.appliedTutorialSetups], ['drums-drag-kick']);

  store.state.matrix.drums[0][0] = createDrumsCell(['hihat']);
  restored.tutorialProgress.kickVariationEditedCells.push('0:10');

  const secondStore = {
    state: null,
    setState(nextState) {
      this.state = nextState;
    },
  };
  const secondRestore = {};
  restoreUndoSnapshot({
    setAppliedTutorialSetups: (value) => {
      secondRestore.appliedTutorialSetups = value;
    },
    setCurrentTutorialStepIndex: () => {},
    setTutorialModeActive: () => {},
    setTutorialProgress: (value) => {
      secondRestore.tutorialProgress = value;
    },
    setTutorialSidebarCollapsed: () => {},
    setTutorialStepCheckpoints: () => {},
    setTutorialVisible: () => {},
    snapshot,
    store: secondStore,
  });

  assert.deepEqual(secondStore.state.matrix.drums[0][0], { instruments: ['kick'] });
  assert.deepEqual(secondRestore.tutorialProgress.kickVariationEditedCells, ['0:2']);
  assert.deepEqual([...secondRestore.appliedTutorialSetups], ['drums-drag-kick']);
});

test('restoreUndoSnapshot is a no-op without a snapshot', () => {
  let called = false;
  const didRestore = restoreUndoSnapshot({
    setCurrentTutorialStepIndex: () => {
      called = true;
    },
    snapshot: null,
    store: {
      setState() {
        called = true;
      },
    },
  });

  assert.equal(didRestore, false);
  assert.equal(called, false);
});
