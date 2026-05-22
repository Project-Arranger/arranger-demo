import { Drum, X } from 'lucide-react';
import { createElement, useState } from 'react';
import { STEPS_PER_BAR } from '../../store/useMusicStore.js';
import {
  DRUM_SEQUENCER_ROWS,
  isDrumsStepActive,
} from '../drumSequencerData.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { renderIcon } from './icons.js';

const STEP_NUMBERS = Array.from({ length: STEPS_PER_BAR }, (_, index) => index + 1);

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
  clipName,
  onClose = () => {},
  onClearCurrentBar,
  onClearDrums,
  onGenerateAllBars,
  onGenerateCurrentBar,
  onStepMove,
  onStepToggle,
  onRenameClip,
  selectedBar,
  tutorialLocked = false,
  tutorialTargets,
}) {
  const [dragSource, setDragSource] = useState(null);

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
            清空 Drums
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
        <div className="drum-seq-panel">
          <div className="drum-step-numbers" aria-hidden="true">
            <div />
            <div className="drum-steps">
              {STEP_NUMBERS.map((stepNumber) => (
                <span
                  className={`drum-step-number${stepNumber % 4 === 0 ? ' beat-end' : ''} mono`}
                  key={stepNumber}
                >
                  {stepNumber}
                </span>
              ))}
            </div>
          </div>

          {DRUM_SEQUENCER_ROWS.map((row) => (
            <div className="drum-row" key={row.id}>
              <div className="drum-row-label">
                <span className="drum-dot" data-instrument={row.id} />
                <span>{row.label}</span>
              </div>
              <div className="drum-steps">
                {STEP_NUMBERS.map((stepNumber) => {
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
                  return (
                    <button
                      className={[
                        'drum-step',
                        active ? 'active' : '',
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
                      draggable={tutorialRole === 'source'}
                      onDragEnd={() => setDragSource(null)}
                      onDragOver={(event) => {
                        if (tutorialRole !== 'target' || !dragSource) return;
                        event.preventDefault();
                      }}
                      onDragStart={(event) => {
                        if (tutorialRole !== 'source') return;
                        setDragSource({ instrument: row.id, step: stepIndex });
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDrop={(event) => {
                        if (tutorialRole !== 'target' || !dragSource) return;
                        event.preventDefault();
                        onStepMove?.(dragSource.instrument, dragSource.step, stepIndex);
                        setDragSource(null);
                      }}
                      onClick={() => onStepToggle(row.id, stepIndex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="drum-bar-indicator mono">
            {selectedBar + 1}
            {' '}
            / 8
          </div>
        </div>
      </div>
    </section>
  );
}

export { DrumSequencer };
