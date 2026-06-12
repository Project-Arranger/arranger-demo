# Drums Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the priority Drums tutorial path: opening, UI tour, generated four-bar groove, three guided kick-edit tasks, four free kick bars, and final eight-bar playback.

**Architecture:** Treat the user's latest table as the source of truth for copy, triggers, and UI presentation. Add a small tutorial domain under `src/tutorial`, a tutorial Zustand slice, and focused drums tutorial helpers so the existing drums editor, timeline, command dispatcher, and audio engine stay reusable. Tutorial UI reads declarative step configuration; task completion reads matrix and tutorial state rather than component internals.

**Tech Stack:** Vite, React, Zustand, Tone.js, Node test runner, existing CSS in `src/index.css`.

---

## Source Priority

The priority product source is the user's latest table in this thread. Use old `arranger` documents only as constraints:

- `/Users/nora/Documents/Nora/app/arranger/docs/ARRANGER_REWRITE_REQUIREMENTS.md:89` says tutorial uses real UI overlay, right-side fixed panel, target highlight, and copy in config.
- `/Users/nora/Documents/Nora/app/arranger/docs/V022_UI_DECISIONS.md:5` says overlay does not duplicate interactive UI and target areas remain clickable.
- `/Users/nora/Documents/Nora/app/arranger/docs/PROJECT_ARCHITECTURE_AGENT_PLAN.md:280` says percussion owns 16-step grid, Kick/Snare/Hihat rows, automatic groove, four percussion tasks, clicking, dragging, validation, and sound feedback.

## File Structure

- Create `src/tutorial/tutorialStepIds.js`: stable IDs and ordered phases for the opening, UI tour, drums setup, four tasks, and completion.
- Create `src/tutorial/drumsTutorialSteps.js`: declarative step copy, UI presentation mode, target selectors, progress labels, and playback intent. Chinese copy is kept here.
- Create `src/tutorial/drumsTutorialConstants.js`: tutorial bars, target steps, source steps, completion counts, and DOM target names.
- Create `src/tutorial/drumsTutorialEvaluators.js`: pure functions that decide task progress and completion from matrix plus tutorial state.
- Create `src/tutorial/drumsTutorialSetup.js`: pure helpers to write the first four basic drums bars and create the final four empty drums bars.
- Create `src/store/slices/tutorialSlice.js`: current step, task progress, edited bar tracking, active toast, and actions for step transition.
- Create `src/app/components/TutorialOverlay.jsx`: fixed right tutorial panel, task text, progress text, CTA, and toast display.
- Modify `src/store/useMusicStore.js`: compose tutorial slice.
- Modify `src/app/App.jsx`: run tutorial setup actions at the right steps, pass tutorial props to UI components, and trigger playback callbacks.
- Modify `src/app/components/TopBar.jsx`: add `data-tutorial-target="top-bar"`.
- Modify `src/app/components/Timeline.jsx`: add `data-tutorial-target="track-area"` and per-bar `data-tutorial-target` hooks for drums clips.
- Modify `src/app/components/BottomEditor.jsx`: add `data-tutorial-target="track-editor"`.
- Modify `src/app/components/DrumSequencer.jsx`: add tutorial target attributes, flashing classes, and pointer drag for kick movement.
- Modify `src/app/drumsPatternActions.js`: export helpers for replacing multiple bars without clearing unrelated tracks.
- Modify `src/app/drumSequencerData.js`: expose row/step target helpers used by the sequencer and tests.
- Modify `src/index.css`: tutorial panel, overlay highlight, target flashing, and toast styles.
- Test `tests/drums_tutorial_steps.test.js`: step IDs, order, copy, and presentation modes.
- Test `tests/drums_tutorial_evaluators.test.js`: Task 1-4 progress/completion rules.
- Test `tests/drums_tutorial_setup.test.js`: four-bar generation and final four-bar creation preserve earlier edits.
- Test `tests/ui_shell.test.js`: tutorial overlay mount and target attributes.
- Test `tests/ui_layout_css.test.js`: panel width and flashing selectors.

## Tutorial Step Model

Use these stable IDs:

```js
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
```

Use these implementation decisions unless product changes the table:

- Task 1 runs on bars `0, 1, 2, 3`.
- Task 1 accepted kick target steps are `2, 6, 10, 14`; the user must add kick to two different bars.
- Task 2 runs only on the two Task 1-unedited bars. It accepts moving kick from step `0` to step `2` in either one of those bars.
- Task 3 runs on the last bar not edited by Task 1 or Task 2. It accepts adding kick at step `4` or step `12`.
- Task 4 creates empty drums clips for bars `4, 5, 6, 7`, tracks any kick edits in those bars, and completes when the user presses the enabled completion button.
- Task 1-3 completion playback covers bars `0, 1, 2, 3`; Task 4 completion playback covers bars `0` through `7`.

## Task 1: Step IDs And Copy Configuration

**Files:**
- Create: `src/tutorial/tutorialStepIds.js`
- Create: `src/tutorial/drumsTutorialConstants.js`
- Create: `src/tutorial/drumsTutorialSteps.js`
- Test: `tests/drums_tutorial_steps.test.js`

- [ ] **Step 1: Write the failing test for ordered IDs and priority copy**

```js
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

  assert.equal(stepsById[TUTORIAL_STEP_IDS.OPENING].copy, '你将像搭积木一样创作一段独属于你的音乐片段');
  assert.equal(stepsById[TUTORIAL_STEP_IDS.START_CTA].copy, '开始创造');
  assert.equal(stepsById[TUTORIAL_STEP_IDS.UI_TOP_BAR].copy, '在这里，你可以调整你的音轨整体参数或设置循环播放');
  assert.equal(stepsById[TUTORIAL_STEP_IDS.DRUMS_TASK_1].title, '任务1《动次打次》');
  assert.match(stepsById[TUTORIAL_STEP_IDS.DRUMS_TASK_4].copy, /底鼓战士/);
});
```

- [ ] **Step 2: Run the failing test**

Run: `node --test tests/drums_tutorial_steps.test.js`

Expected: FAIL with module-not-found for `src/tutorial/tutorialStepIds.js`.

- [ ] **Step 3: Add `tutorialStepIds.js`**

```js
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
```

- [ ] **Step 4: Add constants**

