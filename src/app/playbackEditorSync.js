function syncEditorToPlaybackBar(state, playbackBar) {
  if (!state?.isPlaying || !Number.isInteger(playbackBar) || state.selectedBar === playbackBar) {
    return false;
  }

  const clip = state.getClipForTrackBar?.(state.activeTrackId, playbackBar);
  if (clip?.id) {
    state.selectClip(clip.id);
    return true;
  }

  state.setSelectedBar(playbackBar);
  state.setSelectedClipId(null);
  return true;
}

export { syncEditorToPlaybackBar };
