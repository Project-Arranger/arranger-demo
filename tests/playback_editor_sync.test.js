import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syncEditorToPlaybackBar } from '../src/app/playbackEditorSync.js';

function createState(overrides = {}) {
  const calls = [];

  return {
    state: {
      activeTrackId: 'drums',
      isPlaying: true,
      selectedBar: 0,
      getClipForTrackBar: () => null,
      selectClip: (clipId) => calls.push(['selectClip', clipId]),
      setSelectedBar: (bar) => calls.push(['setSelectedBar', bar]),
      setSelectedClipId: (clipId) => calls.push(['setSelectedClipId', clipId]),
      ...overrides,
    },
    calls,
  };
}

test('syncEditorToPlaybackBar does nothing while transport is stopped', () => {
  const { state, calls } = createState({ isPlaying: false });

  const synced = syncEditorToPlaybackBar(state, 2);

  assert.equal(synced, false);
  assert.deepEqual(calls, []);
});

test('syncEditorToPlaybackBar selects the active track clip for the playback bar', () => {
  const { state, calls } = createState({
    getClipForTrackBar: (trackId, bar) => (
      trackId === 'drums' && bar === 2 ? { id: 'drums-bar-3' } : null
    ),
  });

  const synced = syncEditorToPlaybackBar(state, 2);

  assert.equal(synced, true);
  assert.deepEqual(calls, [['selectClip', 'drums-bar-3']]);
});

test('syncEditorToPlaybackBar switches to an empty editor bar when no clip exists', () => {
  const { state, calls } = createState({ selectedBar: 1 });

  const synced = syncEditorToPlaybackBar(state, 3);

  assert.equal(synced, true);
  assert.deepEqual(calls, [
    ['setSelectedBar', 3],
    ['setSelectedClipId', null],
  ]);
});

test('syncEditorToPlaybackBar skips the current selected bar', () => {
  const { state, calls } = createState({ selectedBar: 2 });

  const synced = syncEditorToPlaybackBar(state, 2);

  assert.equal(synced, false);
  assert.deepEqual(calls, []);
});
