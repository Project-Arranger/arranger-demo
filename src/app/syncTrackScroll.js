function syncScrollTop(source, target, syncState) {
  if (syncState.current || !source || !target) return;
  if (target.scrollTop === source.scrollTop) return;

  syncState.current = true;
  target.scrollTop = source.scrollTop;
  syncState.current = false;
}

function syncTrackScrollContainers(tracksList, timeline) {
  if (!tracksList || !timeline) return () => {};

  const syncState = { current: false };
  const syncFromTracks = () => syncScrollTop(tracksList, timeline, syncState);
  const syncFromTimeline = () => syncScrollTop(timeline, tracksList, syncState);

  tracksList.addEventListener('scroll', syncFromTracks, { passive: true });
  timeline.addEventListener('scroll', syncFromTimeline, { passive: true });

  return () => {
    tracksList.removeEventListener('scroll', syncFromTracks);
    timeline.removeEventListener('scroll', syncFromTimeline);
  };
}

export { syncTrackScrollContainers };
