import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_COMMAND_TYPES,
  CHORD_OPTION_COUNT,
  COMMAND_GROUPS,
  MELODY_NOTE_IDS,
} from '../src/input/appCommands.js';
import { isValidAppCommand } from '../src/input/commandGuards.js';
import { TOTAL_BARS, STEPS_PER_BAR } from '../src/domain/musicConstants.js';

test('app command constants use drums naming', () => {
  assert.equal(APP_COMMAND_TYPES.APP_UNDO, 'app.undo');
  assert.equal(APP_COMMAND_TYPES.APP_REDO, 'app.redo');
  assert.equal(APP_COMMAND_TYPES.DRUMS_TOGGLE, 'drums.toggle');
  assert.equal(APP_COMMAND_TYPES.CHORD_SET_CELL, 'chord.setCell');
  assert.equal(APP_COMMAND_TYPES.CHORD_CLEAR_CELL, 'chord.clearCell');
  assert.equal(APP_COMMAND_TYPES.CLIP_COPY_SELECTED, 'clip.copySelected');
  assert.equal(APP_COMMAND_TYPES.CLIP_DELETE_SELECTED, 'clip.deleteSelected');
  assert.equal(APP_COMMAND_TYPES.CLIP_PASTE, 'clip.paste');
  assert.equal(Object.values(APP_COMMAND_TYPES).includes('unknown.toggle'), false);
  assert.equal(COMMAND_GROUPS.app.includes(APP_COMMAND_TYPES.APP_UNDO), true);
  assert.equal(COMMAND_GROUPS.app.includes(APP_COMMAND_TYPES.APP_REDO), true);
  assert.equal(COMMAND_GROUPS.clip.includes(APP_COMMAND_TYPES.CLIP_COPY_SELECTED), true);
  assert.equal(COMMAND_GROUPS.clip.includes(APP_COMMAND_TYPES.CLIP_DELETE_SELECTED), true);
  assert.equal(COMMAND_GROUPS.clip.includes(APP_COMMAND_TYPES.CLIP_PASTE), true);
  assert.equal(COMMAND_GROUPS.drums.includes(APP_COMMAND_TYPES.DRUMS_TOGGLE), true);
  assert.equal(COMMAND_GROUPS.chord.includes(APP_COMMAND_TYPES.CHORD_SET_CELL), true);
  assert.equal(COMMAND_GROUPS.chord.includes(APP_COMMAND_TYPES.CHORD_CLEAR_CELL), true);
  assert.equal(CHORD_OPTION_COUNT, 8);
  assert.equal(MELODY_NOTE_IDS.length, 36);
  assert.equal(MELODY_NOTE_IDS.at(0), 'B5');
  assert.equal(MELODY_NOTE_IDS.includes('C#4'), true);
  assert.equal(MELODY_NOTE_IDS.includes('A4'), true);
  assert.equal(MELODY_NOTE_IDS.includes('C5'), true);
  assert.equal(MELODY_NOTE_IDS.includes('G5'), true);
  assert.equal(MELODY_NOTE_IDS.includes('C2'), false);
  assert.equal(MELODY_NOTE_IDS.includes('A5'), true);
  assert.equal(MELODY_NOTE_IDS.includes('C6'), false);
  assert.equal(MELODY_NOTE_IDS.at(-1), 'C3');
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

test('app commands validate exact payloads', () => {
  assert.equal(isValidAppCommand({ type: 'app.undo' }), true);
  assert.equal(isValidAppCommand({ type: 'app.redo' }), true);
  assert.equal(isValidAppCommand({ type: 'app.undo', steps: 2 }), false);
  assert.equal(isValidAppCommand({ type: 'app.redo', steps: 2 }), false);
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
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'Amadd9' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'Fmaj9' }), true);
  assert.equal(isValidAppCommand({ type: 'chord.setCell', bar: 0, span: 0, root: 'bA' }), true);
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
  assert.equal(isValidAppCommand({ type: 'clip.copySelected' }), true);
  assert.equal(isValidAppCommand({ type: 'clip.deleteSelected' }), true);
  assert.equal(isValidAppCommand({ type: 'clip.paste' }), true);
  assert.equal(isValidAppCommand({ type: 'clip.copySelected', clipId: 'drums-bar-0' }), false);
  assert.equal(isValidAppCommand({ type: 'clip.deleteSelected', clipId: 'drums-bar-0' }), false);
  assert.equal(isValidAppCommand({ type: 'clip.paste', targetBar: 1 }), false);
});

test('drums command validates track step and known instruments', () => {
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'kick' }), true);
  assert.equal(isValidAppCommand({
    type: 'drums.toggle',
    bar: 0,
    step: 0,
    instrument: 'kick',
    previewInstruments: ['kick', 'hihat'],
  }), true);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'snare' }), true);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'hihat' }), true);
  assert.equal(isValidAppCommand({ type: 'unknown.toggle', bar: 0, step: 0, instrument: 'kick' }), false);
  assert.equal(isValidAppCommand({ type: 'drums.toggle', bar: 0, step: 0, instrument: 'tom' }), false);
  assert.equal(isValidAppCommand({
    type: 'drums.toggle',
    bar: 0,
    step: 0,
    instrument: 'kick',
    previewInstruments: ['kick', 'tom'],
  }), false);
});

test('melody note commands only accept configured melody notes', () => {
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'D3' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOff', note: 'E5' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'C#4' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'G5' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'C2' }), false);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'A5' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'B5' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'C3' }), true);
  assert.equal(isValidAppCommand({ type: 'melody.noteOn', note: 'C6' }), false);
  assert.equal(isValidAppCommand({ type: 'melody.noteOff', note: 'D3', velocity: 100 }), false);
});

test('unknown or malformed commands are invalid', () => {
  assert.equal(isValidAppCommand(null), false);
  assert.equal(isValidAppCommand([]), false);
  assert.equal(isValidAppCommand({}), false);
  assert.equal(isValidAppCommand({ type: 'unknown' }), false);
});
