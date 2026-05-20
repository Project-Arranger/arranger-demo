import { findClipForTrackBar } from '../store/slices/clipsSlice.js';
import { getChordBarDisplayLabel } from './chordActions.js';
import { createTrackVolumeView } from './trackVolumeViewModels.js';

function getTrackVolume(track, volumes) {
  return createTrackVolumeView(volumes?.[track.id] ?? track.volume?.value);
}

function hasClipContent(clip, matrix) {
  const bar = matrix?.[clip.trackId]?.[clip.bar];
  return Array.isArray(bar) && bar.some((cell) => cell !== null);
}

function createClipView(clip, matrix) {
  if (!clip) return null;

  const hasContent = hasClipContent(clip, matrix);
  if (clip.trackId !== 'chord') {
    return hasContent ? { ...clip, hasContent } : clip;
  }

  return {
    ...clip,
    chordLabel: getChordBarDisplayLabel(matrix, clip.bar),
    hasContent,
  };
}

function createTimelineTracks({
  barNumbers,
  clips,
  matrix,
  selectedBar,
  trackUi,
  volumes,
}) {
  return trackUi.map((track) => {
    const clipsByBar = barNumbers.map((_, barIndex) => (
      findClipForTrackBar(clips, track.id, barIndex)
    ));
    const bars = barNumbers.map((barNumber, barIndex) => {
      const clip = clipsByBar[barIndex];

      return {
        bar: barIndex,
        barNumber,
        clip: createClipView(clip, matrix),
        canAddClip: !clip,
      };
    });

    return {
      ...track,
      clip: createClipView(findClipForTrackBar(clips, track.id, selectedBar), matrix),
      bars,
      clipsByBar,
      hasClip: clipsByBar.some(Boolean),
      volume: getTrackVolume(track, volumes),
    };
  });
}

export { createClipView, createTimelineTracks };
