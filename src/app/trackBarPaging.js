function getSortedTrackClipBars(clips, trackId) {
  const bars = (clips?.ids ?? [])
    .map((id) => clips.byId?.[id])
    .filter((clip) => clip?.trackId === trackId && Number.isInteger(clip.bar))
    .map((clip) => clip.bar);

  return [...new Set(bars)].sort((a, b) => a - b);
}

function canPageTrackClipBars(clips, trackId) {
  return getSortedTrackClipBars(clips, trackId).length > 1;
}

function getAdjacentTrackClipBar(clips, trackId, selectedBar, direction) {
  const bars = getSortedTrackClipBars(clips, trackId);
  if (bars.length < 2) return null;

  const currentIndex = bars.indexOf(selectedBar);
  if (currentIndex === -1) return null;

  const offset = direction === 'previous' ? -1 : 1;
  const nextIndex = (currentIndex + offset + bars.length) % bars.length;
  return bars[nextIndex];
}

export {
  canPageTrackClipBars,
  getAdjacentTrackClipBar,
  getSortedTrackClipBars,
};
