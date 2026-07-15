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
    copySelectedClip: () => calls.push(['copySelectedClip']),
    deleteSelectedClip: () => calls.push(['deleteSelectedClip']),
    pasteClip: () => calls.push(['pasteClip']),
    play: () => calls.push(['play']),
    pause: () => calls.push(['pause']),
    stop: () => calls.push(['stop']),
    setTransportPosition: (bar, step) => {
      calls.push(['setTransportPosition', bar, step]);
      state.currentBar = bar;
      state.currentStep = step;
    },
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
  let playOptions = null;
  const audio = {
    play: (options) => {
      playOptions = options;
      audioCalls.push([
        'audio.play',
        options.bpm,
        options.bar,
        options.step,
        options.matrixSource().drums,
        typeof options.onPositionChange,
      ]);
    },
    pause: () => audioCalls.push(['audio.pause']),
    stop: () => audioCalls.push(['audio.stop']),
    seekToStep: (bar, step) => audioCalls.push(['audio.seekToStep', bar, step]),
  };

  assert.deepEqual(await dispatchCommand({ type: 'transport.togglePlay' }, { store, audio }), { ok: true });
  playOptions.onPositionChange(1, 5);
  store.getState().isPlaying = true;
  assert.deepEqual(await dispatchCommand({ type: 'transport.togglePlay' }, { store, audio }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'transport.seek', bar: 2, step: 8 }, { store, audio }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'transport.stop' }, { store, audio }), { ok: true });

  assert.deepEqual(store.calls, [
    ['play'],
    ['setTransportPosition', 1, 5],
    ['pause'],
    ['setTransportPosition', 2, 8],
    ['stop'],
  ]);
  assert.equal(store.getState().currentBar, 2);
  assert.equal(store.getState().currentStep, 8);
  assert.deepEqual(audioCalls, [
    ['audio.play', 96, 1, 4, [], 'function'],
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
    app: {
      undo: () => calls.push(['app.undo']),
      redo: () => calls.push(['app.redo']),
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
    melody: {
      noteOn: (command) => calls.push(['melody.noteOn', command.note]),
      noteOff: (command) => calls.push(['melody.noteOff', command.note]),
    },
  };
  const audio = {
    triggerDrumsStep: (instrument) => audioCalls.push(['audio.triggerDrumsStep', instrument]),
  };

  await dispatchCommand({ type: 'app.undo' }, { handlers });
  await dispatchCommand({ type: 'app.redo' }, { handlers });
  await dispatchCommand({ type: 'tutorial.next' }, { handlers });
  await dispatchCommand({ type: 'tutorial.completeTask' }, { handlers });
  await dispatchCommand({
    type: 'drums.toggle',
    bar: 0,
    step: 4,
    instrument: 'kick',
    previewInstruments: ['kick', 'hihat'],
  }, { handlers, audio });
  await dispatchCommand({ type: 'chord.selectOption', optionIndex: 3 }, { handlers });
  await dispatchCommand({ type: 'chord.confirm' }, { handlers });
  await dispatchCommand({ type: 'chord.setCell', bar: 2, span: 1, root: 'G#' }, { handlers });
  await dispatchCommand({ type: 'chord.clearCell', bar: 2, span: 1 }, { handlers });
  await dispatchCommand({ type: 'melody.noteOn', note: 'D4' }, { handlers });
  await dispatchCommand({ type: 'melody.noteOff', note: 'D4' }, { handlers });

  assert.deepEqual(calls, [
    ['app.undo'],
    ['app.redo'],
    ['tutorial.next'],
    ['tutorial.completeTask'],
    ['drums.toggle', 0, 4, 'kick'],
    ['chord.selectOption', 3],
    ['chord.confirm'],
    ['chord.setCell', 2, 1, 'G#'],
    ['chord.clearCell', 2, 1],
    ['melody.noteOff', 'D4'],
  ]);
  assert.deepEqual(audioCalls, [
    ['audio.triggerDrumsStep', ['kick', 'hihat']],
  ]);
});

test('melody noteOn previews audio without calling editor recording handlers', async () => {
  const calls = [];
  const handlers = {
    melody: {
      noteOn: (command) => calls.push(['handler.melody.noteOn', command.note]),
    },
  };
  const audio = {
    triggerMelodyNote: (note, duration) => calls.push(['audio.triggerMelodyNote', note, duration]),
  };

  await dispatchCommand({ type: 'melody.noteOn', note: 'C4' }, { handlers, audio });

  assert.deepEqual(calls, [
    ['audio.triggerMelodyNote', 'C4', '16n'],
  ]);
});

test('melody noteOn does not fall back to editor recording when audio preview is unavailable', async () => {
  const calls = [];
  const handlers = {
    melody: {
      noteOn: (command) => calls.push(['handler.melody.noteOn', command.note]),
    },
  };

  assert.deepEqual(await dispatchCommand({ type: 'melody.noteOn', note: 'C4' }, { handlers }), { ok: true });

  assert.deepEqual(calls, []);
});

test('createCommandDispatcher binds dependencies', async () => {
  const store = createMockStore();
  const dispatch = createCommandDispatcher({ store });

  assert.deepEqual(await dispatch({ type: 'transport.stop' }), { ok: true });
  assert.deepEqual(store.calls, [['stop']]);
});

