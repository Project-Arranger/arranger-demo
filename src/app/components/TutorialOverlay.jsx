function TutorialOverlay({
  canGoBack = true,
  isLastStep = false,
  onBack,
  onPrimaryAction,
  onSkip,
  step,
}) {
  if (!step) return null;

  const primaryLabel = step.id === 'opening' ? '开始创造' : '下一步';

  return (
    <aside className="tutorial-panel" aria-live="polite">
      <div className="tutorial-panel-body">
        <div className="tutorial-phase">{step.phase}</div>
        <h2>{step.title}</h2>
        <p>{step.copy}</p>
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

