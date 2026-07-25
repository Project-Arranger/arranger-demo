import { CHILL_TUTORIAL_RUN_STATES } from './chillTutorialRuntime.js';

const CHILL_TUTORIAL_STAGES = Object.freeze([
  '第一句话',
  '第二句话',
  '回家',
  '前奏',
  '完整播放',
]);

const TRACK_COPY = Object.freeze({
  drums: '先听节拍如何留下呼吸，再把鼓点放进画面。',
  chord: '和声决定雨夜的颜色，让七和弦把空间撑开。',
  bass: '低音只负责让脚步向前，不要挤满每个空隙。',
  melody: '旋律像路灯反光，只出现几个能被记住的音。',
});

const ACTION_SUMMARY = Object.freeze({
  'phrase-drums': '加入稀疏的底鼓、军鼓和踩镲，让节奏松弛但仍然向前。',
  'phrase-chord': '用 Fmaj7 接到 G，让这一句先温暖，再带一点期待。',
  'phrase-bass': '低音跟着 F 和 G 的根音移动，音符短一点，给其他轨道留空间。',
  'phrase-melody': '只放几个容易记住的音，多留空白，形成一句短旋律。',
  'second-drums': '复制第一句的律动，只改变几个底鼓落点，让重复有一点变化。',
  'second-chord': '把和弦改成 Am 到 F，让第二句和第一句形成对比。',
  'second-bass': '保留原来的节奏，让低音跟着 Am 和 F 移动，听起来仍然连贯。',
  'second-melody': '增加一点旋律起伏，像是在回答第一句话。',
  'home-drums': '前一小节继续推动，最后一小节减少踩镲，让结尾慢慢松下来。',
  'home-chord': '让 G 回到 Cmaj7，用最清楚的方式结束这一段。',
  'home-bass': '低音最后落到 C，和和弦一起确认“回家”。',
  'home-melody': '旋律提前停下，最后一小节留白，让和弦完成结尾。',
  'intro-chord': '前奏只放 Cmaj7 和 Am7，先建立柔和、朦胧的颜色。',
  'intro-drums': '第一小节不进鼓，第二小节只给少量提示，让主句出现时更有层次。',
  'intro-bass': '低音只在进入主句前出现，把前奏带到第三小节；旋律继续留白。',
  'complete-playback': '从头听完整的八小节，注意前奏、两句话和回到主和弦的结构。',
});

function step({
  anchorBar,
  actionSummary,
  id,
  recipeId = null,
  stageIndex,
  title,
  trackId = null,
  primaryLabel = '加入并试听',
  previewBar,
  previewSteps = 32,
  explicit = false,
  detail,
}) {
  return Object.freeze({
    actionSummary: actionSummary ?? ACTION_SUMMARY[recipeId ?? id] ?? '',
    anchorBar,
    anchorSelector: trackId
      ? `[data-tutorial-anchor="${trackId}-bar-${anchorBar}"]`
      : '[data-tutorial-anchor="transport"]',
    detail,
    explicit,
    id,
    preferredPlacements: Object.freeze(['top', 'bottom', 'right', 'left']),
    primaryLabel,
    preview: Object.freeze({
      bar: previewBar,
      maxPlaybackSteps: previewSteps,
    }),
    recipeId,
    stageIndex,
    stageLabel: CHILL_TUTORIAL_STAGES[stageIndex],
    title,
    trackId,
  });
}

