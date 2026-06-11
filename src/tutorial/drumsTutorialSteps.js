import { TUTORIAL_CONTROL_TARGETS } from './drumsTutorialConstants.js';
import { TUTORIAL_STEP_IDS } from './tutorialStepIds.js';

const SECTION_TARGET_1 = '目标1\n点击第一个Drums Clip并添加基础律动';
const SECTION_TARGET_2 = '目标2\n添加整轨的Clips，并全局添加基础律动';
const SECTION_TARGET_3 = '目标3\n编辑所有Drums Clips，找到用户喜欢的律动感';
const SECTION_TARGET_4 = '目标4\n编辑所有Chord Clips，对和弦进行概念建立感性认识，并得到一段自己觉得好听的和弦进行Loop';
const SECTION_TARGET_5 = '目标5\n完成编辑Bass轨';
const BASS_TARGET_COPY = '创建完整的低音音轨\n\n选择一个你喜欢的低音律动\n低音虽存在感低，但不可或缺，它让你的音乐听起来更加丰满完整。现在，你可以简单地选择一个律动模板，系统会自动让低音旋律和你所选择的和弦进行相匹配。\n觉得满意后，点击[继续探索]以继续';

const DRUMS_TUTORIAL_STEPS = [
  {
    id: TUTORIAL_STEP_IDS.DRUMS_OPEN_FIRST_CLIP,
    section: SECTION_TARGET_1,
    trigger: '用户首次进入Arranger主页',
    uiEvent: 'Drum 01 Clip闪烁',
    copy: '创建你的第一个打击乐乐句\n\n认识乐句编辑器页面\n点击正在闪烁的Drum 01乐句，以开始编辑你的第一个乐句',
    primaryLabel: '下一步',
    completion: { type: 'open-clip', trackId: 'drums', bar: 0 },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_GENERATE_CURRENT_BAR,
    section: SECTION_TARGET_1,
    trigger: '用户点击Drum 01乐句Clip',
    uiEvent: '为本小节生成基础律动闪烁',
    copy: '创建你的第一个打击乐乐句\n\n一键生成简单的基础律动\n点击“为本小节生成基础律动”，一键添加一个最简单的打击乐律动',
    primaryLabel: '下一步',
    completion: {
      type: 'generate-current-drums-bar',
      control: TUTORIAL_CONTROL_TARGETS.GENERATE_CURRENT_DRUMS_BAR,
      bar: 0,
    },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_LISTEN_FIRST_CLIP,
    section: SECTION_TARGET_1,
    trigger: '点击“为本小节生成基础律动”',
    uiEvent: '播放按钮闪烁',
    copy: '创建你的第一个打击乐乐句\n\n听听看……\n每次添加或编辑了乐句，都别忘了听听看它有什么不同',
    primaryLabel: '下一步',
    completion: {
      type: 'playback-complete',
      control: TUTORIAL_CONTROL_TARGETS.TRANSPORT_PLAY,
      trackId: 'drums',
      bar: 0,
    },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_FILL_TRACK_CLIPS,
    section: SECTION_TARGET_2,
    trigger: '点击播放按钮并播放完第一个Clip',
    uiEvent: '填充整轨按钮闪烁',
    copy: '创建完整的打击乐音轨\n\n一键填充\n点击“填充整轨”按钮，可以一键给整个音轨都创建乐句；其他轨也可以这样操作',
    primaryLabel: '下一步',
    completion: {
      type: 'fill-track-clips',
      control: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:drums`,
      trackId: 'drums',
    },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_GENERATE_ALL_BARS,
    section: SECTION_TARGET_2,
    trigger: '点击“填充整轨”按钮',
    uiEvent: '全局生成基础律动按钮闪烁',
    copy: '编辑你的第一个打击乐乐句\n\n给整轨添加基础律动\n点击全局生成基础律动按钮，给所有打击乐乐句添加基础律动',
    primaryLabel: '下一步',
    completion: {
      type: 'generate-all-drums-bars',
      control: TUTORIAL_CONTROL_TARGETS.GENERATE_ALL_DRUMS_BARS,
    },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_ADD_KICK_VARIATION,
    section: SECTION_TARGET_3,
    trigger: '点击全局生成基础律动按钮',
    uiEvent: 'Kick行：\n1/5/13列闪烁蓝色\n3/7/11/15列闪烁绿色\n其余的偶数列闪烁黄色',
    copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n在蓝色位置添加底鼓会创造比较规整的节奏感（但太规整听起来可能会有点无聊）；\n在绿色位置添加底鼓会创造强烈的律动感；\n如果在黄色位置添加了底鼓，最好在它之后再多添加一个绿色音符\n多加1-2个音符就会很不一样了——别忘了时常听一听你添加的音符带来了什么改变！',
    primaryLabel: '完成添加',
    completion: { type: 'kick-variation' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_DRAG_KICK,
    section: SECTION_TARGET_3,
    trigger: '直到点击[完成添加]按钮',
    uiEvent: '当前Clip的第一列底鼓音符和第三列位置闪烁',
    copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n你也可以按刚才的规律，把第一列的底鼓音符往后拖拽到第三列；有时候有意创造一些空隙会有意外惊喜！',
    primaryLabel: '完成拖拽',
    setup: { type: 'prepare-kick-drag' },
    completion: { type: 'kick-drag' },
  },
  {
    id: TUTORIAL_STEP_IDS.DRUMS_FREE_CREATE,
    section: SECTION_TARGET_3,
    trigger: '点击[完成拖拽]按钮',
    uiEvent: '无',
    copy: '编辑你的第一个打击乐乐句\n\n让你的律动变得更好听\n现在，你可以自由创造你喜欢的律动。你可以随时点击继续探索以继续探索其他功能。',
    primaryLabel: '继续探索',
    completion: { type: 'manual' },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_FILL_TRACK_CLIPS,
    section: SECTION_TARGET_4,
    trigger: '点击[继续探索按钮]',
    uiEvent: 'Chord轨填充整轨按钮闪烁',
    copy: '创建完整的和弦进行音轨\n\n选择一个你喜欢的和弦进行\n和弦进行是决定旋律感的核心要素，它已发展出了若干成熟的模板，你只需要基于模板去做微调就能创造出只属于你的旋律框架。',
    primaryLabel: '下一步',
    completion: {
      type: 'fill-track-clips',
      control: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:chord`,
      trackId: 'chord',
    },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_SELECT_PROGRESSION_TEMPLATE,
    section: SECTION_TARGET_4,
    trigger: '点击Chord轨填充整轨按钮',
    uiEvent: '选择和弦进行模板按钮闪烁',
    copy: '创建完整的和弦进行音轨\n\n选择一个你喜欢的和弦进行\n和弦进行是决定旋律感的核心要素，它已发展出了若干成熟的模板，你只需要基于模板去做微调就能创造出只属于你的旋律框架。',
    primaryLabel: '下一步',
    completion: {
      type: 'chord-template',
      control: `${TUTORIAL_CONTROL_TARGETS.CHORD_TEMPLATE_CARD_PREFIX}:doowop`,
      templateId: 'doowop',
    },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_SELECT_GROOVE_TEMPLATE,
    section: SECTION_TARGET_4,
    trigger: '在二级菜单完成试听和选择',
    uiEvent: '选择和弦弹奏律动模板按钮闪烁',
    copy: '创建完整的和弦进行音轨\n\n选择如何弹奏你所选择的和弦进行\n和弦可以听起来舒缓或密集；通过选择节奏型，为你的乐曲决定整体听觉和情绪氛围。\n完成选择后，听听看效果如何。',
    primaryLabel: '下一步',
    completion: {
      type: 'chord-groove-template',
      controls: [
        `${TUTORIAL_CONTROL_TARGETS.CHORD_GROOVE_CARD_PREFIX}:block-basic`,
        `${TUTORIAL_CONTROL_TARGETS.CHORD_GROOVE_CARD_PREFIX}:block-syncopated`,
      ],
    },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_LISTEN_LOOP,
    section: SECTION_TARGET_4,
    trigger: '并在二级菜单完成选择',
    uiEvent: '播放按钮闪烁',
    copy: '创建完整的和弦进行音轨\n\n选择如何弹奏你所选择的和弦进行\n和弦可以听起来舒缓或密集；通过选择节奏型，为你的乐曲决定整体听觉和情绪氛围。\n完成选择后，听听看效果如何。',
    primaryLabel: '下一步',
    completion: {
      type: 'playback-loop-complete',
      control: TUTORIAL_CONTROL_TARGETS.TRANSPORT_PLAY,
      trackId: 'chord',
      bars: [0, 1, 2, 3],
    },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_ENRICH_HARMONY,
    section: SECTION_TARGET_4,
    trigger: '播放经过前4小节并点击[下一步]按钮后',
    uiEvent: '和弦按钮闪烁，用户完成一次替换和弦操作后，闪烁效果停止',
    copy: '让你的和弦进行听起来更性感\n\n丰富和弦色彩\n对于任意一个和弦，都可以增加若干不同的音符，让它听起来更有情绪色彩，试试我们为你提供的常见选项能带来什么听觉上的变化\n觉得满意后，点击[继续探索]以继续',
    primaryLabel: '继续探索',
    completion: { type: 'chord-enrich' },
  },
  {
    id: TUTORIAL_STEP_IDS.CHORD_ADD_PASSING,
    section: SECTION_TARGET_4,
    trigger: '点击[继续探索]按钮',
    uiEvent: '+经过和弦按钮闪烁',
    copy: '让你的和弦进行听起来更性感\n\n添加经过和弦\n在两个和弦之间，还可以添加特殊的过渡和弦，让它们衔接时的听觉效果更有戏剧感\n觉得满意后，点击[继续探索]以继续',
    primaryLabel: '继续探索',
    completion: { type: 'chord-passing' },
  },
  {
    id: TUTORIAL_STEP_IDS.BASS_FILL_TRACK_CLIPS,
    section: SECTION_TARGET_5,
    trigger: '点击[继续探索]按钮',
    uiEvent: 'Bass轨填充整轨按钮闪烁',
    copy: BASS_TARGET_COPY,
    primaryLabel: '下一步',
    completion: {
      type: 'fill-track-clips',
      control: `${TUTORIAL_CONTROL_TARGETS.FILL_EMPTY_CLIPS_PREFIX}:bass`,
      trackId: 'bass',
    },
  },
  {
    id: TUTORIAL_STEP_IDS.BASS_SELECT_GROOVE_TEMPLATE,
    section: SECTION_TARGET_5,
    trigger: '点击Bass轨填充整轨按钮',
    uiEvent: '选择Bass弹奏律动模板按钮闪烁',
    copy: BASS_TARGET_COPY,
    primaryLabel: '下一步',
    completion: {
      type: 'bass-groove-template',
      controls: [
        `${TUTORIAL_CONTROL_TARGETS.BASS_GROOVE_CARD_PREFIX}:bass-8th-basic`,
        `${TUTORIAL_CONTROL_TARGETS.BASS_GROOVE_CARD_PREFIX}:bass-8th-swing`,
        `${TUTORIAL_CONTROL_TARGETS.BASS_GROOVE_CARD_PREFIX}:bass-16th-swing`,
      ],
    },
  },
  {
    id: TUTORIAL_STEP_IDS.BASS_LISTEN_LOOP,
    section: SECTION_TARGET_5,
    trigger: '在二级菜单完成选择',
    uiEvent: '播放按钮闪烁',
    copy: BASS_TARGET_COPY,
    primaryLabel: '继续探索',
    completion: {
      type: 'playback-loop-complete',
      control: TUTORIAL_CONTROL_TARGETS.TRANSPORT_PLAY,
      trackId: 'bass',
      bars: [0, 1, 2, 3],
      endsTutorial: true,
    },
  },
];

