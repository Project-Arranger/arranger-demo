import {
  AudioWaveform,
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
import { ClipNameInput } from './ClipNameInput.jsx';
import { EditorTrackIdentity } from './EditorTrackIdentity.jsx';
import { renderIcon } from './icons.js';
import { PianoRoll } from './PianoRoll.jsx';
import { TrackBarPager } from './TrackBarPager.jsx';

const ICON_PLAY_URL = `${import.meta.env.BASE_URL}assets/skeuo/icon-play.svg`;
const ICON_CLOSE_URL = `${import.meta.env.BASE_URL}assets/skeuo/icon-x.svg`;

function renderBassMiniGroove(template) {
  const previewHitStepSet = new Set(getBassGroovePreviewSteps(template));

  return BEAT_NUMBERS.map((beatNumber) => (
    <span className="chord-template-mini-beat-group" key={`${template.id}-beat-${beatNumber}`}>
      {BEAT_NUMBERS.map((stepNumber) => {
        const step = (beatNumber - 1) * 4 + stepNumber - 1;
        return (
          <span
            className={previewHitStepSet.has(step) ? 'on' : ''}
            key={`${template.id}-step-${step}`}
          />
        );
      })}
    </span>
  ));
}

function isTutorialControlAllowed(role) {
  return role === 'target' || role === 'allowed';
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
  const groovePickerOpen = pickerMode === 'groove';
  const closeBassPicker = useCallback(() => setPickerMode(null), []);

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
            disabled={tutorialLocked && !isTutorialControlAllowed(grooveButtonRole)}
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
        createElement(PianoRoll, {
          ariaLabel: 'Bass piano roll',
          disabled: tutorialLocked,
          initialTopNote: 'D1',
          isCellActive: (step, note) => (
            isBassCellActive(matrix, selectedBar, step, note)
          ),
          notes: BASS_NOTES,
          onCellToggle: onBassStepToggle,
          onNotePreview: onBassPreview,
          onPitchInteraction: closeBassPicker,
          trackId,
        })
      ))}

      <section
        className="chord-template-workspace bass-template-workspace"
        aria-labelledby="bassTemplateWorkspaceTitle"
        aria-modal="true"
        data-screen-label="Bass Groove Template Picker"
        hidden={!groovePickerOpen}
        role="dialog"
      >
        <div className="chord-template-workspace-panel bass-template-workspace-panel">
          <header className="chord-template-workspace-head bass-template-workspace-head">
            <h2 id="bassTemplateWorkspaceTitle">Bass 弹奏律动模板</h2>
            <button
              className="chord-template-workspace-icon-button close"
              aria-label="关闭Bass弹奏律动模板"
              title="关闭二级菜单"
              type="button"
              onClick={closeBassPicker}
            >
              <img src={ICON_CLOSE_URL} alt="" aria-hidden="true" />
            </button>
          </header>

          <div className="chord-template-workspace-body bass-template-workspace-body">
            <div className="chord-template-workspace-label bass-template-workspace-label">
              <strong>选择 Bass 弹奏律动</strong>
              <span>BASS GROOVE</span>
              <p>点击卡片后，立即应用到已有 Bass Clips。</p>
            </div>

            <div className="bass-template-groove-options" aria-label="选择Bass弹奏律动模板">
              {BASS_GROOVE_TEMPLATES.map((template) => {
                const templateCardRole = getTutorialControlRole(
                  tutorialTargets,
                  `bass-groove-card:${template.id}`,
                );
                const templateCardDisabled = tutorialLocked && !isTutorialControlAllowed(templateCardRole);
                const templateCardClassName = [
                  'bass-template-groove-card',
                  selectedGrooveTemplateId === template.id ? 'selected' : '',
                  templateCardDisabled ? 'is-disabled' : '',
                  templateCardRole === 'target' ? 'tutorial-control-target' : '',
                ].filter(Boolean).join(' ');

                return (
                  <article
                    className={templateCardClassName}
                    aria-disabled={templateCardDisabled}
                    data-gtpl={template.id}
                    data-tutorial-role={templateCardRole}
                    key={template.id}
                  >
                    <button
                      className="bass-template-card-select"
                      aria-label={`应用 ${template.name}`}
                      aria-pressed={selectedGrooveTemplateId === template.id}
                      disabled={templateCardDisabled}
                      type="button"
                      onClick={() => handleGrooveTemplateApply(template.id)}
                    >
                      <span className="chord-template-card-head">
                        <strong>{template.name}</strong>
                        {template.default ? <span>默认</span> : null}
                      </span>
                      <span className="chord-template-mini-groove" aria-label={`律动预览·${template.name}`}>
                        {renderBassMiniGroove(template)}
                      </span>
                      <span className="chord-template-card-description">{template.desc}</span>
                      <span className="bass-template-card-detail">{template.detail}</span>
                    </button>
                    <div className="bass-template-card-footer">
                      <span className="chord-template-groove-meta">{template.hitLabel}</span>
                      <button
                        className="chord-template-workspace-icon-button preview bass-template-card-preview"
                        type="button"
                        aria-label={`试听 ${template.name}`}
                        disabled={templateCardDisabled}
                        onClick={() => onBassGrooveTemplatePreview(template.id)}
                      >
                        <img src={ICON_PLAY_URL} alt="" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export { BassEditor };
