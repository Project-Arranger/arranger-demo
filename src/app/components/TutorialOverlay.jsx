function TutorialOverlay({
  canGoBack = true,
  canManualNext = true,
  collapsed = false,
  displayCopy,
  isLastStep = false,
  onBack,
  onCompleteTask,
  onPrimaryAction,
  onSkip,
  showCompleteButton = false,
  step,
}) {
  if (!step) return null;

  const primaryLabel = showCompleteButton
    ? '完成'
    : step.id === 'opening' ? '开始创造' : '下一步';
  const primaryDisabled = showCompleteButton ? false : isLastStep || !canManualNext;
  const handlePrimaryAction = showCompleteButton ? onCompleteTask : onPrimaryAction;

  if (collapsed) return null;

  return (
    <aside className="tutorial-panel" aria-live="polite">
      <div className="tutorial-panel-header">
        <div className="tutorial-panel-label">教程</div>
      </div>

      <div className="tutorial-panel-body">
        <p>{displayCopy ?? step.copy}</p>
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
