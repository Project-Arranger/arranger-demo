import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Square } from 'lucide-react';
import { CHORD_TEMPLATES } from '../../domain/chordCells.js';
import {
  CHORD_GROOVE_TEMPLATES,
  CUSTOM_CHORD_GROOVE_ID,
  getAppliedChordProgressionTemplateId,
  getChordRhythmSteps,
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

function ChordEditor({
  canPageBars = false,
  clips,
  clipName,
  matrix,
  onChordRhythmStepToggle = () => {},
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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [templatePage, setTemplatePage] = useState(0);
  const [pendingTemplateId, setPendingTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [pendingGrooveTemplateId, setPendingGrooveTemplateId] = useState(DEFAULT_GROOVE_TEMPLATE_ID);
  const [previewing, setPreviewing] = useState(false);
  const previewRunRef = useRef(0);
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

  useEffect(() => () => {
    previewRunRef.current += 1;
    onChordTemplateWorkspacePreviewStop();
  }, [onChordTemplateWorkspacePreviewStop]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && workspaceOpen) closeWorkspace();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeWorkspace, workspaceOpen]);

  const openWorkspace = () => {
    stopPreview();
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

  const handleApply = (scope) => {
    stopPreview();
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
            onClick={onClearChordBar}
          >
            清空本小节
          </button>
          <button
            className="editor-close chord-rhythm-close"
            aria-label="关闭编辑器"
            title="关闭编辑器"
            type="button"
            onClick={onClose}
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
              <div className="chord-rhythm-progression-info">
                <span className="chord-rhythm-eyebrow">Progression</span>
                <strong className="chord-rhythm-progression-name">
                  {activeTemplate?.name ?? '自定义'}
                </strong>
                <span className="chord-rhythm-progression-chords">
                  {activeTemplate?.chords.join(' · ') ?? currentChord}
                </span>
              </div>
              <div className="chord-rhythm-readout">
                <div>
                  <span className="chord-rhythm-readout-label">当前小节主和弦</span>
                  <span className="chord-rhythm-readout-sub">
                    BAR {String(selectedBar + 1).padStart(2, '0')} · ROOT CHORD
                  </span>
                </div>
                <span className="chord-rhythm-badge">{currentChord ?? '—'}</span>
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
                  return (
                    <div className="chord-rhythm-step-wrap" key={`chord-rhythm-step-${step}`}>
                      <span>{String(step + 1).padStart(2, '0')}</span>
                      <button
                        className="chord-rhythm-step"
                        aria-label={`切换第 ${step + 1} 步`}
                        aria-pressed={activeSteps.has(step)}
                        disabled={tutorialLocked}
                        type="button"
                        onClick={() => onChordRhythmStepToggle(step)}
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
