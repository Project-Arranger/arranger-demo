import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchCommand,
  createCommandDispatcher,
} from '../src/input/commandDispatcher.js';
import {
  mapKeyboardEventToCommand,
  shouldPreventDefaultForCommand,
} from '../src/input/keyboardMap.js';
import useMusicStore from '../src/store/useMusicStore.js';

function createMockStore(initial = {}) {
  const calls = [];
  const state = {
    bpm: 120,
    isPlaying: false,
    matrix: { drums: [] },
    seekBar: 0,
    seekStep: 0,
    currentBar: 0,
    currentStep: 0,
    ...initial,
    play: () => calls.push(['play']),
    pause: () => calls.push(['pause']),
    stop: () => calls.push(['stop']),
    setSeekPosition: (bar, step) => calls.push(['setSeekPosition', bar, step]),
  };

  return {
    calls,
    getState: () => state,
  };
}

test('dispatchCommand rejects invalid commands before side effects', async () => {
  const store = createMockStore();

  const result = await dispatchCommand(
    { type: 'drums.toggle', bar: 0, step: 0, instrument: 'tom' },
    { store },
  );

  assert.deepEqual(result, { ok: false, reason: 'invalid-command' });
  assert.deepEqual(store.calls, []);
});

test('transport commands dispatch to store and optional audio dependencies', async () => {
  const store = createMockStore({ isPlaying: false, bpm: 96, currentBar: 1, currentStep: 4 });
  const audioCalls = [];
  const audio = {
    play: (options) => audioCalls.push([
      'audio.play',
      options.bpm,
      options.bar,
      options.step,
      options.matrixSource().drums,
    ]),
    pause: () => audioCalls.push(['audio.pause']),
    stop: () => audioCalls.push(['audio.stop']),
    seekToStep: (bar, step) => audioCalls.push(['audio.seekToStep', bar, step]),
  };

  assert.deepEqual(await dispatchCommand({ type: 'transport.togglePlay' }, { store, audio }), { ok: true });
  store.getState().isPlaying = true;
  assert.deepEqual(await dispatchCommand({ type: 'transport.togglePlay' }, { store, audio }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'transport.seek', bar: 2, step: 8 }, { store, audio }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'transport.stop' }, { store, audio }), { ok: true });

  assert.deepEqual(store.calls, [
    ['play'],
    ['pause'],
    ['setSeekPosition', 2, 8],
    ['stop'],
  ]);
  assert.deepEqual(audioCalls, [
    ['audio.play', 96, 1, 4, []],
    ['audio.pause'],
    ['audio.seekToStep', 2, 8],
    ['audio.stop'],
  ]);
});

test('transport commands preserve audio engine method context', async () => {
  const store = createMockStore();
  const audioCalls = [];
  const audio = {
    label: 'engine',
    play() {
      audioCalls.push(['play', this.label]);
    },
    stop() {
      audioCalls.push(['stop', this.label]);
    },
  };

  await dispatchCommand({ type: 'transport.togglePlay' }, { store, audio });
  await dispatchCommand({ type: 'transport.stop' }, { store, audio });

  assert.deepEqual(audioCalls, [
    ['play', 'engine'],
    ['stop', 'engine'],
  ]);
});

