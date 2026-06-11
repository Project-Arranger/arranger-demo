const TUTORIAL_STEP_IDS = Object.freeze({
  DRUMS_OPEN_FIRST_CLIP: 'drums-open-first-clip',
  DRUMS_GENERATE_CURRENT_BAR: 'drums-generate-current-bar',
  DRUMS_LISTEN_FIRST_CLIP: 'drums-listen-first-clip',
  DRUMS_FILL_TRACK_CLIPS: 'drums-fill-track-clips',
  DRUMS_GENERATE_ALL_BARS: 'drums-generate-all-bars',
  DRUMS_ADD_KICK_VARIATION: 'drums-add-kick-variation',
  DRUMS_DRAG_KICK: 'drums-drag-kick',
  DRUMS_FREE_CREATE: 'drums-free-create',
});

const TUTORIAL_STEP_ORDER = Object.freeze(Object.values(TUTORIAL_STEP_IDS));

export { TUTORIAL_STEP_IDS, TUTORIAL_STEP_ORDER };
