import {
  ChevronLeft,
  ChevronRight,
  Drum,
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
import { ClipNameInput } from './ClipNameInput.jsx';
import { renderIcon } from './icons.js';

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
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const dragSessionRef = useRef(null);

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

  return (
    <section className="editor drum-editor" data-screen-label="Drum Sequencer">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(Drum)}
          </div>
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
          <button className="btn-template drum-action" type="button" onClick={onGenerateCurrentBar}>
            为本小节生成基础律动
          </button>
          <button className="btn-template drum-action" type="button" onClick={onGenerateAllBars}>
            全局生成基础律动
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={onClearCurrentBar}>
            清空本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={onClearDrums}>
            清空整轨
          </button>
          <button
            className="editor-close"
            aria-label="Close editor"
            title="Close"
            type="button"
            onClick={onClose}
          >
            {renderIcon(X)}
          </button>
        </div>
      </header>

      <div className="drum-seq-body">
        <div className="drum-seq-pager-shell">
          <button
            className="drum-page-btn previous"
            aria-label="上一小节"
            title="上一小节"
            type="button"
            disabled={!canPageBars}
            onClick={onPreviousBar}
          >
            {renderIcon(ChevronLeft)}
          </button>

          <div className="drum-seq-panel">
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
                  const interactiveTutorialCell = tutorialRole === 'target' || tutorialRole === 'source';
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
                        tutorialRole === 'target' ? 'tutorial-cell-target' : '',
                        tutorialRole === 'source' ? 'tutorial-cell-source' : '',
                        tutorialRole === 'completed' ? 'tutorial-cell-completed' : '',
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
          </div>

          <button
            className="drum-page-btn next"
            aria-label="下一小节"
            title="下一小节"
            type="button"
            disabled={!canPageBars}
            onClick={onNextBar}
          >
            {renderIcon(ChevronRight)}
          </button>
        </div>
      </div>
    </section>
  );
}

export { DrumSequencer };
