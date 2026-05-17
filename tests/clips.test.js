import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { TRACK_IDS } from '../src/domain/musicConstants.js';
import useMusicStore from '../src/store/useMusicStore.js';

beforeEach(() => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);
});

test('clips slice starts with migrated drums and chord phrase clips', () => {
  const state = useMusicStore.getState();

  assert.deepEqual(state.clips.ids, ['drums-bar-0', 'chord-bar-0']);
  assert.deepEqual(state.clips.byId['drums-bar-0'], {
    id: 'drums-bar-0',
    trackId: 'drums',
    bar: 0,
    name: 'Drum 01',
  });
  assert.deepEqual(state.clips.byId['chord-bar-0'], {
    id: 'chord-bar-0',
    trackId: 'chord',
    bar: 0,
    name: 'Chord 01',
  });
});

test('getClipForTrackBar returns a clip for one track and bar only', () => {
  const state = useMusicStore.getState();

  assert.equal(state.getClipForTrackBar('drums', 0).id, 'drums-bar-0');
  assert.equal(state.getClipForTrackBar('drums', 1), null);
  assert.equal(state.getClipForTrackBar('bass', 0), null);
});

test('createClip adds a new track clip and selects it', () => {
  const state = useMusicStore.getState();

  const clip = state.createClip('bass', 2);

  assert.deepEqual(clip, {
    id: 'bass-bar-2',
    trackId: 'bass',
    bar: 2,
    name: 'Bass 01',
  });
  assert.equal(useMusicStore.getState().clips.ids.includes('bass-bar-2'), true);
  assert.equal(useMusicStore.getState().selectedClipId, 'bass-bar-2');
  assert.equal(useMusicStore.getState().activeTrackId, 'bass');
  assert.equal(useMusicStore.getState().selectedBar, 2);
});

test('createClip re-selects an existing clip without duplicating it', () => {
  const state = useMusicStore.getState();

  const first = state.createClip('drums', 0);
  const second = useMusicStore.getState().createClip('drums', 0);

  assert.equal(first.id, 'drums-bar-0');
  assert.equal(second.id, 'drums-bar-0');
  assert.deepEqual(useMusicStore.getState().clips.ids, ['drums-bar-0', 'chord-bar-0']);
  assert.equal(useMusicStore.getState().selectedClipId, 'drums-bar-0');
});

test('selectClip links selectedClipId, activeTrackId, and selectedBar', () => {
  const state = useMusicStore.getState();

  state.selectClip('chord-bar-0');

  assert.equal(useMusicStore.getState().selectedClipId, 'chord-bar-0');
  assert.equal(useMusicStore.getState().activeTrackId, 'chord');
  assert.equal(useMusicStore.getState().selectedBar, 0);
});

test('createClip ignores unknown track ids', () => {
  const clip = useMusicStore.getState().createClip('unknown-track', 0);

  assert.equal(clip, null);
  assert.equal(useMusicStore.getState().clips.ids.every((id) => TRACK_IDS.includes(id.split('-bar-')[0])), true);
});

test('createClip ignores invalid bars', () => {
  const before = useMusicStore.getState().clips;

  assert.equal(useMusicStore.getState().createClip('bass', -1), null);
  assert.equal(useMusicStore.getState().createClip('bass', 8), null);
  assert.equal(useMusicStore.getState().createClip('bass', 1.5), null);
  assert.deepEqual(useMusicStore.getState().clips, before);
});
