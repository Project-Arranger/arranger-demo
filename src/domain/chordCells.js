import {
  BEATS_PER_BAR,
  CHORD_SPAN,
} from './musicConstants.js';

const CHORD_ROOTS = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const CHORD_GRID_ROOTS = Object.freeze(['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']);
const CHORD_GRID_OCTAVES = Object.freeze([5, 4, 3]);
const DEFAULT_CHORD_GRID_OCTAVE = 4;
const CHORD_GRID_PITCHES = Object.freeze(
  CHORD_GRID_OCTAVES.flatMap((octave) => (
    CHORD_GRID_ROOTS.map((root) => Object.freeze({
      label: `${root}${octave}`,
      rootName: root,
      octave,
      sharp: root.includes('#'),
      root: root === 'C',
    }))
  )),
);
const MAJOR_TRIAD_INTERVALS = Object.freeze([0, 4, 7]);
const DIATONIC_CHORD_OPTIONS = Object.freeze([
  Object.freeze({ name: 'C', roman: 'I', desc: '调式中心，最稳定、最有归属感的主和弦。' }),
  Object.freeze({ name: 'Dm', roman: 'ii', desc: '柔和的下属功能，常推向 V 形成自然过渡。' }),
  Object.freeze({ name: 'Em', roman: 'iii', desc: '介于 I 与 V 之间，听感温和、略带忧郁。' }),
  Object.freeze({ name: 'F', roman: 'IV', desc: '稳定的下属功能，色彩温暖明亮。' }),
  Object.freeze({ name: 'G', roman: 'V', desc: '最强解决倾向，强力推动回到主和弦。' }),
  Object.freeze({ name: 'Am', roman: 'vi', desc: 'C 大调的关系小调，常用于忧郁段落。' }),
  Object.freeze({ name: 'Bdim', roman: 'vii°', desc: '导和弦，强烈的不稳定感，色彩独特。' }),
]);
const PASSING_CHORD_DEFAULT_OPTIONS = Object.freeze([
  Object.freeze({ name: 'C/B', desc: '常见的转位和弦，让低音线更平滑。' }),
  Object.freeze({ name: 'D7', desc: '副属和弦色彩，制造短暂的方向性张力。' }),
  Object.freeze({ name: 'Em', desc: '调内三级和弦，作为衔接更柔和。' }),
]);
const PASSING_CHORD_OPTIONS = Object.freeze({
  'C→Am': Object.freeze([
    Object.freeze({ name: 'C/B', desc: '在 C 和 Am 之间创造流畅自然的过渡效果。' }),
    Object.freeze({ name: 'E7', desc: '副属和弦手法，衔接 C 和 Am 时有较强的戏剧感。' }),
    Object.freeze({ name: 'Bø', desc: '借助 B 音创造过渡效果，半减七色彩更特别。' }),
  ]),
  'C→F': Object.freeze([
    Object.freeze({ name: 'C7', desc: 'V/IV 副属和弦，强力地把 C 解决到 F。' }),
    Object.freeze({ name: 'F/C', desc: '保留 C 在低音，让 C → F 的过渡平滑无痕。' }),
    Object.freeze({ name: 'Em', desc: '三级铺垫，柔和地引向下属和弦 F。' }),
  ]),
  'C→G': Object.freeze([
    Object.freeze({ name: 'G/B', desc: '低音 B 顺势下行到 G，让过渡更流畅。' }),
    Object.freeze({ name: 'D7', desc: 'V/V 副属和弦，强烈推动 V 级 G。' }),
    Object.freeze({ name: 'Em', desc: '三级和弦色彩柔和，自然过渡到属和弦。' }),
  ]),
  'Am→F': Object.freeze([
    Object.freeze({ name: 'Am/G', desc: '下行低音线，让 Am 到 F 的过渡更平稳。' }),
    Object.freeze({ name: 'C7', desc: '借助 C7 的属功能，转折更明显有方向感。' }),
    Object.freeze({ name: 'Em', desc: '小调三级铺垫，气氛更内敛、连贯。' }),
  ]),
  'F→G': Object.freeze([
    Object.freeze({ name: 'F/A', desc: '转位让低音从 A 顺势走到 G，过渡自然。' }),
    Object.freeze({ name: 'D7', desc: 'V/V 副属和弦，强烈引向 V 级 G。' }),
    Object.freeze({ name: 'Em', desc: '三级和弦色彩柔和，铺垫属和弦的到来。' }),
  ]),
  'G→C': Object.freeze([
    Object.freeze({ name: 'G7', desc: '加入七度色彩，形成最强的 V → I 解决倾向。' }),
    Object.freeze({ name: 'G/B', desc: '低音 B 半音解决到 C，旋律线极为流畅。' }),
    Object.freeze({ name: 'Em', desc: '三级铺垫，从 V 到 I 的过渡更柔和。' }),
  ]),
  'G→Em': Object.freeze([
    Object.freeze({ name: 'B7', desc: 'V/vi 副属和弦，强烈推动小三级 Em。' }),
    Object.freeze({ name: 'G/B', desc: '下行低音衔接 Em 的根音，过渡平滑。' }),
    Object.freeze({ name: 'D7', desc: '属七色彩，制造短暂的方向性张力。' }),
  ]),
  'Dm→F': Object.freeze([
    Object.freeze({ name: 'Dm/F', desc: '直接转位让低音平滑过渡到 F。' }),
    Object.freeze({ name: 'A7', desc: 'V/ii 推动 Dm 后，再自然引向下属功能。' }),
    Object.freeze({ name: 'C/E', desc: '上行低音线，柔和地引向 F 的稳定感。' }),
  ]),
});
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
  'C/B': Object.freeze({ root: 'C', chordRoot: 'C', quality: 'slash', toneRoots: Object.freeze(['C', 'E', 'G']) }),
  'C/E': Object.freeze({ root: 'C', chordRoot: 'C', quality: 'slash', toneRoots: Object.freeze(['C', 'E', 'G']) }),
  C7: Object.freeze({ root: 'C', chordRoot: 'C', quality: '7', toneRoots: Object.freeze(['C', 'E', 'G', 'A#']) }),
  Cmaj7: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'maj7', toneRoots: Object.freeze(['C', 'E', 'G', 'B']) }),
  Csus2: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'sus2', toneRoots: Object.freeze(['C', 'D', 'G']) }),
  Csus4: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'sus4', toneRoots: Object.freeze(['C', 'F', 'G']) }),
  Cadd9: Object.freeze({ root: 'C', chordRoot: 'C', quality: 'add9', toneRoots: Object.freeze(['C', 'E', 'G', 'D']) }),
  D7: Object.freeze({ root: 'D', chordRoot: 'D', quality: '7', toneRoots: Object.freeze(['D', 'F#', 'A', 'C']) }),
  Dm: Object.freeze({ root: 'D', chordRoot: 'Dm', quality: 'min', toneRoots: Object.freeze(['D', 'F', 'A']) }),
  'Dm/F': Object.freeze({ root: 'D', chordRoot: 'Dm', quality: 'slash', toneRoots: Object.freeze(['D', 'F', 'A']) }),
  Dm7: Object.freeze({ root: 'D', chordRoot: 'Dm', quality: 'm7', toneRoots: Object.freeze(['D', 'F', 'A', 'C']) }),
  E7: Object.freeze({ root: 'E', chordRoot: 'E', quality: '7', toneRoots: Object.freeze(['E', 'G#', 'B', 'D']) }),
  Em: Object.freeze({ root: 'E', chordRoot: 'Em', quality: 'min', toneRoots: Object.freeze(['E', 'G', 'B']) }),
  F6: Object.freeze({ root: 'F', chordRoot: 'F', quality: '6', toneRoots: Object.freeze(['F', 'A', 'C', 'D']) }),
  'F/A': Object.freeze({ root: 'F', chordRoot: 'F', quality: 'slash', toneRoots: Object.freeze(['F', 'A', 'C']) }),
  'F/C': Object.freeze({ root: 'F', chordRoot: 'F', quality: 'slash', toneRoots: Object.freeze(['F', 'A', 'C']) }),
  F7: Object.freeze({ root: 'F', chordRoot: 'F', quality: '7', toneRoots: Object.freeze(['F', 'A', 'C', 'D#']) }),
  Fmaj7: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'maj7', toneRoots: Object.freeze(['F', 'A', 'C', 'E']) }),
  Fsus2: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'sus2', toneRoots: Object.freeze(['F', 'G', 'C']) }),
  Fadd9: Object.freeze({ root: 'F', chordRoot: 'F', quality: 'add9', toneRoots: Object.freeze(['F', 'A', 'C', 'G']) }),
  'G/B': Object.freeze({ root: 'G', chordRoot: 'G', quality: 'slash', toneRoots: Object.freeze(['G', 'B', 'D']) }),
  G7: Object.freeze({ root: 'G', chordRoot: 'G', quality: '7', toneRoots: Object.freeze(['G', 'B', 'D', 'F']) }),
  Gsus2: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'sus2', toneRoots: Object.freeze(['G', 'A', 'D']) }),
  Gsus4: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'sus4', toneRoots: Object.freeze(['G', 'C', 'D']) }),
  Gadd9: Object.freeze({ root: 'G', chordRoot: 'G', quality: 'add9', toneRoots: Object.freeze(['G', 'B', 'D', 'A']) }),
  A7: Object.freeze({ root: 'A', chordRoot: 'A', quality: '7', toneRoots: Object.freeze(['A', 'C#', 'E', 'G']) }),
  Am: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'min', toneRoots: Object.freeze(['A', 'C', 'E']) }),
  'Am/G': Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'slash', toneRoots: Object.freeze(['A', 'C', 'E']) }),
  Am6: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm6', toneRoots: Object.freeze(['A', 'C', 'E', 'F#']) }),
  Am7: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm7', toneRoots: Object.freeze(['A', 'C', 'E', 'G']) }),
  Am9: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'm9', toneRoots: Object.freeze(['A', 'C', 'E', 'G', 'B']) }),
  Asus2: Object.freeze({ root: 'A', chordRoot: 'Am', quality: 'sus2', toneRoots: Object.freeze(['A', 'B', 'E']) }),
  B7: Object.freeze({ root: 'B', chordRoot: 'B', quality: '7', toneRoots: Object.freeze(['B', 'D#', 'F#', 'A']) }),
  Bdim: Object.freeze({ root: 'B', chordRoot: 'Bdim', quality: 'dim', toneRoots: Object.freeze(['B', 'D', 'F']) }),
  'Bø': Object.freeze({ root: 'B', chordRoot: 'Bdim', quality: 'half-dim7', toneRoots: Object.freeze(['B', 'D', 'F', 'A']) }),
});

