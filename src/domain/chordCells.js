import {
  BEATS_PER_BAR,
  CHORD_SPAN,
} from './musicConstants.js';

const CHORD_ROOTS = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const MAJOR_TRIAD_INTERVALS = Object.freeze([0, 4, 7]);
const CHORD_TEMPLATES = Object.freeze({
  axis: Object.freeze({
    id: 'axis',
    name: '轴心',
    tag: 'I-V-vi-IV',
    chords: Object.freeze(['C', 'G', 'Dm', 'F']),
    desc: '流行音乐中最具代表性的四和弦进行之一，适合循环段落。',
    songs: Object.freeze(['The Beatles · Hey Jude', 'Adele · Someone Like You']),
  }),
  doowop: Object.freeze({
    id: 'doowop',
    name: 'Doo-wop',
    tag: 'I-vi-IV-V',
    chords: Object.freeze(['C', 'Am', 'F', 'G']),
    desc: '清晰的离家与归家旅程，适合抒情流行与复古段落。',
    songs: Object.freeze(['Ben E. King · Stand By Me', 'Sean Kingston · Beautiful Girls']),
  }),
  andalusian: Object.freeze({
    id: 'andalusian',
    name: '安达卢西亚',
    tag: 'i-VII-VI-V',
    chords: Object.freeze(['Am', 'G', 'F', 'E']),
    desc: '下行级进带来忧郁与张力，适合西语流行和影视感段落。',
    songs: Object.freeze(['Ray Charles · Hit the Road Jack', 'Michael Jackson · Smooth Criminal']),
  }),
  canon: Object.freeze({
    id: 'canon',
    name: '卡农进行',
    tag: 'I-V-vi-iii',
    chords: Object.freeze(['C', 'G', 'Am', 'Em']),
    desc: '平稳流畅的经典下行走向，适合抒情铺垫。',
    songs: Object.freeze(['Pachelbel · Canon in D', 'Green Day · Basket Case']),
  }),
  blues: Object.freeze({
    id: 'blues',
    name: '12 小节布鲁斯',
    tag: 'I-IV-I-V',
    chords: Object.freeze(['C7', 'F7', 'C7', 'G7']),
    desc: '围绕 I-IV-V 的基础循环，用七度色彩制造摇摆感。',
    songs: Object.freeze(['B.B. King · The Thrill Is Gone', 'Chuck Berry · Johnny B. Goode']),
  }),
  jazz251: Object.freeze({
    id: 'jazz251',
    name: 'ii-V-I 爵士',
    tag: 'ii-V-I',
    chords: Object.freeze(['Dm7', 'G7', 'Cmaj7', 'Cmaj7']),
    desc: '下属功能到属功能再回到主功能，爵士终止式核心循环。',
    songs: Object.freeze(['Miles Davis · Autumn Leaves', 'John Coltrane · Giant Steps']),
  }),
});
const CHORD_VARIANTS = Object.freeze({
  C: Object.freeze([
    Object.freeze({ name: 'Cmaj7', desc: '柔和忧郁，常见于爵士与流行。' }),
    Object.freeze({ name: 'Csus2', desc: '明亮清澈，悬而未决。' }),
    Object.freeze({ name: 'Csus4', desc: '清新欢快，有悬置感。' }),
    Object.freeze({ name: 'Cadd9', desc: '温暖开阔，适合民谣流行。' }),
  ]),
  Am: Object.freeze([
    Object.freeze({ name: 'Am7', desc: '细腻内敛，适合抒情段落。' }),
    Object.freeze({ name: 'Am9', desc: '梦幻忧郁，为小三和弦增加空气感。' }),
    Object.freeze({ name: 'Asus2', desc: '开阔明净，弱化小三度色彩。' }),
    Object.freeze({ name: 'Am6', desc: '复古神秘，带一点爵士味。' }),
  ]),
  F: Object.freeze([
    Object.freeze({ name: 'Fmaj7', desc: '温柔克制的下属功能延伸。' }),
    Object.freeze({ name: 'Fsus2', desc: '空灵开阔，保留五度去三度。' }),
    Object.freeze({ name: 'F6', desc: '慵懒复古，有柔和爵士感。' }),
    Object.freeze({ name: 'Fadd9', desc: '清新有空气感，适合铺底。' }),
  ]),
  G: Object.freeze([
    Object.freeze({ name: 'G7', desc: '属七和弦，推动回到主和弦。' }),
    Object.freeze({ name: 'Gsus2', desc: '明亮清澈，常用于民谣流行。' }),
    Object.freeze({ name: 'Gsus4', desc: '强烈悬置，适合 V 到 I 前。' }),
    Object.freeze({ name: 'Gadd9', desc: '为大三和弦增添亮色。' }),
  ]),
});
const EXTRA_CHORD_DEFINITIONS = Object.freeze({
  C7: Object.freeze({ root: 'C', chordRoot: 'C', quality: '7', toneRoots: Object.freeze(['C', 'E', 'G', 'A#']) }),
  Cmaj7: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'maj7', toneRoots: Object.freeze(['C', 'E', 'G', 'B']) }),
  Csus2: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'sus2', toneRoots: Object.freeze(['C', 'D', 'G']) }),
  Csus4: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'sus4', toneRoots: Object.freeze(['C', 'F', 'G']) }),
  Cadd9: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'add9', toneRoots: Object.freeze(['C', 'E', 'G', 'D']) }),
  Dm: Object.freeze({ root: 'D', chordRoot: 'Dm', quality: 'min', toneRoots: Object.freeze(['D', 'F', 'A']) }),
  Dm7: Object.freeze({ root: 'D', chordRoot: 'Dm', quality: 'm7', toneRoots: Object.freeze(['D', 'F', 'A', 'C']) }),
  Em: Object.freeze({ root: 'E', chordRoot: 'Em', quality: 'min', toneRoots: Object.freeze(['E', 'G', 'B']) }),
  F6: Object.freeze({ root: 'F', chordRoot: 'F', quality: '6', toneRoots: Object.freeze(['F', 'A', 'C', 'D']) }),
  F7: Object.freeze({ root: 'F', chordRoot: 'F', quality: '7', toneRoots: Object.freeze(['F', 'A', 'C', 'D#']) }),
  Fmaj7: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'maj7', toneRoots: Object.freeze(['F', 'A', 'C', 'E']) }),
  Fsus2: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'sus2', toneRoots: Object.freeze(['F', 'G', 'C']) }),
  Fadd9: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'add9', toneRoots: Object.freeze(['F', 'A', 'C', 'G']) }),
  G7: Object.freeze({ root: 'G', chordRoot: 'G', quality: '7', toneRoots: Object.freeze(['G', 'B', 'D', 'F']) }),
  Gsus2: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'sus2', toneRoots: Object.freeze(['G', 'A', 'D']) }),
  Gsus4: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'sus4', toneRoots: Object.freeze(['G', 'C', 'D']) }),
  Gadd9: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'add9', toneRoots: Object.freeze(['G', 'B', 'D', 'A']) }),
  Am: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'min', toneRoots: Object.freeze(['A', 'C', 'E']) }),
  Am6: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm6', toneRoots: Object.freeze(['A', 'C', 'E', 'F#']) }),
  Am7: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm7', toneRoots: Object.freeze(['A', 'C', 'E', 'G']) }),
  Am9: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm9', toneRoots: Object.freeze(['A', 'C', 'E', 'G', 'B']) }),
  Asus2: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'sus2', toneRoots: Object.freeze(['A', 'B', 'E']) }),
});

