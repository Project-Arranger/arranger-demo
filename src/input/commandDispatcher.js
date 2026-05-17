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

async function dispatchTransportCommand(command, deps) {
  const store = getStore(deps);
  const state = store.getState();

  switch (command.type) {
    case APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY:
      if (state.isPlaying) {
        state.pause?.();
        await maybeCall(deps.audio?.pause);
      } else {
        state.play?.();
        await maybeCall(deps.audio?.play);
      }
      return { ok: true };

    case APP_COMMAND_TYPES.TRANSPORT_STOP:
      state.stop?.();
      await maybeCall(deps.audio?.stop);
      return { ok: true };

    case APP_COMMAND_TYPES.TRANSPORT_SEEK:
      state.setSeekPosition?.(command.bar, command.step);
      await maybeCall(deps.audio?.seekToStep, command.bar, command.step);
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
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_SELECT_OPTION:
      await maybeCall(handlers.chord?.selectOption, command);
      return { ok: true };

    case APP_COMMAND_TYPES.CHORD_CONFIRM:
      await maybeCall(handlers.chord?.confirm, command);
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

  const handlerResult = await dispatchHandlerCommand(command, deps);
  if (handlerResult) return handlerResult;

  return { ok: false, reason: 'unhandled-command' };
}

function createCommandDispatcher(deps = {}) {
  return (command) => dispatchCommand(command, deps);
}

export { createCommandDispatcher, dispatchCommand };
