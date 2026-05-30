import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

function getMaxPitchScroll(viewport) {
  return viewport ? Math.max(0, viewport.scrollHeight - viewport.clientHeight) : 0;
}

function getOctavePitchScrollStep(viewport) {
  const maxScroll = getMaxPitchScroll(viewport);
  return maxScroll > 0 ? maxScroll / 2 : 0;
}

function usePitchScrollSync(options = {}) {
  const {
    initializeToMiddleOctave = true,
    onPitchInteraction = () => {},
  } = options;
  const scalePitchViewportRef = useRef(null);
  const beatCellsViewportRefs = useRef([]);
  const pitchScrollTopRef = useRef(0);
  const syncPitchScrollGuardRef = useRef(false);
  const syncPitchScrollFrameRef = useRef(null);
  const syncPitchScrollSourceRef = useRef(null);
  const hasInitializedPitchScrollRef = useRef(false);
  const [pitchScrollTop, setPitchScrollTop] = useState(0);
  const [pitchMaxScroll, setPitchMaxScroll] = useState(0);

  const setBeatCellsViewportRef = useCallback((spanIndex, viewport) => {
    beatCellsViewportRefs.current[spanIndex] = viewport;
    if (viewport) viewport.scrollTop = pitchScrollTopRef.current;
  }, []);

  const syncPitchScroll = useCallback((nextScrollTop, sourceViewport = null) => {
    const scaleViewport = scalePitchViewportRef.current;
    const fallbackViewport = beatCellsViewportRefs.current.find(Boolean);
    const scrollViewport = scaleViewport ?? fallbackViewport;
    const maxScroll = getMaxPitchScroll(scrollViewport);
    const clampedScrollTop = Math.max(0, Math.min(maxScroll, nextScrollTop));
    const viewports = [scaleViewport, ...beatCellsViewportRefs.current].filter(Boolean);

    setPitchMaxScroll((currentMaxScroll) => (
      Math.abs(currentMaxScroll - maxScroll) > 0.5 ? maxScroll : currentMaxScroll
    ));
    pitchScrollTopRef.current = clampedScrollTop;
    syncPitchScrollGuardRef.current = true;
    syncPitchScrollSourceRef.current = sourceViewport;
    viewports.forEach((viewport) => {
      if (Math.abs(viewport.scrollTop - clampedScrollTop) > 0.5) {
        viewport.scrollTop = clampedScrollTop;
      }
    });

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      if (syncPitchScrollFrameRef.current) {
        window.cancelAnimationFrame(syncPitchScrollFrameRef.current);
      }
      syncPitchScrollFrameRef.current = window.requestAnimationFrame(() => {
        syncPitchScrollGuardRef.current = false;
        syncPitchScrollSourceRef.current = null;
        syncPitchScrollFrameRef.current = null;
      });
    } else {
      syncPitchScrollGuardRef.current = false;
      syncPitchScrollSourceRef.current = null;
    }

    setPitchScrollTop((currentScrollTop) => (
      Math.abs(currentScrollTop - clampedScrollTop) > 0.5 ? clampedScrollTop : currentScrollTop
    ));
  }, []);

  const handlePitchViewportScroll = useCallback((event) => {
    if (
      syncPitchScrollGuardRef.current
      && syncPitchScrollSourceRef.current !== event.currentTarget
    ) {
      return;
    }
    syncPitchScroll(event.currentTarget.scrollTop, event.currentTarget);
    onPitchInteraction();
  }, [onPitchInteraction, syncPitchScroll]);

  const handlePitchWheel = useCallback((event) => {
    if (!event.deltaY) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    event.preventDefault();
    onPitchInteraction();
    syncPitchScroll(pitchScrollTopRef.current + event.deltaY);
  }, [onPitchInteraction, syncPitchScroll]);

  const scrollPitchByOctave = useCallback((direction) => {
    const scrollViewport = scalePitchViewportRef.current ?? beatCellsViewportRefs.current.find(Boolean);
    const octaveStep = getOctavePitchScrollStep(scrollViewport);
    if (!octaveStep) return;

    onPitchInteraction();
    syncPitchScroll(pitchScrollTopRef.current + direction * octaveStep);
  }, [onPitchInteraction, syncPitchScroll]);

  const canScrollPitchUp = pitchScrollTop > 1;
  const canScrollPitchDown = pitchMaxScroll - pitchScrollTop > 1;

  useEffect(() => {
    if (!initializeToMiddleOctave || hasInitializedPitchScrollRef.current) return;

    const scaleViewport = scalePitchViewportRef.current;
    if (!scaleViewport) return;

    hasInitializedPitchScrollRef.current = true;
    syncPitchScroll(getOctavePitchScrollStep(scaleViewport));
  }, [initializeToMiddleOctave, syncPitchScroll]);

  useEffect(() => () => {
    if (
      syncPitchScrollFrameRef.current
      && typeof window !== 'undefined'
      && window.cancelAnimationFrame
    ) {
      window.cancelAnimationFrame(syncPitchScrollFrameRef.current);
    }
  }, []);

  return {
    beatCellsViewportRefs,
    canScrollPitchDown,
    canScrollPitchUp,
    handlePitchViewportScroll,
    handlePitchWheel,
    pitchMaxScroll,
    pitchScrollTop,
    pitchScrollTopRef,
    scalePitchViewportRef,
    scrollPitchByOctave,
    setBeatCellsViewportRef,
    syncPitchScroll,
  };
}

export {
  getMaxPitchScroll,
  getOctavePitchScrollStep,
  usePitchScrollSync,
};
