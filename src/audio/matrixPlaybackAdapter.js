import {
  CHORD_SPAN,
  STEPS_PER_BAR,
  TOTAL_BARS,
} from '../domain/musicConstants.js';
import { getDrumsCellInstruments } from '../domain/drumsCells.js';
import {
  createChordTonePitches,
  getChordCellNotes,
  getChordDefinition,
  getChordNoteOctave,
  getChordNotePitch,
  getChordToneRoots,
} from '../domain/chordCells.js';

function normalizeMatrixSource(matrixSource) {
  return typeof matrixSource === 'function' ? matrixSource : () => matrixSource;
}

function extractDrumsInstruments(cell) {
  return getDrumsCellInstruments(cell);
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

function createNotesFromToneRoots(root, toneRoots) {
  return createChordTonePitches(root, toneRoots);
}

function createChordNotes(root) {
  const definition = getChordDefinition(root);
  if (!definition) return [];

  return createNotesFromToneRoots(definition.root, definition.toneRoots);
}

function createSingleNotes(noteRoots) {
  if (!noteRoots.length) return [];

  const hasExplicitOctave = noteRoots.some((noteRoot) => getChordNoteOctave(noteRoot) !== null);
  if (!hasExplicitOctave) return createNotesFromToneRoots(noteRoots[0], noteRoots);

  return noteRoots.map((noteRoot) => getChordNotePitch(noteRoot)).filter(Boolean);
}

function createChordNotesWithAddedNotes(root, toneRoots, addedNotes) {
  const legacyAddedNotes = addedNotes.filter((note) => getChordNoteOctave(note) === null);
  const exactAddedNotes = addedNotes
    .filter((note) => getChordNoteOctave(note) !== null)
    .map((note) => getChordNotePitch(note))
    .filter(Boolean);

  return [
    ...createNotesFromToneRoots(root, [...toneRoots, ...legacyAddedNotes]),
    ...exactAddedNotes,
  ];
}

function isChordTriggerStep(step) {
  return Number.isInteger(step) && step % CHORD_SPAN === 0;
}

function extractChordEvent(cell, bar, step) {
  if (!cell) return null;

  if (cell.type === 'note' || cell.type === 'notes') {
    const noteRoots = getChordCellNotes(cell);
    const notes = createSingleNotes(noteRoots);
    if (!notes.length) return null;

    return {
      type: 'chord',
      trackId: 'chord',
      bar,
      step,
      root: null,
      quality: 'notes',
      label: cell.label ?? noteRoots.join('/'),
      notes,
      duration: '16n',
    };
  }

  const isChordLike = cell.type === 'chord' || (!cell.type && (cell.root || cell.label));
  if (!isChordLike) return null;

  const addedNotes = getChordCellNotes(cell);
  if (!isChordTriggerStep(step)) {
    const notes = createSingleNotes(addedNotes);
    if (!notes.length) return null;

    return {
      type: 'chord',
      trackId: 'chord',
      bar,
      step,
      root: null,
      quality: 'notes',
      label: addedNotes.join('/'),
      notes,
      duration: '16n',
    };
  }

  const toneRoots = cell.toneRoots ?? getChordToneRoots(cell.label ?? cell.root);
  const notes = createChordNotesWithAddedNotes(cell.root, toneRoots, addedNotes);
  if (!notes.length) return null;

  return {
    type: 'chord',
    trackId: 'chord',
    bar,
    step,
    root: cell.root,
    quality: cell.quality ?? 'maj',
    label: cell.label ?? cell.root,
    notes,
    duration: '4n',
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
    const drumsCell = matrix?.drums?.[bar]?.[step] ?? null;
    const chordCell = matrix?.chord?.[bar]?.[step] ?? null;

    const drumEvents = extractDrumsInstruments(drumsCell).map((instrument) => (
      createDrumsEvent(bar, step, instrument)
    ));
    const chordEvent = extractChordEvent(chordCell, bar, step);

    return chordEvent ? [...drumEvents, chordEvent] : drumEvents;
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

export {
  createChordNotes,
  createMatrixPlaybackAdapter,
  extractChordEvent,
  extractDrumsInstruments,
};