DRUMS_TUTORIAL_STEPS.errata = Object.freeze({
  phase1: '目标1-3无需修正',
  target4: Object.freeze([
    '目标4/行14-15：补齐空Clip 已按当前 UI 修正为 填充整轨',
    '目标4/行15：空 Tutorial 文案继承上一条 Chord 说明',
    '目标4/行17：空 Tutorial 文案继承上一条 Chord groove 说明',
    '目标4/行18与行19：让你你的 已修正为 让你的',
    '目标4/行18与行19：删除独立成行的 [继续探索]',
    '目标4/播放步骤：8小节播放完成改为前4小节后开放下一步',
  ]),
  target5: Object.freeze([
    '目标5/行20：Chord轨补齐空Clip按钮闪烁 已修正为 Bass轨填充整轨按钮闪烁',
    '目标5/行21：补齐空Clip 已按当前 UI 修正为 填充整轨',
    '目标5/行21-22：空 Tutorial 文案继承上一条 Bass 说明',
    '目标5/行20：删除独立成行的 [继续探索]',
    '目标5/播放步骤：按确认改为前4小节后开放继续探索',
  ]),
  future: Object.freeze([
    '目标6 待实现',
  ]),
});

Object.freeze(DRUMS_TUTORIAL_STEPS);

export { DRUMS_TUTORIAL_STEPS };
