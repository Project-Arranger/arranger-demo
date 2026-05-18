import { findClipForTrackBar } from '../store/slices/clipsSlice.js';
import { createTrackVolumeView } from './trackVolumeViewModels.js';

function getTrackVolume(track, volumes) {
  return createTrackVolumeView(volumes?.[track.id] ?? track.volume?.value);
}

function createTimelineTracks({
  barNumbers,
  clips,
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
      volume: getTrackVolume(track, volumes),
    };
  });
}

export { createTimelineTracks };
