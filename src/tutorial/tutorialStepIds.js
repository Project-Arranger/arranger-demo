const TUTORIAL_STEP_IDS = Object.freeze({
  DRUMS_OPEN_FIRST_CLIP: 'drums-open-first-clip',
  DRUMS_GENERATE_CURRENT_BAR: 'drums-generate-current-bar',
  DRUMS_LISTEN_FIRST_CLIP: 'drums-listen-first-clip',
  DRUMS_FILL_TRACK_CLIPS: 'drums-fill-track-clips',
  DRUMS_GENERATE_ALL_BARS: 'drums-generate-all-bars',
  DRUMS_ADD_KICK_VARIATION: 'drums-add-kick-variation',
  DRUMS_DRAG_KICK: 'drums-drag-kick',
  DRUMS_FREE_CREATE: 'drums-free-create',
  CHORD_FILL_TRACK_CLIPS: 'chord-fill-track-clips',
  CHORD_SELECT_PROGRESSION_TEMPLATE: 'chord-select-progression-template',
  CHORD_SELECT_GROOVE_TEMPLATE: 'chord-select-groove-template',
  CHORD_LISTEN_LOOP: 'chord-listen-loop',
  CHORD_ENRICH_HARMONY: 'chord-enrich-harmony',
  CHORD_ADD_PASSING: 'chord-add-passing',
  BASS_FILL_TRACK_CLIPS: 'bass-fill-track-clips',
  BASS_SELECT_GROOVE_TEMPLATE: 'bass-select-groove-template',
  BASS_LISTEN_LOOP: 'bass-listen-loop',
});

const TUTORIAL_STEP_ORDER = Object.freeze(Object.values(TUTORIAL_STEP_IDS));

export { TUTORIAL_STEP_IDS, TUTORIAL_STEP_ORDER };
