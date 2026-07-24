import {
  useCallback,
  useState,
} from 'react';

import { TOTAL_BARS } from '../domain/musicConstants.js';
import useMusicStore from '../store/useMusicStore.js';
import { getTimelineSelectionClipIds } from './timelineSelection.js';

function useClipClipboardActions({
  activeTrackId,
  clips,
  matrix,
  onTimelineSelectionChange = () => {},
  selectedBar,
  selectedClipId,
  timelineSelection,
  withUndoCheckpoint,
}) {
  const [clipClipboard, setClipClipboard] = useState(null);
  const [pendingClipPaste, setPendingClipPaste] = useState(null);
  const selectedClip = selectedClipId ? clips.byId[selectedClipId] : null;
  const timelineSelectionClipIds = getTimelineSelectionClipIds(clips, timelineSelection);
  const pasteTargetTrackId = selectedClip?.trackId ?? activeTrackId;
  const pasteTargetBar = selectedClip?.bar ?? selectedBar;
  const rangeBarCount = clipClipboard?.kind === 'timeline-range'
    ? clipClipboard.sourceEndBar - clipClipboard.sourceStartBar + 1
    : 0;
  const canCopyClip = Boolean(selectedClip || timelineSelectionClipIds.length);
  const canPasteClip = clipClipboard?.kind === 'timeline-range'
    ? (
      Number.isInteger(pasteTargetBar)
      && pasteTargetBar >= 0
      && pasteTargetBar + rangeBarCount <= TOTAL_BARS
    )
    : Boolean(
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

    if (clipClipboard.kind === 'timeline-range') {
      const barCount = clipClipboard.sourceEndBar - clipClipboard.sourceStartBar + 1;
      if (
        !Number.isInteger(targetBar)
        || targetBar < 0
        || targetBar + barCount > TOTAL_BARS
      ) {
        return null;
      }

      const targetClips = clipClipboard.items
        .map((item) => state.getClipForTrackBar(item.trackId, targetBar + item.barOffset))
        .filter(Boolean);

      return {
        kind: 'timeline-range',
        targetBar,
        targetClips,
      };
    }

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

    let pasteResult = null;
    withUndoCheckpoint(() => {
      pasteResult = target.kind === 'timeline-range'
        ? useMusicStore.getState().pasteTimelineClipboardSnapshot(
          clipClipboard,
          target.targetBar,
        )
        : useMusicStore.getState().pasteClipClipboardSnapshot(
          clipClipboard,
          target.targetTrackId,
          target.targetBar,
        );
    });

    if (pasteResult && target.kind === 'timeline-range') {
      onTimelineSelectionChange({
        startBar: pasteResult.startBar,
        endBar: pasteResult.endBar,
        trackIds: pasteResult.trackIds,
      });
    }

    return pasteResult;
  }, [clipClipboard, onTimelineSelectionChange, withUndoCheckpoint]);

  const handleCopySelectedClip = useCallback(() => {
    if (timelineSelectionClipIds.length) {
      const snapshot = useMusicStore.getState().createTimelineClipboardSnapshot(
        timelineSelection,
      );
      if (!snapshot) return;

      setClipClipboard(snapshot);
      setPendingClipPaste(null);
      return;
    }

    if (!selectedClipId) return;

    const snapshot = useMusicStore.getState().createClipClipboardSnapshot(selectedClipId);
    if (!snapshot) return;

    setClipClipboard(snapshot);
    setPendingClipPaste(null);
  }, [selectedClipId, timelineSelection, timelineSelectionClipIds.length]);

  const handlePasteClipRequest = useCallback(() => {
    const target = getCurrentClipPasteTarget();
    if (!target) return;

    if (target.targetClip || target.targetClips?.length) {
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
