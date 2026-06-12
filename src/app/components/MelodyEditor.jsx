import {
  AudioLines,
  ChevronDown,
  ChevronUp,
  Keyboard,
  MoreHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  createElement,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  formatMelodyNoteParts,
  getMelodyKeyboardKey,
  getMelodyKeyNote,
  getMelodyScale,
  getMelodyScaleRailNotes,
  MELODY_KEY_SEQUENCE,
  MELODY_SCALES,
} from '../../data/melodyScales.js';
import { BEAT_NUMBERS } from '../uiShellData.js';
import { isMelodyCellActive } from '../melodyActions.js';
import { getTutorialControlRole } from '../../tutorial/drumsTutorialRuntime.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { renderIcon } from './icons.js';
import { TrackBarPager } from './TrackBarPager.jsx';

const MELODY_EXAMPLE_DISPLAY_BY_TARGET = Object.freeze({
  '4477887': '4477887',
  '890--098-098': '890- -098 -0 98',
  '23623523434345455': '236 235 234 3434 5455',
});

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
  melodyScaleId = 'major',
  onClearMelody,
  onClearMelodyBar,
  onClose = () => {},
  onNextBar = () => {},
  onPreviousBar = () => {},
  onMelodyPreview = () => {},
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
  const [hoveredPitchRow, setHoveredPitchRow] = useState(null);
  const scaleButtonRole = getTutorialControlRole(tutorialTargets, 'melody-scale-button');
  const scaleButtonDisabled = tutorialLocked && scaleButtonRole !== 'target';
  const exampleKeysTarget = tutorialTargets?.controls?.find((target) => (
    target.name?.startsWith?.('melody-example-keys:')
  ));
  const exampleKeysRole = exampleKeysTarget?.role ?? null;
  const exampleKeysId = exampleKeysTarget?.name?.slice('melody-example-keys:'.length) ?? '';
  const exampleKeysLabel = MELODY_EXAMPLE_DISPLAY_BY_TARGET[exampleKeysId] ?? exampleKeysId;
  const activeScale = getMelodyScale(melodyScaleId);
  const melodyRailNotes = useMemo(
    () => getMelodyScaleRailNotes(melodyScaleId),
    [melodyScaleId],
  );
  const activePlayedNotes = useMemo(() => new Set(
    [...playingKeys]
      .map((key) => getMelodyKeyNote(melodyScaleId, key))
      .filter(Boolean),
  ), [melodyScaleId, playingKeys]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || isEditableKeyboardTarget(event.target)) return;
      const note = getMelodyKeyNote(melodyScaleId, event.key);
      if (!note) return;
      setPlayingKeys((keys) => addSetValue(keys, getMelodyKeyboardKey(event.key)));
    };
    const handleKeyUp = (event) => {
      if (!getMelodyKeyNote(melodyScaleId, event.key)) return;
      setPlayingKeys((keys) => deleteSetValue(keys, getMelodyKeyboardKey(event.key)));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [melodyScaleId]);

  const handlePreviewStart = (key, note) => {
    setPlayingKeys((keys) => addSetValue(keys, key));
    onMelodyPreview(note);
  };
  const handlePreviewEnd = (key) => {
    setPlayingKeys((keys) => deleteSetValue(keys, key));
  };
  const handleClose = () => {
    setPickerMode(null);
    onClose();
  };

  return (
    <section className="editor" data-screen-label="Melody Editor" data-picker={pickerMode ?? undefined}>
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(AudioLines)}
          </div>
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
          <button className="btn-template drum-clear-action" type="button" disabled={tutorialLocked} onClick={onClearMelodyBar}>
            清空本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" disabled={tutorialLocked} onClick={onClearMelody}>
            清空整轨
          </button>
          <button className="tool-icon" aria-label="Clear phrase" title="Clear phrase" type="button" disabled={tutorialLocked} onClick={onClearMelodyBar}>
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
            {MELODY_KEY_SEQUENCE.map((key) => {
              const note = getMelodyKeyNote(activeScale.id, key);
              const { name, octave } = formatMelodyNoteParts(note);
              const playing = playingKeys.has(key);

              return (
                <button
                  className={['ks-key', playing ? 'playing' : ''].filter(Boolean).join(' ')}
                  type="button"
                  data-key={key}
                  data-note={name}
                  data-oct={octave}
                  key={key}
                  aria-label={`${note} - 按 ${key}`}
                  onPointerDown={() => handlePreviewStart(key, note)}
                  onPointerLeave={() => handlePreviewEnd(key)}
                  onPointerUp={() => handlePreviewEnd(key)}
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

        <div className="seq-body melody-seq-body">
          <aside className="scale-rail melody-scale-rail" aria-label="Scale ruler">
            <button
              className="scale-arrow"
              aria-label="Scroll up an octave"
              title="Scroll up an octave"
              type="button"
              disabled
            >
              {renderIcon(ChevronUp)}
            </button>
            <div className="scale-notes-viewport">
              <div className="scale-notes melody-scale-notes">
                {melodyRailNotes.map((note, rowIndex) => (
                  <div
                    className={[
                      'note-key',
                      'melody-note-key',
                      note.sharp ? 'sharp' : '',
                      note.root ? 'root' : '',
                      activePlayedNotes.has(note.note) ? 'playing' : '',
                      hoveredPitchRow === rowIndex ? 'row-hovered' : '',
                    ].filter(Boolean).join(' ')}
                    data-row={rowIndex}
                    key={note.note}
                    title={note.note}
                    onPointerEnter={() => setHoveredPitchRow(rowIndex)}
                    onPointerLeave={() => setHoveredPitchRow(null)}
                  >
                    {note.label}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="scale-arrow"
              aria-label="Scroll down an octave"
              title="Scroll down an octave"
              type="button"
              disabled
            >
              {renderIcon(ChevronDown)}
            </button>
          </aside>

          <div className="melody-grid">
            {BEAT_NUMBERS.map((beatNumber) => {
              const beatIndex = beatNumber - 1;

              return (
                <div className="melody-beat-group" key={beatNumber}>
                  <div className="pitch-grid-head-spacer" aria-hidden="true" />
                  <div
                    className="beat-cells-viewport"
                  >
                    <div className="beat-cells melody-beat-cells">
                      {melodyRailNotes.flatMap((note, rowIndex) => (
                        BEAT_NUMBERS.map((stepNumber, colIndex) => {
                          const step = beatIndex * 4 + colIndex;
                          const active = isMelodyCellActive(matrix, selectedBar, step, note.note);

                          return (
                            <button
                              className={[
                                'cell',
                                'melody-cell',
                                note.sharp ? 'sharp' : '',
                                active ? 'active' : '',
                                hoveredPitchRow === rowIndex ? 'row-hovered' : '',
                              ].filter(Boolean).join(' ')}
                              data-row={rowIndex}
                              data-col={colIndex}
                              data-note={note.note}
                              key={`${note.note}-${stepNumber}`}
                              type="button"
                              aria-label={`${note.note} beat ${beatNumber}.${stepNumber}`}
                              aria-pressed={active}
                              disabled={tutorialLocked}
                              onPointerEnter={() => setHoveredPitchRow(rowIndex)}
                              onPointerLeave={() => setHoveredPitchRow(null)}
                              onClick={() => onMelodyStepToggle(step, note.note)}
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
        </>
      ))}

      <div className="scale-picker" role="dialog" aria-label="选择音阶" data-screen-label="Scale Picker" hidden={pickerMode !== 'scale'}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-scale-active" aria-label="关闭选择音阶" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(ChevronUp)}
              选择音阶
            </button>
            <span className="tpl-meta">
              音阶库 ·
              {' '}
              <span className="mono">{Object.keys(MELODY_SCALES).length}</span>
              {' '}
              个
            </span>
          </div>
          <div className="tpl-head-right">
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(X)}
            </button>
          </div>
        </header>

        <div className="tpl-body">
          <div className="tpl-viewport">
            <div className="tpl-list" id="scaleList">
              {Object.values(MELODY_SCALES).map((scale) => {
                const scaleCardRole = getTutorialControlRole(tutorialTargets, `melody-scale-card:${scale.id}`);
                const scaleCardDisabled = tutorialLocked && scaleCardRole !== 'target';

                return (
                  <article
                    className={[
                      'sctpl-card',
                      scale.id === activeScale.id ? 'selected' : '',
                      scaleCardRole === 'target' ? 'tutorial-control-target' : '',
                    ].filter(Boolean).join(' ')}
                    aria-disabled={scaleCardDisabled}
                    data-scale={scale.id}
                    data-tutorial-role={scaleCardRole ?? undefined}
                    key={scale.id}
                    onClick={() => {
                      if (scaleCardDisabled) return;
                      onMelodyScaleChange(scale.id);
                      setPickerMode(null);
                    }}
                  >
                    <div className="sctpl-name-row">
                      <h3 className="sctpl-name">{scale.label}</h3>
                      {scale.tag ? <span className="sctpl-default-tag">{scale.tag}</span> : null}
                    </div>
                    <div className="sctpl-notes" aria-label="音阶包含的音符">
                      {scale.notes.map((note, index) => (
                        note ? (
                          <span className="sctpl-note" key={`${scale.id}-${note}-${index}`}>{note}</span>
                        ) : (
                          <span className="sctpl-note gap" aria-hidden="true" key={`${scale.id}-gap-${index}`} />
                        )
                      ))}
                    </div>
                    <p className="sctpl-desc">{scale.description}</p>
                    <div className="sctpl-foot">
                      <span className="sctpl-foot-label">{scale.footLabel}</span>
                      <button
                        className="sctpl-play"
                        aria-label={`试听${scale.label}`}
                        data-action="preview"
                        type="button"
                        disabled={scaleCardDisabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (scaleCardDisabled) return;
                          onMelodyPreview(scale.keyNotes);
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
        </div>
      </div>
    </section>
  );
}

export { MelodyEditor };