function isChordRoot(root) {
  return CHORD_ROOTS.includes(root);
}

function createMajorDefinition(root) {
  const rootIndex = CHORD_ROOTS.indexOf(root);
  if (rootIndex === -1) return null;

  return {
    root,
    chordRoot: root,
    quality: 'maj',
    toneRoots: MAJOR_TRIAD_INTERVALS.map((interval) => (
      CHORD_ROOTS[(rootIndex + interval) % CHORD_ROOTS.length]
    )),
  };
}

function getChordDefinition(chordName) {
  return EXTRA_CHORD_DEFINITIONS[chordName] ?? createMajorDefinition(chordName);
}

function isChordName(chordName) {
  return Boolean(getChordDefinition(chordName));
}

function isChordSpan(spanIndex) {
  return Number.isInteger(spanIndex) && spanIndex >= 0 && spanIndex < BEATS_PER_BAR;
}

function getChordSpanStep(spanIndex) {
  if (!isChordSpan(spanIndex)) return null;
  return spanIndex * CHORD_SPAN;
}

function createChordCell(root) {
  const definition = getChordDefinition(root);
  if (!definition) return null;

  return {
    type: 'chord',
    root: definition.root,
    chordRoot: definition.chordRoot,
    quality: definition.quality,
    label: root,
    toneRoots: [...definition.toneRoots],
  };
}

function toggleChordCell(cell, root) {
  if (!isChordName(root)) return null;
  if (cell?.type === 'chord' && cell.label === root) return null;

  return createChordCell(root);
}

function createChordNoteCell(note) {
  if (!isChordRoot(note)) return null;

  return {
    type: 'note',
    note,
    label: note,
  };
}

function toggleChordNoteCell(cell, note) {
  if (!isChordRoot(note)) return null;
  if (cell?.type === 'note' && cell.note === note) return null;

  return createChordNoteCell(note);
}

function getChordToneRoots(root) {
  const definition = getChordDefinition(root);
  return definition ? [...definition.toneRoots] : [];
}

function isChordCellActive(cell, root, columnIndex = 0) {
  if (cell?.type === 'note') return cell.note === root && Number.isInteger(columnIndex);
  if (cell?.type !== 'chord' || columnIndex !== 0) return false;
  return (cell.toneRoots ?? getChordToneRoots(cell.label)).includes(root);
}

export {
  CHORD_TEMPLATES,
  CHORD_VARIANTS,
  CHORD_ROOTS,
  createChordCell,
  createChordNoteCell,
  getChordDefinition,
  getChordToneRoots,
  getChordSpanStep,
  isChordCellActive,
  isChordName,
  isChordRoot,
  isChordSpan,
  toggleChordCell,
  toggleChordNoteCell,
};