```js
const DRUMS_TUTORIAL_INITIAL_BARS = Object.freeze([0, 1, 2, 3]);
const DRUMS_TUTORIAL_FREE_BARS = Object.freeze([4, 5, 6, 7]);
const DRUMS_TASK_1_TARGET_STEPS = Object.freeze([2, 6, 10, 14]);
const DRUMS_TASK_2_SOURCE_STEP = 0;
const DRUMS_TASK_2_TARGET_STEP = 2;
const DRUMS_TASK_3_TARGET_STEPS = Object.freeze([4, 12]);

const TUTORIAL_TARGETS = Object.freeze({
  TOP_BAR: 'top-bar',
  TRACK_AREA: 'track-area',
  TRACK_EDITOR: 'track-editor',
  DRUMS_CLIP_BAR_PREFIX: 'drums-clip-bar',
  DRUM_STEP_PREFIX: 'drum-step',
});

export {
  DRUMS_TASK_1_TARGET_STEPS,
  DRUMS_TASK_2_SOURCE_STEP,
  DRUMS_TASK_2_TARGET_STEP,
  DRUMS_TASK_3_TARGET_STEPS,
  DRUMS_TUTORIAL_FREE_BARS,
  DRUMS_TUTORIAL_INITIAL_BARS,
  TUTORIAL_TARGETS,
};
```

- [ ] **Step 5: Add the priority copy config**

Use the exact table copy:

```js
import { TUTORIAL_STEP_IDS } from './tutorialStepIds.js';
import { TUTORIAL_TARGETS } from './drumsTutorialConstants.js';

const DRUMS_TUTORIAL_STEPS = Object.freeze([
  {
    id: TUTORIAL_STEP_IDS.OPENING,
    phase: 'Opening',
    title: '开场最高任务',
    trigger: '用户进入正式操作前',
    copy: '你将像搭积木一样创作一段独属于你的音乐片段',
    uiMode: 'opening-key-message',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.START_CTA,
    phase: 'Start CTA',
    title: '进入主界面',
    trigger: '用户点击开始按钮',
    copy: '开始创造',
    uiMode: 'primary-cta',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.UI_TOP_BAR,
    phase: 'UI Tour',
    title: 'Top Bar 介绍',
    trigger: 'Top Bar 被 Highlight',
    copy: '在这里，你可以调整你的音轨整体参数或设置循环播放',
    uiMode: 'target-popover',
    target: { name: TUTORIAL_TARGETS.TOP_BAR },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.UI_TRACK_AREA,
    phase: 'UI Tour',
    title: '全局音轨区介绍',
    trigger: '全局音轨区被 Highlight',
    copy: '在这里，你可以对操作构成你的乐曲的每个音轨，并可以拖动进度条到你想要的位置',
    uiMode: 'target-popover',
    target: { name: TUTORIAL_TARGETS.TRACK_AREA },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.UI_EDITOR,
    phase: 'UI Tour',
    title: '音轨编辑区介绍',
    trigger: '音轨编辑区被 Highlight',
    copy: '在这里，详细地编辑各个音轨，获取你想要的声音效果',
    uiMode: 'target-popover',
    target: { name: TUTORIAL_TARGETS.TRACK_EDITOR },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_OPENING,
    phase: 'Drums Setup',
    title: '第一个任务开场',
    trigger: 'UI 区域介绍结束后',
    copy: '让我们从零开始设计一段打击乐律动——这是你的音乐的地基',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_AUTOFILL,
    phase: 'Drums Setup',
    title: '自动生成基础律动',
    trigger: '打击乐音轨出现后',
    copy: '每个人的生命里都会听到的律动：动次打次🥁',
    uiMode: 'task-prompt',
    setup: { type: 'generate-initial-drums' },
    playback: { bars: [0, 1, 2, 3], autoStart: true },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_1_INTRO,
    phase: 'Drums Task 1',
    title: '任务1引导',
    trigger: '基础律动播放后',
    copy: '但简单的改造，就会让它听起来惊喜满满。来试试看！',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_1,
    phase: 'Drums Task 1',
    title: '任务1《动次打次》',
    trigger: '四个节奏乐句 block 与可点击格子开始闪烁',
    copy: '任务1《动次打次》：挑选任意两小节，在闪烁位置增加一个底鼓音符（0/2）',
    progressCopy: '挑选任意两小节，在闪烁位置增加一个底鼓音符',
    uiMode: 'task-progress',
    completion: { type: 'drums-task-1' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_1_COMPLETE,
    phase: 'Drums Task 1',
    title: '任务1完成',
    trigger: '用户完成 2 个底鼓音符后',
    copy: '干得好👍，现在听听看这两个音符带来了什么不同👀',
    uiMode: 'completion-feedback',
    playback: { bars: [0, 1, 2, 3], autoStart: true },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_1_FEEDBACK,
    phase: 'Drums Task 1',
    title: '任务1回放后',
    trigger: '四小节回放结束',
    copy: '感觉到不同了吗？😉',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_2_INTRO,
    phase: 'Drums Task 2',
    title: '任务2转场',
    trigger: '任务1反馈后',
    copy: '它还能更好玩——',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_2,
    phase: 'Drums Task 2',
    title: '任务2《拖和拽》',
    trigger: '未编辑两小节开始闪烁',
    copy: '任务2《拖和拽》：在尚未编辑的两小节中的任意一小节，将底鼓音符向右移动两格（0/1）',
    progressCopy: '在尚未编辑的两小节，将底鼓音符向右移动两格',
    uiMode: 'task-progress',
    completion: { type: 'drums-task-2' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_2_COMPLETE,
    phase: 'Drums Task 2',
    title: '任务2完成',
    trigger: '拖动完成后',
    copy: '简单的拖动，能带来多大改变？🤔听听看就知道了！',
    uiMode: 'completion-feedback',
    playback: { bars: [0, 1, 2, 3], autoStart: true },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_2_FEEDBACK,
    phase: 'Drums Task 2',
    title: '任务2回放后',
    trigger: '四小节回放结束',
    copy: '感觉到你刚才拖拽的那个底鼓音符带来的律动感了吗？💃',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_3_INTRO,
    phase: 'Drums Task 3',
    title: '任务3转场',
    trigger: '任务2反馈后',
    copy: '再来试试最后一种手法——',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_3,
    phase: 'Drums Task 3',
    title: '任务3《循规蹈矩》',
    trigger: '最后一个未编辑小节开始闪烁',
    copy: '任务3《循规蹈矩》：在最后一个尚未编辑的小节中的第5或第13格增加一个底鼓音符（0/1）',
    progressCopy: '在最后一个尚未编辑的小节中，在最后一个尚未编辑的小节中的第5或第13格增加一个底鼓音符',
    uiMode: 'task-progress',
    completion: { type: 'drums-task-3' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_3_COMPLETE,
    phase: 'Drums Task 3',
    title: '任务3完成',
    trigger: '点击完成后',
    copy: '在这两个位置增加一个底鼓音符，听起来会更加整齐',
    uiMode: 'completion-feedback',
    playback: { bars: [0, 1, 2, 3], autoStart: true },
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_4_INTRO,
    phase: 'Drums Task 4',
    title: '任务4转场',
    trigger: '任务3回放结束',
    copy: '现在，你已经掌握了基础三种创造律动感的手法，现在再来尝试四小节，只通过编辑底鼓音符来创造你的律动！',
    uiMode: 'task-prompt',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_4,
    phase: 'Drums Task 4',
    title: '任务4《底鼓战士》',
    trigger: '自动增加 4 小节后',
    copy: '任务4《底鼓战士》：根据刚刚掌握的三种手法，自由创作四小节的底鼓音符，满意后点按完成按钮继续',
    uiMode: 'task-with-complete-button',
    setup: { type: 'create-free-drums-bars' },
    completion: { type: 'drums-task-4' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_TASK_4_COMPLETE,
    phase: 'Drums Complete',
    title: '任务4完成',
    trigger: '用户点击完成按钮后',
    copy: '好玩吧？更好玩的还在后头——',
    uiMode: 'completion-feedback',
    playback: { bars: [0, 1, 2, 3, 4, 5, 6, 7], autoStart: true },
    completion: { type: 'manual' },
  },
]);

export { DRUMS_TUTORIAL_STEPS };
```

