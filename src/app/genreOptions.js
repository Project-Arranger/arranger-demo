const CURRENT_GENRE_ID = 'pop';
const ASSET_BASE_URL = (import.meta.env?.BASE_URL ?? '/').replace(/\/?$/, '/');
const genreArt = (filename) => `${ASSET_BASE_URL}assets/genre-art/${filename}`;

const GENRE_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'pop',
    label: '流行 Pop',
    shortLabel: 'POP',
    enabled: true,
    tone: 'var(--c-chord)',
    ink: 'var(--c-chord-ink)',
    neon: '#53c7ff',
    artImage: genreArt('pop-neon.png'),
    note: 'Doo-wop / I-vi-IV-V',
  }),
  Object.freeze({
    id: 'hip-hop',
    label: '嘻哈 Hip-Hop',
    shortLabel: 'HIP-HOP',
    enabled: false,
    tone: 'var(--c-bass)',
    ink: 'var(--c-bass-ink)',
    neon: '#ff50f0',
    artImage: genreArt('hip-hop-neon.png'),
    note: 'Locked',
  }),
  Object.freeze({
    id: 'r-and-b',
    label: 'R&B',
    shortLabel: 'R&B',
    enabled: false,
    tone: 'var(--c-melody)',
    ink: 'var(--c-melody-ink)',
    neon: '#ff9a45',
    artImage: genreArt('rnb-neon.png'),
    note: 'Locked',
  }),
  Object.freeze({
    id: 'electronic-edm',
    label: '电子 Electronic / EDM',
    shortLabel: 'ELECTRONIC',
    enabled: false,
    tone: 'var(--c-drums)',
    ink: 'var(--c-drums-ink)',
    neon: '#5cff76',
    artImage: genreArt('electronic-neon.png'),
    note: 'Locked',
  }),
  Object.freeze({
    id: 'rock',
    label: '摇滚 Rock',
    shortLabel: 'ROCK',
    enabled: false,
    tone: 'var(--c-vocal)',
    ink: 'var(--c-vocal-ink)',
    neon: '#fff15b',
    artImage: genreArt('rock-neon.png'),
    note: 'Locked',
  }),
  Object.freeze({
    id: 'jazz',
    label: '爵士 Jazz',
    shortLabel: 'JAZZ',
    enabled: false,
    tone: 'var(--c-bass)',
    ink: 'var(--c-bass-ink)',
    neon: '#63f1ff',
    artImage: genreArt('jazz-neon.png'),
    note: 'Locked',
  }),
]);

export {
  CURRENT_GENRE_ID,
  GENRE_OPTIONS,
};
