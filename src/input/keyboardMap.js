import { STEPS_PER_BAR, TOTAL_BARS } from '../domain/musicConstants.js';
import { getMelodyKeyNote } from '../data/melodyScales.js';
import { APP_COMMAND_TYPES, CHORD_OPTION_COUNT } from './appCommands.js';

function getEventKey(event) {
  if (event.code === 'Space') return ' ';
  return event.key;
}

function clampSeek(bar, step) {
  const totalSteps = TOTAL_BARS * STEPS_PER_BAR;
  const current = bar * STEPS_PER_BAR + step;
  const clamped = Math.max(0, Math.min(totalSteps - 1, current));

  return {
    bar: Math.floor(clamped / STEPS_PER_BAR),
    step: clamped % STEPS_PER_BAR,
  };
}

function mapArrowKeyToCommand(key, state) {
  const bar = state.seekBar ?? state.currentBar ?? 0;
  const step = state.seekStep ?? state.currentStep ?? 0;
  const delta = key === 'ArrowRight' ? 1 : -1;
  const next = clampSeek(bar, step + delta);

  return { type: APP_COMMAND_TYPES.TRANSPORT_SEEK, ...next };
}

function mapNumberKeyToCommand(eventType, key, state) {
  const number = Number.parseInt(key, 10);

  if (state.activeTrackId === 'lead') {
    const note = getMelodyKeyNote(state.melodyScaleId, key);
    if (!note || eventType === 'keypress') return null;
    return {
      type: eventType === 'keyup' ? APP_COMMAND_TYPES.LEAD_NOTE_OFF : APP_COMMAND_TYPES.LEAD_NOTE_ON,
      note,
    };
  }

  if (!Number.isInteger(number) || number < 1 || number > CHORD_OPTION_COUNT) return null;
  if (eventType !== 'keydown') return null;
  return {
    type: APP_COMMAND_TYPES.CHORD_SELECT_OPTION,
    optionIndex: number - 1,
  };
}

function isEditableKeyboardTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;

  const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function mapKeyboardEventToCommand(event, state = {}) {
  const key = getEventKey(event);
  const eventType = event.type ?? 'keydown';

  if (event.repeat) return null;
  if (isEditableKeyboardTarget(event.target)) return null;

  if (eventType === 'keydown' && key === ' ') {
    return { type: APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY };
  }

  if (eventType === 'keydown' && key === 'Escape') {
    return { type: APP_COMMAND_TYPES.TRANSPORT_STOP };
  }

  if (eventType === 'keydown' && key === 'Enter') {
    return { type: APP_COMMAND_TYPES.TUTORIAL_NEXT };
  }

  if (
    eventType === 'keydown'
    && (key === 'Delete' || key === 'Backspace')
    && state.selectedClipId
  ) {
    return { type: APP_COMMAND_TYPES.CLIP_DELETE_SELECTED };
  }

  if (eventType === 'keydown' && (key === 'ArrowLeft' || key === 'ArrowRight')) {
    return mapArrowKeyToCommand(key, state);
  }

  if (/^[.0-9\-=]$/.test(key)) {
    return mapNumberKeyToCommand(eventType, key, state);
  }

  return null;
}

function shouldPreventDefaultForCommand(command) {
  return command !== null;
}

export { mapKeyboardEventToCommand, shouldPreventDefaultForCommand };
