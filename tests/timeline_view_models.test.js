import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BAR_NUMBERS, TRACK_UI } from '../src/app/uiShellData.js';
import { createInitialClips } from '../src/store/slices/clipsSlice.js';
import { createTimelineTracks } from '../src/app/timelineViewModels.js';

test('createTimelineTracks decorates static track UI with clip state by bar', () => {
  const clips = createInitialClips();
  const tracks = createTimelineTracks({
    barNumbers: BAR_NUMBERS,
    clips,
    selectedBar: 0,
    trackUi: TRACK_UI,
  });

  const drums = tracks.find((track) => track.id === 'drums');
  const bass = tracks.find((track) => track.id === 'bass');
  const chord = tracks.find((track) => track.id === 'chord');

  assert.equal(tracks.length, TRACK_UI.length);
  assert.equal(drums.clip.id, 'drums-bar-0');
  assert.equal(drums.hasClip, true);
  assert.equal(drums.clipsByBar.length, BAR_NUMBERS.length);
  assert.equal(drums.clipsByBar[0].id, 'drums-bar-0');
  assert.equal(drums.clipsByBar[1], null);
  assert.equal(chord.clip.id, 'chord-bar-0');
  assert.equal(bass.clip, null);
  assert.equal(bass.hasClip, false);
});

test('createTimelineTracks marks tracks with clips outside the selected bar', () => {
  const clips = createInitialClips();
  clips.ids.push('bass-bar-2');
  clips.byId['bass-bar-2'] = {
    id: 'bass-bar-2',
    trackId: 'bass',
    bar: 2,
    name: 'Bass 01',
  };

  const tracks = createTimelineTracks({
    barNumbers: BAR_NUMBERS,
    clips,
    selectedBar: 0,
    trackUi: TRACK_UI,
  });
  const bass = tracks.find((track) => track.id === 'bass');

  assert.equal(bass.clip, null);
  assert.equal(bass.hasClip, true);
  assert.equal(bass.clipsByBar[2].id, 'bass-bar-2');
});
