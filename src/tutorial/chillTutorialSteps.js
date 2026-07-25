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

const TECHNICAL_COPY = Object.freeze({
  'phrase-drums': 'B3：K 1/7/15，S 9，HH 1/5/7/9/13；B4：K 3/6/12/15，S 9，HH 1/5/7/9/13。',
  'phrase-chord': 'B3：Fmaj7@1、F@11；B4：Gsus2@1、G@9、G7@15。',
  'phrase-bass': 'B3：F0@1/5/11、F#0@15；B4：G0@1/5/11/15。全部使用八分音符时值。',
  'phrase-melody': 'B3：B4@1、G4@3、E4@15；B4：G4@1。其余步位留空。',
  'second-drums': '把 B3–4 的节奏重心复制到 B5–6；B6 改为 K 3/11，保留 S 9 与 HH 1/5/7/9/13。',
  'second-chord': 'B5：Am@1/9、Am7@13；B6：Fmaj7@1/13。形成 vi→IV 的第二句。',
  'second-bass': 'B5：A0@1/5/11/15；B6：F0@1/5/11/15。切分步位不变，只替换根音。',
  'second-melody': 'B5：E4@1、A4@3、D4@9、C4@15；B6：E4@1、D4@3、G4@9、D4@11。',
  'home-drums': 'B7：K 1/3/7/15，S 9，HH 1/5/7/9/13；B8 减少 HH，并把 K 放在 3/11/13。',
  'home-chord': 'B7：G@1/9；B8：Cmaj7@1、C@9。V→I 完成终止。',
  'home-bass': 'B7 使用 G0@1/5/11/15；B8 改为 C1@1/5/11/15，确认主音。',
  'home-melody': 'B7 只保留 D4@1；B8 全空，让和声终止承担结尾。',
  'intro-chord': 'B1：Cmaj7@1/13；B2：Am7@1/13，并在第 11 步加入 Amadd9。',
  'intro-drums': 'B1 全空；B2：K 15，S 13，HH 13/15。只在进主句前给出提示。',
  'intro-bass': 'B1 全空；B2：A0@11/15。Melody 在 B1–2 继续保持空白。',
  'complete-playback': '88 BPM，从 B1.1 播放到 B8.16，共 128 个十六分步；完成前会逐项校验四轨母版。',
});

function step({
  anchorBar,
  id,
  recipeId = null,
  stageIndex,
  title,
  trackId = null,
  primaryLabel = '加入这一层',
  explicit = false,
  detail,
}) {
  return Object.freeze({
    anchorBar,
    anchorSelector: trackId
      ? `[data-tutorial-anchor="${trackId}-bar-${anchorBar}"]`
      : '[data-tutorial-anchor="transport"]',
    detail,
    explicit,
    id,
    preferredPlacements: Object.freeze(['top', 'bottom', 'right', 'left']),
    primaryLabel,
    recipeId,
    stageIndex,
    stageLabel: CHILL_TUTORIAL_STAGES[stageIndex],
    technical: TECHNICAL_COPY[recipeId ?? id] ?? '',
    title,
    trackId,
  });
}

const CHILL_TUTORIAL_STEPS = Object.freeze([
  step({ id: 'phrase-drums', recipeId: 'phrase-drums', stageIndex: 0, trackId: 'drums', anchorBar: 2, title: '先让雨落下来', detail: TRACK_COPY.drums }),
  step({ id: 'phrase-chord', recipeId: 'phrase-chord', stageIndex: 0, trackId: 'chord', anchorBar: 2, title: '给雨夜染上颜色', detail: TRACK_COPY.chord }),
  step({ id: 'phrase-bass', recipeId: 'phrase-bass', stageIndex: 0, trackId: 'bass', anchorBar: 2, title: '让脚步开始向前', detail: TRACK_COPY.bass }),
  step({ id: 'phrase-melody', recipeId: 'phrase-melody', stageIndex: 0, trackId: 'melody', anchorBar: 2, title: '留下一句能记住的旋律', detail: TRACK_COPY.melody, primaryLabel: '加入并试听第一句' }),
  step({ id: 'second-drums', recipeId: 'second-drums', stageIndex: 1, trackId: 'drums', anchorBar: 4, title: '复制节奏，再改一个落点', detail: '第 5–6 小节沿用第一句的重心，但删掉多余动作，让第二句不只是重复。' }),
  step({ id: 'second-chord', recipeId: 'second-chord', stageIndex: 1, trackId: 'chord', anchorBar: 4, title: '把和声带去更远处', detail: '从 Am 经过 F，像拐进下一条街。配方会保留复制感，同时改写和弦落点。' }),
  step({ id: 'second-bass', recipeId: 'second-bass', stageIndex: 1, trackId: 'bass', anchorBar: 4, title: '低音跟着第二句移动', detail: '保持同一套切分脚步，只改变根音走向。' }),
  step({ id: 'second-melody', recipeId: 'second-melody', stageIndex: 1, trackId: 'melody', anchorBar: 4, title: '让旋律回答上一句', detail: '第二句使用更完整的问答轮廓，听起来像同一段对话继续向前。', primaryLabel: '完成第二句并试听' }),
  step({ id: 'home-drums', recipeId: 'home-drums', stageIndex: 2, trackId: 'drums', anchorBar: 6, title: '鼓开始收束', detail: '第 7 小节还有推动，第 8 小节减少镲片，让结尾有回家的空间。' }),
  step({ id: 'home-chord', recipeId: 'home-chord', stageIndex: 2, trackId: 'chord', anchorBar: 7, title: '最后落回 Cmaj7', detail: 'G 推向 Cmaj7，最后再落到 C：这是最明确的“回家”。' }),
  step({ id: 'home-bass', recipeId: 'home-bass', stageIndex: 2, trackId: 'bass', anchorBar: 7, title: '低音确认归属', detail: '最后一小节换成 C，脚步停在主音上。' }),
  step({ id: 'home-melody', recipeId: 'home-melody', stageIndex: 2, trackId: 'melody', anchorBar: 6, title: '旋律先一步停下', detail: '第 7 小节只留一个 D，第 8 小节保持空白，把结尾交给和声。', primaryLabel: '完成收束并试听' }),
  step({ id: 'intro-chord', recipeId: 'intro-chord', stageIndex: 3, trackId: 'chord', anchorBar: 0, title: '先从远处亮起和声', detail: '前奏只放 Cmaj7 与 Am7 色彩，像雨夜里远处的灯牌。' }),
  step({ id: 'intro-drums', recipeId: 'intro-drums', stageIndex: 3, trackId: 'drums', anchorBar: 1, title: '第二小节才出现雨点', detail: '第一小节留空，第二小节只加入很少的鼓点。' }),
  step({ id: 'intro-bass', recipeId: 'intro-bass', stageIndex: 3, trackId: 'bass', anchorBar: 1, title: '低音在进主句前出现', detail: '只用两个 A 把前奏接到第三小节；Melody 继续保持空白。', primaryLabel: '完成前奏并试听' }),
  step({ id: 'complete-playback', stageIndex: 4, title: '从头播放八小节', detail: '现在从第一小节播放完整成品。听见前奏、两句话与回家之后，教程就完成了。', primaryLabel: '播放完整成品', explicit: true }),
]);

function createChillTutorialSession() {
  return {
    appliedRecipeIds: [],
    completed: false,
    expanded: false,
    hasStarted: false,
    paused: false,
    stepIndex: 0,
  };
}

export {
  CHILL_TUTORIAL_STAGES,
  CHILL_TUTORIAL_STEPS,
  createChillTutorialSession,
};
