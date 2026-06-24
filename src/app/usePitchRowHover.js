import { useCallback, useRef } from 'react';

const ROW_HOVER_CLASS = 'row-hovered';

function escapeCssValue(value) {
  const text = String(value);
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(text);
  }
  return text.replace(/["\\]/g, '\\$&');
}

function getPitchRowFromTarget(target) {
  const rowTarget = target?.closest?.('[data-row]');
  return rowTarget?.getAttribute?.('data-row') ?? null;
}

function setPitchRowClass(host, row, hovered) {
  if (!host || row == null) return;
  host
    .querySelectorAll(`[data-row="${escapeCssValue(row)}"]`)
    .forEach((element) => {
      element.classList.toggle(ROW_HOVER_CLASS, hovered);
    });
}

function containsTarget(host, target) {
  if (!host || !target || typeof host.contains !== 'function') return false;
  try {
    return host.contains(target);
  } catch {
    return false;
  }
}

export function usePitchRowHover() {
  const pitchRowHoverRef = useRef(null);
  const activePitchRowRef = useRef(null);

  const clearPitchRowHover = useCallback(() => {
    const host = pitchRowHoverRef.current;
    if (activePitchRowRef.current == null) return;
    setPitchRowClass(host, activePitchRowRef.current, false);
    activePitchRowRef.current = null;
  }, []);

  const setPitchRowHover = useCallback((row) => {
    const host = pitchRowHoverRef.current;
    if (!host || row == null) {
      clearPitchRowHover();
      return;
    }
    if (activePitchRowRef.current === row) return;

    setPitchRowClass(host, activePitchRowRef.current, false);
    setPitchRowClass(host, row, true);
    activePitchRowRef.current = row;
  }, [clearPitchRowHover]);

  const handlePitchRowPointerOver = useCallback((event) => {
    setPitchRowHover(getPitchRowFromTarget(event.target));
  }, [setPitchRowHover]);

  const handlePitchRowPointerOut = useCallback((event) => {
    const host = pitchRowHoverRef.current;
    const relatedTarget = event.relatedTarget;

    if (containsTarget(host, relatedTarget)) {
      setPitchRowHover(getPitchRowFromTarget(relatedTarget));
      return;
    }

    clearPitchRowHover();
  }, [clearPitchRowHover, setPitchRowHover]);

  return {
    handlePitchRowPointerOut,
    handlePitchRowPointerOver,
    pitchRowHoverRef,
  };
}
