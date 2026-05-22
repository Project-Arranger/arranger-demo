function syncEditorToTutorialSuggestedBar(state, suggestedBar, { isPlaying = false } = {}) {
  if (
    isPlaying
    || !Number.isInteger(suggestedBar)
    || state?.selectedBar === suggestedBar
  ) {
    return false;
  }

  const clip = state.getClipForTrackBar?.('drums', suggestedBar)
    ?? state.createClip?.('drums', suggestedBar);
  if (clip?.id) {
    state.selectClip?.(clip.id);
    return true;
  }

  state.setActiveTrackId?.('drums');
  state.setSelectedBar?.(suggestedBar);
  state.setSelectedClipId?.(null);
  return true;
}

export { syncEditorToTutorialSuggestedBar };
