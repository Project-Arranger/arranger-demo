import {
  ChevronUp,
  Keyboard,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  createElement,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  formatMelodyNoteParts,
  getMelodyKeyboardKey,
  getMelodyKeyNote,
  getMelodyScale,
  getMelodyScaleNoteIds,
  getMelodyScalePreviewNotes,
  isMelodyScalePitchClass,
  MELODY_KEY_SEQUENCE,
  MELODY_NOTES,
  MELODY_PITCH_CLASSES,
  MELODY_SCALES,
} from '../../data/melodyScales.js';
import {
  getMelodyCellRenderState,
  isMelodyCellActive,
} from '../melodyActions.js';
import {
  getMelodyRhythmTemplate,
  MELODY_RHYTHM_TEMPLATES,
} from '../melodyRhythmTemplates.js';
import { MELODY_RECORDING_PHASES } from '../useMelodyRecordingController.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { BEAT_NUMBERS } from '../uiShellData.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { EditorTrackIdentity } from './EditorTrackIdentity.jsx';
import { renderIcon } from './icons.js';
import { PianoRoll } from './PianoRoll.jsx';
import { TrackBarPager } from './TrackBarPager.jsx';

const MELODY_EXAMPLE_DISPLAY_BY_TARGET = Object.freeze({
  '1188008': '1188008',
  '013553105310': '0135 5310 53 10',
  '805803801010131': '805 803 801 0101 31',
});

const ICON_CLOSE_URL = `${import.meta.env.BASE_URL}assets/skeuo/icon-x.svg`;

function renderMelodyMiniGroove(template) {
  return BEAT_NUMBERS.map((beatNumber) => (
    <span
      className="chord-template-mini-beat-group"
      key={`${template.id}-beat-${beatNumber}`}
    >
      {BEAT_NUMBERS.map((stepNumber) => {
        const step = (beatNumber - 1) * 4 + stepNumber - 1;

        return (
          <span
            className={template.steps.includes(step) ? 'on' : ''}
            key={`${template.id}-step-${step}`}
          />
        );
      })}
    </span>
  ));
}

function addSetValue(set, value) {
  if (!value || set.has(value)) return set;
  const nextSet = new Set(set);
  nextSet.add(value);
  return nextSet;
}

function deleteSetValue(set, value) {
  if (!set.has(value)) return set;
  const nextSet = new Set(set);
  nextSet.delete(value);
  return nextSet;
}

function isEditableKeyboardTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;

  const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function renderPlayGlyph() {
  return <span className="play-glyph" aria-hidden="true" />;
}

