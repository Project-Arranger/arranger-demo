import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syncTrackScrollContainers } from '../src/app/syncTrackScroll.js';

function createScrollContainer(scrollTop = 0) {
  const listeners = new Map();

  return {
    scrollTop,
    addEventListener(type, listener) {
      const typeListeners = listeners.get(type) ?? new Set();
      typeListeners.add(listener);
      listeners.set(type, typeListeners);
    },
    dispatchScroll() {
      for (const listener of listeners.get('scroll') ?? []) {
        listener();
      }
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
  };
}

test('syncTrackScrollContainers keeps left and right track panels vertically synced', () => {
  const tracksList = createScrollContainer();
  const timeline = createScrollContainer();

  const cleanup = syncTrackScrollContainers(tracksList, timeline);

  tracksList.scrollTop = 124;
  tracksList.dispatchScroll();
  assert.equal(timeline.scrollTop, 124);

  timeline.scrollTop = 48;
  timeline.dispatchScroll();
  assert.equal(tracksList.scrollTop, 48);

  cleanup();
  tracksList.scrollTop = 0;
  tracksList.dispatchScroll();
  assert.equal(timeline.scrollTop, 48);
  assert.equal(tracksList.listenerCount('scroll'), 0);
  assert.equal(timeline.listenerCount('scroll'), 0);
});

test('syncTrackScrollContainers safely no-ops when a panel ref is missing', () => {
  const cleanup = syncTrackScrollContainers(null, createScrollContainer());

  assert.equal(typeof cleanup, 'function');
  assert.doesNotThrow(cleanup);
});
