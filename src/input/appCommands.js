import { MELODY_NOTE_IDS as CONFIGURED_MELODY_NOTE_IDS } from '../data/melodyScales.js';

const APP_COMMAND_TYPES = Object.freeze({
  APP_REDO: 'app.redo',
  APP_UNDO: 'app.undo',
  TRANSPORT_TOGGLE_PLAY: 'transport.togglePlay',
  TRANSPORT_STOP: 'transport.stop',
  TRANSPORT_SEEK: 'transport.seek',
  CLIP_COPY_SELECTED: 'clip.copySelected',
  CLIP_DELETE_SELECTED: 'clip.deleteSelected',
  CLIP_PASTE: 'clip.paste',
  TUTORIAL_NEXT: 'tutorial.next',
  TUTORIAL_COMPLETE_TASK: 'tutorial.completeTask',
  DRUMS_TOGGLE: 'drums.toggle',
  CHORD_SELECT_OPTION: 'chord.selectOption',
  CHORD_CONFIRM: 'chord.confirm',
  CHORD_SET_CELL: 'chord.setCell',
  CHORD_CLEAR_CELL: 'chord.clearCell',
  MELODY_NOTE_ON: 'melody.noteOn',
  MELODY_NOTE_OFF: 'melody.noteOff',
});

const CHORD_OPTION_COUNT = 8;
const MELODY_NOTE_IDS = CONFIGURED_MELODY_NOTE_IDS;

const COMMAND_GROUPS = Object.freeze({
  app: Object.freeze([
    APP_COMMAND_TYPES.APP_REDO,
    APP_COMMAND_TYPES.APP_UNDO,
  ]),
  transport: Object.freeze([
    APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY,
    APP_COMMAND_TYPES.TRANSPORT_STOP,
    APP_COMMAND_TYPES.TRANSPORT_SEEK,
  ]),
  clip: Object.freeze([
    APP_COMMAND_TYPES.CLIP_COPY_SELECTED,
    APP_COMMAND_TYPES.CLIP_DELETE_SELECTED,
    APP_COMMAND_TYPES.CLIP_PASTE,
  ]),
  tutorial: Object.freeze([
    APP_COMMAND_TYPES.TUTORIAL_NEXT,
    APP_COMMAND_TYPES.TUTORIAL_COMPLETE_TASK,
  ]),
  drums: Object.freeze([
    APP_COMMAND_TYPES.DRUMS_TOGGLE,
  ]),
  chord: Object.freeze([
    APP_COMMAND_TYPES.CHORD_SELECT_OPTION,
    APP_COMMAND_TYPES.CHORD_CONFIRM,
    APP_COMMAND_TYPES.CHORD_SET_CELL,
    APP_COMMAND_TYPES.CHORD_CLEAR_CELL,
  ]),
  melody: Object.freeze([
    APP_COMMAND_TYPES.MELODY_NOTE_ON,
    APP_COMMAND_TYPES.MELODY_NOTE_OFF,
  ]),
});

/**
 * @typedef {{ type: 'app.undo' } | { type: 'app.redo' }} AppUiCommand
 * @typedef {{ type: 'transport.togglePlay' } | { type: 'transport.stop' } | { type: 'transport.seek', bar: number, step: number }} TransportCommand
 * @typedef {{ type: 'clip.copySelected' } | { type: 'clip.deleteSelected' } | { type: 'clip.paste' }} ClipCommand
 * @typedef {{ type: 'tutorial.next' } | { type: 'tutorial.completeTask' }} TutorialCommand
 * @typedef {{ type: 'drums.toggle', bar: number, step: number, instrument: 'kick' | 'snare' | 'hihat', previewInstruments?: Array<'kick' | 'snare' | 'hihat'> }} DrumsCommand
 * @typedef {{ type: 'chord.selectOption', optionIndex: number } | { type: 'chord.confirm' } | { type: 'chord.setCell', bar: number, span: number, root: string } | { type: 'chord.clearCell', bar: number, span: number }} ChordCommand
 * @typedef {{ type: 'melody.noteOn', note: string } | { type: 'melody.noteOff', note: string }} MelodyCommand
 * @typedef {AppUiCommand | TransportCommand | ClipCommand | TutorialCommand | DrumsCommand | ChordCommand | MelodyCommand} AppCommand
 */

export {
  APP_COMMAND_TYPES,
  CHORD_OPTION_COUNT,
  COMMAND_GROUPS,
  MELODY_NOTE_IDS,
};
