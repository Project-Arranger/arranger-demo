import { STEPS_PER_BAR } from '../domain/musicConstants.js';
import {
  createChordCell,
  createChordNotesCell,
  createChordTonePitches,
  getChordDefinition,
} from '../domain/chordCells.js';
import { getExistingChordClipBars } from './chordActions.js';

const DEFAULT_GROOVE_CHORD = 'C';

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
  Object.freeze({
    id: 'arp-basic',
    name: '琶音基础律动',
    kind: 'arpeggio',
    hitLabel: '4 hits / bar · arpeggio',
    desc: '将和弦的组成音按基础律动依次单个弹出，听感更加柔和，创造更多的旋律线条感。',
    detail: '在每小节的 1/16、3/16、5/16、7/16 处将和弦的组成音依次弹出；如果和弦超过四个音的，可以继续往后延展；如果和弦只有三个音，则在 7/16 处继续插入根音的八度音。',
    steps: Object.freeze([0, 2, 4, 6]),
  }),
]);

function getChordGrooveTemplate(templateId) {
  return CHORD_GROOVE_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

function createChordNotes(chordName) {
  const definition = getChordDefinition(chordName);
  if (!definition) return [];

  return createChordTonePitches(definition.root, definition.toneRoots);
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

function createGrooveChordCell(chordName, templateId) {
  const cell = createChordCell(chordName) ?? createChordCell(DEFAULT_GROOVE_CHORD);
  if (!cell) return null;

  return {
    ...cell,
    duration: '16n',
    grooveTemplateId: templateId,
    sourceChordLabel: cell.label,
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

function createGrooveBar(template, chordName) {
  const notes = createChordNotes(chordName);
  const sourceChordName = notes.length ? chordName : DEFAULT_GROOVE_CHORD;
  const sourceNotes = notes.length ? notes : createChordNotes(DEFAULT_GROOVE_CHORD);
  const nextBar = Array.from({ length: STEPS_PER_BAR }, () => null);

  template.steps.forEach((step, index) => {
    if (template.kind === 'block') {
      nextBar[step] = createGrooveChordCell(sourceChordName, template.id);
      return;
    }

    const note = getArpeggioNote(sourceNotes, index);
    nextBar[step] = note ? createGrooveNoteCell(note, template.id, sourceChordName) : null;
  });

  return nextBar;
}

function applyChordGrooveTemplateToExistingClips(matrix, clips, templateId) {
  const template = getChordGrooveTemplate(templateId);
  if (!template) return matrix;

  return getExistingChordClipBars(clips).reduce((nextMatrix, barIndex) => {
    if (!nextMatrix?.chord?.[barIndex]) return nextMatrix;

    const sourceChordLabel = getSourceChordLabel(nextMatrix, barIndex);
    const nextChord = [...nextMatrix.chord];
    nextChord[barIndex] = createGrooveBar(template, sourceChordLabel);

    return {
      ...nextMatrix,
      chord: nextChord,
    };
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

export {
  CHORD_GROOVE_TEMPLATES,
  applyChordGrooveTemplateToExistingClips,
  createChordGroovePreviewEvents,
  getChordGrooveTemplate,
  getSourceChordLabel,
};
