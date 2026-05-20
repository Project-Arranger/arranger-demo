import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_COMMAND_TYPES,
  CHORD_OPTION_COUNT,
  COMMAND_GROUPS,
  LEAD_NOTE_IDS,
} from '../src/input/appCommands.js';
import { isValidAppCommand } from '../src/input/commandGuards.js';
import { TOTAL_BARS, STEPS_PER_BAR } from '../src/domain/musicConstants.js';

test('app command constants use drums naming', () => {
  assert.equal(APP_COMMAND_TYPES.DRUMS_TOGGLE, 'drums.toggle');
  assert.equal(APP_COMMAND_TYPES.CHORD_SET_CELL, 'chord.setCell');
  assert.equal(APP_COMMAND_TYPES.CHORD_CLEAR_CELL, 'chord.clearCell');
  assert.equal(APP_COMMAND_TYPES.CLIP_DELETE_SELECTED, 'clip.deleteSelected');
  assert.equal(Object.values(APP_COMMAND_TYPES).includes('unknown.toggle'), false);
  assert.equal(COMMAND_GROUPS.clip.includes(APP_COMMAND_TYPES.CLIP_DELETE_SELECTED), true);
  assert.equal(COMMAND_GROUPS.drums.includes(APP_COMMAND_TYPES.DRUMS_TOGGLE), true);
  assert.equal(COMMAND_GROUPS.chord.includes(APP_COMMAND_TYPES.CHORD_SET_CELL), true);
  assert.equal(COMMAND_GROUPS.chord.includes(APP_COMMAND_TYPES.CHORD_CLEAR_CELL), true);
  assert.equal(CHORD_OPTION_COUNT, 8);
  assert.deepEqual(LEAD_NOTE_IDS, ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3']);
});

test('transport commands validate exact payloads', () => {
  assert.equal(isValidAppCommand({ type: 'transport.togglePlay' }), true);
  assert.equal(isValidAppCommand({ type: 'transport.stop' }), true);
  assert.equal(isValidAppCommand({ type: 'transport.togglePlay', extra: true }), false);
  assert.equal(isValidAppCommand({ type: 'transport.seek', bar: 0, step: 0 }), true);
  assert.equal(isValidAppCommand({ type: 'transport.seek', bar: TOTAL_BARS - 1, step: STEPS_PER_BAR - 1 }), true);
  assert.equal(isValidAppCommand({ type: 'transport.seek', bar: TOTAL_BARS, step: 0 }), false);
  assert.equal(isValidAppCommand({ type: 'transport.seek', bar: 0, step: STEPS_PER_BAR }), false);
});

test('tutorial and chord commands validate exact payloads', () => {
  assert.equal(isValidAppCommand({ type: 'tutorial.next' }), true);
  assert.equal(isValidAppCommand({ type: 'tutorial.completeTask' }), true);
  assert.equal(isValidAppCommand({ type: 'tutorial.next', id: 'intro' }), false);
  assert.equal(isValidAppCommand({ type: 'chord.selectOption', optionIndex: 0 }), true);
  assert.equal(isValidAppCommand({ type: 'chord.selectOption', optionIndex: 7 }), true);
  assert.equal(isValidAppCommand({ type: 'chord.selectOption', optionIndex: 8 }), false);
  assert.equal(isValidAppCommand({ type: 'chord.confirm' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.confirm', optionIndex: 0 }), false);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'C' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'Cmaj7' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'Am9' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 7, span: 3, root: 'A#' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 4, root: 'C' }), false);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'H' }), false);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'C', extra: true }), false);
  assert.equal(isValidAppCommand({ type: 'chord.clearCell', bar: 0, span: 0 }), true);
  assert.equal(isValidAppCommand({ type: 'chord.clearCell', bar: 7, span: 3 }), true);
  assert.equal(isValidAppCommand({ type: 'chord.clearCell', bar: 8, span: 0 }), false);
  assert.equal(isValidAppCommand({ type: 'chord.clearCell', bar: 0, span: 4 }), false);
  assert.equal(isValidAppCommand({ type: 'chord.clearCell', bar: 0, span: 0, root: 'C' }), false);
});

test('clip commands validate exact payloads', () => {
  assert.equal(isValidAppCommand({ type: 'clip.deleteSelected' }), true);
  assert.equal(isValidAppCommand({ type: 'clip.deleteSelected', clipId: 'drums-bar-0' }), false);
});

test('drums command validates track step and known instruments', () => {
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'kick' }), true);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'snare' }), true);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'hihat' }), true);
  assert.equal(isValidAppCommand({ type: 'unknown.toggle', bar: 0, step: 0, instrument: 'kick' }), false);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'tom' }), false);
});

test('lead note commands only accept configured lead notes', () => {
  assert.equal(isValidAppCommand({ type: 'lead.noteOn', note: 'C3' }), true);
  assert.equal(isValidAppCommand({ type: 'lead.noteOff', note: 'B3' }), true);
  assert.equal(isValidAppCommand({ type: 'lead.noteOn', note: 'C4' }), false);
  assert.equal(isValidAppCommand({ type: 'lead.noteOff', note: 'C3', velocity: 100 }), false);
});

test('unknown or malformed commands are invalid', () => {
  assert.equal(isValidAppCommand(null), false);
  assert.equal(isValidAppCommand([]), false);
  assert.equal(isValidAppCommand({}), false);
  assert.equal(isValidAppCommand({ type: 'unknown' }), false);
});
