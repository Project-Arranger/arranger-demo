const CURRENT_GENRE_ID = 'pop';

const GENRE_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'pop',
    label: '流行 Pop',
    enabled: true,
    tone: 'var(--c-chord)',
    ink: 'var(--c-chord-ink)',
    note: 'Doo-wop / I-vi-IV-V',
  }),
  Object.freeze({
    id: 'hip-hop',
    label: '嘻哈 Hip-Hop',
    enabled: false,
    tone: 'var(--c-bass)',
    ink: 'var(--c-bass-ink)',
    note: 'Locked',
  }),
  Object.freeze({
    id: 'r-and-b',
    label: 'R&B',
    enabled: false,
    tone: 'var(--c-melody)',
    ink: 'var(--c-melody-ink)',
    note: 'Locked',
  }),
  Object.freeze({
    id: 'electronic-edm',
    label: '电子 Electronic / EDM',
    enabled: false,
    tone: 'var(--c-drums)',
    ink: 'var(--c-drums-ink)',
    note: 'Locked',
  }),
  Object.freeze({
    id: 'rock',
    label: '摇滚 Rock',
    enabled: false,
    tone: 'var(--c-vocal)',
    ink: 'var(--c-vocal-ink)',
    note: 'Locked',
  }),
]);

export {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
};
