import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Square } from 'lucide-react';
import {
  CHORD_TEMPLATES,
  getChordToneRoots,
  getChordVariantOptions,
  getDoowopPassingTargetChord,
  getPassingChordOptions,
} from '../../domain/chordCells.js';
import {
  CHORD_GROOVE_TEMPLATES,
  CUSTOM_CHORD_GROOVE_ID,
  PASSING_CHORD_STEP_INDEX,
  getAppliedChordProgressionTemplateId,
  getChordRhythmSteps,
  getChordRhythmStepLabel,
  getChordRhythmStepSourceLabel,
  getChordSelectedGrooveTemplateId,
  getSourceChordLabel,
} from '../chordGrooveActions.js';
import { getExistingChordClipBars } from '../chordActions.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { EditorTrackIdentity } from './EditorTrackIdentity.jsx';
import { renderIcon } from './icons.js';
import { TrackBarPager } from './TrackBarPager.jsx';

const TEMPLATE_PAGE_SIZE = 3;
const STEPS_PER_BAR = 16;
const STEPS_PER_BEAT = 4;
const DEFAULT_TEMPLATE_ID = 'doowop';
const DEFAULT_GROOVE_TEMPLATE_ID = 'block-basic';
const WORKSPACE_BUTTON_CONTROL = 'chord-template-workspace-button';
const APPLY_BAR_CONTROL = 'chord-template-apply-current';
const APPLY_GLOBAL_CONTROL = 'chord-template-apply-global';
const ICON_PLAY_URL = `${import.meta.env.BASE_URL}assets/skeuo/icon-play.svg`;
const ICON_CLOSE_URL = `${import.meta.env.BASE_URL}assets/skeuo/icon-x.svg`;
const HARMONY_POPOVER_MARGIN = 16;
const HARMONY_POPOVER_GAP = 12;
const HARMONY_POPOVER_WIDTH = 940;
const HARMONY_POPOVER_ESTIMATED_HEIGHT = 490;

function isTutorialControlAllowed(role) {
  return role === 'target' || role === 'allowed';
}

function getNextChordClipBar(clips, selectedBar) {
  const bars = getExistingChordClipBars(clips);
  if (bars.length < 2) return null;
  const selectedIndex = bars.indexOf(selectedBar);
  if (selectedIndex === -1) return null;
  return bars[(selectedIndex + 1) % bars.length] ?? null;
}

function getGrooveStatusLabel(grooveTemplateId) {
  if (grooveTemplateId === CUSTOM_CHORD_GROOVE_ID) return '自定义律动';
  return CHORD_GROOVE_TEMPLATES.find((template) => template.id === grooveTemplateId)?.name
    ?? '自定义律动';
}

function renderMiniGroove(template) {
  return Array.from({ length: STEPS_PER_BAR / STEPS_PER_BEAT }, (_, beat) => (
    <span className="chord-template-mini-beat-group" key={`${template.id}-mini-beat-${beat}`}>
      {Array.from({ length: STEPS_PER_BEAT }, (__, beatStep) => {
        const step = beat * STEPS_PER_BEAT + beatStep;
        return (
          <span
            className={template.steps.includes(step) ? 'on' : ''}
            key={`${template.id}-mini-step-${step}`}
          />
        );
      })}
    </span>
  ));
}

function getHarmonyPopoverPosition(anchorRect) {
  if (!anchorRect || typeof window === 'undefined') {
    return { arrowX: 32, left: HARMONY_POPOVER_MARGIN, side: 'below', top: HARMONY_POPOVER_MARGIN };
  }

  const tutorialPanel = document.querySelector('.tutorial-panel');
  const tutorialRect = tutorialPanel?.getBoundingClientRect();
  const safeRight = tutorialRect?.width > 0 && tutorialRect.left > HARMONY_POPOVER_MARGIN
    ? Math.min(window.innerWidth - HARMONY_POPOVER_MARGIN, tutorialRect.left - HARMONY_POPOVER_MARGIN)
    : window.innerWidth - HARMONY_POPOVER_MARGIN;
  const width = Math.min(HARMONY_POPOVER_WIDTH, Math.max(300, safeRight - HARMONY_POPOVER_MARGIN));
  const anchorCenter = anchorRect.left + anchorRect.width / 2;
  const left = Math.max(
    HARMONY_POPOVER_MARGIN,
    Math.min(safeRight - width, anchorCenter - width / 2),
  );
  const fitsBelow = anchorRect.bottom + HARMONY_POPOVER_GAP + HARMONY_POPOVER_ESTIMATED_HEIGHT
    <= window.innerHeight - HARMONY_POPOVER_MARGIN;
  const top = fitsBelow
    ? anchorRect.bottom + HARMONY_POPOVER_GAP
    : Math.max(HARMONY_POPOVER_MARGIN, anchorRect.top - HARMONY_POPOVER_GAP - HARMONY_POPOVER_ESTIMATED_HEIGHT);

  return {
    arrowX: Math.max(24, Math.min(width - 24, anchorCenter - left)),
    left,
    side: fitsBelow ? 'below' : 'above',
    top,
    width,
  };
}

