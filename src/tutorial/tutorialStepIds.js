const TUTORIAL_STEP_IDS = Object.freeze({
  OPENING: 'opening',
  START_CTA: 'start-cta',
  UI_TOP_BAR: 'ui-tour-top-bar',
  UI_TRACK_AREA: 'ui-tour-track-area',
  UI_EDITOR: 'ui-tour-editor',
  DRUMS_OPENING: 'drums-opening',
  DRUMS_AUTOFILL: 'drums-autofill',
  DRUMS_TASK_1_INTRO: 'drums-task-1-intro',
  DRUMS_TASK_1: 'drums-task-1-dong-ci-da-ci',
  DRUMS_TASK_1_COMPLETE: 'drums-task-1-complete',
  DRUMS_TASK_1_FEEDBACK: 'drums-task-1-feedback',
  DRUMS_TASK_2_INTRO: 'drums-task-2-intro',
  DRUMS_TASK_2: 'drums-task-2-drag',
  DRUMS_TASK_2_COMPLETE: 'drums-task-2-complete',
  DRUMS_TASK_2_FEEDBACK: 'drums-task-2-feedback',
  DRUMS_TASK_3_INTRO: 'drums-task-3-intro',
  DRUMS_TASK_3: 'drums-task-3-regularity',
  DRUMS_TASK_3_COMPLETE: 'drums-task-3-complete',
  DRUMS_TASK_4_INTRO: 'drums-task-4-intro',
  DRUMS_TASK_4: 'drums-task-4-kick-warrior',
  DRUMS_TASK_4_COMPLETE: 'drums-task-4-complete',
});

const TUTORIAL_STEP_ORDER = Object.freeze(Object.values(TUTORIAL_STEP_IDS));

export { TUTORIAL_STEP_IDS, TUTORIAL_STEP_ORDER };

