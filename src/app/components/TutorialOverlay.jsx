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
  isLastStep = false,
  onBack,
  onPrimaryAction,
  onSkip,
  step,
  targetName,
}) {
  if (!step) return null;

  const primaryLabel = step.id === 'opening' ? '开始创造' : '下一步';
  const placement = getTutorialPlacement(targetName);

  return (
    <aside className="tutorial-panel" data-placement={placement} aria-live="polite">
      <div className="tutorial-panel-body">
        <div className="tutorial-phase">{step.phase}</div>
        <h2>{step.title}</h2>
        <p>{step.copy}</p>
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
          onClick={onPrimaryAction}
          disabled={isLastStep}
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
