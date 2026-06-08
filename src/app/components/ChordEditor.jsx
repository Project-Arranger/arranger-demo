import {
  AudioWaveform,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  MoreHorizontal,
  Piano,
  Plus,
  X,
} from 'lucide-react';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BEAT_NUMBERS,
  CHORD_GRID_PITCHES,
} from '../uiShellData.js';
import {
  getChordBarDisplayLabel,
  getChordCell,
  getChordEnrichTargetLabel,
  getPassingChordDisplayLabel,
  getChordSpanDisplayLabel,
  getChordStepCell,
} from '../chordActions.js';
import {
  CHORD_TEMPLATES,
  getDoowopPassingTargetChord,
  getChordRootName,
  getPassingChordOptions,
  getChordVariantOptions,
  getChordToneRoots,
  isChordAddedNoteActive,
  isChordCellActive,
} from '../../domain/chordCells.js';
import { CHORD_GROOVE_TEMPLATES } from '../chordGrooveActions.js';
import { usePitchScrollSync } from '../usePitchScrollSync.js';
import { ClipNameInput } from './ClipNameInput.jsx';
import { renderIcon } from './icons.js';

const TEMPLATE_PAGE_SIZE = 3;
const ADD_CHORD_PANEL_WIDTH = 760;
const VIEWPORT_MARGIN = 16;
const PANEL_GAP = 12;
const GROOVE_STEPS_PER_BEAT = 4;
const PASSING_CHORD_STEP_INDEX = 14;
const PASSING_CHORD_SPAN_INDEX = 3;

function rectToAnchor(rect) {
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  };
}

function getPopoverPosition(anchorRect) {
  if (!anchorRect || typeof window === 'undefined') {
    return { left: 16, top: 16, side: 'below', arrowX: 24 };
  }

  const width = Math.min(ADD_CHORD_PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(window.innerWidth - width - VIEWPORT_MARGIN, anchorCenterX - width / 2),
  );
  const estimatedHeight = 300;
  const fitsBelow = anchorRect.bottom + PANEL_GAP + estimatedHeight + VIEWPORT_MARGIN <= window.innerHeight;
  const top = fitsBelow
    ? anchorRect.bottom + PANEL_GAP
    : Math.max(VIEWPORT_MARGIN, anchorRect.top - PANEL_GAP - estimatedHeight);
  const side = fitsBelow ? 'below' : 'above';
  const arrowX = Math.max(20, Math.min(width - 20, anchorCenterX - left));

  return { arrowX, left, side, top, width };
}

