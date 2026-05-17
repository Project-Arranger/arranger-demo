import {
  DRUMS_INSTRUMENT_IDS,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';

const DRUMS_INSTRUMENT_SET = new Set(DRUMS_INSTRUMENT_IDS);

function normalizeMatrixSource(matrixSource) {
  return typeof matrixSource === 'function' ? matrixSource : () => matrixSource;
}

function extractDrumsInstruments(cell) {
  if (!cell) return [];

  const instruments = Array.isArray(cell.instruments)
    ? cell.instruments
    : [cell.instrument].filter(Boolean);

  return instruments.filter((instrument) => DRUMS_INSTRUMENT_SET.has(instrument));
}

function createDrumsEvent(bar, step, instrument) {
  return {
    type: 'drums',
    trackId: 'drums',
    bar,
    step,
    instrument,
  };
}

function createMatrixPlaybackAdapter(matrixSource, options = {}) {
  const readMatrix = normalizeMatrixSource(matrixSource);
  const totalBars = options.totalBars ?? TOTAL_BARS;
  const stepsPerBar = options.stepsPerBar ?? STEPS_PER_BAR;
  const totalSteps = totalBars * stepsPerBar;

  function getPositionForFlatStep(flatStep) {
    const normalizedStep = ((flatStep % totalSteps) + totalSteps) % totalSteps;

    return {
      bar: Math.floor(normalizedStep / stepsPerBar),
      step: normalizedStep % stepsPerBar,
    };
  }

  function getEventsForStep(bar, step) {
    const matrix = readMatrix();
    const cell = matrix?.drums?.[bar]?.[step] ?? null;

    return extractDrumsInstruments(cell).map((instrument) => (
      createDrumsEvent(bar, step, instrument)
    ));
  }

  return {
    getEventsForFlatStep: (flatStep) => {
      const { bar, step } = getPositionForFlatStep(flatStep);

      return getEventsForStep(bar, step);
    },
    getEventsForStep,
    getPositionForFlatStep,
    stepsPerBar,
    totalBars,
    totalSteps,
  };
}

export { createMatrixPlaybackAdapter, extractDrumsInstruments };
