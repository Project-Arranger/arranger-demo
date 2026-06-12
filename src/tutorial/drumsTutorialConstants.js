const DRUMS_TUTORIAL_FIRST_BAR = 0;
const DRUMS_KICK_BLUE_STEPS = Object.freeze([0, 4, 12]);
const DRUMS_KICK_GREEN_STEPS = Object.freeze([2, 6, 10, 14]);
const DRUMS_KICK_YELLOW_STEPS = Object.freeze([1, 3, 5, 7, 9, 11, 13, 15]);
const DRUMS_DRAG_SOURCE_STEP = 0;
const DRUMS_DRAG_TARGET_STEP = 2;

const TUTORIAL_CONTROL_TARGETS = Object.freeze({
  BASS_GROOVE_BUTTON: 'bass-groove-button',
  BASS_GROOVE_CARD_PREFIX: 'bass-groove-card',
  CHORD_ENRICH_BUTTON_PREFIX: 'chord-enrich-button',
  CHORD_GROOVE_BUTTON: 'chord-groove-button',
  CHORD_GROOVE_CARD_PREFIX: 'chord-groove-card',
  CHORD_PASSING_BUTTON: 'chord-passing-button',
  CHORD_TEMPLATE_BUTTON: 'chord-template-button',
  CHORD_TEMPLATE_CARD_PREFIX: 'chord-template-card',
  FILL_EMPTY_CLIPS_PREFIX: 'fill-empty-clips',
  GENERATE_ALL_DRUMS_BARS: 'generate-all-drums-bars',
  GENERATE_CURRENT_DRUMS_BAR: 'generate-current-drums-bar',
  MELODY_EXAMPLE_KEYS_PREFIX: 'melody-example-keys',
  MELODY_SCALE_BUTTON: 'melody-scale-button',
  MELODY_SCALE_CARD_PREFIX: 'melody-scale-card',
  TRANSPORT_PLAY: 'transport-play',
});

const TUTORIAL_TARGETS = Object.freeze({
  TOP_BAR: 'top-bar',
  TRACK_AREA: 'track-area',
  TRACK_EDITOR: 'track-editor',
  DRUMS_CLIP_BAR_PREFIX: 'drums-clip-bar',
  DRUM_STEP_PREFIX: 'drum-step',
});

export {
  DRUMS_DRAG_SOURCE_STEP,
  DRUMS_DRAG_TARGET_STEP,
  DRUMS_KICK_BLUE_STEPS,
  DRUMS_KICK_GREEN_STEPS,
  DRUMS_KICK_YELLOW_STEPS,
  DRUMS_TUTORIAL_FIRST_BAR,
  TUTORIAL_CONTROL_TARGETS,
  TUTORIAL_TARGETS,
};
