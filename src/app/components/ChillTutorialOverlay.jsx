import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getContextualTutorialPosition } from '../../tutorial/contextualTutorialPosition.js';
import { CHILL_TUTORIAL_RUN_STATES } from '../../tutorial/chillTutorialRuntime.js';
import { renderIcon } from './icons.js';

function createRectSnapshot(rect) {
  if (!rect) return null;
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  };
}

function ChillTutorialOverlay({
  alreadyApplied = false,
  expanded = false,
  onBack = () => {},
  onExit = () => {},
  onPause = () => {},
  onPrimary = () => {},
  onToggleExpanded = () => {},
  runState = CHILL_TUTORIAL_RUN_STATES.IDLE,
  step,
  stepIndex = 0,
  stepCount = 1,
}) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const updatePosition = useCallback(() => {
    const target = document.querySelector(step?.anchorSelector);
    const card = cardRef.current;
    if (!target || !card) {
      setTargetMissing(true);
      setPosition({
        left: Math.max(12, (window.innerWidth - 360) / 2),
        placement: 'safe',
        top: Math.max(88, window.innerHeight * 0.2),
      });
      return;
    }

    setTargetMissing(false);
    const nextPosition = getContextualTutorialPosition({
      cardRect: createRectSnapshot(card.getBoundingClientRect()),
      placements: step.preferredPlacements,
      targetRect: createRectSnapshot(target.getBoundingClientRect()),
      viewport: {
        height: window.innerHeight,
        width: window.innerWidth,
      },
    });
    setPosition(nextPosition);
  }, [step]);

  useEffect(() => {
    const target = document.querySelector(step?.anchorSelector);
    target?.classList.add('chill-tutorial-target');
    target?.setAttribute('data-chill-tutorial-target', 'true');

    const resizeObserver = new ResizeObserver(updatePosition);
    if (target) resizeObserver.observe(target);
    if (cardRef.current) resizeObserver.observe(cardRef.current);
    const mutationObserver = new MutationObserver(updatePosition);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    const animationFrameId = window.requestAnimationFrame(updatePosition);
    return () => {
      target?.classList.remove('chill-tutorial-target');
      target?.removeAttribute('data-chill-tutorial-target');
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step, updatePosition]);

  if (!step) return null;
  const previewing = runState === CHILL_TUTORIAL_RUN_STATES.PREVIEWING;
  const completed = runState === CHILL_TUTORIAL_RUN_STATES.COMPLETED;
  const primaryLabel = previewing
    ? '正在试听…'
    : completed
      ? '听完了 ✓'
      : alreadyApplied && !step.explicit
        ? '重新试听并继续'
        : step.primaryLabel;

  return (
    <section
      className={[
        'chill-coachmark',
        expanded ? 'expanded' : '',
        previewing ? 'previewing' : '',
        completed ? 'completed' : '',
        targetMissing ? 'target-missing' : '',
      ].filter(Boolean).join(' ')}
      data-placement={position?.placement ?? 'safe'}
      ref={cardRef}
      style={position ? {
        left: `${position.left}px`,
        top: `${position.top}px`,
      } : undefined}
      aria-live="polite"
    >
      <div className="chill-coachmark-heading">
        <div>
          <span className="chill-coachmark-stage">
            {step.stageLabel}
            {' · '}
            {step.trackId ? step.trackId.toUpperCase() : 'PLAYBACK'}
          </span>
          <h2>
            {previewing
              ? `正在试听：${step.title}`
              : completed ? '听完了 ✓' : step.title}
          </h2>
        </div>
        <button
          className="chill-coachmark-icon"
          type="button"
          aria-label="退出教程"
          title="退出教程"
          onClick={onExit}
        >
          {renderIcon(X)}
        </button>
      </div>

      <p className="chill-coachmark-copy">
        {targetMissing
          ? '正在同步到这一步需要的轨道与编辑位置，请稍候。'
          : step.detail}
      </p>
      {!targetMissing && step.actionSummary ? (
        <div className="chill-coachmark-technical">
          <span>编曲动作</span>
          <p>{step.actionSummary}</p>
        </div>
      ) : null}
      {expanded ? (
        <p className="chill-coachmark-detail">
          为什么这样编：鼓负责节奏、和弦负责气氛、低音负责方向、旋律负责记忆点，
          再用留白让整段音乐保持松弛。
        </p>
      ) : null}

      <div className="chill-coachmark-progress">
        <span>进度</span>
        <div className="chill-coachmark-progress-track" aria-hidden="true">
          <span style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }} />
        </div>
        <strong className="mono">{stepIndex + 1}/{stepCount}</strong>
      </div>

      <div className="chill-coachmark-actions">
        <button
          className="chill-coachmark-primary"
          type="button"
          disabled={targetMissing || previewing || completed}
          onClick={onPrimary}
        >
          {primaryLabel}
          {renderIcon(ChevronRight)}
        </button>
        <div className="chill-coachmark-tools">
          <button type="button" onClick={onBack} disabled={stepIndex === 0}>
            {renderIcon(ChevronLeft)}
            上一步
          </button>
          <button type="button" onClick={onToggleExpanded}>
            {renderIcon(expanded ? Minimize2 : Maximize2)}
            {expanded ? '收起说明' : '展开说明'}
          </button>
          <button type="button" onClick={onPause}>
            {renderIcon(Pause)}
            暂停教程
          </button>
        </div>
      </div>
    </section>
  );
}

export { ChillTutorialOverlay };