- [ ] **Step 6: Run the test**

Run: `node --test tests/drums_tutorial_steps.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tutorial/tutorialStepIds.js src/tutorial/drumsTutorialConstants.js src/tutorial/drumsTutorialSteps.js tests/drums_tutorial_steps.test.js
git commit -m "feat: add drums tutorial step config"
```

## Task 2: Drums Tutorial Setup Helpers

**Files:**
- Create: `src/tutorial/drumsTutorialSetup.js`
- Modify: `src/app/drumsPatternActions.js`
- Test: `tests/drums_tutorial_setup.test.js`

- [ ] **Step 1: Write the failing setup tests**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import {
  createFreeDrumsTutorialBars,
  createInitialDrumsTutorialBars,
} from '../src/tutorial/drumsTutorialSetup.js';

test('createInitialDrumsTutorialBars writes the basic groove into the first four bars', () => {
  const matrix = createInitialMatrix();
  matrix.chord[0][0] = { root: 'C' };

  const nextMatrix = createInitialDrumsTutorialBars(matrix);

  assert.deepEqual(nextMatrix.drums[0][0], { instruments: ['kick', 'hihat'] });
  assert.deepEqual(nextMatrix.drums[3][8], { instruments: ['snare', 'hihat'] });
  assert.equal(nextMatrix.drums[4][0], null);
  assert.deepEqual(nextMatrix.chord[0][0], { root: 'C' });
});

test('createFreeDrumsTutorialBars clears only bars four through seven', () => {
  const matrix = createInitialDrumsTutorialBars(createInitialMatrix());
  matrix.drums[0][2] = { instruments: ['kick'] };
  matrix.drums[4][0] = { instruments: ['snare'] };

  const nextMatrix = createFreeDrumsTutorialBars(matrix);

  assert.deepEqual(nextMatrix.drums[0][2], { instruments: ['kick'] });
  assert.equal(nextMatrix.drums[4].every((cell) => cell === null), true);
  assert.equal(nextMatrix.drums[7].every((cell) => cell === null), true);
});
```

- [ ] **Step 2: Run the failing test**

Run: `node --test tests/drums_tutorial_setup.test.js`

Expected: FAIL with module-not-found for `src/tutorial/drumsTutorialSetup.js`.

- [ ] **Step 3: Implement setup helpers**

```js
import { createBasicDrumsBar, createEmptyDrumsBar } from '../app/drumsPatternActions.js';
import {
  DRUMS_TUTORIAL_FREE_BARS,
  DRUMS_TUTORIAL_INITIAL_BARS,
} from './drumsTutorialConstants.js';

function replaceDrumsBars(matrix, barMap) {
  if (!matrix?.drums) return matrix;

  const nextDrums = matrix.drums.map((bar, barIndex) => (
    barMap.has(barIndex) ? barMap.get(barIndex) : bar
  ));

  return {
    ...matrix,
    drums: nextDrums,
  };
}

function createInitialDrumsTutorialBars(matrix) {
  return replaceDrumsBars(
    matrix,
    new Map(DRUMS_TUTORIAL_INITIAL_BARS.map((bar) => [bar, createBasicDrumsBar()])),
  );
}

function createFreeDrumsTutorialBars(matrix) {
  return replaceDrumsBars(
    matrix,
    new Map(DRUMS_TUTORIAL_FREE_BARS.map((bar) => [bar, createEmptyDrumsBar()])),
  );
}

