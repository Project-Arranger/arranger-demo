import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_TRACK_VOLUME_DB,
  MIN_TRACK_VOLUME_DB,
  getTrackVolumeFromClientX,
} from '../src/app/trackVolumeInteraction.js';

test('getTrackVolumeFromClientX maps pointer position to clamped dB values', () => {
  const rect = { left: 100, width: 300 };

  assert.equal(getTrackVolumeFromClientX(100, rect), MIN_TRACK_VOLUME_DB);
  assert.equal(getTrackVolumeFromClientX(400, rect), MAX_TRACK_VOLUME_DB);
  assert.equal(getTrackVolumeFromClientX(340, rect), 0);
  assert.equal(getTrackVolumeFromClientX(50, rect), MIN_TRACK_VOLUME_DB);
  assert.equal(getTrackVolumeFromClientX(450, rect), MAX_TRACK_VOLUME_DB);
});

test('getTrackVolumeFromClientX falls back to neutral volume for invalid geometry', () => {
  assert.equal(getTrackVolumeFromClientX(100, { left: 0, width: 0 }), 0);
  assert.equal(getTrackVolumeFromClientX(100, null), 0);
});
