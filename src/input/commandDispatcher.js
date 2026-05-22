import useMusicStore from '../store/useMusicStore.js';
import { APP_COMMAND_TYPES } from './appCommands.js';
import { isValidAppCommand } from './commandGuards.js';

function getStore(deps) {
  return deps.store ?? useMusicStore;
}

async function maybeCall(fn, ...args) {
  if (typeof fn !== 'function') return;
  await fn(...args);
}

async function maybeCallMethod(target, methodName, ...args) {
  const fn = target?.[methodName];
  if (typeof fn !== 'function') return;
  await fn.call(target, ...args);
}

function createAudioPlayOptions(store, state) {
  return {
    bpm: state.bpm,
    bar: state.currentBar,
    step: state.currentStep,
    matrixSource: () => store.getState().matrix,
    volumeSource: () => store.getState().volumes,
  };
}

async function dispatchTransportCommand(command, deps) {
  const store = getStore(deps);
  const state = store.getState();

  switch (command.type) {
    case APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY:
      if (state.isPlaying) {
        state.pause?.();
        await maybeCallMethod(deps.audio, 'pause');
      } else {
        state.play?.();
        await maybeCallMethod(deps.audio, 'play', createAudioPlayOptions(store, state));
      }
      return { ok: true };

    case APP_COMMAND_TYPES.TRANSPORT_STOP:
      state.stop?.();
      await maybeCallMethod(deps.audio, 'stop');
      return { ok: true };

    case APP_COMMAND_TYPES.TRANSPORT_SEEK:
      if (typeof state.setTransportPosition === 'function') {
        state.setTransportPosition(command.bar, command.step);
      } else {
        state.setPosition?.(command.bar, command.step);
        state.setSeekPosition?.(command.bar, command.step);
      }
      await maybeCallMethod(deps.audio, 'seekToStep', command.bar, command.step);
      return { ok: true };

    default:
      return null;
  }
}

async function dispatchClipCommand(command, deps) {
  const store = getStore(deps);
  const state = store.getState();

  switch (command.type) {
    case APP_COMMAND_TYPES.CLIP_DELETE_SELECTED:
      state.deleteSelectedClip?.();
      return { ok: true };

    default:
      return null;
  }
}

async function dispatchHandlerCommand(command, deps) {
  const { handlers = {} } = deps;

  switch (command.type) {
    case APP_COMMAND_TYPES.TUTORIAL_NEXT:
      await maybeCall(handlers.tutorial?.next, command);
      return { ok: true };

    case APP_COMMAND_TYPES.TUTORIAL_COMPLETE_TASK:
      await maybeCall(handlers.tutorial?.completeTask, command);
      return { ok: true };

    case APP_COMMAND_TYPES.DRUMS_TOGGLE:
      await maybeCall(handlers.drums?.toggle, command);
      await maybeCallMethod(
        deps.audio,
        'triggerDrumsStep',
        command.previewInstruments ?? command.instrument,
      );
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_SELECT_OPTION:
      await maybeCall(handlers.chord?.selectOption, command);
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_CONFIRM:
      await maybeCall(handlers.chord?.confirm, command);
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_SET_CELL:
      await maybeCall(handlers.chord?.setCell, command);
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_CLEAR_CELL:
      await maybeCall(handlers.chord?.clearCell, command);
      return { ok: true };

    case APP_COMMAND_TYPES.LEAD_NOTE_ON:
      await maybeCall(handlers.lead?.noteOn, command);
      return { ok: true };

    case APP_COMMAND_TYPES.LEAD_NOTE_OFF:
      await maybeCall(handlers.lead?.noteOff, command);
      return { ok: true };

    default:
      return null;
  }
}

async function dispatchCommand(command, deps = {}) {
  if (!isValidAppCommand(command)) {
    return { ok: false, reason: 'invalid-command' };
  }

  const transportResult = await dispatchTransportCommand(command, deps);
  if (transportResult) return transportResult;

  const clipResult = await dispatchClipCommand(command, deps);
  if (clipResult) return clipResult;

  const handlerResult = await dispatchHandlerCommand(command, deps);
  if (handlerResult) return handlerResult;

  return { ok: false, reason: 'unhandled-command' };
}

function createCommandDispatcher(deps = {}) {
  return (command) => dispatchCommand(command, deps);
}

export { createCommandDispatcher, dispatchCommand };
