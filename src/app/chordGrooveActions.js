import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  CHORD_TEMPLATES,
  createChordCell,
  createChordNotesCell,
  createChordTonePitches,
  getChordDefinition,
} from '../domain/chordCells.js';
import { getExistingChordClipBars } from './chordActions.js';

const DEFAULT_GROOVE_CHORD = 'C';
const CUSTOM_CHORD_GROOVE_ID = 'custom-rhythm';
const CHORD_SOURCE_CELL_TYPE = 'chord-source';

const CHORD_GROOVE_TEMPLATES = Object.freeze([
  Object.freeze({
    id: 'block-basic',
    name: '柱式音型基础律动',
    kind: 'block',
    default: true,
    hitLabel: '1 hit / bar',
    desc: '最基础的弹奏律动，适合在这个基础上做进一步的微调。',
    detail: '在每小节的 1/16 处添加和弦的柱式音型。',
    steps: Object.freeze([0]),
  }),
  Object.freeze({
    id: 'block-syncopated',
    name: '柱式音型切分律动',
    kind: 'block',
    hitLabel: '3 hits / bar',
    desc: '在基础柱式音型上加入切分重音，创造更多律动感。',
    detail: '在每小节的第 1/16、7/16、13/16 处添加和弦的柱式音型。',
    steps: Object.freeze([0, 6, 12]),
  }),
]);

