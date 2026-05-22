import {
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';

const TOTAL_STEPS = TOTAL_BARS * STEPS_PER_BAR;

function clampFlatStep(flatStep) {
  return Math.max(0, Math.min(TOTAL_STEPS - 1, flatStep));
}

function getTimelinePlayheadSeekPosition(clientX, rect) {
  const left = Number(rect?.left);
  const width = Number(rect?.width);

  if (!Number.isFinite(clientX) || !Number.isFinite(left) || !Number.isFinite(width) || width <= 0) {
    return null;
  }

  const ratio = (clientX - left) / width;
  const flatStep = clampFlatStep(Math.round(ratio * TOTAL_STEPS));

  return {
    bar: Math.floor(flatStep / STEPS_PER_BAR),
    flatStep,
    step: flatStep % STEPS_PER_BAR,
  };
}

export { getTimelinePlayheadSeekPosition };
