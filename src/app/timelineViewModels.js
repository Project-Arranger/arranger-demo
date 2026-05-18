import { findClipForTrackBar } from '../store/slices/clipsSlice.js';

function createTimelineTracks({
  barNumbers,
  clips,
  selectedBar,
  trackUi,
}) {
  return trackUi.map((track) => {
    const clipsByBar = barNumbers.map((_, barIndex) => (
      findClipForTrackBar(clips, track.id, barIndex)
    ));

    return {
      ...track,
      clip: findClipForTrackBar(clips, track.id, selectedBar),
      clipsByBar,
      hasClip: clipsByBar.some(Boolean),
    };
  });
}

export { createTimelineTracks };