const CHILL_TUTORIAL_STEPS = Object.freeze([
  step({ id: 'phrase-drums', recipeId: 'phrase-drums', stageIndex: 0, trackId: 'drums', anchorBar: 2, previewBar: 2, title: '先让雨落下来', detail: TRACK_COPY.drums }),
  step({ id: 'phrase-chord', recipeId: 'phrase-chord', stageIndex: 0, trackId: 'chord', anchorBar: 2, previewBar: 2, title: '给雨夜染上颜色', detail: TRACK_COPY.chord }),
  step({ id: 'phrase-bass', recipeId: 'phrase-bass', stageIndex: 0, trackId: 'bass', anchorBar: 2, previewBar: 2, title: '让脚步开始向前', detail: TRACK_COPY.bass }),
  step({ id: 'phrase-melody', recipeId: 'phrase-melody', stageIndex: 0, trackId: 'melody', anchorBar: 2, previewBar: 2, title: '留下一句能记住的旋律', detail: TRACK_COPY.melody }),
  step({ id: 'second-drums', recipeId: 'second-drums', stageIndex: 1, trackId: 'drums', anchorBar: 4, previewBar: 4, title: '复制节奏，再改一个落点', detail: '第 5–6 小节沿用第一句的重心，但删掉多余动作，让第二句不只是重复。' }),
  step({ id: 'second-chord', recipeId: 'second-chord', stageIndex: 1, trackId: 'chord', anchorBar: 4, previewBar: 4, title: '把和声带去更远处', detail: '从 Am 经过 F，像拐进下一条街。配方会保留复制感，同时改写和弦落点。' }),
  step({ id: 'second-bass', recipeId: 'second-bass', stageIndex: 1, trackId: 'bass', anchorBar: 4, previewBar: 4, title: '低音跟着第二句移动', detail: '保持同一套切分脚步，只改变根音走向。' }),
  step({ id: 'second-melody', recipeId: 'second-melody', stageIndex: 1, trackId: 'melody', anchorBar: 4, previewBar: 4, title: '让旋律回答上一句', detail: '第二句使用更完整的问答轮廓，听起来像同一段对话继续向前。' }),
  step({ id: 'home-drums', recipeId: 'home-drums', stageIndex: 2, trackId: 'drums', anchorBar: 6, previewBar: 6, title: '鼓开始收束', detail: '第 7 小节还有推动，第 8 小节减少镲片，让结尾有回家的空间。' }),
  step({ id: 'home-chord', recipeId: 'home-chord', stageIndex: 2, trackId: 'chord', anchorBar: 7, previewBar: 6, title: '最后落回 Cmaj7', detail: 'G 推向 Cmaj7，最后再落到 C：这是最明确的“回家”。' }),
  step({ id: 'home-bass', recipeId: 'home-bass', stageIndex: 2, trackId: 'bass', anchorBar: 7, previewBar: 6, title: '低音确认归属', detail: '最后一小节换成 C，脚步停在主音上。' }),
  step({ id: 'home-melody', recipeId: 'home-melody', stageIndex: 2, trackId: 'melody', anchorBar: 6, previewBar: 6, title: '旋律先一步停下', detail: '第 7 小节只留一个 D，第 8 小节保持空白，把结尾交给和声。' }),
  step({ id: 'intro-chord', recipeId: 'intro-chord', stageIndex: 3, trackId: 'chord', anchorBar: 0, previewBar: 0, title: '先从远处亮起和声', detail: '前奏只放 Cmaj7 与 Am7 色彩，像雨夜里远处的灯牌。' }),
  step({ id: 'intro-drums', recipeId: 'intro-drums', stageIndex: 3, trackId: 'drums', anchorBar: 1, previewBar: 0, title: '第二小节才出现雨点', detail: '第一小节留空，第二小节只加入很少的鼓点。' }),
  step({ id: 'intro-bass', recipeId: 'intro-bass', stageIndex: 3, trackId: 'bass', anchorBar: 1, previewBar: 0, previewSteps: 64, title: '低音在进主句前出现', detail: '只用两个 A 把前奏接到第三小节；Melody 继续保持空白。' }),
  step({ id: 'complete-playback', stageIndex: 4, previewBar: 0, previewSteps: 128, title: '从头播放八小节', detail: '现在从第一小节播放完整成品。听见前奏、两句话与回家之后，教程就完成了。', primaryLabel: '播放完整成品', explicit: true }),
]);

function createChillTutorialSession() {
  return {
    appliedRecipeIds: [],
    completed: false,
    expanded: false,
    hasStarted: false,
    paused: false,
    runState: CHILL_TUTORIAL_RUN_STATES.IDLE,
    stepIndex: 0,
  };
}

export {
  CHILL_TUTORIAL_STAGES,
  CHILL_TUTORIAL_STEPS,
  createChillTutorialSession,
};