export {
  createFreeDrumsTutorialBars,
  createInitialDrumsTutorialBars,
  replaceDrumsBars,
};
```

- [ ] **Step 4: Run setup tests**

Run: `node --test tests/drums_tutorial_setup.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tutorial/drumsTutorialSetup.js tests/drums_tutorial_setup.test.js
git commit -m "feat: add drums tutorial setup helpers"
```

## Task 3: Task Evaluators

**Files:**
- Create: `src/tutorial/drumsTutorialEvaluators.js`
- Test: `tests/drums_tutorial_evaluators.test.js`

- [ ] **Step 1: Write failing tests for Task 1-3 completion**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import { createInitialDrumsTutorialBars } from '../src/tutorial/drumsTutorialSetup.js';
import {
  getDrumsTask1Progress,
  getDrumsTask2Progress,
  getDrumsTask3Progress,
  getRemainingTutorialBars,
} from '../src/tutorial/drumsTutorialEvaluators.js';

test('task 1 counts different bars with added kick on flashing positions', () => {
  const matrix = createInitialDrumsTutorialBars(createInitialMatrix());
  matrix.drums[0][2] = createDrumsCell(['kick']);
  matrix.drums[1][6] = createDrumsCell(['kick']);

  assert.deepEqual(getDrumsTask1Progress(matrix), {
    count: 2,
    total: 2,
    bars: [0, 1],
    complete: true,
  });
});

test('task 2 completes when one remaining bar moves kick from step zero to step two', () => {
  const matrix = createInitialDrumsTutorialBars(createInitialMatrix());
  matrix.drums[0][2] = createDrumsCell(['kick']);
  matrix.drums[1][6] = createDrumsCell(['kick']);
  matrix.drums[2][0] = createDrumsCell(['hihat']);
  matrix.drums[2][2] = createDrumsCell(['kick']);

  assert.deepEqual(getRemainingTutorialBars([0, 1]), [2, 3]);
  assert.deepEqual(getDrumsTask2Progress(matrix, [0, 1]), {
    count: 1,
    total: 1,
    bar: 2,
    complete: true,
  });
});

test('task 3 completes when the last untouched bar receives kick on step five or thirteen', () => {
  const matrix = createInitialDrumsTutorialBars(createInitialMatrix());
  matrix.drums[3][12] = createDrumsCell(['kick', 'hihat']);

  assert.deepEqual(getDrumsTask3Progress(matrix, [0, 1], 2), {
    count: 1,
    total: 1,
    bar: 3,
    complete: true,
  });
});
```

- [ ] **Step 2: Run the failing evaluator test**

Run: `node --test tests/drums_tutorial_evaluators.test.js`

Expected: FAIL with module-not-found for `src/tutorial/drumsTutorialEvaluators.js`.

- [ ] **Step 3: Implement evaluator helpers**

```js
import { getDrumsCellInstruments } from '../domain/drumsCells.js';
import {
  DRUMS_TASK_1_TARGET_STEPS,
  DRUMS_TASK_2_SOURCE_STEP,
  DRUMS_TASK_2_TARGET_STEP,
  DRUMS_TASK_3_TARGET_STEPS,
  DRUMS_TUTORIAL_INITIAL_BARS,
} from './drumsTutorialConstants.js';

function hasInstrument(matrix, bar, step, instrument) {
  return getDrumsCellInstruments(matrix?.drums?.[bar]?.[step] ?? null).includes(instrument);
}

function getDrumsTask1Progress(matrix) {
  const bars = DRUMS_TUTORIAL_INITIAL_BARS.filter((bar) => (
    DRUMS_TASK_1_TARGET_STEPS.some((step) => hasInstrument(matrix, bar, step, 'kick'))
  ));
  const count = Math.min(bars.length, 2);

  return {
    count,
    total: 2,
    bars: bars.slice(0, 2),
    complete: count >= 2,
  };
}

function getRemainingTutorialBars(editedBars) {
  const edited = new Set(editedBars);
  return DRUMS_TUTORIAL_INITIAL_BARS.filter((bar) => !edited.has(bar));
}

function getDrumsTask2Progress(matrix, task1Bars) {
  const bar = getRemainingTutorialBars(task1Bars).find((candidate) => (
    !hasInstrument(matrix, candidate, DRUMS_TASK_2_SOURCE_STEP, 'kick')
      && hasInstrument(matrix, candidate, DRUMS_TASK_2_TARGET_STEP, 'kick')
  ));
  const complete = Number.isInteger(bar);

  return {
    count: complete ? 1 : 0,
    total: 1,
    bar: complete ? bar : null,
    complete,
  };
}

function getDrumsTask3Progress(matrix, task1Bars, task2Bar) {
  const remainingBars = getRemainingTutorialBars([...task1Bars, task2Bar].filter(Number.isInteger));
  const bar = remainingBars[0] ?? null;
  const complete = Number.isInteger(bar)
    && DRUMS_TASK_3_TARGET_STEPS.some((step) => hasInstrument(matrix, bar, step, 'kick'));

  return {
    count: complete ? 1 : 0,
    total: 1,
    bar,
    complete,
  };
}

export {
  getDrumsTask1Progress,
  getDrumsTask2Progress,
  getDrumsTask3Progress,
  getRemainingTutorialBars,
  hasInstrument,
};
```

- [ ] **Step 4: Run evaluator tests**

Run: `node --test tests/drums_tutorial_evaluators.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tutorial/drumsTutorialEvaluators.js tests/drums_tutorial_evaluators.test.js
git commit -m "feat: add drums tutorial evaluators"
```

## Task 4: Tutorial Store Slice

**Files:**
- Create: `src/store/slices/tutorialSlice.js`
- Modify: `src/store/useMusicStore.js`
- Test: `tests/tutorial_slice.test.js`

- [ ] **Step 1: Write failing store tests**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import useMusicStore from '../src/store/useMusicStore.js';
import { TUTORIAL_STEP_IDS } from '../src/tutorial/tutorialStepIds.js';

test('tutorial slice starts at opening and advances through configured order', () => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);

  const state = useMusicStore.getState();
  assert.equal(state.currentTutorialStepId, TUTORIAL_STEP_IDS.OPENING);

  state.nextTutorialStep();
  assert.equal(useMusicStore.getState().currentTutorialStepId, TUTORIAL_STEP_IDS.START_CTA);
});

test('tutorial slice records task progress and toast copy', () => {
  useMusicStore.setState(useMusicStore.getInitialState(), true);

  useMusicStore.getState().setTutorialTaskProgress('drums-task-1', {
    count: 1,
    total: 2,
    bars: [0],
  });
  useMusicStore.getState().showTutorialToast('挑选任意两小节，在闪烁位置增加一个底鼓音符（1/2）');

  const state = useMusicStore.getState();
  assert.deepEqual(state.tutorialTaskProgress['drums-task-1'], {
    count: 1,
    total: 2,
    bars: [0],
  });
  assert.equal(state.tutorialToast, '挑选任意两小节，在闪烁位置增加一个底鼓音符（1/2）');
});
```

- [ ] **Step 2: Run the failing store test**

Run: `node --test tests/tutorial_slice.test.js`

Expected: FAIL because `currentTutorialStepId` is undefined.

- [ ] **Step 3: Implement `tutorialSlice.js`**

```js
import { TUTORIAL_STEP_IDS, TUTORIAL_STEP_ORDER } from '../../tutorial/tutorialStepIds.js';

