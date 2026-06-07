function getSortedDrumsClipBars(clips) {
  const bars = (clips?.ids ?? [])
    .map((id) => clips.byId?.[id])
    .filter((clip) => clip?.trackId === 'drums' && Number.isInteger(clip.bar))
    .map((clip) => clip.bar);

  return [...new Set(bars)].sort((a, b) => a - b);
}

function canPageDrumsClipBars(clips) {
  return getSortedDrumsClipBars(clips).length > 1;
}

function getAdjacentDrumsClipBar(clips, selectedBar, direction) {
  const bars = getSortedDrumsClipBars(clips);
  if (bars.length < 2) return null;

  const currentIndex = bars.indexOf(selectedBar);
  if (currentIndex === -1) return null;

  const offset = direction === 'previous' ? -1 : 1;
  const nextIndex = (currentIndex + offset + bars.length) % bars.length;
  return bars[nextIndex];
}

export {
  canPageDrumsClipBars,
  getAdjacentDrumsClipBar,
};