function AddChordPopover({
  anchorRect,
  currentChord,
  onClose,
  onPick,
  onChordPreview,
  spanIndex,
}) {
  const [playingChord, setPlayingChord] = useState(null);
  const currentChordRoot = getChordRootName(currentChord);
  const variantOptions = getChordVariantOptions(currentChord);
  const position = getPopoverPosition(anchorRect);

  const handlePreview = (event, chordName) => {
    event.stopPropagation();
    setPlayingChord(chordName);
    onChordPreview(chordName);
    window.setTimeout(() => setPlayingChord(null), 600);
  };

  const renderOptionCard = (option) => {
    const isCurrent = option.name === currentChord;

    return (
      <article
        className={[
          'cv-card',
          isCurrent ? 'current' : '',
        ].filter(Boolean).join(' ')}
        data-variant={option.name}
        key={option.name}
        tabIndex={0}
        onClick={() => {
          onPick(spanIndex, option.name);
          onClose();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onPick(spanIndex, option.name);
          onClose();
        }}
      >
        <span className="cv-name">{option.name}</span>
        <p className="cv-desc">{option.desc}</p>
        <div className="cv-foot">
          <div className="cv-notes" aria-label="组成音">
            {getChordToneRoots(option.name).map((note) => (
              <span className="n" key={note}>{note}</span>
            ))}
          </div>
          <button
            className={['cv-preview', playingChord === option.name ? 'playing' : ''].filter(Boolean).join(' ')}
            type="button"
            aria-label={`试听 ${option.name}`}
            data-action="preview"
            onClick={(event) => handlePreview(event, option.name)}
          >
            <span className="play-glyph" aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <div
      className="chord-variants"
      id="chordVariants"
      role="dialog"
      aria-label="丰富和弦色彩"
      data-side={position.side}
      style={{
        '--arrow-x': `${position.arrowX}px`,
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <span className="cv-arrow" />
      <header className="cv-head">
        <h2 className="cv-title">丰富和弦</h2>
      </header>

      <section className="cv-panel" id="cvPanelEnrich" role="tabpanel">
        <div className="cv-context enrich">
          <span>丰富和弦色彩</span>
          <span className="cv-ctx-chord">{currentChordRoot ?? currentChord}</span>
        </div>
        {variantOptions.length ? (
          <div className="cv-grid enrich">
            {variantOptions.map((option) => renderOptionCard(option))}
          </div>
        ) : (
          <div className="cv-empty">
            暂无可用丰富和弦
          </div>
        )}
      </section>
    </div>
  );
}

function PassingChordPopover({
  anchorRect,
  currentChord,
  targetChord,
  onClose,
  onPassingChordPick,
  onChordPreview,
}) {
  const [playingChord, setPlayingChord] = useState(null);
  const passingOptions = getPassingChordOptions(currentChord, targetChord);
  const position = getPopoverPosition(anchorRect);

  const handlePreview = (event, chordName) => {
    event.stopPropagation();
    setPlayingChord(chordName);
    onChordPreview(chordName);
    window.setTimeout(() => setPlayingChord(null), 600);
  };

  const handlePick = (option) => {
    onPassingChordPick(PASSING_CHORD_STEP_INDEX, option.name);
    onClose();
  };

  return (
    <div
      className="chord-variants passing-variants"
      id="chordVariants"
      role="dialog"
      aria-label="添加经过和弦"
      data-side={position.side}
      style={{
        '--arrow-x': `${position.arrowX}px`,
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <span className="cv-arrow" />
      <header className="cv-head">
        <h2 className="cv-title">添加经过和弦</h2>
        <button className="cv-custom" type="button" aria-label="自定义和弦">
          <MoreHorizontal size={12} />
          自定义
        </button>
      </header>

      <section className="cv-panel" id="cvPanelPassing" role="tabpanel">
        {currentChord ? (
          <div className="cv-context">
            {targetChord ? (
              <>
                <span>在</span>
                <span className="cv-ctx-chord">{currentChord}</span>
                <span className="cv-ctx-arrow">→</span>
                <span className="cv-ctx-chord">{targetChord}</span>
                <span>之间插入经过和弦</span>
              </>
            ) : (
              <>
                <span>从</span>
                <span className="cv-ctx-chord">{currentChord}</span>
                <span>引出的经过和弦</span>
              </>
            )}
          </div>
        ) : null}
        <div className="cv-grid passing">
          {passingOptions.map((option) => (
            <article
              className="cv-card"
              data-variant={option.name}
              key={option.name}
              tabIndex={0}
              onClick={() => handlePick(option)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                handlePick(option);
              }}
            >
              <span className="cv-name">{option.name}</span>
              <p className="cv-desc">{option.desc}</p>
              <div className="cv-foot">
                <div className="cv-notes" aria-label="组成音">
                  {getChordToneRoots(option.name).map((note) => (
                    <span className="n" key={note}>{note}</span>
                  ))}
                </div>
                <button
                  className={['cv-preview', playingChord === option.name ? 'playing' : ''].filter(Boolean).join(' ')}
                  type="button"
                  aria-label={`试听 ${option.name}`}
                  data-action="preview"
                  onClick={(event) => handlePreview(event, option.name)}
                >
                  <span className="play-glyph" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function getGrooveStepClass(template, step) {
  const isHit = template.steps.includes(step);
  const hitClass = template.kind === 'arpeggio' ? 'hit-arp' : 'hit-block';

  return [
    'gtpl-step',
    step % GROOVE_STEPS_PER_BEAT === 0 ? 'downbeat' : '',
    isHit ? hitClass : '',
  ].filter(Boolean).join(' ');
}

function getGrooveStepStyle(template, step) {
  if (template.kind !== 'arpeggio') return undefined;

  const hitIndex = template.steps.indexOf(step);
  if (hitIndex === -1) return undefined;

  return { '--h': String((hitIndex % 4) + 1) };
}

function ChordEditor({
  clipName,
  matrix,
  onChordNoteSelect,
  onChordPick,
  onChordPreview,
  onChordGrooveTemplatePreview,
  onChordGrooveTemplateApply,
  onChordTemplatePreview,
  onChordTemplateApply,
  onPassingChordPick = () => {},
  onClose = () => {},
  onClearChord = () => {},
  onClearChordBar,
  onRenameClip,
  selectedBar,
}) {
  const [pickerMode, setPickerMode] = useState(null);
  const [templatePage, setTemplatePage] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedGrooveTemplateId, setSelectedGrooveTemplateId] = useState('block-basic');
  const [addChordPanel, setAddChordPanel] = useState(null);
  const [passingChordPanel, setPassingChordPanel] = useState(null);
  const [hoveredPitchRow, setHoveredPitchRow] = useState(null);
  const templates = useMemo(() => Object.values(CHORD_TEMPLATES), []);
  const pageCount = Math.ceil(templates.length / TEMPLATE_PAGE_SIZE);
  const chordPickerOpen = pickerMode === 'chord';
  const groovePickerOpen = pickerMode === 'groove';
  const visibleTemplates = templates.slice(
    templatePage * TEMPLATE_PAGE_SIZE,
    templatePage * TEMPLATE_PAGE_SIZE + TEMPLATE_PAGE_SIZE,
  );
  const primaryChordLabel = getChordBarDisplayLabel(matrix, selectedBar);
  const passingSourceChord = getChordCell(matrix, selectedBar, 0)?.label ?? primaryChordLabel;
  const passingTargetChord = getDoowopPassingTargetChord(passingSourceChord);
  const passingChordDisplayLabel = getPassingChordDisplayLabel(matrix, selectedBar, PASSING_CHORD_STEP_INDEX);
  const passingButtonClassName = [
    'add-chord-btn',
    'passing-btn',
    passingChordDisplayLabel ? 'filled' : '',
    passingChordPanel?.bar === selectedBar ? 'variants-open' : '',
  ].filter(Boolean).join(' ');
  const closeChordPanels = useCallback(() => {
    setAddChordPanel(null);
    setPassingChordPanel(null);
  }, []);
  const {
    canScrollPitchDown,
    canScrollPitchUp,
    handlePitchViewportScroll,
    handlePitchWheel,
    scalePitchViewportRef,
    scrollPitchByOctave,
    setBeatCellsViewportRef,
  } = usePitchScrollSync({ onPitchInteraction: closeChordPanels });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setPickerMode(null);
      closeChordPanels();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeChordPanels]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!addChordPanel && !passingChordPanel) return;
      if (event.target.closest('.chord-variants')) return;
      if (event.target.closest('.add-chord-btn')) return;
      if (event.target.closest('.passing-btn')) return;
      closeChordPanels();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [addChordPanel, closeChordPanels, passingChordPanel]);

  const handleTemplateApply = (templateId) => {
    setSelectedTemplateId(templateId);
    onChordTemplateApply(templateId);
    setPickerMode(null);
    closeChordPanels();
  };

  const handleGrooveTemplateApply = (templateId) => {
    setSelectedGrooveTemplateId(templateId);
    onChordGrooveTemplateApply(templateId);
    setPickerMode(null);
    closeChordPanels();
  };

  const handleClear = () => {
    onClearChordBar();
    closeChordPanels();
  };

  const handleClearChord = () => {
    onClearChord();
    closeChordPanels();
  };

  const handleClose = () => {
    setPickerMode(null);
    closeChordPanels();
    onClose();
  };

  const openAddChordPanel = (spanIndex, buttonElement, chordLabel) => {
    if (!chordLabel) return;

    setPickerMode(null);
    setPassingChordPanel(null);
    setAddChordPanel({
      anchorRect: rectToAnchor(buttonElement.getBoundingClientRect()),
      bar: selectedBar,
      chordLabel,
      spanIndex,
    });
  };

  const openPassingChordPanel = (buttonElement) => {
    setPickerMode(null);
    setAddChordPanel(null);
    setPassingChordPanel({
      anchorRect: rectToAnchor(buttonElement.getBoundingClientRect()),
      bar: selectedBar,
    });
  };

  return (
    <section className="editor" data-screen-label="Chord Editor" data-picker={pickerMode ?? undefined}>
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(Piano)}
          </div>
          <div className="clip-title">
            <div className="crumb">Chord · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
            <div className="clip-name-meta">
              CHORD EDITOR - BAR
              {' '}
              {selectedBar + 1}
              {primaryChordLabel ? ` · ${primaryChordLabel}` : ''}
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className="btn-template"
            aria-label="选择和弦进行模板"
            type="button"
            onClick={() => {
              setPickerMode('chord');
              closeChordPanels();
            }}
          >
            {renderIcon(LayoutTemplate)}
            选择和弦进行模板
          </button>
          <button
            className="btn-template-groove"
            aria-label="选择和弦弹奏律动模板"
            type="button"
            onClick={() => {
              setPickerMode('groove');
              closeChordPanels();
            }}
          >
            {renderIcon(AudioWaveform)}
            选择和弦弹奏律动模板
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={handleClear}>
            清空本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={handleClearChord}>
            清空整轨
          </button>
          <button className="tool-icon" aria-label="More" title="More" type="button">
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

      <div className="seq-body" onWheel={handlePitchWheel}>
        <aside className="scale-rail" aria-label="Scale ruler">
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
            <div className="scale-notes">
              {CHORD_GRID_PITCHES.map((note, rowIndex) => (
                <div
                  className={[
                    'note-key',
                    note.sharp ? 'sharp' : '',
                    note.root ? 'root' : '',
                    hoveredPitchRow === rowIndex ? 'row-hovered' : '',
                  ].filter(Boolean).join(' ')}
                  data-row={rowIndex}
                  key={note.label}
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
            disabled={!canScrollPitchDown}
            onClick={() => scrollPitchByOctave(1)}
          >
            {renderIcon(ChevronDown)}
          </button>
        </aside>

        <div className="chord-grid">
          {BEAT_NUMBERS.map((beatNumber) => {
            const spanIndex = beatNumber - 1;
            const hasPassingShortcut = spanIndex === PASSING_CHORD_SPAN_INDEX;
            const label = getChordSpanDisplayLabel(matrix, selectedBar, spanIndex);
            const enrichTargetLabel = getChordEnrichTargetLabel(matrix, selectedBar, spanIndex);
            const hasValue = Boolean(label);
            const beatHeadAddButtonClassName = [
              'add-chord-btn',
              'chord-label-segment',
              hasValue ? 'filled' : '',
              addChordPanel?.bar === selectedBar && addChordPanel?.spanIndex === spanIndex ? 'variants-open' : '',
            ].filter(Boolean).join(' ');

            return (
              <div
                className={[
                  'beat-group',
                  hasPassingShortcut ? 'has-passing' : '',
                ].filter(Boolean).join(' ')}
                key={beatNumber}
                style={{ gridColumn: spanIndex + 1 }}
              >
                <div className="beat-head">
                  {label ? (
                    <button
                      className={beatHeadAddButtonClassName}
                      aria-label={`添加和弦 beat ${beatNumber}`}
                      data-chord-root={enrichTargetLabel ?? label}
                      type="button"
                      onClick={(event) => {
                        openAddChordPanel(spanIndex, event.currentTarget, enrichTargetLabel);
                      }}
                    >
                      {label}
                    </button>
                  ) : null}
                  {hasPassingShortcut ? (
                    <div className="passing-anchor">
                      <button
                        className={passingButtonClassName}
                        type="button"
                        aria-label="添加经过和弦"
                        title="添加经过和弦"
                        aria-expanded={passingChordPanel?.bar === selectedBar}
                        onClick={(event) => {
                          event.stopPropagation();
                          openPassingChordPanel(event.currentTarget);
                        }}
                      >
                        {passingChordDisplayLabel ? null : renderIcon(Plus)}
                        {passingChordDisplayLabel ?? '经过和弦'}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div
                  className="beat-cells-viewport"
                  ref={(viewport) => setBeatCellsViewportRef(spanIndex, viewport)}
                  onScroll={handlePitchViewportScroll}
                >
                  <div className="beat-cells">
                    {CHORD_GRID_PITCHES.flatMap((note, rowIndex) => (
                      BEAT_NUMBERS.map((stepNumber, colIndex) => {
                        const stepCell = getChordStepCell(matrix, selectedBar, spanIndex, colIndex);
                        const active = isChordCellActive(stepCell, note.label, colIndex);
                        const added = isChordAddedNoteActive(stepCell, note.label);

                        return (
                          <button
                            className={[
                              'cell',
                              active ? 'active' : '',
                              added ? 'added' : '',
                              note.sharp ? 'sharp' : '',
                              hoveredPitchRow === rowIndex ? 'row-hovered' : '',
                            ].filter(Boolean).join(' ')}
                            data-row={rowIndex}
                            data-col={colIndex}
                            data-span-index={spanIndex}
                            data-chord-root={note.label}
                            key={`${note.label}-${stepNumber}`}
                            type="button"
                            aria-label={`${note.label} beat ${beatNumber}.${stepNumber}`}
                            aria-pressed={active || added}
                            onPointerEnter={() => setHoveredPitchRow(rowIndex)}
                            onPointerLeave={() => setHoveredPitchRow(null)}
                            onClick={() => {
                              onChordNoteSelect(spanIndex, colIndex, note.label);
                              closeChordPanels();
                            }}
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

      {addChordPanel?.bar === selectedBar ? createElement(AddChordPopover, {
        anchorRect: addChordPanel.anchorRect,
        currentChord: addChordPanel.chordLabel,
        onChordPreview,
        onClose: closeChordPanels,
        onPick: onChordPick,
        spanIndex: addChordPanel.spanIndex,
      }) : null}

      {passingChordPanel?.bar === selectedBar ? createElement(PassingChordPopover, {
        anchorRect: passingChordPanel.anchorRect,
        currentChord: passingSourceChord,
        targetChord: passingTargetChord,
        onChordPreview,
        onClose: closeChordPanels,
        onPassingChordPick,
      }) : null}

      <div className="tpl-picker" role="dialog" aria-label="选择和弦进行模板" data-screen-label="Chord Template Picker" hidden={!chordPickerOpen}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-active" aria-label="关闭和弦进行模板" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(LayoutTemplate)}
              选择和弦进行模板
            </button>
            <span className="tpl-meta">
              和弦进行模板库 ·
              {' '}
              <span className="mono">{templates.length}</span>
              {' '}
              个
            </span>
          </div>
          <div className="tpl-head-right">
            <label className="tpl-search">
              <input type="text" placeholder="搜索模板名 / 风格 / 和弦…" />
            </label>
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(X)}
            </button>
          </div>
        </header>

        <div className="tpl-body">
          <div className="tpl-list" id="tplList">
            {visibleTemplates.map((template) => (
              <article
                className={[
                  'tpl-card',
                  selectedTemplateId === template.id ? 'selected' : '',
                ].filter(Boolean).join(' ')}
                data-tpl={template.id}
                key={template.id}
                onClick={() => handleTemplateApply(template.id)}
              >
                <div className="tpl-name-row">
                  <h3 className="tpl-name">{template.name}</h3>
                  <span className="tpl-tag">{template.tag}</span>
                </div>
                <div className="tpl-prog">
                  <div className="tpl-chords">
                    {template.chords.map((chord, index) => (
                      <span className="tpl-chord-wrap" key={`${template.id}-${chord}-${index}`}>
                        <span className="tpl-chord">{chord}</span>
                        {index < template.chords.length - 1 ? <span className="tpl-chord-sep">-</span> : null}
                      </span>
                    ))}
                  </div>
                  <button
                    className="tpl-play"
                    aria-label="试听"
                    data-action="preview"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChordTemplatePreview(template.chords);
                    }}
                  >
                    <span className="play-glyph" aria-hidden="true" />
                  </button>
                </div>
                <p className="tpl-desc">{template.desc}</p>
                <div className="tpl-songs">
                  <span className="tpl-songs-label">代表曲目</span>
                  {template.songs.map((song) => (
                    <span className="tpl-song" key={song}>{song}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="tpl-pager">
          <button
            className="tpl-pager-btn"
            type="button"
            aria-label="上一页"
            disabled={templatePage === 0}
            onClick={() => setTemplatePage((page) => Math.max(0, page - 1))}
          >
            ‹
          </button>
          <span className="tpl-pager-count mono">
            <span className="now">{templatePage + 1}</span>
            {' '}
            /
            {' '}
            {pageCount}
          </span>
          <button
            className="tpl-pager-btn"
            type="button"
            aria-label="下一页"
            disabled={templatePage === pageCount - 1}
            onClick={() => setTemplatePage((page) => Math.min(pageCount - 1, page + 1))}
          >
            ›
          </button>
        </footer>
      </div>

      <div className="gtpl-picker" role="dialog" aria-label="选择和弦弹奏律动模板" data-screen-label="Groove Template Picker" hidden={!groovePickerOpen}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-groove-active" aria-label="关闭和弦弹奏律动模板" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(AudioWaveform)}
              选择和弦弹奏律动模板
            </button>
            <span className="tpl-meta">
              弹奏律动模板库 ·
              {' '}
              <span className="mono">{CHORD_GROOVE_TEMPLATES.length}</span>
              {' '}
              个
            </span>
          </div>
          <div className="tpl-head-right">
            <label className="tpl-search">
              <input type="text" placeholder="搜索律动名称 / 音型…" />
            </label>
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setPickerMode(null)}>
              {renderIcon(X)}
            </button>
          </div>
        </header>

        <div className="tpl-body">
          <div className="tpl-list" id="gtplList">
            {CHORD_GROOVE_TEMPLATES.map((template) => (
              <article
                className={[
                  'gtpl-card',
                  selectedGrooveTemplateId === template.id ? 'selected' : '',
                ].filter(Boolean).join(' ')}
                data-gtpl={template.id}
                key={template.id}
                onClick={() => handleGrooveTemplateApply(template.id)}
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
                          const step = (beatNumber - 1) * GROOVE_STEPS_PER_BEAT + stepNumber - 1;

                          return (
                            <span
                              className={getGrooveStepClass(template, step)}
                              key={`${template.id}-${step}`}
                              style={getGrooveStepStyle(template, step)}
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
                    data-action="gpreview"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChordGrooveTemplatePreview(template.id);
                    }}
                  >
                    <span className="play-glyph" aria-hidden="true" />
                    试听
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="tpl-pager">
          <button className="tpl-pager-btn" type="button" aria-label="上一页" disabled>
            ‹
          </button>
          <span className="tpl-pager-count mono">
            <span className="now">1</span>
            {' '}
            /
            {' '}
            1
          </span>
          <button className="tpl-pager-btn" type="button" aria-label="下一页" disabled>
            ›
          </button>
        </footer>
      </div>
    </section>
  );
}

export { ChordEditor };
