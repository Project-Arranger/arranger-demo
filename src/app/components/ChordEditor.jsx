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
  getChordBeatDisplaySegments,
  getChordBarDisplayLabel,
  getChordCell,
  getChordStepCell,
} from '../chordActions.js';
import {
  DIATONIC_CHORD_OPTIONS,
  CHORD_TEMPLATES,
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

function getNextChordCell(matrix, selectedBar, spanIndex) {
  const chordBars = matrix?.chord ?? [];
  const barCount = chordBars.length;
  if (!barCount) return null;

  for (let offset = 1; offset < barCount * 4; offset += 1) {
    const absoluteSpan = selectedBar * 4 + spanIndex + offset;
    const bar = Math.floor(absoluteSpan / 4) % barCount;
    const span = absoluteSpan % 4;
    const cell = getChordCell(matrix, bar, span);
    if (cell?.type === 'chord') return cell;
  }

  return null;
}

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
  activeTab,
  anchorRect,
  matrix,
  mode,
  onClose,
  onPick,
  onChordPreview,
  onTabChange,
  rootKey,
  selectedBar,
  spanIndex,
}) {
  const [playingChord, setPlayingChord] = useState(null);
  const currentCell = getChordCell(matrix, selectedBar, spanIndex);
  const nextCell = getNextChordCell(matrix, selectedBar, spanIndex);
  const currentChord = currentCell?.type === 'chord' ? currentCell.label : null;
  const currentChordRoot = currentCell?.type === 'chord' ? currentCell.chordRoot : null;
  const nextChord = nextCell?.type === 'chord' ? nextCell.label : null;
  const passingOptions = getPassingChordOptions(currentChord, nextChord);
  const variantOptions = getChordVariantOptions(currentChord);
  const isEmptyMode = mode === 'empty';
  const isFilledMode = mode === 'filled';
  const selectedTab = isFilledMode
    ? (activeTab === 'enrich' ? 'enrich' : 'diatonic')
    : (activeTab === 'passing' ? 'passing' : 'diatonic');
  const position = getPopoverPosition(anchorRect);

  const handlePreview = (event, chordName) => {
    event.stopPropagation();
    setPlayingChord(chordName);
    onChordPreview(chordName);
    window.setTimeout(() => setPlayingChord(null), 600);
  };

  const renderOptionCard = (option, options = {}) => {
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
        {options.roman ? <span className="cv-roman">{options.roman}</span> : null}
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
      aria-label={isFilledMode ? '丰富和弦色彩' : '添加和弦'}
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
        <div className="cv-tabs" role="tablist" aria-label="添加和弦方式">
          {isEmptyMode ? (
            <button
              className="cv-tab"
              role="tab"
              type="button"
              aria-selected={selectedTab === 'passing'}
              aria-controls="cvPanelPassing"
              onClick={() => onTabChange('passing')}
            >
              添加经过和弦
            </button>
          ) : null}
          <button
            className="cv-tab"
            role="tab"
            type="button"
            aria-selected={selectedTab === 'diatonic'}
            aria-controls="cvPanelDiatonic"
            onClick={() => onTabChange('diatonic')}
          >
            添加调内和弦
            <span className="cv-tab-key">{rootKey} 大调</span>
          </button>
          {isFilledMode ? (
            <button
              className="cv-tab"
              role="tab"
              type="button"
              aria-selected={selectedTab === 'enrich'}
              aria-controls="cvPanelEnrich"
              onClick={() => onTabChange('enrich')}
            >
              丰富和弦
            </button>
          ) : null}
        </div>
        <button className="cv-custom" type="button" aria-label="自定义和弦">
          <MoreHorizontal size={12} />
          自定义
        </button>
      </header>

      {isEmptyMode ? (
        <section className="cv-panel" id="cvPanelPassing" role="tabpanel" hidden={selectedTab !== 'passing'}>
          {currentChord ? (
            <div className="cv-context">
              {nextChord ? (
                <>
                  <span>在</span>
                  <span className="cv-ctx-chord">{currentChord}</span>
                  <span className="cv-ctx-arrow">→</span>
                  <span className="cv-ctx-chord">{nextChord}</span>
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
            {passingOptions.map((option) => renderOptionCard(option))}
          </div>
        </section>
      ) : null}

      <section className="cv-panel" id="cvPanelDiatonic" role="tabpanel" hidden={selectedTab !== 'diatonic'}>
        <div className="cv-grid diatonic">
          {DIATONIC_CHORD_OPTIONS.map((option) => (
            renderOptionCard(option, { roman: option.roman })
          ))}
        </div>
      </section>

      {isFilledMode ? (
        <section className="cv-panel" id="cvPanelEnrich" role="tabpanel" hidden={selectedTab !== 'enrich'}>
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
      ) : null}
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
  onClose = () => {},
  onClearChord = () => {},
  onClearChordBar,
  onRenameClip,
  rootKey,
  selectedBar,
}) {
  const [pickerMode, setPickerMode] = useState(null);
  const [templatePage, setTemplatePage] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedGrooveTemplateId, setSelectedGrooveTemplateId] = useState('block-basic');
  const [addChordPanel, setAddChordPanel] = useState(null);
  const [activeChordTab, setActiveChordTab] = useState('diatonic');
  const templates = useMemo(() => Object.values(CHORD_TEMPLATES), []);
  const pageCount = Math.ceil(templates.length / TEMPLATE_PAGE_SIZE);
  const chordPickerOpen = pickerMode === 'chord';
  const groovePickerOpen = pickerMode === 'groove';
  const visibleTemplates = templates.slice(
    templatePage * TEMPLATE_PAGE_SIZE,
    templatePage * TEMPLATE_PAGE_SIZE + TEMPLATE_PAGE_SIZE,
  );
  const primaryChordLabel = getChordBarDisplayLabel(matrix, selectedBar);
  const beatDisplaySegments = getChordBeatDisplaySegments(matrix, selectedBar);
  const closeAddChordPanel = useCallback(() => setAddChordPanel(null), []);
  const {
    canScrollPitchDown,
    canScrollPitchUp,
    handlePitchViewportScroll,
    handlePitchWheel,
    scalePitchViewportRef,
    scrollPitchByOctave,
    setBeatCellsViewportRef,
  } = usePitchScrollSync({ onPitchInteraction: closeAddChordPanel });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setPickerMode(null);
      setAddChordPanel(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!addChordPanel) return;
      if (event.target.closest('.chord-variants')) return;
      if (event.target.closest('.add-chord-btn')) return;
      setAddChordPanel(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [addChordPanel]);

  const handleTemplateApply = (templateId) => {
    setSelectedTemplateId(templateId);
    onChordTemplateApply(templateId);
    setPickerMode(null);
    setAddChordPanel(null);
  };

  const handleGrooveTemplateApply = (templateId) => {
    setSelectedGrooveTemplateId(templateId);
    onChordGrooveTemplateApply(templateId);
    setPickerMode(null);
    setAddChordPanel(null);
  };

  const handleClear = () => {
    onClearChordBar();
    setAddChordPanel(null);
  };

  const handleClearChord = () => {
    onClearChord();
    setAddChordPanel(null);
  };

  const handleClose = () => {
    setPickerMode(null);
    setAddChordPanel(null);
    onClose();
  };

  const openAddChordPanel = (spanIndex, buttonElement, hasChord) => {
    setPickerMode(null);
    setActiveChordTab(hasChord ? 'enrich' : 'diatonic');
    setAddChordPanel({
      anchorRect: rectToAnchor(buttonElement.getBoundingClientRect()),
      bar: selectedBar,
      mode: hasChord ? 'filled' : 'empty',
      spanIndex,
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
              setAddChordPanel(null);
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
              setAddChordPanel(null);
            }}
          >
            {renderIcon(AudioWaveform)}
            选择和弦弹奏律动模板
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={handleClear}>
            清空本小节
          </button>
          <button className="btn-template drum-clear-action" type="button" onClick={handleClearChord}>
            清空 Chord
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
              {CHORD_GRID_PITCHES.map((note) => (
                <div
                  className={[
                    'note-key',
                    note.sharp ? 'sharp' : '',
                    note.root ? 'root' : '',
                  ].filter(Boolean).join(' ')}
                  key={note.label}
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
          <div className="chord-label-row">
            {beatDisplaySegments.map((segment) => (
              <button
                className={[
                  'add-chord-btn',
                  'chord-label-segment',
                  segment.hasValue ? 'filled' : '',
                  segment.span > 1 ? 'merged' : '',
                  addChordPanel?.bar === selectedBar && addChordPanel?.spanIndex === segment.startBeat ? 'variants-open' : '',
                ].filter(Boolean).join(' ')}
                aria-label={`添加和弦 beat ${segment.startBeat + 1}`}
                data-chord-root={segment.label}
                key={`segment-${segment.startBeat}`}
                style={{ gridColumn: `${segment.startBeat + 1} / span ${segment.span}` }}
                type="button"
                onClick={(event) => {
                  openAddChordPanel(segment.startBeat, event.currentTarget, segment.hasChord);
                }}
              >
                {segment.hasValue ? null : renderIcon(Plus)}
                {segment.label ?? '添加和弦'}
              </button>
            ))}
          </div>
          <div className="beat-number-row">
            {BEAT_NUMBERS.map((beatNumber) => (
              <span className="beat-num mono" key={beatNumber}>{beatNumber}</span>
            ))}
          </div>
          {BEAT_NUMBERS.map((beatNumber) => {
            const spanIndex = beatNumber - 1;

            return (
              <div
                className="beat-group"
                key={beatNumber}
                style={{ gridColumn: spanIndex + 1 }}
              >
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
                            ].filter(Boolean).join(' ')}
                            data-row={rowIndex}
                            data-col={colIndex}
                            data-span-index={spanIndex}
                            data-chord-root={note.label}
                            key={`${note.label}-${stepNumber}`}
                            type="button"
                            aria-label={`${note.label} beat ${beatNumber}.${stepNumber}`}
                            aria-pressed={active || added}
                            onClick={() => {
                              onChordNoteSelect(spanIndex, colIndex, note.label);
                              setAddChordPanel(null);
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
        activeTab: activeChordTab,
        anchorRect: addChordPanel.anchorRect,
        matrix,
        mode: addChordPanel.mode,
        onChordPreview,
        onClose: () => setAddChordPanel(null),
        onPick: onChordPick,
        onTabChange: setActiveChordTab,
        rootKey,
        selectedBar,
        spanIndex: addChordPanel.spanIndex,
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