function getNextStepId(currentStepId) {
  const index = TUTORIAL_STEP_ORDER.indexOf(currentStepId);
  if (index < 0) return TUTORIAL_STEP_ORDER[0];
  return TUTORIAL_STEP_ORDER[Math.min(index + 1, TUTORIAL_STEP_ORDER.length - 1)];
}

export default function createTutorialSlice(set, get) {
  return {
    currentTutorialStepId: TUTORIAL_STEP_IDS.OPENING,
    isTutorialActive: true,
    tutorialTaskProgress: {},
    tutorialToast: null,

    goToTutorialStep: (stepId) => {
      if (!TUTORIAL_STEP_ORDER.includes(stepId)) return null;
      set({ currentTutorialStepId: stepId, tutorialToast: null });
      return stepId;
    },

    nextTutorialStep: () => {
      const nextStepId = getNextStepId(get().currentTutorialStepId);
      set({ currentTutorialStepId: nextStepId, tutorialToast: null });
      return nextStepId;
    },

    setTutorialTaskProgress: (taskId, progress) => set((state) => ({
      tutorialTaskProgress: {
        ...state.tutorialTaskProgress,
        [taskId]: progress,
      },
    })),

    showTutorialToast: (tutorialToast) => set({ tutorialToast }),
    clearTutorialToast: () => set({ tutorialToast: null }),
    skipTutorial: () => set({ isTutorialActive: false, tutorialToast: null }),
    restartTutorial: () => set({
      currentTutorialStepId: TUTORIAL_STEP_IDS.OPENING,
      isTutorialActive: true,
      tutorialTaskProgress: {},
      tutorialToast: null,
    }),
  };
}
```

- [ ] **Step 4: Compose the slice**

Modify `src/store/useMusicStore.js`:

```js
import createTutorialSlice from './slices/tutorialSlice.js';

const useMusicStore = create((set, get) => ({
  ...createTransportSlice(set, get),
  ...createMatrixSlice(set, get),
  ...createContextSlice(set, get),
  ...createClipsSlice(set, get),
  ...createTutorialSlice(set, get),
}));
```

- [ ] **Step 5: Run store test and full unit suite**

Run: `node --test tests/tutorial_slice.test.js`

Expected: PASS.

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/slices/tutorialSlice.js src/store/useMusicStore.js tests/tutorial_slice.test.js
git commit -m "feat: add tutorial store slice"
```

## Task 5: Drums Editing And Drag Helpers

**Files:**
- Create: `src/app/drumsEditingActions.js`
- Modify: `src/app/drumSequencerData.js`
- Test: `tests/drums_editing_actions.test.js`

- [ ] **Step 1: Write failing drag helper tests**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrumsCell } from '../src/domain/drumsCells.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';
import { moveDrumsInstrument } from '../src/app/drumsEditingActions.js';

test('moveDrumsInstrument moves kick without deleting hihat on the source step', () => {
  const matrix = createInitialMatrix();
  matrix.drums[2][0] = createDrumsCell(['kick', 'hihat']);

  const nextMatrix = moveDrumsInstrument(matrix, 2, 0, 2, 'kick');

  assert.deepEqual(nextMatrix.drums[2][0], { instruments: ['hihat'] });
  assert.deepEqual(nextMatrix.drums[2][2], { instruments: ['kick'] });
});

test('moveDrumsInstrument stacks kick on an existing target cell', () => {
  const matrix = createInitialMatrix();
  matrix.drums[2][0] = createDrumsCell(['kick', 'hihat']);
  matrix.drums[2][2] = createDrumsCell(['snare']);

  const nextMatrix = moveDrumsInstrument(matrix, 2, 0, 2, 'kick');

  assert.deepEqual(nextMatrix.drums[2][2], { instruments: ['kick', 'snare'] });
});
```

- [ ] **Step 2: Run the failing test**

Run: `node --test tests/drums_editing_actions.test.js`

Expected: FAIL with module-not-found for `src/app/drumsEditingActions.js`.

- [ ] **Step 3: Implement the move helper**

```js
import {
  createDrumsCell,
  getDrumsCellInstruments,
} from '../domain/drumsCells.js';
import { DRUMS_INSTRUMENT_IDS, STEPS_PER_BAR, TOTAL_BARS } from '../domain/musicConstants.js';

function isValidMove(bar, fromStep, toStep, instrument) {
  return Number.isInteger(bar)
    && bar >= 0
    && bar < TOTAL_BARS
    && Number.isInteger(fromStep)
    && fromStep >= 0
    && fromStep < STEPS_PER_BAR
    && Number.isInteger(toStep)
    && toStep >= 0
    && toStep < STEPS_PER_BAR
    && DRUMS_INSTRUMENT_IDS.includes(instrument);
}

function withoutInstrument(cell, instrument) {
  const instruments = getDrumsCellInstruments(cell).filter((item) => item !== instrument);
  return instruments.length > 0 ? createDrumsCell(instruments) : null;
}

function withInstrument(cell, instrument) {
  return createDrumsCell([...getDrumsCellInstruments(cell), instrument]);
}

function moveDrumsInstrument(matrix, bar, fromStep, toStep, instrument) {
  if (!matrix?.drums || !isValidMove(bar, fromStep, toStep, instrument)) return matrix;
  if (!getDrumsCellInstruments(matrix.drums[bar]?.[fromStep]).includes(instrument)) return matrix;

  const nextBar = [...matrix.drums[bar]];
  nextBar[fromStep] = withoutInstrument(nextBar[fromStep], instrument);
  nextBar[toStep] = withInstrument(nextBar[toStep], instrument);

  const nextDrums = [...matrix.drums];
  nextDrums[bar] = nextBar;

  return {
    ...matrix,
    drums: nextDrums,
  };
}

