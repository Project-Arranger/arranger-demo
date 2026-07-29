import { createClipRecord } from '../domain/clipHelpers.js';
import {
  CORE_TRACK_IDS,
  ROOT_KEY,
  SCALE,
  TOTAL_BARS,
  TRACK_IDS,
} from '../domain/musicConstants.js';
import { createDefaultTrackState } from '../domain/trackInstances.js';
import {
  RECOMMENDED_BPM,
  normalizeBpm,
} from '../domain/bpm.js';
import createInitialMatrix from '../store/createInitialMatrix.js';

const MULTIMODAL_MEDIA_LIMITS = Object.freeze({
  image: 20 * 1024 * 1024,
  video: 200 * 1024 * 1024,
});

const MULTIMODAL_IMAGE_TYPES = Object.freeze([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MULTIMODAL_VIDEO_TYPES = Object.freeze([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const MULTIMODAL_ACCEPT = [
  ...MULTIMODAL_IMAGE_TYPES,
  ...MULTIMODAL_VIDEO_TYPES,
  '.mov',
].join(',');

const MULTIMODAL_ANALYSIS_STAGES = Object.freeze([
  '读取画面构图与动态',
  '识别色彩、场景与情绪',
  '匹配调式、和声与配器',
]);

const MULTIMODAL_RECOMMENDATION = Object.freeze({
  style: Object.freeze({
    defaultId: 'chill-rainy-street',
    options: Object.freeze([
      Object.freeze({ id: 'chill-rainy-street', label: 'Chill 雨夜街头' }),
      Object.freeze({ id: 'lofi-night-walk', label: 'Lofi 夜行' }),
      Object.freeze({ id: 'city-pop-afterglow', label: 'City Pop 余晖' }),
    ]),
  }),
  mode: Object.freeze({
    defaultId: 'c-ionian',
    options: Object.freeze([
      Object.freeze({ id: 'c-ionian', label: 'C Major · Ionian' }),
      Object.freeze({ id: 'a-aeolian', label: 'A Minor · Aeolian' }),
      Object.freeze({ id: 'd-dorian', label: 'D Minor · Dorian' }),
    ]),
  }),
  harmony: Object.freeze({
    defaultId: 'maj7-home',
    options: Object.freeze([
      Object.freeze({ id: 'maj7-home', label: 'Cmaj7 → Am7 → Fmaj7 → G7' }),
      Object.freeze({ id: 'minor-loop', label: 'Am7 → Fmaj7 → Cmaj7 → G' }),
      Object.freeze({ id: 'dorian-loop', label: 'Dm7 → G → Cmaj7 → Am7' }),
    ]),
  }),
  timbre: Object.freeze({
    defaultId: 'warm-neon',
    options: Object.freeze([
      Object.freeze({
        id: 'warm-neon',
        label: 'Warm Neon',
        tracks: Object.freeze({
          drums: 'Soft Electronic Kit',
          chord: 'Warm Electric Piano',
          bass: 'Round Electric Bass',
          melody: 'Airy Synth Lead',
        }),
      }),
      Object.freeze({
        id: 'tape-haze',
        label: 'Tape Haze',
        tracks: Object.freeze({
          drums: 'Dusty Tape Kit',
          chord: 'Muted Rhodes',
          bass: 'Soft Sub Bass',
          melody: 'Hazy Bell Lead',
        }),
      }),
      Object.freeze({
        id: 'glass-city',
        label: 'Glass City',
        tracks: Object.freeze({
          drums: 'Clean Digital Kit',
          chord: 'Glass Electric Keys',
          bass: 'FM Round Bass',
          melody: 'Soft Pluck Lead',
        }),
      }),
    ]),
  }),
  timeSignature: '4 / 4',
  structure: '8 小节 · 前奏 / 两句主题 / 收束',
});

function getMultimodalMediaKind(file) {
  const type = String(file?.type ?? '').toLowerCase();
  const name = String(file?.name ?? '').toLowerCase();

  if (
    MULTIMODAL_IMAGE_TYPES.includes(type)
    || /\.(gif|jpe?g|png|webp)$/.test(name)
  ) return 'image';
  if (
    MULTIMODAL_VIDEO_TYPES.includes(type)
    || /\.(mov|mp4|webm)$/.test(name)
  ) return 'video';
  return null;
}

function validateMultimodalMediaFile(file) {
  if (!file) {
    return {
      error: '请选择一张图片或一段视频。',
      kind: null,
      valid: false,
    };
  }

  const kind = getMultimodalMediaKind(file);
  if (!kind) {
    return {
      error: '暂时支持 JPEG、PNG、WebP、GIF、MP4、WebM 和 MOV。',
      kind: null,
      valid: false,
    };
  }

  const size = Number(file.size);
  if (!Number.isFinite(size) || size < 0 || size > MULTIMODAL_MEDIA_LIMITS[kind]) {
    return {
      error: kind === 'image'
        ? '图片不能超过 20MB。'
        : '视频不能超过 200MB。',
      kind,
      valid: false,
    };
  }

  return {
    error: null,
    kind,
    valid: true,
  };
}

function createMultimodalClips() {
  const records = CORE_TRACK_IDS.flatMap((trackId) => (
    Array.from({ length: TOTAL_BARS }, (_, bar) => createClipRecord(trackId, bar))
  ));

  return {
    ids: records.map((clip) => clip.id),
    byId: Object.fromEntries(records.map((clip) => [clip.id, clip])),
  };
}

function createMultimodalRecommendationAppState({ bpm = RECOMMENDED_BPM } = {}) {
  return {
    ...createDefaultTrackState(),
    activeTrackId: 'drums',
    bpm: normalizeBpm(bpm),
    clips: createMultimodalClips(),
    currentBar: 0,
    currentStep: 0,
    isPlaying: false,
    matrix: createInitialMatrix(),
    melodyScaleId: 'major',
    mutedTracks: Object.fromEntries(CORE_TRACK_IDS.map((trackId) => [trackId, false])),
    rootKey: ROOT_KEY,
    scale: SCALE,
    seekBar: 0,
    seekStep: 0,
    selectedBar: 0,
    selectedClipId: 'drums-bar-0',
    visibleTrackIds: [...CORE_TRACK_IDS],
    volumes: Object.fromEntries(TRACK_IDS.map((trackId) => [trackId, 0])),
  };
}

function createInitialRecommendationSelections() {
  return {
    harmony: MULTIMODAL_RECOMMENDATION.harmony.defaultId,
    mode: MULTIMODAL_RECOMMENDATION.mode.defaultId,
    style: MULTIMODAL_RECOMMENDATION.style.defaultId,
    timbre: MULTIMODAL_RECOMMENDATION.timbre.defaultId,
  };
}

export {
  MULTIMODAL_ACCEPT,
  MULTIMODAL_ANALYSIS_STAGES,
  MULTIMODAL_MEDIA_LIMITS,
  MULTIMODAL_RECOMMENDATION,
  createInitialRecommendationSelections,
  createMultimodalRecommendationAppState,
  getMultimodalMediaKind,
  validateMultimodalMediaFile,
};
