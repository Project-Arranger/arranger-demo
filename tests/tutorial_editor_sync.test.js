import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syncEditorToTutorialSuggestedBar } from '../src/app/tutorialEditorSync.js';

function createState(overrides = {}) {
  const calls = [];

  return {
    calls,
    state: {
      getClipForTrackBar: (trackId, bar) => (
        trackId === 'drums' && bar === 4 ? { id: 'drums-bar-4', bar, trackId } : null
      ),
      selectedBar: 0,
      selectClip: (clipId) => calls.push(['selectClip', clipId]),
      setActiveTrackId: (trackId) => calls.push(['setActiveTrackId', trackId]),
      setSelectedBar: (bar) => calls.push(['setSelectedBar', bar]),
      setSelectedClipId: (clipId) => calls.push(['setSelectedClipId', clipId]),
      ...overrides,
    },
  };
}

test('syncEditorToTutorialSuggestedBar does not fight playback-selected bars', () => {
  const { calls, state } = createState();

  const synced = syncEditorToTutorialSuggestedBar(state, 4, { isPlaying: true });

  assert.equal(synced, false);
  assert.deepEqual(calls, []);
});

test('syncEditorToTutorialSuggestedBar selects the suggested drums clip while stopped', () => {
  const { calls, state } = createState();

  const synced = syncEditorToTutorialSuggestedBar(state, 4, { isPlaying: false });

  assert.equal(synced, true);
  assert.deepEqual(calls, [['selectClip', 'drums-bar-4']]);
});
