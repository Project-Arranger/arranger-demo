import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TUTORIAL_STEP_IDS,
  TUTORIAL_STEP_ORDER,
} from '../src/tutorial/tutorialStepIds.js';
import { DRUMS_TUTORIAL_STEPS } from '../src/tutorial/drumsTutorialSteps.js';

test('drums tutorial exposes the priority step order', () => {
  assert.deepEqual(TUTORIAL_STEP_ORDER, [
    TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP,
    TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR,
    TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP,
    TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS,
    TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS,
    TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION,
    TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK,
    TUTORIAL_STEP_IDS.DRUMS_FREE_CREATE,
  ]);
});

test('drums tutorial v0.2 phase 1 keeps exact table source columns', () => {
  assert.deepEqual(DRUMS_TUTORIAL_STEPS.map((step) => ({
    section: step.section,
    trigger: step.trigger,
    uiEvent: step.uiEvent,
    copy: step.copy,
    primaryLabel: step.primaryLabel,
  })), [
    {
      section: '目标1\n点击第一个Drums Clip并添加基础律动',
      trigger: '用户首次进入Arranger主页',
      uiEvent: 'Drum 01 Clip闪烁',
      copy: '创建你的第一个打击乐乐句\n\n认识乐句编辑器页面\n点击正在闪烁的Drum 01乐句，以开始编辑你的第一个乐句',
      primaryLabel: '下一步',
    },
    {
      section: '目标1\n点击第一个Drums Clip并添加基础律动',
      trigger: '用户点击Drum 01乐句Clip',
      uiEvent: '为本小节生成基础律动闪烁',
      copy: '创建你的第一个打击乐乐句\n\n一键生成简单的基础律动\n点击“为本小节生成基础律动”，一键添加一个最简单的打击乐律动',
      primaryLabel: '下一步',
    },
    {
      section: '目标1\n点击第一个Drums Clip并添加基础律动',
      trigger: '点击“为本小节生成基础律动”',
      uiEvent: '播放按钮闪烁',
      copy: '创建你的第一个打击乐乐句\n\n听听看……\n每次添加或编辑了乐句，都别忘了听听看它有什么不同',
      primaryLabel: '下一步',
    },
    {
      section: '目标2\n添加整轨的Clips，并全局添加基础律动',
      trigger: '点击播放按钮并播放完第一个Clip',
      uiEvent: '填充整轨按钮闪烁',
      copy: '创建完整的打击乐音轨\n\n一键填充\n点击“填充整轨”按钮，可以一键给整个音轨都创建乐句；其他轨也可以这样操作',
      primaryLabel: '下一步',
    },
    {
      section: '目标2\n添加整轨的Clips，并全局添加基础律动',
      trigger: '点击“填充整轨”按钮',
      uiEvent: '全局生成基础律动按钮闪烁',
      copy: '编辑你的第一个打击乐乐句\n\n给整轨添加基础律动\n点击全局生成基础律动按钮，给所有打击乐乐句添加基础律动',
      primaryLabel: '下一步',
    },
    {
      section: '目标3\n编辑所有Drums Clips，找到用户喜欢的律动感',
      trigger: '点击全局生成基础律动按钮',
      uiEvent: 'Kick行：\n1/5/13列闪烁蓝色\n3/7/11/15列闪烁绿色\n其余的偶数列闪烁黄色',
      copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n在蓝色位置添加底鼓会创造比较规整的节奏感（但太规整听起来可能会有点无聊）；\n在绿色位置添加底鼓会创造强烈的律动感；\n如果在黄色位置添加了底鼓，最好在它之后再多添加一个绿色音符\n多加1-2个音符就会很不一样了——别忘了时常听一听你添加的音符带来了什么改变！',
      primaryLabel: '完成添加',
    },
    {
      section: '目标3\n编辑所有Drums Clips，找到用户喜欢的律动感',
      trigger: '直到点击[完成添加]按钮',
      uiEvent: '当前Clip的第一列底鼓音符和第三列位置闪烁',
      copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n你也可以按刚才的规律，把第一列的底鼓音符往后拖拽到第三列；有时候有意创造一些空隙会有意外惊喜！',
      primaryLabel: '完成拖拽',
    },
    {
      section: '目标3\n编辑所有Drums Clips，找到用户喜欢的律动感',
      trigger: '点击[完成拖拽]按钮',
      uiEvent: '无',
      copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n现在，你可以自由创造你喜欢的律动。你可以随时点击继续探索以继续探索其他功能。',
      primaryLabel: '继续探索',
    },
  ]);
});

test('drums tutorial v0.2 phase 1 documents errata scope', () => {
  assert.deepEqual(DRUMS_TUTORIAL_STEPS.errata, {
    phase1: '目标1-3无需修正',
    future: [
      '目标4/行18与行19疑似错字：让你你的...',
      '目标5/行20疑似错列：Chord轨填充整轨按钮闪烁',
    ],
  });
});

test('drums tutorial fills the basic groove only after explicit generation steps', () => {
  const setupSteps = DRUMS_TUTORIAL_STEPS
    .filter((step) => step.setup?.type === 'generate-initial-drums')
    .map((step) => step.id);

  assert.deepEqual(setupSteps, []);

  assert.deepEqual(DRUMS_TUTORIAL_STEPS
    .filter((step) => step.completion?.type === 'generate-current-drums-bar')
    .map((step) => step.id), [TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR]);
  assert.deepEqual(DRUMS_TUTORIAL_STEPS
    .filter((step) => step.completion?.type === 'generate-all-drums-bars')
    .map((step) => step.id), [TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS]);
});