export { moveDrumsInstrument };
```

- [ ] **Step 4: Run drag helper tests**

Run: `node --test tests/drums_editing_actions.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/drumsEditingActions.js tests/drums_editing_actions.test.js
git commit -m "feat: add drums move helper"
```

## Task 6: Tutorial Overlay UI

**Files:**
- Create: `src/app/components/TutorialOverlay.jsx`
- Modify: `src/index.css`
- Test: `tests/ui_shell.test.js`
- Test: `tests/ui_layout_css.test.js`

- [ ] **Step 1: Add source tests for overlay structure**

Append tests that read the component and CSS:

```js
test('tutorial overlay renders panel copy progress toast and controls', async () => {
  const source = await readFile(
    new URL('../src/app/components/TutorialOverlay.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /tutorial-panel/);
  assert.match(source, /tutorial-toast/);
  assert.match(source, /onPrimaryAction/);
  assert.match(source, /onSkip/);
  assert.match(source, /onRestart/);
});
```

Append CSS checks:

```js
test('tutorial panel keeps the old v022 width constraint', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.tutorial-panel\s*\{[^}]*width:\s*min\(25vw,\s*360px\);/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*min-width:\s*280px;/s);
  assert.match(css, /\.tutorial-target-flash/);
  assert.match(css, /\.tutorial-toast/);
});
```

- [ ] **Step 2: Run failing source tests**

Run: `node --test tests/ui_shell.test.js tests/ui_layout_css.test.js`

Expected: FAIL because `TutorialOverlay.jsx` does not exist and CSS selectors are missing.

- [ ] **Step 3: Implement `TutorialOverlay.jsx`**

```jsx
import { createElement } from 'react';

function TutorialOverlay({
  primaryLabel = '下一步',
  step,
  toast,
  canContinue = true,
  onPrimaryAction,
  onRestart,
  onSkip,
}) {
  if (!step) return null;

  const showProgress = step.progressText || step.progressCopy;

  return (
    <aside className="tutorial-panel" aria-live="polite">
      <div className="tutorial-panel-body">
        <div className="tutorial-phase">{step.phase}</div>
        <h2>{step.title}</h2>
        <p>{step.copy}</p>
        {showProgress ? (
          <div className="tutorial-progress">{step.progressText ?? step.progressCopy}</div>
        ) : null}
      </div>

      <div className="tutorial-panel-actions">
        <button
          className="tutorial-primary"
          type="button"
          disabled={!canContinue}
          onClick={onPrimaryAction}
        >
          {primaryLabel}
        </button>
        <button className="tutorial-secondary" type="button" onClick={onSkip}>
          跳过教程
        </button>
        <button className="tutorial-link" type="button" onClick={onRestart}>
          重新开始
        </button>
      </div>

      {toast ? createElement('div', { className: 'tutorial-toast' }, toast) : null}
    </aside>
  );
}

export { TutorialOverlay };
```

- [ ] **Step 4: Add CSS**

Append to `src/index.css`:

```css
.tutorial-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40;
  width: min(25vw, 360px);
  min-width: 280px;
  height: 100vh;
  padding: 18px;
  color: var(--ink);
  background: color-mix(in oklab, white 88%, var(--c-drums) 12%);
  border-left: 1px solid color-mix(in oklab, var(--c-drums-ink) 18%, transparent);
  box-shadow: -12px 0 32px color-mix(in oklab, var(--c-drums-ink) 12%, transparent);
}

.tutorial-panel-body {
  display: grid;
  gap: 10px;
}

.tutorial-phase {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--c-drums-ink);
}

.tutorial-panel h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.tutorial-panel p {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
}

.tutorial-progress {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.45;
  background: color-mix(in oklab, var(--c-drums) 36%, white);
  border: 1px solid color-mix(in oklab, var(--c-drums-ink) 18%, transparent);
  border-radius: 8px;
}

