import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TUTORIAL_STEP_IDS,
  TUTORIAL_STEP_ORDER,
} from '../src/tutorial/tutorialStepIds.js';
import { DRUMS_TUTORIAL_STEPS } from '../src/tutorial/drumsTutorialSteps.js';

test('drums tutorial exposes the priority step order', () => {
  assert.deepEqual(TUTORIAL_STEP_ORDER.slice(0, 5), [
    TUTORIAL_STEP_IDS.OPENING,
    TUTORIAL_STEP_IDS.START_CTA,
    TUTORIAL_STEP_IDS.UI_TOP_BAR,
    TUTORIAL_STEP_IDS.UI_TRACK_AREA,
    TUTORIAL_STEP_IDS.UI_EDITOR,
  ]);
  assert.equal(TUTORIAL_STEP_ORDER.at(-1), TUTORIAL_STEP_IDS.DRUMS_TASK_4_COMPLETE);
});

test('drums tutorial keeps priority copy in configuration', () => {
  const stepsById = Object.fromEntries(DRUMS_TUTORIAL_STEPS.map((step) => [step.id, step]));

  assert.equal(
    stepsById[TUTORIAL_STEP_IDS.OPENING].copy,
    '你将像搭积木一样创作一段独属于你的音乐片段',
  );
  assert.equal(stepsById[TUTORIAL_STEP_IDS.START_CTA].copy, '开始创造');
  assert.equal(
    stepsById[TUTORIAL_STEP_IDS.UI_TOP_BAR].copy,
    '在这里，你可以调整你的音轨整体参数或设置循环播放',
  );
  assert.equal(stepsById[TUTORIAL_STEP_IDS.DRUMS_TASK_1].title, '任务1《动次打次》');
  assert.match(stepsById[TUTORIAL_STEP_IDS.DRUMS_TASK_4].copy, /底鼓战士/);
});

test('drums tutorial fills the basic groove only on the autofill step', () => {
  const setupSteps = DRUMS_TUTORIAL_STEPS
    .filter((step) => step.setup?.type === 'generate-initial-drums')
    .map((step) => step.id);

  assert.deepEqual(setupSteps, [TUTORIAL_STEP_IDS.DRUMS_AUTOFILL]);
});
