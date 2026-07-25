import { getDrumsCellInstruments } from '../domain/drumsCells.js';

function hasPlayableChordCell(cell) {
  if (!cell || cell.type === 'chord-source') return false;

  if (cell.type === 'notes') {
    return Array.isArray(cell.notes) && cell.notes.length > 0;
  }
  if (cell.type === 'note') {
    return Boolean(cell.note || cell.label);
  }
  if (cell.type === 'chord') {
    return Boolean(
      cell.root
      || cell.chordRoot
      || cell.label
      || cell.sourceChordLabel,
    );
  }

  return !cell.type && Boolean(cell.root || cell.label);
}

function hasTrackBarContent(matrix, trackId, barIndex) {
  const bar = matrix?.[trackId]?.[barIndex];
  if (!Array.isArray(bar)) return false;

  switch (trackId) {
    case 'drums':
      return bar.some((cell) => getDrumsCellInstruments(cell).length > 0);
    case 'chord':
      return bar.some(hasPlayableChordCell);
    case 'bass':
    case 'melody':
      return bar.some((cell) => Boolean(cell?.note));
    default:
      return bar.some((cell) => cell !== null);
  }
}

function hasClipContent(matrix, clip) {
  return Boolean(
    clip
    && Number.isInteger(clip.bar)
    && hasTrackBarContent(matrix, clip.trackId, clip.bar),
  );
}

function getExistingTrackClips(clips, trackId) {
  return (clips?.ids ?? [])
    .map((id) => clips.byId?.[id])
    .filter((clip) => clip?.trackId === trackId && Number.isInteger(clip.bar));
}

function hasExistingTrackClipContent(matrix, clips, trackId) {
  return getExistingTrackClips(clips, trackId)
    .some((clip) => hasClipContent(matrix, clip));
}

export {
  getExistingTrackClips,
  hasClipContent,
  hasExistingTrackClipContent,
  hasPlayableChordCell,
  hasTrackBarContent,
};