function isChordRoot(root) {
  return CHORD_ROOTS.includes(root);
}

function parseChordGridPitch(note) {
  if (typeof note !== 'string') return null;

  const match = /^([A-G]#?)([0-9])$/.exec(note);
  if (!match) return null;

  const [, root, octaveText] = match;
  const octave = Number(octaveText);
  if (!isChordRoot(root) || !CHORD_GRID_OCTAVES.includes(octave)) return null;

  return { label: `${root}${octave}`, octave, root };
}

function isChordGridPitch(note) {
  return Boolean(parseChordGridPitch(note));
}

function isChordNoteLabel(note) {
  return isChordRoot(note) || isChordGridPitch(note);
}

function getChordNoteRoot(note) {
  const pitch = parseChordGridPitch(note);
  if (pitch) return pitch.root;
  return isChordRoot(note) ? note : null;
}

function getChordNoteOctave(note) {
  return parseChordGridPitch(note)?.octave ?? null;
}

function getChordNotePitch(note) {
  const root = getChordNoteRoot(note);
  if (!root) return null;

  return `${root}${getChordNoteOctave(note) ?? DEFAULT_CHORD_GRID_OCTAVE}`;
}

function doChordNotesMatch(currentNote, candidateNote) {
  if (isChordRoot(candidateNote)) return getChordNoteRoot(currentNote) === candidateNote;

  const currentPitch = getChordNotePitch(currentNote);
  const candidatePitch = getChordNotePitch(candidateNote);
  return Boolean(currentPitch && candidatePitch && currentPitch === candidatePitch);
}

function createChordTonePitches(root, toneRoots) {
  if (!toneRoots.length) return [];

  const rootIndex = CHORD_ROOTS.indexOf(root);
  if (rootIndex === -1) return [];

  let octave = DEFAULT_CHORD_GRID_OCTAVE;
  let previousToneIndex = rootIndex;

  return toneRoots.map((toneRoot) => {
    const toneIndex = CHORD_ROOTS.indexOf(toneRoot);
    if (toneIndex === -1) return null;
    if (toneIndex < previousToneIndex) octave += 1;
    previousToneIndex = toneIndex;
    return `${toneRoot}${octave}`;
  }).filter(Boolean);
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

function getChordRootName(chordName) {
  return getChordDefinition(chordName)?.chordRoot ?? null;
}

function getPassingChordOptions(fromName, toName) {
  const fromRoot = getChordRootName(fromName);
  const toRoot = getChordRootName(toName);
  const key = fromRoot && toRoot ? `${fromRoot}→${toRoot}` : null;

  return key && PASSING_CHORD_OPTIONS[key]
    ? [...PASSING_CHORD_OPTIONS[key]]
    : [...PASSING_CHORD_DEFAULT_OPTIONS];
}

function getChordVariantOptions(chordName) {
  const chordRoot = getChordRootName(chordName);
  return chordRoot && CHORD_VARIANTS[chordRoot] ? [...CHORD_VARIANTS[chordRoot]] : [];
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

  const nextCell = createChordCell(root);
  const addedNotes = getChordCellNotes(cell);
  return addedNotes.length ? { ...nextCell, addedNotes } : nextCell;
}

function normalizeChordNotes(notes) {
  if (!Array.isArray(notes)) return [];

  return notes.reduce((uniqueNotes, note) => {
    if (isChordNoteLabel(note) && !uniqueNotes.includes(note)) uniqueNotes.push(note);
    return uniqueNotes;
  }, []);
}

function createChordNotesCell(notes) {
  const normalizedNotes = normalizeChordNotes(notes);
  if (!normalizedNotes.length) return null;

  return {
    type: 'notes',
    notes: normalizedNotes,
    label: normalizedNotes.join('/'),
  };
}

function createChordNoteCell(note) {
  return createChordNotesCell([note]);
}

function getChordCellNotes(cell) {
  if (cell?.type === 'note' && isChordNoteLabel(cell.note)) return [cell.note];
  if (cell?.type === 'notes') return normalizeChordNotes(cell.notes);
  if (cell?.type === 'chord') return normalizeChordNotes(cell.addedNotes);

  return [];
}

function withChordAddedNotes(cell, notes) {
  const normalizedNotes = normalizeChordNotes(notes);
  const baseCell = { ...cell };
  delete baseCell.addedNotes;

  return normalizedNotes.length ? { ...baseCell, addedNotes: normalizedNotes } : baseCell;
}

function toggleChordNoteCell(cell, note) {
  if (!isChordNoteLabel(note)) return null;

  const currentNotes = getChordCellNotes(cell);
  const nextNotes = currentNotes.some((currentNote) => doChordNotesMatch(currentNote, note))
    ? currentNotes.filter((currentNote) => !doChordNotesMatch(currentNote, note))
    : [...currentNotes, note];

  if (cell?.type === 'chord') return withChordAddedNotes(cell, nextNotes);
  return createChordNotesCell(nextNotes);
}

function getChordToneRoots(root) {
  const definition = getChordDefinition(root);
  return definition ? [...definition.toneRoots] : [];
}

function isChordCellActive(cell, root, columnIndex = 0) {
  if (cell?.type === 'note' || cell?.type === 'notes') {
    return Number.isInteger(columnIndex)
      && getChordCellNotes(cell).some((note) => doChordNotesMatch(note, root));
  }
  if (cell?.type !== 'chord' || ![0, 1].includes(columnIndex)) return false;

  const toneRoots = cell.toneRoots ?? getChordToneRoots(cell.label);
  if (isChordGridPitch(root)) return createChordTonePitches(cell.root, toneRoots).includes(root);
  return toneRoots.includes(root);
}

function isChordAddedNoteActive(cell, root) {
  return getChordCellNotes(cell).some((note) => doChordNotesMatch(note, root));
}

export {
  CHORD_GRID_OCTAVES,
  CHORD_GRID_PITCHES,
  CHORD_GRID_ROOTS,
  DEFAULT_CHORD_GRID_OCTAVE,
  DIATONIC_CHORD_OPTIONS,
  PASSING_CHORD_DEFAULT_OPTIONS,
  PASSING_CHORD_OPTIONS,
  CHORD_TEMPLATES,
  CHORD_VARIANTS,
  CHORD_ROOTS,
  createChordCell,
  createChordNoteCell,
  createChordNotesCell,
  createChordTonePitches,
  getChordDefinition,
  getChordCellNotes,
  getChordNoteOctave,
  getChordNotePitch,
  getChordRootName,
  getChordToneRoots,
  getChordVariantOptions,
  getPassingChordOptions,
  getChordSpanStep,
  isChordAddedNoteActive,
  isChordCellActive,
  isChordGridPitch,
  isChordName,
  isChordRoot,
  isChordSpan,
  toggleChordCell,
  toggleChordNoteCell,
};
