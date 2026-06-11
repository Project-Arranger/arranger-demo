function renderTutorialCopy(copy) {
  const [titleBlock = '', ...contentBlocks] = String(copy ?? '').split('\n\n');
  const titleLines = titleBlock.split('\n').filter(Boolean);
  const contentLines = contentBlocks.flatMap((block) => block.split('\n')).filter(Boolean);
  const [subtitleLine = '', ...bodyLines] = contentLines;

  return (
    <div className="tutorial-copy">
      <div className="tutorial-copy-title-group">
        {titleLines.map((line, lineIndex) => (
          <span className="tutorial-copy-title" key={`copy-title-${lineIndex}`}>
            {line}
          </span>
        ))}
      </div>
      {subtitleLine ? (
        <div className="tutorial-copy-subtitle">
          {subtitleLine}
        </div>
      ) : null}
      {bodyLines.length ? (
        <div className="tutorial-copy-body-group">
          {bodyLines.map((line, lineIndex) => (
            <span className="tutorial-copy-body" key={`copy-body-${lineIndex}`}>
              {line}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TutorialOverlay({
  canGoBack = true,
  canManualNext = true,
  collapsed = false,
  displayCopy,
  onBack,
  onCompleteTask,
  onPrimaryAction,
  onSkip,
  primaryDisabled = false,
  primaryLabel,
  showCompleteButton = false,
  step,
}) {
  if (!step) return null;

  const resolvedPrimaryLabel = primaryLabel ?? step.primaryLabel ?? '下一步';
  const resolvedPrimaryDisabled = primaryDisabled || (!showCompleteButton && !canManualNext);
  const handlePrimaryAction = showCompleteButton ? onCompleteTask : onPrimaryAction;

  if (collapsed) return null;

  return (
    <aside className="tutorial-panel" aria-live="polite">
      <div className="tutorial-panel-header">
        <div className="tutorial-panel-label">教程</div>
      </div>

      <div className="tutorial-panel-body">
        {renderTutorialCopy(displayCopy ?? step.copy)}
      </div>

      <div className="tutorial-panel-actions">
        <button
          className="tutorial-primary"
          type="button"
          onClick={handlePrimaryAction}
          disabled={resolvedPrimaryDisabled}
        >
          {resolvedPrimaryLabel}
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