.tutorial-panel-actions {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.tutorial-primary,
.tutorial-secondary,
.tutorial-link {
  min-height: 36px;
  border-radius: 8px;
}

.tutorial-toast {
  position: fixed;
  top: 14px;
  left: 50%;
  z-index: 60;
  max-width: min(520px, 60vw);
  padding: 10px 14px;
  font-size: 14px;
  background: white;
  border: 1px solid color-mix(in oklab, var(--c-drums-ink) 20%, transparent);
  border-radius: 8px;
  transform: translateX(-50%);
  box-shadow: 0 12px 28px color-mix(in oklab, black 16%, transparent);
}

.tutorial-target-flash {
  animation: tutorialTargetPulse 1s ease-in-out infinite;
}

@keyframes tutorialTargetPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--c-drums-ink) 30%, transparent);
  }

  50% {
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--c-drums-ink) 18%, transparent);
  }
}
```

- [ ] **Step 5: Run UI source tests**

Run: `node --test tests/ui_shell.test.js tests/ui_layout_css.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/TutorialOverlay.jsx src/index.css tests/ui_shell.test.js tests/ui_layout_css.test.js
git commit -m "feat: add tutorial overlay panel"
```

## Task 7: Wire Tutorial Into App And Targets

**Files:**
- Modify: `src/app/App.jsx`
- Modify: `src/app/components/TopBar.jsx`
- Modify: `src/app/components/Timeline.jsx`
- Modify: `src/app/components/BottomEditor.jsx`
- Modify: `src/app/components/DrumSequencer.jsx`
- Test: `tests/ui_shell.test.js`

- [ ] **Step 1: Add source tests for target attributes**

```js
test('tutorial target attributes exist on main app regions and drums cells', async () => {
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const timelineSource = await readFile(new URL('../src/app/components/Timeline.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(new URL('../src/app/components/BottomEditor.jsx', import.meta.url), 'utf8');
  const drumSequencerSource = await readFile(new URL('../src/app/components/DrumSequencer.jsx', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');

  assert.match(topBarSource, /data-tutorial-target="top-bar"/);
  assert.match(timelineSource, /data-tutorial-target="track-area"/);
  assert.match(bottomEditorSource, /data-tutorial-target="track-editor"/);
  assert.match(drumSequencerSource, /data-tutorial-target/);
  assert.match(appSource, /TutorialOverlay/);
});
```

- [ ] **Step 2: Run failing source test**

Run: `node --test tests/ui_shell.test.js`

Expected: FAIL because the target attributes and overlay mount are missing.

- [ ] **Step 3: Add target attributes to shell components**

In `TopBar.jsx`, put the target on the top-level top bar element:

```jsx
<header className="topbar" data-tutorial-target="top-bar">
```

In `Timeline.jsx`, put the target on the timeline/track area container:

```jsx
<section className="timeline" data-tutorial-target="track-area">
```

For each drums clip button or bar cell in `Timeline.jsx`, add:

```jsx
data-tutorial-target={track.id === 'drums' ? `drums-clip-bar-${barIndex}` : undefined}
```

In `BottomEditor.jsx`, wrap the returned editor area:

```jsx
<div data-tutorial-target="track-editor">
  {editor}
</div>
```

- [ ] **Step 4: Add tutorial target props to `DrumSequencer.jsx`**

Add props:

```js
tutorialActiveTargets = new Set(),
onMoveInstrument = () => {},
```

Add helper inside the component:

```js
function getStepTarget(rowId, stepIndex) {
  return `drum-step-${rowId}-${stepIndex}`;
}
```

On each step button:

```jsx
data-tutorial-target={getStepTarget(row.id, stepIndex)}
className={[
  'drum-step',
  active ? 'active' : '',
  tutorialActiveTargets.has(getStepTarget(row.id, stepIndex)) ? 'tutorial-target-flash' : '',
  stepNumber % 4 === 0 ? 'beat-end' : '',
].filter(Boolean).join(' ')}
```

- [ ] **Step 5: Mount `TutorialOverlay` in `App.jsx`**

Import:

```js
import { TutorialOverlay } from './components/TutorialOverlay.jsx';
import { DRUMS_TUTORIAL_STEPS } from '../tutorial/drumsTutorialSteps.js';
```

Add selector:

```js
const tutorialStep = DRUMS_TUTORIAL_STEPS.find((step) => step.id === currentTutorialStepId);
```

Render near the app root:

```jsx
{isTutorialActive ? (
  <TutorialOverlay
    step={tutorialStep}
    toast={tutorialToast}
    canContinue
    primaryLabel={tutorialStep?.id === TUTORIAL_STEP_IDS.START_CTA ? '开始创造' : '下一步'}
    onPrimaryAction={nextTutorialStep}
    onSkip={skipTutorial}
    onRestart={restartTutorial}
  />
) : null}
```

- [ ] **Step 6: Run source tests**

Run: `node --test tests/ui_shell.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/App.jsx src/app/components/TopBar.jsx src/app/components/Timeline.jsx src/app/components/BottomEditor.jsx src/app/components/DrumSequencer.jsx tests/ui_shell.test.js
git commit -m "feat: wire tutorial overlay targets"
```

## Task 8: Tutorial Task Progress Wiring

**Files:**
- Modify: `src/app/App.jsx`
- Modify: `src/app/components/DrumSequencer.jsx`
- Test: `tests/audio_ui_bridge.test.js`
- Test: `tests/ui_shell.test.js`

- [ ] **Step 1: Add source tests for tutorial progress wiring**

```js
test('app wires drums tutorial evaluators to drums edits', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');

  assert.match(appSource, /getDrumsTask1Progress/);
  assert.match(appSource, /getDrumsTask2Progress/);
  assert.match(appSource, /getDrumsTask3Progress/);
  assert.match(appSource, /setTutorialTaskProgress/);
  assert.match(appSource, /showTutorialToast/);
});
```

- [ ] **Step 2: Run failing source test**

Run: `node --test tests/ui_shell.test.js`

Expected: FAIL because `App.jsx` does not import or use the evaluators.

- [ ] **Step 3: Add an `updateDrumsTutorialProgress` callback**

In `App.jsx`, import evaluators and step IDs:

```js
import {
  getDrumsTask1Progress,
  getDrumsTask2Progress,
  getDrumsTask3Progress,
} from '../tutorial/drumsTutorialEvaluators.js';
import { TUTORIAL_STEP_IDS } from '../tutorial/tutorialStepIds.js';
```

Implement after store selectors:

```js
const updateDrumsTutorialProgress = useCallback(() => {
  const state = useMusicStore.getState();

  if (state.currentTutorialStepId === TUTORIAL_STEP_IDS.DRUMS_TASK_1) {
    const progress = getDrumsTask1Progress(state.matrix);
    state.setTutorialTaskProgress('drums-task-1', progress);
    state.showTutorialToast(`挑选任意两小节，在闪烁位置增加一个底鼓音符（${progress.count}/${progress.total}）`);
    if (progress.complete) state.goToTutorialStep(TUTORIAL_STEP_IDS.DRUMS_TASK_1_COMPLETE);
    return;
  }

  const task1Bars = state.tutorialTaskProgress['drums-task-1']?.bars ?? [];

  if (state.currentTutorialStepId === TUTORIAL_STEP_IDS.DRUMS_TASK_2) {
    const progress = getDrumsTask2Progress(state.matrix, task1Bars);
    state.setTutorialTaskProgress('drums-task-2', progress);
    state.showTutorialToast(`在尚未编辑的两小节，将底鼓音符向右移动两格（${progress.count}/${progress.total}）`);
    if (progress.complete) state.goToTutorialStep(TUTORIAL_STEP_IDS.DRUMS_TASK_2_COMPLETE);
    return;
  }

  if (state.currentTutorialStepId === TUTORIAL_STEP_IDS.DRUMS_TASK_3) {
    const task2Bar = state.tutorialTaskProgress['drums-task-2']?.bar;
    const progress = getDrumsTask3Progress(state.matrix, task1Bars, task2Bar);
    state.setTutorialTaskProgress('drums-task-3', progress);
    state.showTutorialToast(`在最后一个尚未编辑的小节中，在最后一个尚未编辑的小节中的第5或第13格增加一个底鼓音符（${progress.count}/${progress.total}）`);
    if (progress.complete) state.goToTutorialStep(TUTORIAL_STEP_IDS.DRUMS_TASK_3_COMPLETE);
  }
}, []);
```

Call it at the end of `handleDrumsStepToggle` after `setCell`.

- [ ] **Step 4: Add move wiring for Task 2**

Import `moveDrumsInstrument` in `App.jsx`, add:

```js
const handleDrumsInstrumentMove = useCallback((instrument, fromStep, toStep) => {
  const state = useMusicStore.getState();
  const nextMatrix = moveDrumsInstrument(state.matrix, selectedBar, fromStep, toStep, instrument);
  if (nextMatrix === state.matrix) return;

  nextMatrix.drums[selectedBar].forEach((cell, step) => {
    state.setCell('drums', selectedBar, step, cell);
  });
  updateDrumsTutorialProgress();
}, [selectedBar, updateDrumsTutorialProgress]);
```

Pass `onMoveInstrument={handleDrumsInstrumentMove}` to `DrumSequencer`.

- [ ] **Step 5: Add pointer drag in `DrumSequencer.jsx`**

Use component state:

```js
const [draggedStep, setDraggedStep] = useState(null);
```

On kick step buttons:

```jsx
onPointerDown={() => {
  if (row.id === 'kick' && active) setDraggedStep(stepIndex);
}}
onPointerUp={() => {
  if (row.id === 'kick' && draggedStep !== null && draggedStep !== stepIndex) {
    onMoveInstrument('kick', draggedStep, stepIndex);
  }
  setDraggedStep(null);
}}
```

Keep the existing click toggle for normal clicks.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/ui_shell.test.js tests/drums_tutorial_evaluators.test.js tests/drums_editing_actions.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/App.jsx src/app/components/DrumSequencer.jsx tests/ui_shell.test.js
git commit -m "feat: connect drums tutorial progress"
```

## Task 9: Step Setup And Playback Hooks

**Files:**
- Modify: `src/app/App.jsx`
- Modify: `src/audio/AudioEngine.js`
- Test: `tests/audio_engine.test.js`
- Test: `tests/ui_shell.test.js`

- [ ] **Step 1: Add tests for setup and playback references**

```js
test('app runs drums tutorial setup and playback hooks from step config', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');

  assert.match(appSource, /createInitialDrumsTutorialBars/);
  assert.match(appSource, /createFreeDrumsTutorialBars/);
  assert.match(appSource, /playTutorialBars/);
  assert.match(appSource, /setup\.type === 'generate-initial-drums'/);
  assert.match(appSource, /setup\.type === 'create-free-drums-bars'/);
});
```

- [ ] **Step 2: Run failing source test**

Run: `node --test tests/ui_shell.test.js`

Expected: FAIL because setup and playback hooks are missing.

- [ ] **Step 3: Add `playTutorialBars` to `AudioEngine.js`**

Add a method that seeks to the first bar and plays through the requested range using the existing transport path:

```js
async playTutorialBars({ bars, matrixSource, volumeSource, bpm }) {
  if (!Array.isArray(bars) || bars.length === 0) return false;
  const firstBar = Math.min(...bars);
  await this.stop();
  await this.seekToStep(firstBar, 0);
  await this.play({
    bpm,
    bar: firstBar,
    step: 0,
    matrixSource,
    volumeSource,
  });
  return true;
}
```

- [ ] **Step 4: Wire setup and playback in `App.jsx`**

Import setup helpers:

```js
import {
  createFreeDrumsTutorialBars,
  createInitialDrumsTutorialBars,
} from '../tutorial/drumsTutorialSetup.js';
```

Add:

```js
const applyTutorialMatrix = useCallback((nextMatrix) => {
  const state = useMusicStore.getState();
  nextMatrix.drums.forEach((bar, barIndex) => {
    bar.forEach((cell, step) => {
      state.setCell('drums', barIndex, step, cell);
    });
  });
}, []);

const runTutorialStepSetup = useCallback((step) => {
  if (step?.setup?.type === 'generate-initial-drums') {
    const state = useMusicStore.getState();
    [0, 1, 2, 3].forEach((bar) => state.createClip('drums', bar));
    applyTutorialMatrix(createInitialDrumsTutorialBars(state.matrix));
  }

  if (step?.setup?.type === 'create-free-drums-bars') {
    const state = useMusicStore.getState();
    [4, 5, 6, 7].forEach((bar) => state.createClip('drums', bar));
    applyTutorialMatrix(createFreeDrumsTutorialBars(state.matrix));
  }
}, [applyTutorialMatrix]);

const playTutorialBars = useCallback((bars) => {
  const state = useMusicStore.getState();
  void audioEngine.playTutorialBars?.({
    bars,
    bpm: state.bpm,
    matrixSource: () => useMusicStore.getState().matrix,
    volumeSource: () => useMusicStore.getState().volumes,
  });
}, []);
```

Invoke setup/playback when `currentTutorialStepId` changes:

```js
useEffect(() => {
  if (!tutorialStep) return;
  runTutorialStepSetup(tutorialStep);
  if (tutorialStep.playback?.autoStart) playTutorialBars(tutorialStep.playback.bars);
}, [playTutorialBars, runTutorialStepSetup, tutorialStep]);
```

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/audio_engine.test.js tests/ui_shell.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.jsx src/audio/AudioEngine.js tests/audio_engine.test.js tests/ui_shell.test.js
git commit -m "feat: add tutorial setup playback hooks"
```

## Task 10: Final Verification

**Files:**
- Modify tests only if a test exposes an incorrect assumption in the implementation.

- [ ] **Step 1: Run all unit tests**

Run: `npm test`

Expected: all Node tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no ESLint errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Vite build completes and writes `dist`.

- [ ] **Step 4: Browser smoke test**

Run: `npm run dev`

Open the local dev server and verify:

1. Opening shows “你将像搭积木一样创作一段独属于你的音乐片段”.
2. Start CTA says “开始创造”.
3. Top Bar, track area, and editor area can be highlighted in order.
4. Drums setup generates four basic bars and plays them.
5. Task 1 accepts two kick additions on flashing cells in two different bars and shows `0/2`, `1/2`, `2/2`.
6. Task 2 accepts dragging kick two steps right in one remaining bar and shows `1/1`.
7. Task 3 accepts kick on step 5 or 13 in the final remaining bar and shows `1/1`.
8. Task 4 creates bars 5-8 visually, accepts free kick edits, and completes from the completion button.
9. Final feedback plays eight bars.
10. Existing Play/Stop, clip selection, chord editor, and drums clear actions still work.

- [ ] **Step 5: Commit final fixes**

```bash
git add src tests
git commit -m "fix: stabilize drums tutorial flow"
```

## Self-Review

Spec coverage:

- Opening, Start CTA, UI tour, drums setup, Task 1, Task 2, Task 3, Task 4, progress toasts, completion feedback, four-bar playback, and eight-bar playback are each represented by a step and at least one implementation task.
- Old v0.22 constraints are covered by overlay targets, real UI operation, right-side panel width, copy config, and manual progression.

Ambiguity resolved:

- Task 2 is implemented as true pointer drag because the priority table says “拖和拽”.
- Task 4 creates bars `4-7`, preserving bars `0-3`.
- Task 1 flashing positions are fixed to steps `2, 6, 10, 14` so the evaluator is deterministic.
- Task 3 step labels “第5或第13格” map to zero-based steps `4` and `12`.

Verification commands:

- `node --test tests/drums_tutorial_steps.test.js`
- `node --test tests/drums_tutorial_setup.test.js`
- `node --test tests/drums_tutorial_evaluators.test.js`
- `node --test tests/drums_editing_actions.test.js`
- `node --test tests/tutorial_slice.test.js`
- `npm test`
- `npm run lint`
- `npm run build`
