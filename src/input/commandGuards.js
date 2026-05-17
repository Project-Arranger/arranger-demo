import { DRUMS_INSTRUMENT_IDS, STEPS_PER_BAR, TOTAL_BARS } from '../domain/musicConstants.js';
import { APP_COMMAND_TYPES, CHORD_OPTION_COUNT, LEAD_NOTE_IDS } from './appCommands.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value, keys) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function hasValidSeekPayload(command) {
  return (
    hasOnlyKeys(command, ['type', 'bar', 'step']) &&
    isIntegerInRange(command.bar, 0, TOTAL_BARS - 1) &&
    isIntegerInRange(command.step, 0, STEPS_PER_BAR - 1)
  );
}

function hasValidDrumsPayload(command) {
  return (
    hasOnlyKeys(command, ['type', 'bar', 'step', 'instrument']) &&
    isIntegerInRange(command.bar, 0, TOTAL_BARS - 1) &&
    isIntegerInRange(command.step, 0, STEPS_PER_BAR - 1) &&
    DRUMS_INSTRUMENT_IDS.includes(command.instrument)
  );
}

function hasValidChordOptionPayload(command) {
  return (
    hasOnlyKeys(command, ['type', 'optionIndex']) &&
    isIntegerInRange(command.optionIndex, 0, CHORD_OPTION_COUNT - 1)
  );
}

function hasValidLeadPayload(command) {
  return (
    hasOnlyKeys(command, ['type', 'note']) &&
    LEAD_NOTE_IDS.includes(command.note)
  );
}

function isValidAppCommand(command) {
  if (!isPlainObject(command) || typeof command.type !== 'string') return false;

  switch (command.type) {
    case APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY:
    case APP_COMMAND_TYPES.TRANSPORT_STOP:
    case APP_COMMAND_TYPES.TUTORIAL_NEXT:
    case APP_COMMAND_TYPES.TUTORIAL_COMPLETE_TASK:
    case APP_COMMAND_TYPES.CHORD_CONFIRM:
      return hasOnlyKeys(command, ['type']);

    case APP_COMMAND_TYPES.TRANSPORT_SEEK:
      return hasValidSeekPayload(command);

    case APP_COMMAND_TYPES.DRUMS_TOGGLE:
      return hasValidDrumsPayload(command);

    case APP_COMMAND_TYPES.CHORD_SELECT_OPTION:
      return hasValidChordOptionPayload(command);

    case APP_COMMAND_TYPES.LEAD_NOTE_ON:
    case APP_COMMAND_TYPES.LEAD_NOTE_OFF:
      return hasValidLeadPayload(command);

    default:
      return false;
  }
}

export { isValidAppCommand };
