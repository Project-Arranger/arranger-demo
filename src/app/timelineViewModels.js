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
    const bars = barNumbers.map((barNumber, barIndex) => {
      const clip = clipsByBar[barIndex];

      return {
        bar: barIndex,
        barNumber,
        clip,
        canAddClip: !clip,
      };
    });

    return {
      ...track,
      clip: findClipForTrackBar(clips, track.id, selectedBar),
      bars,
      clipsByBar,
      hasClip: clipsByBar.some(Boolean),
    };
  });
}

export { createTimelineTracks };