function MelodyEditor({
  canPageBars = false,
  clipName,
  matrix,
  melodyRecordingState,
  melodyRhythmTemplateId = null,
  melodyScaleId = 'major',
  onClearMelody,
  onClearMelodyBar,
  onClose = () => {},
  onNextBar = () => {},
  onPreviousBar = () => {},
  onMelodyPreview = () => {},
  onMelodyNoteOff = () => {},
  onMelodyNoteOn = () => {},
  onMelodyRecordCancel = () => {},
  onMelodyRecordConfirm = () => {},
  onMelodyRecordToggle = () => {},
  onMelodyRhythmTemplateApply = () => {},
  onMelodyScaleChange = () => {},
  onMelodyStepToggle = () => {},
  onRenameClip,
  selectedBar,
  trackId = 'melody',
  tutorialLocked = false,
  tutorialTargets,
}) {
  const [pickerMode, setPickerMode] = useState(null);
  const [playingKeys, setPlayingKeys] = useState(() => new Set());
  const [selectedRhythmTemplateId, setSelectedRhythmTemplateId] = useState(
    melodyRhythmTemplateId,
  );
  const scaleButtonRole = getTutorialControlRole(tutorialTargets, 'melody-scale-button');
  const scaleButtonDisabled = tutorialLocked && scaleButtonRole !== 'target';
  const exampleKeysTarget = tutorialTargets?.controls?.find((target) => (
    target.name?.startsWith?.('melody-example-keys:')
  ));
  const exampleKeysRole = exampleKeysTarget?.role ?? null;
  const exampleKeysId = exampleKeysTarget?.name?.slice('melody-example-keys:'.length) ?? '';
  const exampleKeysLabel = MELODY_EXAMPLE_DISPLAY_BY_TARGET[exampleKeysId] ?? exampleKeysId;
  const activeScale = getMelodyScale(melodyScaleId);
  const activeRhythmTemplate = getMelodyRhythmTemplate(melodyRhythmTemplateId);
  const recordingPhase = melodyRecordingState?.phase ?? MELODY_RECORDING_PHASES.IDLE;
  const recordingActive = recordingPhase === MELODY_RECORDING_PHASES.COUNT_IN
    || recordingPhase === MELODY_RECORDING_PHASES.RECORDING;
  const activeRhythmRecordingStep = recordingPhase === MELODY_RECORDING_PHASES.RECORDING
    ? activeRhythmTemplate?.steps[melodyRecordingState?.recordedNotes] ?? null
    : null;
  const activeScaleNoteIds = useMemo(
    () => new Set(getMelodyScaleNoteIds(melodyScaleId)),
    [melodyScaleId],
  );
  const highlightedStepIds = useMemo(
    () => new Set(getMelodyRhythmTemplate(melodyRhythmTemplateId)?.steps ?? []),
    [melodyRhythmTemplateId],
  );
  const activePlayedNotes = useMemo(() => new Set(
    [...playingKeys]
      .map((key) => getMelodyKeyNote(key))
      .filter(Boolean),
  ), [playingKeys]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || isEditableKeyboardTarget(event.target)) return;
      const note = getMelodyKeyNote(event.key);
      if (!note) return;
      flushSync(() => {
        setPlayingKeys((keys) => addSetValue(keys, getMelodyKeyboardKey(event.key)));
      });
    };
    const handleKeyUp = (event) => {
      if (!getMelodyKeyNote(event.key)) return;
      setPlayingKeys((keys) => deleteSetValue(keys, getMelodyKeyboardKey(event.key)));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePreviewStart = (key, note) => {
    flushSync(() => {
      setPlayingKeys((keys) => addSetValue(keys, key));
    });
    onMelodyNoteOn(note);
  };
  const handlePreviewEnd = (key, note) => {
    setPlayingKeys((keys) => deleteSetValue(keys, key));
    onMelodyNoteOff(note);
  };
  const handleClose = () => {
    setPickerMode(null);
    onClose();
  };

  return (
    <section className="editor" data-screen-label="Melody Editor" data-picker={pickerMode ?? undefined}>
      <header className="editor-head">
        <div className="editor-left">
          {createElement(EditorTrackIdentity, { trackId: 'melody', label: 'Melody' })}
          <div className="clip-title">
            <div className="crumb">Melody · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
            <div className="clip-name-meta">
              MELODY EDITOR - BAR
              {' '}
              {selectedBar + 1}
              {' · '}
              {activeScale.label}
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className={[
              'btn-template-groove',
              activeRhythmTemplate ? 'btn-template-groove-active' : '',
            ].filter(Boolean).join(' ')}
            aria-label="选择旋律律动"
            type="button"
            disabled={tutorialLocked || recordingActive}
            onClick={() => {
              setSelectedRhythmTemplateId(melodyRhythmTemplateId);
              setPickerMode('rhythm');
            }}
          >
            {renderIcon(SlidersHorizontal)}
            {activeRhythmTemplate?.name ?? '律动模板'}
          </button>
          <button
            className={[
              'btn-template-groove',
              scaleButtonRole === 'target' ? 'tutorial-control-target' : '',
            ].filter(Boolean).join(' ')}
            aria-label="选择音阶"
            aria-disabled={scaleButtonDisabled}
            data-tutorial-role={scaleButtonRole ?? undefined}
            type="button"
            disabled={scaleButtonDisabled}
            onClick={() => setPickerMode('scale')}
          >
            {renderIcon(ChevronUp)}
            选择音阶
          </button>
          <button
            className={[
              'btn-template',
              'melody-record-button',
              recordingActive ? 'recording' : '',
            ].filter(Boolean).join(' ')}
            aria-label={recordingActive ? '停止旋律写入' : '开始旋律写入'}
            type="button"
            disabled={tutorialLocked}
            onClick={onMelodyRecordToggle}
          >
            {recordingPhase === MELODY_RECORDING_PHASES.COUNT_IN
              ? `预拍 ${melodyRecordingState.countInBeat}`
              : recordingPhase === MELODY_RECORDING_PHASES.RECORDING
                ? activeRhythmTemplate
                  ? `写入 ${melodyRecordingState.recordedNotes}/${melodyRecordingState.totalNotes}`
                  : '写入中'
                : '写入'}
          </button>
          <button className="btn-template drum-clear-action" type="button" disabled={tutorialLocked} onClick={onClearMelodyBar}>
            清空本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" disabled={tutorialLocked} onClick={onClearMelody}>
            清空整轨
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
        className: 'melody-editor-pager-shell',
        contentClassName: 'melody-editor-scroll',
        onNextBar,
        onPreviousBar,
        trackId,
      }, (
        <>
        <div className="keyboard-strip" role="group" aria-label="QWERTY ↔ 音阶 对应关系">
          <div className="ks-intro">
            <div className="ks-glyph">
              {renderIcon(Keyboard)}
            </div>
            <div className="ks-copy">
              <span className="ks-eyebrow">Play · 试奏</span>
              <span className="ks-title">键盘奏响音符</span>
              <span className="ks-scale">{activeScale.label}</span>
            </div>
          </div>

          <div className="ks-keys" data-scale={activeScale.id} aria-label="按键 ↔ 音符 对应表">
            {MELODY_KEY_SEQUENCE.map((key, index) => {
              const note = getMelodyKeyNote(key);
              const { name, octave } = formatMelodyNoteParts(note);
              const playing = playingKeys.has(key);
              const scaleTone = isMelodyScalePitchClass(
                activeScale.id,
                MELODY_PITCH_CLASSES[index],
              );

              return (
                <button
                  className={[
                    'ks-key',
                    scaleTone ? 'scale-tone' : '',
                    playing ? 'playing' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  data-key={key}
                  data-note={name}
                  data-oct={octave}
                  key={key}
                  aria-label={`${note} - 按 ${key}`}
                  onPointerDown={() => handlePreviewStart(key, note)}
                  onPointerLeave={() => handlePreviewEnd(key, note)}
                  onPointerUp={() => handlePreviewEnd(key, note)}
                >
                  <span className="ks-letter">{key}</span>
                  <span className="ks-note">
                    {name}
                    <span className="oct">{octave}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {exampleKeysTarget ? (
          <div
            className={[
              'melody-example-keys',
              exampleKeysRole === 'target' ? 'tutorial-control-target' : '',
            ].filter(Boolean).join(' ')}
            aria-label={`示例乐句 ${exampleKeysLabel}`}
            data-tutorial-role={exampleKeysRole ?? undefined}
          >
            {exampleKeysLabel.split('').map((character, index) => (
              character === ' ' ? (
                <span className="melody-example-gap" aria-hidden="true" key={`gap-${index}`} />
              ) : (
                <span className="melody-example-key" key={`${character}-${index}`}>
                  {character}
                </span>
              )
            ))}
          </div>
        ) : null}

        {createElement(PianoRoll, {
          activeHighlightedStep: activeRhythmRecordingStep,
          activeNoteIds: activePlayedNotes,
          ariaLabel: 'Melody piano roll',
          autoRevealActiveNote: true,
          disabled: tutorialLocked,
          getCellRenderState: (step, note) => (
            getMelodyCellRenderState(matrix, selectedBar, step, note)
          ),
          highlightedNoteIds: activeScaleNoteIds,
          highlightedStepIds,
          initialTopNote: 'B4',
          isCellActive: (step, note) => (
            isMelodyCellActive(matrix, selectedBar, step, note)
          ),
          notes: MELODY_NOTES,
          onCellPressEnd: recordingActive
            ? (_step, note) => onMelodyNoteOff(note)
            : undefined,
          onCellPressStart: recordingActive
            ? (_step, note) => onMelodyNoteOn(note)
            : undefined,
          onCellToggle: onMelodyStepToggle,
          trackId,
        })}
        </>
      ))}

      {recordingPhase === MELODY_RECORDING_PHASES.COUNT_IN ? (
        <div className="melody-record-count-in" role="status" aria-live="assertive">
          <span>预拍</span>
          <strong>{melodyRecordingState.countInBeat}</strong>
        </div>
      ) : null}

      <section
        className="scale-picker melody-scale-workspace"
        aria-labelledby="melodyScaleWorkspaceTitle"
        aria-modal="true"
        data-screen-label="Scale Picker"
        hidden={pickerMode !== 'scale'}
        role="dialog"
      >
        <div className="melody-scale-workspace-panel">
          <header className="melody-scale-workspace-head">
            <div>
              <h2 id="melodyScaleWorkspaceTitle">旋律音阶</h2>
              <span>
                音阶库 · {Object.keys(MELODY_SCALES).length} 个
              </span>
            </div>
            <button
              className="melody-scale-workspace-icon-button close"
              aria-label="关闭二级菜单"
              title="关闭二级菜单"
              type="button"
              onClick={() => setPickerMode(null)}
            >
              {renderIcon(X)}
            </button>
          </header>

          <div className="melody-scale-workspace-body">
            <div className="melody-scale-workspace-label">
              <strong>选择旋律音阶</strong>
              <span>MELODY SCALE</span>
              <p>音阶只改变高亮和试听，十二个半音始终可以编辑。</p>
            </div>

            <div className="melody-scale-options" id="scaleList" aria-label="选择旋律音阶">
              {Object.values(MELODY_SCALES).map((scale) => {
                const scaleCardRole = getTutorialControlRole(tutorialTargets, `melody-scale-card:${scale.id}`);
                const scaleCardDisabled = tutorialLocked && scaleCardRole !== 'target';

                return (
                  <article
                    className={[
                      'sctpl-card',
                      'melody-scale-card',
                      scale.id === activeScale.id ? 'selected' : '',
                      scaleCardRole === 'target' ? 'tutorial-control-target' : '',
                    ].filter(Boolean).join(' ')}
                    aria-disabled={scaleCardDisabled}
                    data-scale={scale.id}
                    data-tutorial-role={scaleCardRole ?? undefined}
                    key={scale.id}
                  >
                    <button
                      className="melody-scale-card-select"
                      aria-label={`选择${scale.label}`}
                      aria-pressed={scale.id === activeScale.id}
                      disabled={scaleCardDisabled}
                      type="button"
                      onClick={() => {
                        onMelodyScaleChange(scale.id);
                        setPickerMode(null);
                      }}
                    >
                      <span className="sctpl-name-row">
                        <strong className="sctpl-name">{scale.label}</strong>
                        {scale.tag ? <span className="sctpl-default-tag">{scale.tag}</span> : null}
                      </span>
                      <span className="sctpl-notes" aria-label="音阶包含的音符">
                        {MELODY_PITCH_CLASSES.map((pitchClass) => {
                          const scaleTone = isMelodyScalePitchClass(scale.id, pitchClass);
                          return (
                            <span
                              className={[
                                'sctpl-note',
                                scaleTone ? 'scale-tone' : '',
                              ].filter(Boolean).join(' ')}
                              key={`${scale.id}-${pitchClass}`}
                            >
                              {pitchClass}
                            </span>
                          );
                        })}
                      </span>
                      <span className="sctpl-desc">{scale.description}</span>
                    </button>
                    <div className="sctpl-foot">
                      <span className="sctpl-foot-label">{scale.footLabel}</span>
                      <button
                        className="sctpl-play"
                        aria-label={`试听${scale.label}`}
                        data-action="preview"
                        type="button"
                        disabled={scaleCardDisabled}
                        onClick={() => onMelodyPreview(getMelodyScalePreviewNotes(scale.id))}
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
        </div>
      </section>

      <section
        className="chord-template-workspace melody-rhythm-workspace"
        aria-labelledby="melodyRhythmWorkspaceTitle"
        aria-modal="true"
        data-screen-label="Melody Rhythm Picker"
        hidden={pickerMode !== 'rhythm'}
        role="dialog"
      >
        <div className="chord-template-workspace-panel melody-rhythm-workspace-panel">
          <header className="chord-template-workspace-head melody-rhythm-workspace-head">
            <h2 id="melodyRhythmWorkspaceTitle">旋律律动模板</h2>
            <button
              className="chord-template-workspace-icon-button close"
              aria-label="关闭律动菜单"
              title="关闭二级菜单"
              type="button"
              onClick={() => setPickerMode(null)}
            >
              <img src={ICON_CLOSE_URL} alt="" aria-hidden="true" />
            </button>
          </header>
          <div className="chord-template-workspace-body melody-rhythm-workspace-body">
            <div className="chord-template-workspace-label melody-rhythm-workspace-label">
              <strong>选择律动节奏</strong>
              <span>MELODY RHYTHM</span>
              <p>先选择模板，再决定应用到当前小节或所有已有 Melody Clips。</p>
            </div>
            <div
              className="chord-template-groove-options melody-rhythm-options"
              aria-label="选择旋律律动模板"
            >
              {MELODY_RHYTHM_TEMPLATES.map((template) => (
                <button
                  aria-pressed={template.id === selectedRhythmTemplateId}
                  data-template-id={template.id}
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedRhythmTemplateId(template.id)}
                >
                  <strong>{template.name}</strong>
                  <span className="chord-template-mini-groove" aria-hidden="true">
                    {renderMelodyMiniGroove(template)}
                  </span>
                  <span className="chord-template-card-description">
                    第 {template.steps.map((step) => step + 1).join('、')} 格
                  </span>
                  <span className="chord-template-groove-meta">
                    {template.steps.length} 个音 / 小节
                  </span>
                </button>
              ))}
            </div>
            <div aria-hidden="true" />
            <div className="chord-template-workspace-actions melody-rhythm-actions">
              <button
                className="primary"
                type="button"
                disabled={!getMelodyRhythmTemplate(selectedRhythmTemplateId)}
                onClick={() => {
                  onMelodyRhythmTemplateApply(selectedRhythmTemplateId, 'bar');
                  setPickerMode(null);
                }}
              >
                应用到本小节
              </button>
              <button
                type="button"
                disabled={!getMelodyRhythmTemplate(selectedRhythmTemplateId)}
                onClick={() => {
                  onMelodyRhythmTemplateApply(selectedRhythmTemplateId, 'global');
                  setPickerMode(null);
                }}
              >
                应用到全局
              </button>
            </div>
          </div>
        </div>
      </section>

      {recordingPhase === MELODY_RECORDING_PHASES.CONFIRM ? (
        <div className="melody-record-confirm-overlay" role="presentation">
          <section
            className="melody-record-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="melodyRecordConfirmTitle"
          >
            <span>MELODY WRITE</span>
            <h2 id="melodyRecordConfirmTitle">本次写入会清空当前小节</h2>
            <p>确认后会删除当前 Melody 音符，但保留已经应用的律动模板。</p>
            <div>
              <button type="button" onClick={onMelodyRecordCancel}>取消</button>
              <button className="primary" type="button" onClick={onMelodyRecordConfirm}>
                清空并写入
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export { MelodyEditor };
