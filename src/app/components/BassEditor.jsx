import {
  AudioWaveform,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  createElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  BASS_GROOVE_TEMPLATES,
  isBassCellActive,
} from '../bassActions.js';
import { getBassGroovePreviewSteps } from '../bassGroovePreview.js';
import { BASS_NOTES } from '../../data/bassNotes.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { BEAT_NUMBERS } from '../uiShellData.js';
import { usePitchRowHover } from '../usePitchRowHover.js';
import { usePitchScrollSync } from '../usePitchScrollSync.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { EditorTrackIdentity } from './EditorTrackIdentity.jsx';
import { renderIcon } from './icons.js';
import { TrackBarPager } from './TrackBarPager.jsx';

function renderPlayGlyph() {
  return <span className="play-glyph" aria-hidden="true" />;
}

function getTemplateStepLength(template) {
  return template.duration === '8n' ? '8' : '16';
}

function getGrooveStepClass(isHit, step) {
  return [
    'gtpl-step',
    step % 4 === 0 ? 'downbeat' : '',
    isHit ? 'hit-root' : '',
  ].filter(Boolean).join(' ');
}

function BassEditor({
  canPageBars = false,
  clipName,
  matrix,
  onBassPreview = () => {},
  onBassStepToggle = () => {},
  onBassGrooveTemplatePreview = () => {},
  onBassGrooveTemplateApply = () => {},
  onClearBassBar = () => {},
  onClearBass = () => {},
  onClose = () => {},
  onNextBar = () => {},
  onPreviousBar = () => {},
  onRenameClip,
  selectedBar,
  trackId = 'bass',
  tutorialLocked = false,
  tutorialTargets,
}) {
  const [pickerMode, setPickerMode] = useState(null);
  const [selectedGrooveTemplateId, setSelectedGrooveTemplateId] = useState('bass-8th-basic');
  const {
    handlePitchRowPointerOut,
    handlePitchRowPointerOver,
    pitchRowHoverRef,
  } = usePitchRowHover();
  const groovePickerOpen = pickerMode === 'groove';
  const closeBassPicker = useCallback(() => setPickerMode(null), []);
  const {
    canScrollPitchDown,
    canScrollPitchUp,
    handlePitchViewportScroll,
    handlePitchWheel,
    scalePitchViewportRef,
    scrollPitchByOctave,
    setBeatCellsViewportRef,
  } = usePitchScrollSync({ onPitchInteraction: closeBassPicker });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setPickerMode(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGrooveTemplateApply = (templateId) => {
    setSelectedGrooveTemplateId(templateId);
    onBassGrooveTemplateApply(templateId);
    setPickerMode(null);
  };

  const handleGrooveTemplateCardClick = (event, templateId) => {
    if (event.target.closest?.('[data-action="bgpreview"]')) return;
    handleGrooveTemplateApply(templateId);
  };

  const handleClose = () => {
    setPickerMode(null);
    onClose();
  };

  const grooveButtonRole = getTutorialControlRole(tutorialTargets, 'bass-groove-button');
  const grooveButtonClassName = [
    'btn-template-groove',
    grooveButtonRole === 'target' ? 'tutorial-control-target' : '',
  ].filter(Boolean).join(' ');

  return (
    <section className="editor bass-editor" data-screen-label="Bass Editor" data-picker={pickerMode ?? undefined}>
      <header className="editor-head">
        <div className="editor-left">
          {createElement(EditorTrackIdentity, { trackId: 'bass', label: 'Bass' })}
          <div className="clip-title">
            <div className="crumb">Bass · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
            <div className="clip-name-meta">
              BASS EDITOR - BAR
              {' '}
              {selectedBar + 1}
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className={grooveButtonClassName}
            aria-label="选择Bass弹奏律动模板"
            type="button"
            data-tutorial-role={grooveButtonRole}
            disabled={tutorialLocked && grooveButtonRole !== 'target'}
            onClick={() => setPickerMode('groove')}
          >
            {renderIcon(AudioWaveform)}
            选择Bass弹奏律动模板
          </button>
          <button
            className="btn-template drum-clear-action"
            type="button"
            disabled={tutorialLocked}
            onClick={onClearBassBar}
          >
            清空本小节
          </button>
          <button
            className="btn-template drum-clear-action"
            type="button"
            disabled={tutorialLocked}
            onClick={onClearBass}
          >
            清空整轨
          </button>
          <button
            className="tool-icon"
            aria-label="Clear phrase"
            title="Clear phrase"
            type="button"
            disabled={tutorialLocked}
            onClick={onClearBassBar}
          >
            {renderIcon(Trash2)}
          </button>
          <button className="tool-icon" aria-label="More" title="More" type="button" disabled={tutorialLocked}>
            {renderIcon(MoreHorizontal)}
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

      {createElement(TrackBarPager, {
        canPageBars,
        onNextBar,
        onPreviousBar,
        trackId,
      }, (
        <div
          className="seq-body bass-seq-body"
          ref={pitchRowHoverRef}
          onPointerOut={handlePitchRowPointerOut}
          onPointerOver={handlePitchRowPointerOver}
          onWheel={handlePitchWheel}
        >
          <aside className="scale-rail bass-scale-rail" aria-label="Bass note ruler">
            <button
              className="scale-arrow"
              aria-label="Scroll up an octave"
              title="Scroll up an octave"
              type="button"
              disabled={!canScrollPitchUp}
              onClick={() => scrollPitchByOctave(-1)}
            >
              {renderIcon(ChevronUp)}
            </button>
            <div
              className="scale-notes-viewport"
              ref={scalePitchViewportRef}
              onScroll={handlePitchViewportScroll}
            >
              <div className="scale-notes bass-scale-notes">
                {BASS_NOTES.map((note, rowIndex) => (
                  <button
                    className={[
                      'note-key',
                      'bass-note-key',
                      note.sharp ? 'sharp' : '',
                      note.root ? 'root' : '',
                    ].filter(Boolean).join(' ')}
                    data-row={rowIndex}
                    key={note.note}
                    type="button"
                    disabled={tutorialLocked}
                    onClick={() => onBassPreview(note.note)}
                  >
                    {note.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="scale-arrow"
              aria-label="Scroll down an octave"
              title="Scroll down an octave"
              type="button"
              disabled={!canScrollPitchDown}
              onClick={() => scrollPitchByOctave(1)}
            >
              {renderIcon(ChevronDown)}
            </button>
          </aside>

          <div className="chord-grid bass-grid">
            {BEAT_NUMBERS.map((beatNumber) => {
              const beatIndex = beatNumber - 1;

              return (
                <div
                  className="beat-group bass-beat-group"
                  key={beatNumber}
                  style={{ gridColumn: beatIndex + 1 }}
                >
                  <div className="pitch-grid-head-spacer" aria-hidden="true" />
                  <div
                    className="beat-cells-viewport"
                    ref={(viewport) => setBeatCellsViewportRef(beatIndex, viewport)}
                    onScroll={handlePitchViewportScroll}
                  >
                    <div className="beat-cells bass-beat-cells">
                      {BASS_NOTES.flatMap((note, rowIndex) => (
                        BEAT_NUMBERS.map((stepNumber, colIndex) => {
                          const step = beatIndex * 4 + colIndex;
                          const active = isBassCellActive(matrix, selectedBar, step, note.note);

                          return (
                            <button
                              className={[
                                'cell',
                                'bass-cell',
                                note.sharp ? 'sharp' : '',
                                active ? 'active' : '',
                              ].filter(Boolean).join(' ')}
                              data-row={rowIndex}
                              data-col={colIndex}
                              data-note={note.note}
                              key={`${note.note}-${stepNumber}`}
                              type="button"
                              aria-label={`${note.note} beat ${beatNumber}.${stepNumber}`}
                              aria-pressed={active}
                              disabled={tutorialLocked}
                              onClick={() => onBassStepToggle(step, note.note)}
                            />
                          );
                        })
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="gtpl-picker" role="dialog" aria-label="选择Bass弹奏律动模板" data-screen-label="Bass Groove Template Picker" hidden={!groovePickerOpen}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-groove-active" aria-label="关闭Bass弹奏律动模板" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(AudioWaveform)}
              选择Bass弹奏律动模板
            </button>
            <span className="tpl-meta">
              Bass 律动模板库 ·
              {' '}
              <span className="mono">{BASS_GROOVE_TEMPLATES.length}</span>
              {' '}
              个
            </span>
          </div>
          <div className="tpl-head-right">
            <label className="tpl-search">
              <input type="text" placeholder="搜索律动名称 / 音型..." />
            </label>
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(X)}
            </button>
          </div>
        </header>

        <div className="tpl-body">
          <div className="tpl-list" id="bgtplList">
            {BASS_GROOVE_TEMPLATES.map((template) => {
              const previewHitStepSet = new Set(getBassGroovePreviewSteps(template));
              const templateCardRole = getTutorialControlRole(
                tutorialTargets,
                `bass-groove-card:${template.id}`,
              );
              const templateCardDisabled = tutorialLocked && templateCardRole !== 'target';
              const templateCardClassName = [
                'gtpl-card',
                selectedGrooveTemplateId === template.id ? 'selected' : '',
                templateCardRole === 'target' ? 'tutorial-control-target' : '',
              ].filter(Boolean).join(' ');

              return (
                <article
                  className={templateCardClassName}
                  aria-disabled={templateCardDisabled}
                  data-gtpl={template.id}
                  data-tutorial-role={templateCardRole}
                  key={template.id}
                  onClick={(event) => {
                    if (templateCardDisabled) return;
                    handleGrooveTemplateCardClick(event, template.id);
                  }}
                >
                  <div className="gtpl-name-row">
                    <h3 className="gtpl-name">{template.name}</h3>
                    {template.default ? <span className="gtpl-default-tag">默认</span> : null}
                  </div>
                  <div className="gtpl-rhythm" aria-label={`律动预览·${template.name}`}>
                    <div className="gtpl-rhythm-grid">
                      {BEAT_NUMBERS.map((beatNumber) => (
                        <div className="gtpl-beat" key={`${template.id}-beat-${beatNumber}`}>
                          {BEAT_NUMBERS.map((stepNumber) => {
                            const step = (beatNumber - 1) * 4 + stepNumber - 1;
                            const isHit = previewHitStepSet.has(step);

                            return (
                              <span
                                className={getGrooveStepClass(isHit, step)}
                                data-len={isHit ? getTemplateStepLength(template) : undefined}
                                key={`${template.id}-${step}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="gtpl-beat-num mono">
                      {BEAT_NUMBERS.map((beatNumber) => (
                        <span key={`${template.id}-num-${beatNumber}`}>{beatNumber}</span>
                      ))}
                    </div>
                  </div>
                  <p className="gtpl-desc">{template.desc}</p>
                  <p className="gtpl-detail">{template.detail}</p>
                  <div className="gtpl-foot">
                    <span className="gtpl-foot-label mono">{template.hitLabel}</span>
                    <button
                      className="gtpl-play"
                      type="button"
                      aria-label={`试听 ${template.name}`}
                      data-action="bgpreview"
                      disabled={templateCardDisabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        onBassGrooveTemplatePreview(template.id);
                      }}
                    >
                      {renderPlayGlyph()}
                      试听
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <footer className="tpl-pager">
          <button className="tpl-pager-btn" type="button" aria-label="上一页" disabled>
            {renderIcon(ChevronUp)}
          </button>
          <span className="tpl-pager-count mono">
            <span className="now">1</span>
            {' '}
            / 1
          </span>
          <button className="tpl-pager-btn" type="button" aria-label="下一页" disabled>
            {renderIcon(ChevronDown)}
          </button>
        </footer>
      </div>
    </section>
  );
}

export { BassEditor };
