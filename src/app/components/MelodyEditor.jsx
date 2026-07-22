import {
  ChevronUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  createElement,
  useMemo,
  useState,
} from 'react';
import {
  formatMelodyNoteParts,
  getMelodyScale,
  getMelodyScaleNoteIds,
  getMelodyScalePreviewNotes,
  isMelodyScalePitchClass,
  MELODY_NOTES,
  MELODY_PITCH_CLASSES,
  MELODY_SCALES,
} from '../../data/melodyScales.js';
import {
  getMelodyInputGrid,
  getVirtualMelodyInputId,
  isMelodyInputAreaVisible,
  MELODY_INPUT_SOURCES,
} from '../../input/melodyInputLayout.js';
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
  AAFFGGF: 'AAFFGGF',
  GASDDSAGDSAG: 'GASD DSAG DS AG',
  FGDFGSFGAGAGASA: 'FGD FGS FGA GAGA SA',
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

function renderPlayGlyph() {
  return <span className="play-glyph" aria-hidden="true" />;
}

function MelodyEditor({
  activeInputNotes = new Set(),
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
  onMelodyWriteToggle = () => {},
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
  const recordingPhase = melodyRecordingState?.phase ?? MELODY_RECORDING_PHASES.IDLE;
  const activeRhythmTemplate = getMelodyRhythmTemplate(
    melodyRecordingState?.templateId ?? melodyRhythmTemplateId,
  );
  const writeBarProgress = Number.isInteger(melodyRecordingState?.currentBar)
    && Number.isInteger(melodyRecordingState?.startBar)
    ? melodyRecordingState.currentBar - melodyRecordingState.startBar + 1
    : 0;
  const melodyInputVisible = isMelodyInputAreaVisible({
    hasTemplate: Boolean(activeRhythmTemplate),
    phase: recordingPhase,
  });
  const recordingActive = recordingPhase === MELODY_RECORDING_PHASES.COUNT_IN
    || recordingPhase === MELODY_RECORDING_PHASES.RECORDING;
  const sequenceCaptureActive = recordingPhase === MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE;
  const recordButtonActive = recordingActive || sequenceCaptureActive;
  const scaleChangeLocked = recordingActive || [
    MELODY_RECORDING_PHASES.CONFIRM,
    MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE,
  ].includes(recordingPhase);
  const workflowLocked = recordingActive
    || scaleChangeLocked
    || sequenceCaptureActive;
  const activeRhythmRecordingStep = recordingPhase === MELODY_RECORDING_PHASES.STEP_EDIT
    ? melodyRecordingState?.selectedStep ?? null
    : sequenceCaptureActive
      ? activeRhythmTemplate?.steps[melodyRecordingState?.barRecordedNotes] ?? null
      : null;
  const melodyInputStatus = (() => {
    if (!activeRhythmTemplate) return null;
    if (recordingPhase === MELODY_RECORDING_PHASES.STEP_EDIT) {
      return `Step ${(melodyRecordingState?.selectedStep ?? 0) + 1} · 请选择音高`;
    }
    if (sequenceCaptureActive) {
      return [
        `总音符 ${melodyRecordingState?.recordedNotes ?? 0}/${melodyRecordingState?.totalNotes ?? 0}`,
        `小节 ${writeBarProgress}/${melodyRecordingState?.totalBars ?? 0}`,
      ].join(' · ');
    }
    if (recordingPhase === MELODY_RECORDING_PHASES.CONFIRM) return '确认重写 · 原旋律仍然保留';
    if (recordingPhase === MELODY_RECORDING_PHASES.OVERVIEW) {
      return '自由弹奏 · 不会写入；点击写入开始收集';
    }
    return null;
  })();
  const activeScaleNoteIds = useMemo(
    () => new Set(getMelodyScaleNoteIds(melodyScaleId)),
    [melodyScaleId],
  );
  const highlightedStepIds = useMemo(
    () => new Set(activeRhythmTemplate?.steps ?? []),
    [activeRhythmTemplate],
  );
  const melodyInputGrid = useMemo(
    () => getMelodyInputGrid(melodyScaleId),
    [melodyScaleId],
  );
  const activePlayedNotes = useMemo(
    () => new Set(activeInputNotes),
    [activeInputNotes],
  );

  const handlePreviewStart = (event, cell) => {
    if (!cell.enabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onMelodyNoteOn({
      inputId: getVirtualMelodyInputId(cell.rowIndex, cell.column, event.pointerId),
      note: cell.note,
      source: MELODY_INPUT_SOURCES.VIRTUAL,
    });
  };
  const handlePreviewEnd = (event, cell) => {
    onMelodyNoteOff({
      inputId: getVirtualMelodyInputId(cell.rowIndex, cell.column, event.pointerId),
      note: cell.note ?? undefined,
    });
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
              <span>
                MELODY EDITOR - BAR
                {' '}
                {selectedBar + 1}
                {' · '}
                {activeScale.label}
              </span>
              {melodyInputStatus ? (
                <span
                  className="melody-input-status-inline"
                  role="status"
                  aria-live="polite"
                >
                  {melodyInputStatus}
                </span>
              ) : null}
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
            disabled={tutorialLocked || workflowLocked}
            onClick={() => {
              setSelectedRhythmTemplateId(activeRhythmTemplate?.id ?? melodyRhythmTemplateId);
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
            aria-disabled={scaleButtonDisabled || scaleChangeLocked}
            data-tutorial-role={scaleButtonRole ?? undefined}
            type="button"
            disabled={scaleButtonDisabled || scaleChangeLocked}
            onClick={() => setPickerMode('scale')}
          >
            {renderIcon(ChevronUp)}
            选择音阶
          </button>
          <button
            className={[
              'btn-template',
              'melody-record-button',
              recordButtonActive ? 'recording' : '',
            ].filter(Boolean).join(' ')}
            aria-label={recordButtonActive ? '控制旋律写入' : '开始旋律写入'}
            type="button"
            disabled={tutorialLocked}
            onClick={onMelodyWriteToggle}
          >
            {recordingPhase === MELODY_RECORDING_PHASES.COUNT_IN
              ? `预拍 ${melodyRecordingState.countInBeat}`
              : recordingPhase === MELODY_RECORDING_PHASES.RECORDING
                ? `写入中 ${writeBarProgress}/${melodyRecordingState?.totalBars ?? 0}`
                : recordingPhase === MELODY_RECORDING_PHASES.SEQUENCE_CAPTURE
                    ? `取消 ${melodyRecordingState.recordedNotes}/${melodyRecordingState.totalNotes}`
                    : recordingPhase === MELODY_RECORDING_PHASES.CONFIRM
                      ? '确认重写'
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
        contentClassName: [
          'melody-editor-scroll',
          melodyInputVisible ? 'has-input-dock' : '',
        ].filter(Boolean).join(' '),
        onNextBar,
        onPreviousBar,
        trackId,
      }, (
        <>
        {melodyInputVisible ? (
        <div className="keyboard-strip" role="group" aria-label="QWERTY、网页与 Launchpad 音阶对应关系">
          <div className="ks-keys" data-scale={activeScale.id} aria-label="三八度按键与音符对应表">
            {melodyInputGrid.map((row) => (
              <div className="ks-row" key={row[0].rowId}>
                <span className="ks-octave" aria-hidden="true">{row[0].octave}</span>
                {row.map((cell) => {
                  const { name, octave } = formatMelodyNoteParts(cell.note ?? '');
                  const playing = cell.note ? activePlayedNotes.has(cell.note) : false;
                  return (
                    <button
                      className={[
                        'ks-key',
                        cell.enabled ? 'scale-tone' : 'disabled',
                        playing ? 'playing' : '',
                      ].filter(Boolean).join(' ')}
                      type="button"
                      data-key={cell.keyLabel}
                      data-note={cell.note ?? ''}
                      data-oct={octave}
                      disabled={!cell.enabled}
                      key={`${cell.rowId}-${cell.column}`}
                      aria-label={cell.enabled ? `${cell.note} - 按 ${cell.keyLabel}` : `${cell.keyLabel} - 当前音阶未使用`}
                      onPointerCancel={(event) => handlePreviewEnd(event, cell)}
                      onPointerDown={(event) => handlePreviewStart(event, cell)}
                      onPointerUp={(event) => handlePreviewEnd(event, cell)}
                    >
                      <span className="ks-letter">{cell.keyLabel}</span>
                      <span className="ks-divider" aria-hidden="true">·</span>
                      <span className="ks-note">
                        {cell.enabled ? name : '—'}
                        {cell.enabled ? <span className="oct">{octave}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        ) : null}

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
            ? (_step, note) => onMelodyNoteOff({ inputId: `virtual:piano-roll:${note}`, note })
            : undefined,
          onCellPressStart: recordingActive
            ? (_step, note) => onMelodyNoteOn({
              inputId: `virtual:piano-roll:${note}`,
              note,
              source: MELODY_INPUT_SOURCES.VIRTUAL,
            })
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
            <h2 id="melodyRecordConfirmTitle">
              是否覆盖第 {melodyRecordingState.startBar + 1}–{melodyRecordingState.endBar + 1} 小节已有旋律？
            </h2>
            <p>
              {melodyRecordingState.mode === 'template'
                ? '每个小节会在收集完整一组音符后才原子覆盖；提前停止会保留当前未完成和未来小节。'
                : '自由写入只会在播放到每个小节时覆盖；提前停止会保留尚未到达的小节。'}
            </p>
            <div>
              <button type="button" onClick={onMelodyRecordCancel}>取消</button>
              <button className="primary" type="button" onClick={onMelodyRecordConfirm}>
                覆盖并开始写入
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export { MelodyEditor };
