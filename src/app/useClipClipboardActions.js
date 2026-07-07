import {
  useCallback,
  useState,
} from 'react';

import useMusicStore from '../store/useMusicStore.js';

function useClipClipboardActions({
  activeTrackId,
  clips,
  matrix,
  selectedBar,
  selectedClipId,
  withUndoCheckpoint,
}) {
  const [clipClipboard, setClipClipboard] = useState(null);
  const [pendingClipPaste, setPendingClipPaste] = useState(null);
  const selectedClip = selectedClipId ? clips.byId[selectedClipId] : null;
  const pasteTargetTrackId = selectedClip?.trackId ?? activeTrackId;
  const pasteTargetBar = selectedClip?.bar ?? selectedBar;
  const canCopyClip = Boolean(selectedClip);
  const canPasteClip = Boolean(
    clipClipboard
      && clipClipboard.trackId === pasteTargetTrackId
      && Array.isArray(matrix[pasteTargetTrackId]?.[pasteTargetBar]),
  );

  const clearClipClipboardState = useCallback(() => {
    setClipClipboard(null);
    setPendingClipPaste(null);
  }, []);

  const getCurrentClipPasteTarget = useCallback(() => {
    if (!clipClipboard) return null;

    const state = useMusicStore.getState();
    const targetClip = state.selectedClipId ? state.clips.byId[state.selectedClipId] : null;
    const targetTrackId = targetClip?.trackId ?? state.activeTrackId;
    const targetBar = targetClip?.bar ?? state.selectedBar;

    if (
      clipClipboard.trackId !== targetTrackId
      || !Number.isInteger(targetBar)
      || !Array.isArray(state.matrix[targetTrackId]?.[targetBar])
    ) {
      return null;
    }

    return {
      targetBar,
      targetClip,
      targetTrackId,
    };
  }, [clipClipboard]);

  const pasteClipToTarget = useCallback((target) => {
    if (!target || !clipClipboard) return null;

    let pastedClip = null;
    withUndoCheckpoint(() => {
      pastedClip = useMusicStore.getState().pasteClipClipboardSnapshot(
        clipClipboard,
        target.targetTrackId,
        target.targetBar,
      );
    });

    return pastedClip;
  }, [clipClipboard, withUndoCheckpoint]);

  const handleCopySelectedClip = useCallback(() => {
    if (!selectedClipId) return;

    const snapshot = useMusicStore.getState().createClipClipboardSnapshot(selectedClipId);
    if (!snapshot) return;

    setClipClipboard(snapshot);
    setPendingClipPaste(null);
  }, [selectedClipId]);

  const handlePasteClipRequest = useCallback(() => {
    const target = getCurrentClipPasteTarget();
    if (!target) return;

    if (target.targetClip) {
      setPendingClipPaste(target);
      return;
    }

    pasteClipToTarget(target);
  }, [getCurrentClipPasteTarget, pasteClipToTarget]);

  const cancelClipPaste = useCallback(() => {
    setPendingClipPaste(null);
  }, []);

  const confirmClipPaste = useCallback(() => {
    if (!pendingClipPaste || !clipClipboard) {
      setPendingClipPaste(null);
      return;
    }

    pasteClipToTarget(pendingClipPaste);
    setPendingClipPaste(null);
  }, [clipClipboard, pasteClipToTarget, pendingClipPaste]);

  return {
    canCopyClip,
    canPasteClip,
    cancelClipPaste,
    clearClipClipboardState,
    confirmClipPaste,
    handleCopySelectedClip,
    handlePasteClipRequest,
    pendingClipPaste,
    selectedClip,
  };
}

export {
  useClipClipboardActions,
};
