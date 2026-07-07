import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const EDITOR_RESIZE_MIN_HEIGHT = 180;
const EDITOR_RESIZE_WORKSPACE_MIN_HEIGHT = 180;
const EDITOR_RESIZE_KEYBOARD_STEP = 16;
const EDITOR_RESIZE_DEFAULT_HEIGHT = 300;

function getViewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

function getTopbarHeight() {
  return document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
}

function getEditorResizeBounds() {
  const maxHeight = Math.max(
    EDITOR_RESIZE_MIN_HEIGHT,
    getViewportHeight() - getTopbarHeight() - EDITOR_RESIZE_WORKSPACE_MIN_HEIGHT,
  );

  return {
    maxHeight,
    minHeight: EDITOR_RESIZE_MIN_HEIGHT,
  };
}

function clampEditorHeight(height, bounds = getEditorResizeBounds()) {
  return Math.round(Math.max(bounds.minHeight, Math.min(bounds.maxHeight, height)));
}

function getCurrentEditorHeight(fallbackHeight = EDITOR_RESIZE_DEFAULT_HEIGHT) {
  return Math.round(
    document.querySelector('.track-editor-target')?.getBoundingClientRect().height
      ?? fallbackHeight,
  );
}

function useEditorResize({
  activeTrackId,
  selectedClipId,
} = {}) {
  const [editorHeightPx, setEditorHeightPx] = useState(null);
  const [editorResizeMaxHeight, setEditorResizeMaxHeight] = useState(EDITOR_RESIZE_DEFAULT_HEIGHT);
  const [currentEditorResizeValue, setCurrentEditorResizeValue] = useState(EDITOR_RESIZE_DEFAULT_HEIGHT);
  const [isEditorResizing, setIsEditorResizing] = useState(false);
  const editorResizeDragRef = useRef(null);
  const editorResizeCleanupRef = useRef(null);

  const commitEditorHeight = useCallback((height) => {
    const bounds = getEditorResizeBounds();
    const nextHeight = clampEditorHeight(height, bounds);

    setEditorResizeMaxHeight(bounds.maxHeight);
    setCurrentEditorResizeValue(nextHeight);
    setEditorHeightPx(nextHeight);
    return nextHeight;
  }, []);

  const readEditorHeight = useCallback(() => (
    editorHeightPx ?? getCurrentEditorHeight(currentEditorResizeValue)
  ), [currentEditorResizeValue, editorHeightPx]);

  useEffect(() => {
    const syncEditorResizeMetrics = () => {
      const bounds = getEditorResizeBounds();
      setEditorResizeMaxHeight(bounds.maxHeight);

      if (editorHeightPx === null) {
        setCurrentEditorResizeValue(clampEditorHeight(getCurrentEditorHeight(), bounds));
        return;
      }

      const nextHeight = clampEditorHeight(editorHeightPx, bounds);
      setCurrentEditorResizeValue(nextHeight);
      if (nextHeight !== editorHeightPx) setEditorHeightPx(nextHeight);
    };

    syncEditorResizeMetrics();
    window.addEventListener('resize', syncEditorResizeMetrics);
    return () => window.removeEventListener('resize', syncEditorResizeMetrics);
  }, [activeTrackId, editorHeightPx, selectedClipId]);

  useEffect(() => () => {
    editorResizeCleanupRef.current?.();
  }, []);

  const handleEditorResizePointerDown = useCallback((event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    editorResizeCleanupRef.current?.();

    const resizeHandle = event.currentTarget;
    const dragSession = {
      startHeight: readEditorHeight(),
      startY: event.clientY,
    };
    editorResizeDragRef.current = dragSession;
    setIsEditorResizing(true);

    const handlePointerMove = (moveEvent) => {
      commitEditorHeight(dragSession.startHeight + dragSession.startY - moveEvent.clientY);
    };

    const handlePointerUp = () => {
      resizeHandle.releasePointerCapture?.(event.pointerId);
      editorResizeDragRef.current = null;
      editorResizeCleanupRef.current?.();
      editorResizeCleanupRef.current = null;
      setIsEditorResizing(false);
    };

    editorResizeCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [commitEditorHeight, readEditorHeight]);

  const handleEditorResizeKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        commitEditorHeight(readEditorHeight() + EDITOR_RESIZE_KEYBOARD_STEP);
        break;
      case 'ArrowDown':
        event.preventDefault();
        commitEditorHeight(readEditorHeight() - EDITOR_RESIZE_KEYBOARD_STEP);
        break;
      case 'Home':
        event.preventDefault();
        commitEditorHeight(EDITOR_RESIZE_MIN_HEIGHT);
        break;
      case 'End':
        event.preventDefault();
        commitEditorHeight(getEditorResizeBounds().maxHeight);
        break;
      default:
        break;
    }
  }, [commitEditorHeight, readEditorHeight]);

  return {
    currentEditorResizeValue,
    editorHeightPx,
    editorResizeMaxHeight,
    handleEditorResizeKeyDown,
    handleEditorResizePointerDown,
    isEditorResizing,
  };
}

export {
  EDITOR_RESIZE_MIN_HEIGHT,
  useEditorResize,
};