function getChordGrooveTemplate(templateId) {
  return CHORD_GROOVE_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

function createChordNotes(chordName) {
  const definition = getChordDefinition(chordName);
  if (!definition) return [];

  return createChordTonePitches(definition.root, definition.toneRoots, definition.tonePitches);
}

function octaveUp(note) {
  const match = /^([A-G]#?)([0-9])$/.exec(note);
  if (!match) return note;

  return `${match[1]}${Number(match[2]) + 1}`;
}

function getArpeggioNote(notes, index) {
  if (!notes.length) return null;
  if (notes[index]) return notes[index];

  return octaveUp(notes[index % notes.length]);
}

function getSourceChordLabel(matrix, barIndex) {
  const chordBar = matrix?.chord?.[barIndex] ?? [];
  const firstCell = chordBar[0];
  if (firstCell?.type === 'chord') return firstCell.sourceChordLabel ?? firstCell.label;
  if (firstCell?.sourceChordLabel) return firstCell.sourceChordLabel;

  return chordBar.find((cell) => cell?.sourceChordLabel)?.sourceChordLabel ?? DEFAULT_GROOVE_CHORD;
}

function getChordProgressionTemplateId(matrix, barIndex) {
  return matrix?.chord?.[barIndex]?.find((cell) => cell?.progressionTemplateId)
    ?.progressionTemplateId ?? null;
}

function getChordRhythmSteps(matrix, barIndex) {
  return (matrix?.chord?.[barIndex] ?? [])
    .map((cell, step) => ({ cell, step }))
    .filter(({ cell }) => cell?.type === 'chord')
    .map(({ step }) => step);
}

function getChordSelectedGrooveTemplateId(matrix, barIndex) {
  const chordBar = matrix?.chord?.[barIndex] ?? [];
  const selectedId = chordBar.find((cell) => cell?.selectedGrooveTemplateId)
    ?.selectedGrooveTemplateId;
  if (selectedId) return selectedId;

  const grooveIds = new Set(
    chordBar
      .filter((cell) => cell?.type === 'chord' && cell.duration === '16n')
      .map((cell) => cell.grooveTemplateId)
      .filter(Boolean),
  );

  return grooveIds.size === 1 ? [...grooveIds][0] : null;
}

function getAppliedChordProgressionTemplateId(matrix, clips, selectedBar) {
  const explicitTemplateId = getChordProgressionTemplateId(matrix, selectedBar);
  if (explicitTemplateId && CHORD_TEMPLATES[explicitTemplateId]) return explicitTemplateId;

  const bars = getExistingChordClipBars(clips);
  if (!bars.length) return null;
  const matchingIds = Object.values(CHORD_TEMPLATES)
    .filter((template) => bars.every((barIndex, index) => (
      getSourceChordLabel(matrix, barIndex) === template.chords[index % template.chords.length]
    )))
    .map((template) => template.id);

  return matchingIds.length === 1 ? matchingIds[0] : null;
}

function createChordSourceCell(
  chordName,
  progressionTemplateId = null,
  selectedGrooveTemplateId = CUSTOM_CHORD_GROOVE_ID,
) {
  const chordCell = createChordCell(chordName) ?? createChordCell(DEFAULT_GROOVE_CHORD);
  if (!chordCell) return null;

  return {
    type: CHORD_SOURCE_CELL_TYPE,
    label: chordCell.label,
    sourceChordLabel: chordCell.label,
    ...(progressionTemplateId ? { progressionTemplateId } : {}),
    ...(selectedGrooveTemplateId ? { selectedGrooveTemplateId } : {}),
  };
}

function createGrooveChordCell(
  chordName,
  templateId,
  progressionTemplateId = null,
  selectedGrooveTemplateId = templateId,
) {
  const cell = createChordCell(chordName) ?? createChordCell(DEFAULT_GROOVE_CHORD);
  if (!cell) return null;

  return {
    ...cell,
    duration: '16n',
    grooveTemplateId: templateId,
    sourceChordLabel: cell.label,
    ...(progressionTemplateId ? { progressionTemplateId } : {}),
    ...(selectedGrooveTemplateId ? { selectedGrooveTemplateId } : {}),
  };
}

function createGrooveNoteCell(note, templateId, chordName) {
  const cell = createChordNotesCell([note]);
  if (!cell) return null;

  return {
    ...cell,
    grooveTemplateId: templateId,
    sourceChordLabel: chordName,
  };
}

function createGrooveBar(template, chordName, progressionTemplateId = null) {
  const notes = createChordNotes(chordName);
  const sourceChordName = notes.length ? chordName : DEFAULT_GROOVE_CHORD;
  const sourceNotes = notes.length ? notes : createChordNotes(DEFAULT_GROOVE_CHORD);
  const nextBar = Array.from({ length: STEPS_PER_BAR }, () => null);

  template.steps.forEach((step, index) => {
    if (template.kind === 'block') {
      nextBar[step] = createGrooveChordCell(
        sourceChordName,
        template.id,
        progressionTemplateId,
      );
      return;
    }

    const note = getArpeggioNote(sourceNotes, index);
    nextBar[step] = note ? createGrooveNoteCell(note, template.id, sourceChordName) : null;
  });

  return nextBar;
}

function createCustomRhythmBar(steps, chordName, progressionTemplateId = null) {
  const nextBar = Array.from({ length: STEPS_PER_BAR }, () => null);
  steps.forEach((step) => {
    nextBar[step] = createGrooveChordCell(
      chordName,
      CUSTOM_CHORD_GROOVE_ID,
      progressionTemplateId,
      CUSTOM_CHORD_GROOVE_ID,
    );
  });

  return nextBar;
}

function replaceChordBar(matrix, barIndex, nextBar) {
  if (!matrix?.chord?.[barIndex] || !Array.isArray(nextBar)) return matrix;

  const nextChord = [...matrix.chord];
  nextChord[barIndex] = nextBar;

  return {
    ...matrix,
    chord: nextChord,
  };
}

function applyChordTemplateWorkspaceToBar(
  matrix,
  clips,
  barIndex,
  { progressionTemplateId, grooveTemplateId } = {},
) {
  const progression = CHORD_TEMPLATES[progressionTemplateId];
  const groove = getChordGrooveTemplate(grooveTemplateId);
  const clipBars = getExistingChordClipBars(clips);
  const clipIndex = clipBars.indexOf(barIndex);
  if (!progression || !groove || clipIndex === -1 || !matrix?.chord?.[barIndex]) return matrix;

  const chordName = progression.chords[clipIndex % progression.chords.length];
  return replaceChordBar(
    matrix,
    barIndex,
    createGrooveBar(groove, chordName, progression.id),
  );
}

function applyChordTemplateWorkspaceToExistingClips(
  matrix,
  clips,
  { progressionTemplateId, grooveTemplateId } = {},
) {
  const progression = CHORD_TEMPLATES[progressionTemplateId];
  const groove = getChordGrooveTemplate(grooveTemplateId);
  if (!progression || !groove) return matrix;

  return getExistingChordClipBars(clips).reduce((nextMatrix, barIndex, index) => {
    if (!nextMatrix?.chord?.[barIndex]) return nextMatrix;
    const chordName = progression.chords[index % progression.chords.length];
    return replaceChordBar(
      nextMatrix,
      barIndex,
      createGrooveBar(groove, chordName, progression.id),
    );
  }, matrix);
}

function toggleChordRhythmStep(matrix, barIndex, stepIndex) {
  if (
    !matrix?.chord?.[barIndex]
    || !Number.isInteger(stepIndex)
    || stepIndex < 0
    || stepIndex >= STEPS_PER_BAR
  ) {
    return matrix;
  }

  const sourceChordLabel = getSourceChordLabel(matrix, barIndex);
  const progressionTemplateId = getChordProgressionTemplateId(matrix, barIndex);
  const activeSteps = new Set(getChordRhythmSteps(matrix, barIndex));
  if (activeSteps.has(stepIndex)) activeSteps.delete(stepIndex);
  else activeSteps.add(stepIndex);

  if (!activeSteps.size) {
    const nextBar = Array.from({ length: STEPS_PER_BAR }, () => null);
    nextBar[0] = createChordSourceCell(
      sourceChordLabel,
      progressionTemplateId,
      CUSTOM_CHORD_GROOVE_ID,
    );
    return replaceChordBar(matrix, barIndex, nextBar);
  }

  return replaceChordBar(
    matrix,
    barIndex,
    createCustomRhythmBar([...activeSteps].sort((a, b) => a - b), sourceChordLabel, progressionTemplateId),
  );
}

function clearChordRhythmBar(matrix, barIndex) {
  if (!matrix?.chord?.[barIndex]) return matrix;

  const sourceChordLabel = getSourceChordLabel(matrix, barIndex);
  const progressionTemplateId = getChordProgressionTemplateId(matrix, barIndex);
  const selectedGrooveTemplateId = getChordSelectedGrooveTemplateId(matrix, barIndex)
    ?? CUSTOM_CHORD_GROOVE_ID;
  const nextBar = Array.from({ length: STEPS_PER_BAR }, () => null);
  nextBar[0] = createChordSourceCell(
    sourceChordLabel,
    progressionTemplateId,
    selectedGrooveTemplateId,
  );

  return replaceChordBar(matrix, barIndex, nextBar);
}

function applyChordGrooveTemplateToExistingClips(matrix, clips, templateId) {
  const template = getChordGrooveTemplate(templateId);
  if (!template) return matrix;

  return getExistingChordClipBars(clips).reduce((nextMatrix, barIndex) => {
    if (!nextMatrix?.chord?.[barIndex]) return nextMatrix;

    const sourceChordLabel = getSourceChordLabel(nextMatrix, barIndex);
    return replaceChordBar(
      nextMatrix,
      barIndex,
      createGrooveBar(
        template,
        sourceChordLabel,
        getChordProgressionTemplateId(nextMatrix, barIndex),
      ),
    );
  }, matrix);
}

function createChordGroovePreviewEvents(templateId, chordName = DEFAULT_GROOVE_CHORD) {
  const template = getChordGrooveTemplate(templateId);
  if (!template) return [];

  const notes = createChordNotes(chordName);
  const sourceNotes = notes.length ? notes : createChordNotes(DEFAULT_GROOVE_CHORD);

  return template.steps.map((step, index) => {
    const eventNotes = template.kind === 'block'
      ? sourceNotes
      : [getArpeggioNote(sourceNotes, index)].filter(Boolean);

    return {
      step,
      notes: eventNotes,
      duration: '16n',
    };
  }).filter((event) => event.notes.length);
}

function createChordTemplateWorkspacePreviewEvents({
  progressionTemplateId,
  grooveTemplateId,
} = {}) {
  const progression = CHORD_TEMPLATES[progressionTemplateId];
  const groove = getChordGrooveTemplate(grooveTemplateId);
  if (!progression || !groove) return [];

  return progression.chords.slice(0, 4).flatMap((chordName, clipIndex) => (
    createChordGroovePreviewEvents(groove.id, chordName).map((event) => ({
      ...event,
      step: event.step + clipIndex * STEPS_PER_BAR,
    }))
  ));
}

export {
  CHORD_SOURCE_CELL_TYPE,
  CHORD_GROOVE_TEMPLATES,
  CUSTOM_CHORD_GROOVE_ID,
  applyChordTemplateWorkspaceToBar,
  applyChordTemplateWorkspaceToExistingClips,
  applyChordGrooveTemplateToExistingClips,
  clearChordRhythmBar,
  createChordGroovePreviewEvents,
  createChordTemplateWorkspacePreviewEvents,
  getAppliedChordProgressionTemplateId,
  getChordGrooveTemplate,
  getChordProgressionTemplateId,
  getChordRhythmSteps,
  getChordSelectedGrooveTemplateId,
  getSourceChordLabel,
  toggleChordRhythmStep,
};
