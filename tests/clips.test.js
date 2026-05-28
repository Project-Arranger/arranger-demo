import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { TRACK_IDS } from '../src/domain/musicConstants.js';
import useMusicStore from '../src/store/useMusicStore.js';

beforeEach(() => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);
});

test('clips slice starts with drums only and does not preseed chord clips', () => {
  const state = useMusicStore.getState();

  assert.deepEqual(state.clips.ids, ['drums-bar-0']);
  assert.deepEqual(state.clips.byId['drums-bar-0'], {
    id: 'drums-bar-0',
    trackId: 'drums',
    bar: 0,
    name: 'Drum 01',
  });
  assert.equal(state.getClipForTrackBar('chord', 0), null);
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
    name: 'Bass 03',
  });
  assert.equal(useMusicStore.getState().clips.ids.includes('bass-bar-2'), true);
  assert.equal(useMusicStore.getState().selectedClipId, 'bass-bar-2');
  assert.equal(useMusicStore.getState().activeTrackId, 'bass');
  assert.equal(useMusicStore.getState().selectedBar, 2);
});

test('createClip names clips from bar 1 through bar 8', () => {
  const state = useMusicStore.getState();

  assert.equal(state.createClip('lead', 0).name, 'Melody 01');
  assert.equal(useMusicStore.getState().createClip('lead', 7).name, 'Melody 08');
});

test('createClip re-selects an existing clip without duplicating it', () => {
  const state = useMusicStore.getState();

  const first = state.createClip('drums', 0);
  const second = useMusicStore.getState().createClip('drums', 0);

  assert.equal(first.id, 'drums-bar-0');
  assert.equal(second.id, 'drums-bar-0');
  assert.deepEqual(useMusicStore.getState().clips.ids, ['drums-bar-0']);
  assert.equal(useMusicStore.getState().selectedClipId, 'drums-bar-0');
});

test('renameClip updates clip names across tracks and preserves custom names on move', () => {
  const state = useMusicStore.getState();
  state.createClip('bass', 2);

  const renamedClip = useMusicStore.getState().renameClip('bass-bar-2', 'Warm Bass');

  assert.equal(renamedClip.name, 'Warm Bass');
  assert.equal(renamedClip.customName, true);
  assert.equal(useMusicStore.getState().getClipForTrackBar('bass', 2).name, 'Warm Bass');

  const movedClip = useMusicStore.getState().moveClipToBar('bass-bar-2', 4);

  assert.equal(movedClip.id, 'bass-bar-4');
  assert.equal(movedClip.name, 'Warm Bass');
  assert.equal(movedClip.customName, true);
  assert.equal(useMusicStore.getState().getClipForTrackBar('bass', 4).name, 'Warm Bass');
});

test('renameClip ignores missing clips and non-string names', () => {
  const beforeClips = structuredClone(useMusicStore.getState().clips);

  assert.equal(useMusicStore.getState().renameClip('missing-clip', 'Nope'), null);
  assert.equal(useMusicStore.getState().renameClip('drums-bar-0', 123), null);
  assert.deepEqual(useMusicStore.getState().clips, beforeClips);
});

test('moveClipToBar moves a clip and its matrix bar data to an empty bar', () => {
  const state = useMusicStore.getState();
  state.setCell('bass', 2, 0, { note: 'C3' });
  state.setCell('bass', 2, 5, { note: 'G3' });
  state.createClip('bass', 2);

  const movedClip = useMusicStore.getState().moveClipToBar('bass-bar-2', 4);

  assert.deepEqual(movedClip, {
    id: 'bass-bar-4',
    trackId: 'bass',
    bar: 4,
    name: 'Bass 05',
  });
  assert.equal(useMusicStore.getState().getClipForTrackBar('bass', 2), null);
  assert.equal(useMusicStore.getState().getClipForTrackBar('bass', 4).id, 'bass-bar-4');
  assert.equal(useMusicStore.getState().selectedClipId, 'bass-bar-4');
  assert.equal(useMusicStore.getState().activeTrackId, 'bass');
  assert.equal(useMusicStore.getState().selectedBar, 4);
  assert.deepEqual(useMusicStore.getState().matrix.bass[4][0], { note: 'C3' });
  assert.deepEqual(useMusicStore.getState().matrix.bass[4][5], { note: 'G3' });
  assert.equal(useMusicStore.getState().matrix.bass[2].every((cell) => cell === null), true);
});

