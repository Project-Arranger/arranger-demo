import { TUTORIAL_TARGETS } from '../../tutorial/drumsTutorialConstants.js';

const TUTORIAL_TARGET_PLACEMENTS = Object.freeze({
  [TUTORIAL_TARGETS.TOP_BAR]: 'top',
  [TUTORIAL_TARGETS.TRACK_AREA]: 'middle',
  [TUTORIAL_TARGETS.TRACK_EDITOR]: 'editor',
});

function getTutorialPlacement(targetName) {
  return TUTORIAL_TARGET_PLACEMENTS[targetName] ?? 'center';
}

function TutorialOverlay({
  canGoBack = true,
  canManualNext = true,
  displayCopy,
  isLastStep = false,
  onBack,
  onCompleteTask,
  onPrimaryAction,
  onSkip,
  showCompleteButton = false,
  step,
  targetName,
}) {
  if (!step) return null;

  const primaryLabel = showCompleteButton
    ? '完成'
    : step.id === 'opening' ? '开始创造' : '下一步';
  const placement = getTutorialPlacement(targetName);
  const primaryDisabled = showCompleteButton ? false : isLastStep || !canManualNext;
  const handlePrimaryAction = showCompleteButton ? onCompleteTask : onPrimaryAction;

  return (
    <aside className="tutorial-panel" data-placement={placement} aria-live="polite">
      <div className="tutorial-panel-body">
        <div className="tutorial-phase">{step.phase}</div>
        <h2>{step.title}</h2>
        <p>{displayCopy ?? step.copy}</p>
        {targetName ? (
          <div className="tutorial-target-note">
            正在指引：
            {' '}
            {targetName}
          </div>
        ) : null}
      </div>

      <div className="tutorial-panel-actions">
        <button
          className="tutorial-primary"
          type="button"
          onClick={handlePrimaryAction}
          disabled={primaryDisabled}
        >
          {primaryLabel}
        </button>
        <button className="tutorial-secondary" type="button" onClick={onBack} disabled={!canGoBack}>
          上一步
        </button>
        <button className="tutorial-link" type="button" onClick={onSkip}>
          跳过教程
        </button>
      </div>
    </aside>
  );
}

export { TutorialOverlay };
