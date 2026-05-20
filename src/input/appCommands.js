const APP_COMMAND_TYPES = Object.freeze({
  TRANSPORT_TOGGLE_PLAY: 'transport.togglePlay',
  TRANSPORT_STOP: 'transport.stop',
  TRANSPORT_SEEK: 'transport.seek',
  CLIP_DELETE_SELECTED: 'clip.deleteSelected',
  TUTORIAL_NEXT: 'tutorial.next',
  TUTORIAL_COMPLETE_TASK: 'tutorial.completeTask',
  DRUMS_TOGGLE: 'drums.toggle',
  CHORD_SELECT_OPTION: 'chord.selectOption',
  CHORD_CONFIRM: 'chord.confirm',
  CHORD_SET_CELL: 'chord.setCell',
  CHORD_CLEAR_CELL: 'chord.clearCell',
  LEAD_NOTE_ON: 'lead.noteOn',
  LEAD_NOTE_OFF: 'lead.noteOff',
});

const CHORD_OPTION_COUNT = 8;
const LEAD_NOTE_IDS = Object.freeze(['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3']);

const COMMAND_GROUPS = Object.freeze({
  transport: Object.freeze([
    APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY,
    APP_COMMAND_TYPES.TRANSPORT_STOP,
    APP_COMMAND_TYPES.TRANSPORT_SEEK,
  ]),
  clip: Object.freeze([
    APP_COMMAND_TYPES.CLIP_DELETE_SELECTED,
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
  lead: Object.freeze([
    APP_COMMAND_TYPES.LEAD_NOTE_ON,
    APP_COMMAND_TYPES.LEAD_NOTE_OFF,
  ]),
});

/**
 * @typedef {{ type: 'transport.togglePlay' } | { type: 'transport.stop' } | { type: 'transport.seek', bar: number, step: number }} TransportCommand
 * @typedef {{ type: 'clip.deleteSelected' }} ClipCommand
 * @typedef {{ type: 'tutorial.next' } | { type: 'tutorial.completeTask' }} TutorialCommand
 * @typedef {{ type: 'drums.toggle', bar: number, step: number, instrument: 'kick' | 'snare' | 'hihat' }} DrumsCommand
 * @typedef {{ type: 'chord.selectOption', optionIndex: number } | { type: 'chord.confirm' } | { type: 'chord.setCell', bar: number, span: number, root: string } | { type: 'chord.clearCell', bar: number, span: number }} ChordCommand
 * @typedef {{ type: 'lead.noteOn', note: string } | { type: 'lead.noteOff', note: string }} LeadCommand
 * @typedef {TransportCommand | ClipCommand | TutorialCommand | DrumsCommand | ChordCommand | LeadCommand} AppCommand
 */

export {
  APP_COMMAND_TYPES,
  CHORD_OPTION_COUNT,
  COMMAND_GROUPS,
  LEAD_NOTE_IDS,
};
