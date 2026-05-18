import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  areSameDrumsInstruments,
  createDrumsCell,
  getDrumsCellInstruments,
  mergeDrumsCellInstrument,
  toggleDrumsCellInstrument,
} from '../src/domain/drumsCells.js';

test('getDrumsCellInstruments supports current and legacy drums cell shapes', () => {
  assert.deepEqual(getDrumsCellInstruments(null), []);
  assert.deepEqual(getDrumsCellInstruments({ instruments: ['kick', 'tom', 'hihat'] }), ['kick', 'hihat']);
  assert.deepEqual(getDrumsCellInstruments({ instrument: 'snare' }), ['snare']);
});

test('createDrumsCell filters instruments and preserves drums order', () => {
  assert.deepEqual(createDrumsCell(['hihat', 'kick', 'tom', 'snare']), {
    instruments: ['kick', 'snare', 'hihat'],
  });
  assert.equal(createDrumsCell(['tom']), null);
});

test('mergeDrumsCellInstrument and toggleDrumsCellInstrument keep cells normalized', () => {
  assert.deepEqual(mergeDrumsCellInstrument(null, 'kick'), { instruments: ['kick'] });
  assert.deepEqual(
    mergeDrumsCellInstrument({ instruments: ['kick'] }, 'hihat'),
    { instruments: ['kick', 'hihat'] },
  );
  assert.deepEqual(
    toggleDrumsCellInstrument({ instruments: ['kick', 'hihat'] }, 'kick'),
    { instruments: ['hihat'] },
  );
  assert.equal(toggleDrumsCellInstrument({ instruments: ['snare'] }, 'snare'), null);
  assert.deepEqual(toggleDrumsCellInstrument({ instruments: ['snare'] }, 'tom'), { instruments: ['snare'] });
});

test('areSameDrumsInstruments compares ordered normalized arrays', () => {
  assert.equal(areSameDrumsInstruments(['kick', 'hihat'], ['kick', 'hihat']), true);
  assert.equal(areSameDrumsInstruments(['hihat', 'kick'], ['kick', 'hihat']), false);
  assert.equal(areSameDrumsInstruments(['kick'], ['kick', 'hihat']), false);
});