test('clip commands dispatch to selected clip store actions and injected handlers', async () => {
  const store = createMockStore();
  const calls = [];
  const handlers = {
    clip: {
      copySelected: () => calls.push(['clip.copySelected']),
      paste: () => calls.push(['clip.paste']),
    },
  };

  assert.deepEqual(await dispatchCommand({ type: 'clip.copySelected' }, { store, handlers }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'clip.deleteSelected' }, { store }), { ok: true });
  assert.deepEqual(await dispatchCommand({ type: 'clip.paste' }, { store, handlers }), { ok: true });
  assert.deepEqual(calls, [
    ['clip.copySelected'],
    ['clip.paste'],
  ]);
  assert.deepEqual(store.calls, [['deleteSelectedClip']]);
});

test('keyboard map turns common keys into app commands', () => {
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', key: 'z', ctrlKey: true }), { type: 'app.undo' });
  assert.deepEqual(mapKeyboardEventToCommand({ type: 'keydown', key: 'z', metaKey: true }), { type: 'app.undo' });
  assert.equal(mapKeyboardEventToCommand({ type: 'keyup', key: 'z', ctrlKey: true }), null);
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: 'z', ctrlKey: true, shiftKey: true }), null);
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: 'z', metaKey: true, shiftKey: true }), null);
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: 'y', ctrlKey: true }), null);
  assert.equal(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'z', ctrlKey: true, target: { tagName: 'INPUT', isContentEditable: false } },
    ),
    null,
  );
  assert.deepEqual(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'c', ctrlKey: true },
      { selectedClipId: 'drums-bar-0' },
    ),
    { type: 'clip.copySelected' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'c', metaKey: true },
      { selectedClipId: 'drums-bar-0' },
    ),
    { type: 'clip.copySelected' },
  );
  assert.equal(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'c', ctrlKey: true },
      { selectedClipId: null },
    ),
    null,
  );
  assert.deepEqual(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'v', metaKey: true },
      { activeTrackId: 'drums', selectedBar: 0 },
    ),
    { type: 'clip.paste' },
  );
  assert.equal(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'v', metaKey: true, target: { tagName: 'TEXTAREA', isContentEditable: false } },
      { activeTrackId: 'drums', selectedBar: 0 },
    ),
    null,
  );
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
  assert.equal(
    mapKeyboardEventToCommand({ type: 'keydown', key: '·' }, { activeTrackId: 'melody', melodyScaleId: 'major' }),
    null,
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '1' }, { activeTrackId: 'melody', melodyScaleId: 'major' }),
    { type: 'melody.noteOn', note: 'C4' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keyup', key: '=' }, { activeTrackId: 'melody', melodyScaleId: 'pentatonic' }),
    { type: 'melody.noteOff', note: 'B4' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '+' }, { activeTrackId: 'melody', melodyScaleId: 'major' }),
    { type: 'melody.noteOn', note: 'B4' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '5' }, { activeTrackId: 'melody', melodyScaleId: 'major' }),
    mapKeyboardEventToCommand({ type: 'keydown', key: '5' }, { activeTrackId: 'melody', melodyScaleId: 'pentatonic' }),
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: '4' }, { activeTrackId: 'chord' }),
    { type: 'chord.selectOption', optionIndex: 3 },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: 'Delete' }, { selectedClipId: 'drums-bar-0' }),
    { type: 'clip.deleteSelected' },
  );
  assert.deepEqual(
    mapKeyboardEventToCommand({ type: 'keydown', key: 'Backspace' }, { selectedClipId: 'drums-bar-0' }),
    { type: 'clip.deleteSelected' },
  );
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: 'Delete' }, { selectedClipId: null }), null);
  assert.equal(
    mapKeyboardEventToCommand(
      { type: 'keydown', key: 'Delete', target: { tagName: 'INPUT', isContentEditable: false } },
      { selectedClipId: 'drums-bar-0' },
    ),
    null,
  );
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: 'q' }, { activeTrackId: 'melody' }), null);
  assert.equal(mapKeyboardEventToCommand({ type: 'keydown', key: '4', repeat: true }, { activeTrackId: 'melody' }), null);
});

test('keyboard mapped commands should prevent browser defaults', () => {
  assert.equal(shouldPreventDefaultForCommand({ type: 'transport.togglePlay' }), true);
  assert.equal(shouldPreventDefaultForCommand(null), false);
});

test('dispatcher can use the real music store for existing transport actions', async () => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);

  await dispatchCommand({ type: 'transport.seek', bar: 3, step: 12 });
  assert.equal(useMusicStore.getState().currentBar, 3);
  assert.equal(useMusicStore.getState().currentStep, 12);
  assert.equal(useMusicStore.getState().seekBar, 3);
  assert.equal(useMusicStore.getState().seekStep, 12);

  await dispatchCommand({ type: 'transport.stop' });
  assert.equal(useMusicStore.getState().isPlaying, false);
  assert.equal(useMusicStore.getState().currentBar, 3);
  assert.equal(useMusicStore.getState().currentStep, 12);
  assert.equal(useMusicStore.getState().seekBar, 3);
  assert.equal(useMusicStore.getState().seekStep, 12);
});
