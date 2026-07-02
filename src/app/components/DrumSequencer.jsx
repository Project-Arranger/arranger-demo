import {
  AudioWaveform,
  X,
} from 'lucide-react';
import {
  createElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { STEPS_PER_BAR } from '../../store/useMusicStore.js';
import {
  DRUM_SEQUENCER_ROWS,
  isDrumsStepActive,
} from '../drumSequencerData.js';
import { createDefaultDrumsPattern } from '../drumsPatternActions.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { EditorTrackIdentity } from './EditorTrackIdentity.jsx';
import { renderIcon } from './icons.js';
import { TrackBarPager } from './TrackBarPager.jsx';

const STEP_NUMBERS = Array.from({ length: STEPS_PER_BAR }, (_, index) => index + 1);
const STEPS_PER_BEAT_GROUP = 4;
const STEP_GROUPS = Array.from(
  { length: Math.ceil(STEP_NUMBERS.length / STEPS_PER_BEAT_GROUP) },
  (_, groupIndex) => STEP_NUMBERS.slice(
    groupIndex * STEPS_PER_BEAT_GROUP,
    (groupIndex + 1) * STEPS_PER_BEAT_GROUP,
  ),
);
const DRAG_THRESHOLD_PX = 6;
const BASIC_DRUM_TEMPLATE = Object.freeze({
  id: 'basic-drums-groove',
  name: '基础律动',
  tag: '默认',
  desc: 'Kick 落在开头，Snare 稳住第三拍，Hi-Hat 给出清晰脉冲。',
  detail: '适合先搭出稳定节拍，再手动添加变化。',
});
const BASIC_DRUM_TEMPLATE_HITS = new Set(
  createDefaultDrumsPattern().map(({ instrument, step }) => `${instrument}:${step}`),
);
const DRUM_TEMPLATE_HIT_LABELS = Object.freeze({
  hihat: 'H',
  kick: 'K',
  snare: 'S',
});
const DRUM_TEMPLATE_BEAT_MARKERS = new Set([1, 5, 9, 13]);
const TUTORIAL_CELL_COLOR_CLASSES = Object.freeze({
  target: Object.freeze({
    blue: 'tutorial-cell-target-blue',
    green: 'tutorial-cell-target-green',
    yellow: 'tutorial-cell-target-yellow',
  }),
});

function renderStepGroups(renderStep) {
  return (
    <div className="drum-steps drum-step-groups">
      {STEP_GROUPS.map((stepGroup, groupIndex) => (
        <div className="drum-step-group" key={groupIndex}>
          {stepGroup.map(renderStep)}
        </div>
      ))}
    </div>
  );
}

function didPointerDrag(event, dragSession) {
  return Math.abs(event.clientX - dragSession.startX) > DRAG_THRESHOLD_PX
    || Math.abs(event.clientY - dragSession.startY) > DRAG_THRESHOLD_PX;
}

function getDropTargetFromPoint(event, dragSession) {
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.drum-step');
  if (!target) return null;
  if (target.dataset.instrument !== dragSession.instrument) return null;
  if (target.getAttribute('aria-disabled') === 'true') return null;
  if (target.getAttribute('aria-pressed') === 'true') return null;

  const step = Number(target.dataset.step);
  if (!Number.isInteger(step) || step === dragSession.step) return null;

  return { instrument: dragSession.instrument, step };
}

function getTutorialCellRole(tutorialTargets, bar, instrument, step) {
  const cellTargets = tutorialTargets?.drumCells ?? [];
  const target = cellTargets.find((item) => (
    item.bar === bar
    && item.instrument === instrument
    && item.steps.includes(step)
  ));

  return target?.role ?? null;
}

function getTutorialCellClasses(tutorialRole) {
  if (!tutorialRole) return [];

  if (tutorialRole.startsWith('target')) {
    return [
      'tutorial-cell-target',
      tutorialRole.endsWith('-blue') ? TUTORIAL_CELL_COLOR_CLASSES.target.blue : '',
      tutorialRole.endsWith('-green') ? TUTORIAL_CELL_COLOR_CLASSES.target.green : '',
      tutorialRole.endsWith('-yellow') ? TUTORIAL_CELL_COLOR_CLASSES.target.yellow : '',
    ];
  }
  if (tutorialRole === 'source') return ['tutorial-cell-source'];
  return [];
}

function getDrumTemplateHitLabel(rowId, stepIndex) {
  if (!BASIC_DRUM_TEMPLATE_HITS.has(`${rowId}:${stepIndex}`)) return null;
  return DRUM_TEMPLATE_HIT_LABELS[rowId] ?? null;
}

function getDrumTemplateStepClass(rowId, stepIndex) {
  const hitLabel = getDrumTemplateHitLabel(rowId, stepIndex);

  return [
    'gtpl-step',
    'drum-template-step',
    stepIndex % 4 === 0 ? 'downbeat' : '',
    hitLabel ? 'hit-block' : '',
  ].filter(Boolean).join(' ');
}

function DrumSequencer({
  matrix,
  canPageBars = false,
  clipName,
  onClose = () => {},
  onClearCurrentBar,
  onClearDrums,
  onGenerateAllBars,
  onGenerateCurrentBar,
  onNextBar = () => {},
  onPreviousBar = () => {},
  onStepMove,
  onStepToggle,
  onRenameClip,
  selectedBar,
  tutorialLocked = false,
  tutorialTargets,
}) {
  const [dragSource, setDragSource] = useState(null);
  const [dragOverStep, setDragOverStep] = useState(null);
  const [drumTemplatePickerOpen, setDrumTemplatePickerOpen] = useState(false);
  const [selectedDrumTemplateId, setSelectedDrumTemplateId] = useState(BASIC_DRUM_TEMPLATE.id);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const dragSessionRef = useRef(null);
  const generateCurrentRole = getTutorialControlRole(tutorialTargets, 'generate-current-drums-bar');
  const generateAllRole = getTutorialControlRole(tutorialTargets, 'generate-all-drums-bars');
  const templateButtonRole = generateCurrentRole === 'target' || generateAllRole === 'target'
    ? 'target'
    : null;
  const templateButtonLocked = tutorialLocked && templateButtonRole !== 'target';
  const generateCurrentLocked = tutorialLocked && generateCurrentRole !== 'target';
  const generateAllLocked = tutorialLocked && generateAllRole !== 'target';
  const templateButtonClassName = [
    'btn-template-groove',
    'drum-action',
    templateButtonRole === 'target' ? 'tutorial-control-target' : '',
  ].filter(Boolean).join(' ');
  const applyCurrentClassName = [
    'btn-template',
    'drum-template-apply',
    generateCurrentRole === 'target' ? 'tutorial-control-target' : '',
  ].filter(Boolean).join(' ');
  const applyAllClassName = [
    'btn-template',
    'drum-template-apply',
    generateAllRole === 'target' ? 'tutorial-control-target' : '',
  ].filter(Boolean).join(' ');

  const handleMouseDownStep = (event, instrument, step, canDrag) => {
    if (!canDrag || event.button !== 0) return;
    const dragSession = {
      dragging: false,
      instrument,
      startX: event.clientX,
      startY: event.clientY,
      step,
    };
    dragSessionRef.current = dragSession;
    setDragSource({ instrument, step });
  };

  useEffect(() => {
    if (!dragSource) return undefined;

    const handleMouseMove = (event) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) return;
      if (!didPointerDrag(event, dragSession)) return;

      dragSession.dragging = true;
      const target = getDropTargetFromPoint(event, dragSession);
      setDragOverStep(target ? { instrument: target.instrument, step: target.step } : null);
    };

    const handleMouseUp = (event) => {
      const dragSession = dragSessionRef.current;
      const target = dragSession?.dragging ? getDropTargetFromPoint(event, dragSession) : null;

      if (dragSession?.dragging) {
        setSuppressNextClick(true);
      }
      if (target) {
        onStepMove?.(dragSession.instrument, dragSession.step, target.step);
      }

      dragSessionRef.current = null;
      setDragSource(null);
      setDragOverStep(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragSource, onStepMove]);

  useEffect(() => {
    if (!drumTemplatePickerOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setDrumTemplatePickerOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drumTemplatePickerOpen]);

  const handleTemplateCardKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setSelectedDrumTemplateId(BASIC_DRUM_TEMPLATE.id);
  };

  const handleApplyCurrentTemplate = () => {
    onGenerateCurrentBar?.(selectedDrumTemplateId);
    setDrumTemplatePickerOpen(false);
  };

  const handleApplyAllTemplate = () => {
    onGenerateAllBars?.(selectedDrumTemplateId);
    setDrumTemplatePickerOpen(false);
  };

  const handleClose = () => {
    setDrumTemplatePickerOpen(false);
    onClose();
  };

  return (
    <section className="editor drum-editor" data-screen-label="Drum Sequencer" data-picker={drumTemplatePickerOpen ? 'drum-template' : undefined}>
      <header className="editor-head">
        <div className="editor-left">
          {createElement(EditorTrackIdentity, { trackId: 'drums', label: 'Drums' })}
          <div className="clip-title">
            <div className="crumb">Drums · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
            <div className="clip-name-meta">
              DRUM SEQUENCER - BAR
              {' '}
              {selectedBar + 1}
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className={templateButtonClassName}
            type="button"
            data-tutorial-role={templateButtonRole}
            disabled={templateButtonLocked}
            onClick={() => setDrumTemplatePickerOpen(true)}
          >
            {renderIcon(AudioWaveform)}
            选择律动模板
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={onClearCurrentBar}>
            清本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={onClearDrums}>
            清整轨
          </button>
          <button
            className="editor-close"
            aria-label="Close editor"
            title="Close"
            type="button"
            onClick={handleClose}
          >
            {renderIcon(X)}
          </button>
        </div>
      </header>

      <div className="drum-seq-body">
        {createElement(TrackBarPager, {
          canPageBars,
          contentClassName: 'drum-seq-panel',
          onNextBar,
          onPreviousBar,
          trackId: 'drums',
        }, (
          <>
            <div className="drum-step-numbers" aria-hidden="true">
              <div />
              {renderStepGroups((stepNumber) => (
                <span
                  className={`drum-step-number${stepNumber % 4 === 0 ? ' beat-end' : ''} mono`}
                  key={stepNumber}
                >
                  {stepNumber}
                </span>
              ))}
            </div>

            {DRUM_SEQUENCER_ROWS.map((row) => (
              <div className="drum-row" key={row.id}>
                <div className="drum-row-label">
                  <span className="drum-dot" data-instrument={row.id} />
                  <span>{row.label}</span>
                </div>
                {renderStepGroups((stepNumber) => {
                  const stepIndex = stepNumber - 1;
                  const active = isDrumsStepActive(matrix, selectedBar, stepIndex, row.id);
                  const tutorialRole = getTutorialCellRole(
                    tutorialTargets,
                    selectedBar,
                    row.id,
                    stepIndex,
                  );
                  const interactiveTutorialCell = tutorialRole?.startsWith('target')
                    || tutorialRole === 'source';
                  const locked = tutorialLocked && !interactiveTutorialCell;
                  const canDrag = active && !locked;
                  const dragOver = dragOverStep?.instrument === row.id
                    && dragOverStep.step === stepIndex;
                  return (
                    <button
                      className={[
                        'drum-step',
                        active ? 'active' : '',
                        canDrag ? 'drum-step-drag-source' : '',
                        dragOver ? 'drag-over' : '',
                        stepNumber % 4 === 0 ? 'beat-end' : '',
                        locked ? 'tutorial-locked' : '',
                        ...getTutorialCellClasses(tutorialRole),
                      ].filter(Boolean).join(' ')}
                      data-instrument={row.id}
                      data-step={stepIndex}
                      data-tutorial-role={tutorialRole ?? undefined}
                      key={stepNumber}
                      type="button"
                      aria-label={`Toggle ${row.label} step ${stepNumber}`}
                      aria-pressed={active}
                      aria-disabled={locked}
                      disabled={locked}
                      draggable={false}
                      onMouseDown={(event) => handleMouseDownStep(event, row.id, stepIndex, canDrag)}
                      onClick={() => {
                        if (suppressNextClick) {
                          setSuppressNextClick(false);
                          return;
                        }
                        onStepToggle(row.id, stepIndex);
                      }}
                    />
                  );
                })}
              </div>
            ))}

            <div className="drum-bar-indicator mono">
              {selectedBar + 1}
              {' '}
              / 8
            </div>
          </>
        ))}
      </div>

      <div className="gtpl-picker drum-template-picker" role="dialog" aria-label="选择律动模板" data-screen-label="Drum Groove Template Picker" hidden={!drumTemplatePickerOpen}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-groove-active" aria-label="关闭选择律动模板" type="button" onClick={() => setDrumTemplatePickerOpen(false)}>
              {renderIcon(AudioWaveform)}
              选择律动模板
            </button>
            <span className="tpl-meta">
              Drums 律动模板库 ·
              {' '}
              <span className="mono">1</span>
              {' '}
              个
            </span>
          </div>
          <div className="tpl-head-right">
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setDrumTemplatePickerOpen(false)}>
              {renderIcon(X)}
            </button>
          </div>
        </header>

        <div className="tpl-body">
          <div className="tpl-list drum-template-list">
            <article
              className={[
                'gtpl-card',
                'drum-template-card',
                selectedDrumTemplateId === BASIC_DRUM_TEMPLATE.id ? 'selected' : '',
              ].filter(Boolean).join(' ')}
              data-drum-template={BASIC_DRUM_TEMPLATE.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDrumTemplateId(BASIC_DRUM_TEMPLATE.id)}
              onKeyDown={handleTemplateCardKeyDown}
            >
              <div className="gtpl-name-row">
                <h3 className="gtpl-name">{BASIC_DRUM_TEMPLATE.name}</h3>
                <span className="gtpl-default-tag">{BASIC_DRUM_TEMPLATE.tag}</span>
              </div>
              <div className="gtpl-rhythm drum-template-rhythm" aria-label={`律动预览·${BASIC_DRUM_TEMPLATE.name}`}>
                <div className="drum-template-beat-markers" aria-hidden="true">
                  <span />
                  <div className="drum-template-beat-marker-grid">
                    {STEP_NUMBERS.map((stepNumber) => (
                      <span className="drum-template-beat-marker mono" key={`beat-marker-${stepNumber}`}>
                        {DRUM_TEMPLATE_BEAT_MARKERS.has(stepNumber) ? stepNumber : ''}
                      </span>
                    ))}
                  </div>
                </div>
                {DRUM_SEQUENCER_ROWS.map((row) => (
                  <div className="drum-template-row" key={row.id}>
                    <span className="drum-template-row-label">{row.label}</span>
                    <div className="drum-template-row-grid">
                      {STEP_NUMBERS.map((stepNumber) => {
                        const stepIndex = stepNumber - 1;
                        const hitLabel = getDrumTemplateHitLabel(row.id, stepIndex);

                        return (
                          <span
                            className={getDrumTemplateStepClass(row.id, stepIndex)}
                            data-instrument={row.id}
                            data-hit-label={hitLabel ?? undefined}
                            key={`${row.id}-${stepNumber}`}
                            aria-label={hitLabel ? `${row.label} hit at step ${stepNumber}` : `${row.label} rest at step ${stepNumber}`}
                          >
                            {hitLabel ? (
                              <span className="drum-template-hit-label" aria-hidden="true">
                                {hitLabel}
                              </span>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="gtpl-desc">{BASIC_DRUM_TEMPLATE.desc}</p>
              <p className="gtpl-detail">{BASIC_DRUM_TEMPLATE.detail}</p>
            </article>
          </div>
        </div>

        <footer className="tpl-pager drum-template-actions">
          <button
            className={applyCurrentClassName}
            type="button"
            data-tutorial-role={generateCurrentRole}
            disabled={generateCurrentLocked}
            onClick={handleApplyCurrentTemplate}
          >
            应用到本小节
          </button>
          <button
            className={applyAllClassName}
            type="button"
            data-tutorial-role={generateAllRole}
            disabled={generateAllLocked}
            onClick={handleApplyAllTemplate}
          >
            应用到整轨
          </button>
        </footer>
      </div>
    </section>
  );
}

export { DrumSequencer };