test('moveClipToBar swaps same-track clips and their matrix bar data', () => {
  const state = useMusicStore.getState();
  state.setCell('drums', 0, 0, { instruments: ['kick'] });
  state.setCell('drums', 2, 4, { instruments: ['snare'] });
  state.createClip('drums', 2);

  const movedClip = useMusicStore.getState().moveClipToBar('drums-bar-0', 2);

  assert.equal(movedClip.id, 'drums-bar-2');
  assert.equal(movedClip.name, 'Drum 03');
  assert.deepEqual(useMusicStore.getState().clips.ids, ['drums-bar-0', 'drums-bar-2']);
  assert.equal(useMusicStore.getState().getClipForTrackBar('drums', 0).id, 'drums-bar-0');
  assert.equal(useMusicStore.getState().getClipForTrackBar('drums', 0).name, 'Drum 01');
  assert.equal(useMusicStore.getState().getClipForTrackBar('drums', 2).id, 'drums-bar-2');
  assert.deepEqual(useMusicStore.getState().matrix.drums[2][0], { instruments: ['kick'] });
  assert.deepEqual(useMusicStore.getState().matrix.drums[0][4], { instruments: ['snare'] });
  assert.equal(useMusicStore.getState().selectedClipId, 'drums-bar-2');
  assert.equal(useMusicStore.getState().selectedBar, 2);
});

test('moveClipToBar ignores invalid clips and bars without changing state', () => {
  const beforeClips = structuredClone(useMusicStore.getState().clips);
  const beforeMatrix = structuredClone(useMusicStore.getState().matrix);

  assert.equal(useMusicStore.getState().moveClipToBar('missing-clip', 1), null);
  assert.equal(useMusicStore.getState().moveClipToBar('drums-bar-0', -1), null);
  assert.equal(useMusicStore.getState().moveClipToBar('drums-bar-0', 8), null);
  assert.equal(useMusicStore.getState().moveClipToBar('drums-bar-0', 1.5), null);
  assert.deepEqual(useMusicStore.getState().clips, beforeClips);
  assert.deepEqual(useMusicStore.getState().matrix, beforeMatrix);
});

test('selectClip links selectedClipId, activeTrackId, and selectedBar', () => {
  const state = useMusicStore.getState();
  state.createClip('chord', 0);

  state.selectClip('chord-bar-0');

  assert.equal(useMusicStore.getState().selectedClipId, 'chord-bar-0');
  assert.equal(useMusicStore.getState().activeTrackId, 'chord');
  assert.equal(useMusicStore.getState().selectedBar, 0);
});

test('deleteSelectedClip removes selected clip and clears its matrix bar', () => {
  const state = useMusicStore.getState();
  state.setCell('drums', 0, 0, { instruments: ['kick'] });
  state.setCell('drums', 0, 4, { instruments: ['snare'] });
  state.selectClip('drums-bar-0');

  const deletedClip = useMusicStore.getState().deleteSelectedClip();

  assert.equal(deletedClip.id, 'drums-bar-0');
  assert.equal(useMusicStore.getState().getClipForTrackBar('drums', 0), null);
  assert.deepEqual(useMusicStore.getState().clips.ids, []);
  assert.equal(useMusicStore.getState().matrix.drums[0].every((cell) => cell === null), true);
  assert.equal(useMusicStore.getState().selectedClipId, null);
  assert.equal(useMusicStore.getState().activeTrackId, 'drums');
  assert.equal(useMusicStore.getState().selectedBar, 0);
});

test('deleteClip ignores missing clips without changing state', () => {
  const beforeClips = structuredClone(useMusicStore.getState().clips);
  const beforeMatrix = structuredClone(useMusicStore.getState().matrix);

  assert.equal(useMusicStore.getState().deleteClip('missing-clip'), null);
  assert.equal(useMusicStore.getState().deleteSelectedClip(), null);
  assert.deepEqual(useMusicStore.getState().clips, beforeClips);
  assert.deepEqual(useMusicStore.getState().matrix, beforeMatrix);
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