test('domain commands dispatch to injected handlers with drums naming', async () => {
  const calls = [];
  const audioCalls = [];
  const handlers = {
    tutorial: {
      next: () => calls.push(['tutorial.next']),
      completeTask: () => calls.push(['tutorial.completeTask']),
    },
    drums: {
      toggle: (command) => calls.push(['drums.toggle', command.bar, command.step, command.instrument]),
    },
    chord: {
      selectOption: (command) => calls.push(['chord.selectOption', command.optionIndex]),
      confirm: () => calls.push(['chord.confirm']),
      setCell: (command) => calls.push(['chord.setCell', command.bar, command.span, command.root]),
      clearCell: (command) => calls.push(['chord.clearCell', command.bar, command.span]),
    },
    lead: {
      noteOn: (command) => calls.push(['lead.noteOn', command.note]),
      noteOff: (command) => calls.push(['lead.noteOff', command.note]),
    },
  };
  const audio = {
    triggerDrumsStep: (instrument) => audioCalls.push(['audio.triggerDrumsStep', instrument]),
  };

  await dispatchCommand({ type: 'tutorial.next' }, { handlers });
  await dispatchCommand({ type: 'tutorial.completeTask' }, { handlers });
  await dispatchCommand({ type: 'drums.toggle', bar: 0, step: 4, instrument: 'kick' }, { handlers, audio });
  await dispatchCommand({ type: 'chord.selectOption', optionIndex: 3 }, { handlers });
  await dispatchCommand({ type: 'chord.confirm' }, { handlers });
  await dispatchCommand({ type: 'chord.setCell', bar: 2, span: 1, root: 'G#' }, { handlers });
  await dispatchCommand({ type: 'chord.clearCell', bar: 2, span: 1 }, { handlers });
  await dispatchCommand({ type: 'lead.noteOn', note: 'C3' }, { handlers });
  await dispatchCommand({ type: 'lead.noteOff', note: 'C3' }, { handlers });

  assert.deepEqual(calls, [
    ['tutorial.next'],
    ['tutorial.completeTask'],
    ['drums.toggle', 0, 4, 'kick'],
    ['chord.selectOption', 3],
    ['chord.confirm'],
    ['chord.setCell', 2, 1, 'G#'],
    ['chord.clearCell', 2, 1],
    ['lead.noteOn', 'C3'],
    ['lead.noteOff', 'C3'],
  ]);
  assert.deepEqual(audioCalls, [
    ['audio.triggerDrumsStep', 'kick'],
  ]);
});

test('createCommandDispatcher binds dependencies', async () => {
  const store = createMockStore();
  const dispatch = createCommandDispatcher({ store });

  assert.deepEqual(await dispatch({ type: 'transport.stop' }), { ok: true });
  assert.deepEqual(store.calls, [['stop']]);
});

test('keyboard map turns common keys into app commands', () => {
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', key: ' ' }), { type: 'transport.togglePlay' });
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', code: 'Space' }), { type: 'transport.togglePlay' });
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', key: 'Escape' }), { type: 'transport.stop' });
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', key: 'Enter' }), { type: 'tutorial.next' });
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: 'ArrowRight' }, { seekBar: 0, seekStep: 15 }),
    { type: 'transport.seek', bar: 1, step: 0 },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: 'ArrowLeft' }, { seekBar: 0, seekStep: 0 }),
    { type: 'transport.seek', bar: 0, step: 0 },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '4' }, { activeTrackId: 'lead' }),
    { type: 'lead.noteOn', note: 'F3' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keyup', key: '4' }, { activeTrackId: 'lead' }),
    { type: 'lead.noteOff', note: 'F3' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '4' }, { activeTrackId: 'chord' }),
    { type: 'chord.selectOption', optionIndex: 3 },
  );
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: '8' }, { activeTrackId: 'lead' }), null);
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: '4', repeat: true }, { activeTrackId: 'lead' }), null);
});

test('keyboard mapped commands should prevent browser defaults', () => {
  assert.equal(shouldPreventDefaultForCommand({ type: 'transport.togglePlay' }), true);
  assert.equal(shouldPreventDefaultForCommand(null), false);
});

test('dispatcher can use the real music store for existing transport actions', async () => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);

  await dispatchCommand({ type: 'transport.seek', bar: 3, step: 12 });
  assert.equal(useMusicStore.getState().seekBar, 3);
  assert.equal(useMusicStore.getState().seekStep, 12);

  await dispatchCommand({ type: 'transport.stop' });
  assert.equal(useMusicStore.getState().isPlaying, false);
  assert.equal(useMusicStore.getState().currentBar, 0);
  assert.equal(useMusicStore.getState().currentStep, 0);
});