// JSX usage is tracked by the React compiler even though the base no-unused-vars rule is not JSX-aware.
// eslint-disable-next-line no-unused-vars
function ChordStepHarmonyPopover({
  anchorRect,
  currentLabel,
  onApply,
  onClose,
  onPreview,
  previewingOptionKey,
  sourceChordLabel,
  stepIndex,
  targetChordLabel,
}) {
  const position = getHarmonyPopoverPosition(anchorRect);
  const canApplyPassing = stepIndex === PASSING_CHORD_STEP_INDEX;
  const enrichOptions = [
    { desc: '恢复为本小节的主和弦。', name: sourceChordLabel, restore: true },
    ...getChordVariantOptions(sourceChordLabel),
  ].filter((option, index, options) => (
    option.name && options.findIndex((candidate) => candidate.name === option.name) === index
  ));
  const passingOptions = getPassingChordOptions(sourceChordLabel, targetChordLabel);
  const passingHintId = `chordPassingStepHint-${stepIndex}`;

  const renderToneNames = (chordName) => (
    <span className="chord-step-harmony-tones" aria-label="组成音">
      {getChordToneRoots(chordName).map((tone) => <span key={tone}>{tone}</span>)}
    </span>
  );

  const renderHarmonyOption = (option, mode, disabled = false) => {
    const optionKey = `${mode}:${option.name}`;
    const isPreviewing = previewingOptionKey === optionKey;
    const describedBy = mode === 'passing' && disabled ? passingHintId : undefined;

    return (
      <div
        className={[
          'chord-step-harmony-option',
          currentLabel === option.name ? 'is-current' : '',
          option.restore ? 'restore' : '',
          disabled ? 'is-disabled' : '',
        ].filter(Boolean).join(' ')}
        key={option.name}
      >
        <button
          className="chord-step-harmony-option-apply"
          aria-describedby={describedBy}
          disabled={disabled}
          type="button"
          onClick={() => onApply({ chordName: option.name, mode, stepIndex })}
        >
          <strong>{option.name}</strong>
          {renderToneNames(option.name)}
          <span>{option.desc}</span>
        </button>
        <button
          className={[
            'chord-step-harmony-option-preview',
            isPreviewing ? 'is-playing' : '',
          ].filter(Boolean).join(' ')}
          aria-describedby={describedBy}
          aria-label={isPreviewing ? `停止试听 ${option.name}` : `试听 ${option.name}`}
          aria-pressed={isPreviewing}
          disabled={disabled}
          title={isPreviewing ? `停止试听 ${option.name}` : `试听 ${option.name}`}
          type="button"
          onClick={() => onPreview({ chordName: option.name, mode, optionKey })}
        >
          {isPreviewing
            ? renderIcon(Square)
            : <img src={ICON_PLAY_URL} alt="" aria-hidden="true" />}
        </button>
      </div>
    );
  };

  return (
    <section
      className="chord-step-harmony-popover"
      data-side={position.side}
      role="dialog"
      aria-label={`编辑第 ${stepIndex + 1} 步和弦`}
      style={{
        '--harmony-arrow-x': `${position.arrowX}px`,
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <span className="chord-step-harmony-arrow" aria-hidden="true" />
      <header className="chord-step-harmony-head">
        <div>
          <span>STEP {String(stepIndex + 1).padStart(2, '0')} · CHORD EDIT</span>
          <h2>{currentLabel}</h2>
        </div>
        <button aria-label="关闭和弦编辑菜单" type="button" onClick={onClose}>×</button>
      </header>

      <section className="chord-step-harmony-section" aria-labelledby="chordEnrichmentTitle">
        <div className="chord-step-harmony-section-head">
          <div>
            <h3 id="chordEnrichmentTitle">丰富和弦</h3>
            <span>ROOT · {sourceChordLabel}</span>
          </div>
          <span>替换当前 Step</span>
        </div>
        <div className="chord-step-harmony-options enrich">
          {enrichOptions.length
            ? enrichOptions.map((option) => renderHarmonyOption(option, 'enrich'))
            : <p className="chord-step-harmony-empty">暂无可用丰富和弦</p>}
        </div>
      </section>

      <section className="chord-step-harmony-section passing" aria-labelledby="chordPassingTitle">
        <div className="chord-step-harmony-section-head">
          <div>
            <h3 id="chordPassingTitle">经过和弦</h3>
            <span>{sourceChordLabel} → {targetChordLabel ?? 'NEXT CHORD'}</span>
          </div>
          <span id={passingHintId}>
            {canApplyPassing ? '第 15 步可用' : '仅第 15 步可用'}
          </span>
        </div>
        <div className="chord-step-harmony-options passing">
          {passingOptions.map((option) => renderHarmonyOption(option, 'passing', !canApplyPassing))}
        </div>
      </section>
    </section>
  );
}

function ChordEditor({
  canPageBars = false,
  clips,
  clipName,
  matrix,
  onChordRhythmStepToggle = () => {},
  onChordStepHarmonyApply = () => {},
  onChordStepHarmonyPreview = () => Promise.resolve('empty'),
  onChordStepHarmonyPreviewStop = () => {},
  onChordTemplateWorkspacePreview = () => Promise.resolve('empty'),
  onChordTemplateWorkspacePreviewStop = () => {},
  onChordTemplateWorkspaceApply = () => {},
  onClose = () => {},
  onClearChordBar = () => {},
  onNextBar = () => {},
  onPreviousBar = () => {},
  onRenameClip,
  selectedBar,
  trackId = 'chord',
  tutorialLocked = false,
  tutorialTargets,
}) {
  const templates = useMemo(() => Object.values(CHORD_TEMPLATES), []);
  const pageCount = Math.ceil(templates.length / TEMPLATE_PAGE_SIZE);
  const appliedTemplateId = getAppliedChordProgressionTemplateId(matrix, clips, selectedBar);
  const appliedGrooveTemplateId = getChordSelectedGrooveTemplateId(matrix, selectedBar);
  const activeTemplate = appliedTemplateId ? CHORD_TEMPLATES[appliedTemplateId] : null;
  const currentChord = getSourceChordLabel(matrix, selectedBar);
  const nextChordBar = getNextChordClipBar(clips, selectedBar);
  const nextChord = nextChordBar === null ? null : getSourceChordLabel(matrix, nextChordBar);
  const activeSteps = new Set(getChordRhythmSteps(matrix, selectedBar));
  const hasPlayableChordContent = activeSteps.size > 0;
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [templatePage, setTemplatePage] = useState(0);
  const [pendingTemplateId, setPendingTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [pendingGrooveTemplateId, setPendingGrooveTemplateId] = useState(DEFAULT_GROOVE_TEMPLATE_ID);
  const [previewing, setPreviewing] = useState(false);
  const [harmonyPanel, setHarmonyPanel] = useState(null);
  const [harmonyPreviewOptionKey, setHarmonyPreviewOptionKey] = useState(null);
  const previewRunRef = useRef(0);
  const harmonyPreviewRunRef = useRef(0);
  const workspaceButtonRole = getTutorialControlRole(tutorialTargets, WORKSPACE_BUTTON_CONTROL);
  const applyBarRole = getTutorialControlRole(tutorialTargets, APPLY_BAR_CONTROL);
  const applyGlobalRole = getTutorialControlRole(tutorialTargets, APPLY_GLOBAL_CONTROL);
  const visibleTemplates = templates.slice(
    templatePage * TEMPLATE_PAGE_SIZE,
    templatePage * TEMPLATE_PAGE_SIZE + TEMPLATE_PAGE_SIZE,
  );

  const stopPreview = useCallback(() => {
    previewRunRef.current += 1;
    onChordTemplateWorkspacePreviewStop();
    setPreviewing(false);
  }, [onChordTemplateWorkspacePreviewStop]);

  const closeWorkspace = useCallback(() => {
    stopPreview();
    setWorkspaceOpen(false);
  }, [stopPreview]);

  const stopHarmonyPreview = useCallback(() => {
    harmonyPreviewRunRef.current += 1;
    onChordStepHarmonyPreviewStop();
    setHarmonyPreviewOptionKey(null);
  }, [onChordStepHarmonyPreviewStop]);

  const closeHarmonyPanel = useCallback(() => {
    stopHarmonyPreview();
    setHarmonyPanel(null);
  }, [stopHarmonyPreview]);

  useEffect(() => () => {
    previewRunRef.current += 1;
    harmonyPreviewRunRef.current += 1;
    onChordTemplateWorkspacePreviewStop();
    onChordStepHarmonyPreviewStop();
  }, [onChordStepHarmonyPreviewStop, onChordTemplateWorkspacePreviewStop]);

  useEffect(() => {
    if (!harmonyPanel || harmonyPanel.bar === selectedBar) return undefined;
    const timeoutId = window.setTimeout(closeHarmonyPanel, 0);
    return () => window.clearTimeout(timeoutId);
  }, [closeHarmonyPanel, harmonyPanel, selectedBar]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (harmonyPanel) {
        closeHarmonyPanel();
        return;
      }
      if (workspaceOpen) closeWorkspace();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHarmonyPanel, closeWorkspace, harmonyPanel, workspaceOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!harmonyPanel) return;
      if (event.target.closest('.chord-step-harmony-popover')) return;
      if (event.target.closest('.chord-rhythm-step-label')) return;
      closeHarmonyPanel();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [closeHarmonyPanel, harmonyPanel]);

  const openWorkspace = () => {
    stopPreview();
    closeHarmonyPanel();
    const nextTemplateId = appliedTemplateId ?? DEFAULT_TEMPLATE_ID;
    const nextTemplateIndex = Math.max(0, templates.findIndex((template) => template.id === nextTemplateId));
    setPendingTemplateId(nextTemplateId);
    setPendingGrooveTemplateId(
      CHORD_GROOVE_TEMPLATES.some((template) => template.id === appliedGrooveTemplateId)
        ? appliedGrooveTemplateId
        : DEFAULT_GROOVE_TEMPLATE_ID,
    );
    setTemplatePage(Math.floor(nextTemplateIndex / TEMPLATE_PAGE_SIZE));
    setWorkspaceOpen(true);
  };

  const handlePreview = async () => {
    if (previewing) {
      stopPreview();
      return;
    }

    const runId = previewRunRef.current + 1;
    previewRunRef.current = runId;
    setPreviewing(true);
    try {
      await onChordTemplateWorkspacePreview({
        progressionTemplateId: pendingTemplateId,
        grooveTemplateId: pendingGrooveTemplateId,
      });
    } catch {
      // The preview is optional UI feedback; keep the workspace usable if audio startup fails.
    } finally {
      if (previewRunRef.current === runId) setPreviewing(false);
    }
  };

  const handleHarmonyPreview = async ({ chordName, mode, optionKey }) => {
    if (harmonyPreviewOptionKey === optionKey) {
      stopHarmonyPreview();
      return;
    }

    stopHarmonyPreview();
    const runId = harmonyPreviewRunRef.current + 1;
    harmonyPreviewRunRef.current = runId;
    setHarmonyPreviewOptionKey(optionKey);
    try {
      await onChordStepHarmonyPreview({ chordName, mode });
    } catch {
      // Harmony preview is optional UI feedback; applying the chord remains available.
    } finally {
      if (harmonyPreviewRunRef.current === runId) setHarmonyPreviewOptionKey(null);
    }
  };

  const handleApply = (scope) => {
    stopPreview();
    closeHarmonyPanel();
    onChordTemplateWorkspaceApply({
      progressionTemplateId: pendingTemplateId,
      grooveTemplateId: pendingGrooveTemplateId,
      scope,
    });
    setWorkspaceOpen(false);
  };

  const handleProgressionSelect = (templateId) => {
    if (templateId === pendingTemplateId) return;
    stopPreview();
    setPendingTemplateId(templateId);
  };

  const handleGrooveSelect = (templateId) => {
    if (templateId === pendingGrooveTemplateId) return;
    stopPreview();
    setPendingGrooveTemplateId(templateId);
  };

  const handleHarmonyPanelOpen = (stepIndex, element) => {
    if (!activeSteps.has(stepIndex)) return;
    stopPreview();
    stopHarmonyPreview();
    setHarmonyPanel({
      anchorRect: element.getBoundingClientRect(),
      bar: selectedBar,
      stepIndex,
    });
  };

  const handleHarmonyApply = (selection) => {
    stopHarmonyPreview();
    onChordStepHarmonyApply(selection);
    setHarmonyPanel(null);
  };

  const handleRhythmStepToggle = (stepIndex) => {
    closeHarmonyPanel();
    onChordRhythmStepToggle(stepIndex);
  };

  const handleClearChordBar = () => {
    closeHarmonyPanel();
    onClearChordBar();
  };

  const handleCloseEditor = () => {
    closeHarmonyPanel();
    onClose();
  };

  const editorClassName = [
    'editor',
    'chord-rhythm-editor',
    workspaceOpen ? 'chord-template-workspace-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <section
      className={editorClassName}
      data-screen-label="Chord Editor"
      data-picker={workspaceOpen ? 'chord-workspace' : undefined}
    >
      <header className="editor-head chord-rhythm-editor-head">
        <div className="editor-left">
          {createElement(EditorTrackIdentity, { trackId: 'chord', label: 'Chord' })}
          <div className="clip-title">
            <div className="crumb">Chord · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
            <div className="clip-name-meta">
              CHORD EDITOR · BAR
              {' '}
              {String(selectedBar + 1).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="tools chord-rhythm-tools">
          <button
            className={[
              'chord-template-workspace-trigger',
              workspaceButtonRole === 'target' ? 'tutorial-control-target' : '',
            ].filter(Boolean).join(' ')}
            aria-expanded={workspaceOpen}
            data-tutorial-role={workspaceButtonRole}
            disabled={tutorialLocked && !isTutorialControlAllowed(workspaceButtonRole)}
            type="button"
            onClick={openWorkspace}
          >
            选择和弦模板与律动
          </button>
          <button
            className="chord-rhythm-clear"
            disabled={tutorialLocked}
            type="button"
            onClick={handleClearChordBar}
          >
            清空本小节
          </button>
          <button
            className="editor-close chord-rhythm-close"
            aria-label="关闭编辑器"
            title="关闭编辑器"
            type="button"
            onClick={handleCloseEditor}
          >
            <img src={ICON_CLOSE_URL} alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      {createElement(TrackBarPager, {
        canPageBars,
        className: 'chord-rhythm-pager',
        contentClassName: 'chord-rhythm-pager-content',
        onNextBar,
        onPreviousBar,
        trackId,
      }, (
        <section className="chord-rhythm-panel" aria-label="本小节和弦律动">
          <div className="chord-rhythm-summary">
            <div className="chord-rhythm-summary-left">
              {hasPlayableChordContent ? (
                <div className="chord-rhythm-progression-info">
                  <span className="chord-rhythm-eyebrow">Progression</span>
                  <strong className="chord-rhythm-progression-name">
                    {activeTemplate?.name ?? '自定义'}
                  </strong>
                  <span className="chord-rhythm-progression-chords">
                    {activeTemplate?.chords.join(' · ') ?? currentChord}
                  </span>
                </div>
              ) : null}
              <div className="chord-rhythm-readout">
                <div>
                  <span className="chord-rhythm-readout-label">当前小节主和弦</span>
                  <span className="chord-rhythm-readout-sub">
                    BAR {String(selectedBar + 1).padStart(2, '0')} · ROOT CHORD
                  </span>
                </div>
                <span className="chord-rhythm-badge">
                  {hasPlayableChordContent ? (currentChord ?? '—') : '—'}
                </span>
              </div>
            </div>
            <div className="chord-rhythm-readout next">
              <div>
                <span className="chord-rhythm-readout-label">下一小节主和弦</span>
                <span className="chord-rhythm-readout-sub">
                  {nextChordBar === null
                    ? 'NO NEXT CHORD'
                    : `BAR ${String(nextChordBar + 1).padStart(2, '0')} · NEXT CHORD`}
                </span>
              </div>
              <span className="chord-rhythm-badge">{nextChord ?? '—'}</span>
            </div>
          </div>

          <div className="chord-rhythm-sequencer-head">
            <div>
              <h2>本小节弹奏律动</h2>
              <p>点击 16 个步进开关，决定这个和弦在一小节里的触发位置</p>
            </div>
            <div className="chord-rhythm-status">
              <span className="chord-rhythm-status-lamp" aria-hidden="true" />
              <span>GROOVE · {getGrooveStatusLabel(appliedGrooveTemplateId)}</span>
            </div>
          </div>

          <div className="chord-rhythm-step-grid" aria-label="16 step chord groove">
            {Array.from({ length: STEPS_PER_BAR / STEPS_PER_BEAT }, (_, beat) => (
              <div
                className="chord-rhythm-beat-group"
                aria-label={`Beat ${beat + 1}`}
                key={`chord-rhythm-beat-group-${beat}`}
                role="group"
              >
                {Array.from({ length: STEPS_PER_BEAT }, (__, beatStep) => {
                  const step = beat * STEPS_PER_BEAT + beatStep;
                  const isActive = activeSteps.has(step);
                  const stepChordLabel = getChordRhythmStepLabel(matrix, selectedBar, step);
                  return (
                    <div className="chord-rhythm-step-wrap" key={`chord-rhythm-step-${step}`}>
                      <div className="chord-rhythm-step-head">
                        <span>{String(step + 1).padStart(2, '0')}</span>
                        {isActive ? (
                          <button
                            aria-expanded={harmonyPanel?.bar === selectedBar && harmonyPanel?.stepIndex === step}
                            aria-haspopup="dialog"
                            aria-label={`编辑第 ${step + 1} 步和弦 ${stepChordLabel}`}
                            className="chord-rhythm-step-label"
                            disabled={tutorialLocked}
                            type="button"
                            onClick={(event) => handleHarmonyPanelOpen(step, event.currentTarget)}
                          >
                            {stepChordLabel}
                          </button>
                        ) : null}
                      </div>
                      <button
                        className="chord-rhythm-step"
                        aria-label={`${isActive ? '关闭' : '开启'}第 ${step + 1} 步`}
                        aria-pressed={isActive}
                        disabled={tutorialLocked}
                        type="button"
                        onClick={() => handleRhythmStepToggle(step)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="chord-rhythm-beat-labels" aria-hidden="true">
            {Array.from({ length: STEPS_PER_BAR / STEPS_PER_BEAT }, (_, beat) => (
              <span key={`chord-rhythm-beat-${beat}`}>BEAT {beat + 1}</span>
            ))}
          </div>
        </section>
      ))}

      {harmonyPanel?.bar === selectedBar && activeSteps.has(harmonyPanel.stepIndex) ? (
        <ChordStepHarmonyPopover
          anchorRect={harmonyPanel.anchorRect}
          currentLabel={getChordRhythmStepLabel(matrix, selectedBar, harmonyPanel.stepIndex)}
          onApply={handleHarmonyApply}
          onClose={closeHarmonyPanel}
          onPreview={handleHarmonyPreview}
          previewingOptionKey={harmonyPreviewOptionKey}
          sourceChordLabel={getChordRhythmStepSourceLabel(matrix, selectedBar, harmonyPanel.stepIndex)}
          stepIndex={harmonyPanel.stepIndex}
          targetChordLabel={nextChord ?? getDoowopPassingTargetChord(
            getChordRhythmStepSourceLabel(matrix, selectedBar, harmonyPanel.stepIndex),
          )}
        />
      ) : null}

      <section
        className="chord-template-workspace"
        aria-labelledby="chordTemplateWorkspaceTitle"
        aria-modal="true"
        hidden={!workspaceOpen}
        role="dialog"
      >
        <div className="chord-template-workspace-panel">
          <header className="chord-template-workspace-head">
            <h2 id="chordTemplateWorkspaceTitle">和弦模板与弹奏律动</h2>
            <div>
              <button
                className={[
                  'chord-template-workspace-icon-button',
                  'preview',
                  previewing ? 'is-playing' : '',
                ].filter(Boolean).join(' ')}
                aria-label={previewing ? '停止试听' : '试听所选和弦与律动'}
                aria-pressed={previewing}
                title={previewing ? '停止试听' : '试听所选和弦与律动'}
                type="button"
                onClick={handlePreview}
              >
                {previewing
                  ? renderIcon(Square)
                  : <img src={ICON_PLAY_URL} alt="" aria-hidden="true" />}
              </button>
              <button
                className="chord-template-workspace-icon-button close"
                aria-label="关闭二级菜单"
                title="关闭二级菜单"
                type="button"
                onClick={closeWorkspace}
              >
                <img src={ICON_CLOSE_URL} alt="" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="chord-template-workspace-body">
            <div className="chord-template-workspace-label progression">
              <strong>选择和弦模板</strong>
              <span>CHORD PROGRESSION</span>
              <div className="chord-template-page-controls">
                <button
                  type="button"
                  disabled={templatePage === 0}
                  onClick={() => setTemplatePage((page) => Math.max(0, page - 1))}
                >
                  上一页
                </button>
                <span>{templatePage + 1} / {pageCount}</span>
                <button
                  type="button"
                  disabled={templatePage === pageCount - 1}
                  onClick={() => setTemplatePage((page) => Math.min(pageCount - 1, page + 1))}
                >
                  下一页
                </button>
              </div>
            </div>
            <div className="chord-template-progression-options" aria-label="选择和弦模板">
              {visibleTemplates.map((template) => {
                const controlName = `chord-template-card:${template.id}`;
                const role = getTutorialControlRole(tutorialTargets, controlName);
                const disabled = tutorialLocked && !isTutorialControlAllowed(role);

                return (
                  <button
                    className={role === 'target' ? 'tutorial-control-target' : ''}
                    aria-pressed={pendingTemplateId === template.id}
                    data-tutorial-role={role}
                    disabled={disabled}
                    key={template.id}
                    type="button"
                    onClick={() => handleProgressionSelect(template.id)}
                  >
                    <span className="chord-template-card-head">
                      <strong>{template.name}</strong>
                      <span>{template.tag}</span>
                    </span>
                    <span className="chord-template-card-chords">
                      {template.chords.map((chord, index) => (
                        <span className="chord-template-card-chord-wrap" key={`${template.id}-${chord}-${index}`}>
                          <span className="chord-template-card-chord">{chord}</span>
                          {index < template.chords.length - 1 ? <span className="chord-template-card-separator">–</span> : null}
                        </span>
                      ))}
                    </span>
                    <span className="chord-template-card-description">{template.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="chord-template-workspace-label groove">
              <strong>选择和弦弹奏律动模板</strong>
              <span>CHORD GROOVE</span>
            </div>
            <div className="chord-template-groove-options" aria-label="选择和弦弹奏律动模板">
              {CHORD_GROOVE_TEMPLATES.map((template) => {
                const controlName = `chord-groove-card:${template.id}`;
                const role = getTutorialControlRole(tutorialTargets, controlName);
                const disabled = tutorialLocked && !isTutorialControlAllowed(role);

                return (
                  <button
                    className={role === 'target' ? 'tutorial-control-target' : ''}
                    aria-pressed={pendingGrooveTemplateId === template.id}
                    data-tutorial-role={role}
                    disabled={disabled}
                    key={template.id}
                    type="button"
                    onClick={() => handleGrooveSelect(template.id)}
                  >
                    <strong>{template.name}</strong>
                    <span className="chord-template-mini-groove" aria-hidden="true">
                      {renderMiniGroove(template)}
                    </span>
                    <span className="chord-template-card-description">{template.desc}</span>
                    <span className="chord-template-groove-meta">
                      {template.hitLabel}{template.default ? ' · DEFAULT' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div aria-hidden="true" />
            <div className="chord-template-workspace-actions">
              <button
                className={[
                  'primary',
                  applyBarRole === 'target' ? 'tutorial-control-target' : '',
                ].filter(Boolean).join(' ')}
                data-tutorial-role={applyBarRole}
                disabled={tutorialLocked && !isTutorialControlAllowed(applyBarRole)}
                type="button"
                onClick={() => handleApply('bar')}
              >
                应用到本小节
              </button>
              <button
                className={applyGlobalRole === 'target' ? 'tutorial-control-target' : ''}
                data-tutorial-role={applyGlobalRole}
                disabled={tutorialLocked && !isTutorialControlAllowed(applyGlobalRole)}
                type="button"
                onClick={() => handleApply('global')}
              >
                应用到全局
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export { ChordEditor };
