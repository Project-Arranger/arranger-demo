import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canPageDrumsClipBars,
  getAdjacentDrumsClipBar,
} from '../src/app/drumsBarPaging.js';

function createClips(entries) {
  return {
    ids: entries.map(({ id }) => id),
    byId: Object.fromEntries(entries.map((clip) => [clip.id, clip])),
  };
}

test('getAdjacentDrumsClipBar cycles through existing drums clip bars only', () => {
  const clips = createClips([
    { id: 'drums-bar-0', trackId: 'drums', bar: 0 },
    { id: 'bass-bar-1', trackId: 'bass', bar: 1 },
    { id: 'drums-bar-2', trackId: 'drums', bar: 2 },
    { id: 'drums-bar-5', trackId: 'drums', bar: 5 },
  ]);

  assert.equal(getAdjacentDrumsClipBar(clips, 0, 'next'), 2);
  assert.equal(getAdjacentDrumsClipBar(clips, 2, 'next'), 5);
  assert.equal(getAdjacentDrumsClipBar(clips, 5, 'next'), 0);
  assert.equal(getAdjacentDrumsClipBar(clips, 0, 'previous'), 5);
  assert.equal(getAdjacentDrumsClipBar(clips, 2, 'previous'), 0);
});

test('getAdjacentDrumsClipBar returns null when the drums track cannot page', () => {
  const oneDrumsClip = createClips([
    { id: 'drums-bar-3', trackId: 'drums', bar: 3 },
    { id: 'bass-bar-4', trackId: 'bass', bar: 4 },
  ]);
  const noDrumsClips = createClips([
    { id: 'bass-bar-4', trackId: 'bass', bar: 4 },
  ]);

  assert.equal(canPageDrumsClipBars(oneDrumsClip), false);
  assert.equal(getAdjacentDrumsClipBar(oneDrumsClip, 3, 'next'), null);
  assert.equal(getAdjacentDrumsClipBar(oneDrumsClip, 3, 'previous'), null);
  assert.equal(canPageDrumsClipBars(noDrumsClips), false);
  assert.equal(getAdjacentDrumsClipBar(noDrumsClips, 3, 'next'), null);
});

test('canPageDrumsClipBars requires at least two drums clips', () => {
  const clips = createClips([
    { id: 'drums-bar-0', trackId: 'drums', bar: 0 },
    { id: 'drums-bar-7', trackId: 'drums', bar: 7 },
  ]);

  assert.equal(canPageDrumsClipBars(clips), true);
});
