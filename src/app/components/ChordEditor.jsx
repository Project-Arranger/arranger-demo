import {
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  MoreHorizontal,
  Pencil,
  Piano,
  Plus,
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
  BEAT_NUMBERS,
  CHORD_NOTES,
} from '../uiShellData.js';
import {
  getChordCell,
  getChordStepCell,
} from '../chordActions.js';
import {
  CHORD_TEMPLATES,
  CHORD_VARIANTS,
  getChordToneRoots,
  isChordCellActive,
} from '../../domain/chordCells.js';
import { renderIcon } from './icons.js';

const TEMPLATE_PAGE_SIZE = 3;

function getBeatNoteLabel(matrix, selectedBar, spanIndex) {
  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    const cell = getChordStepCell(matrix, selectedBar, spanIndex, columnIndex);
    if (cell?.type === 'note') return cell.label;
  }

  return null;
}

function VariantPopover({
  chordCell,
  onChordCellSelect,
  onClose,
}) {
  const [playingVariant, setPlayingVariant] = useState(null);
  const variants = CHORD_VARIANTS[chordCell?.chordRoot] ?? [];

  if (!chordCell || !variants.length) return null;

  const handlePreview = (event, name) => {
    event.stopPropagation();
    setPlayingVariant(name);
    window.setTimeout(() => setPlayingVariant(null), 600);
  };

  return (
    <div className="chord-variants" id="chordVariants" role="dialog" aria-label="丰富和弦色彩">
      <span className="cv-arrow" />
      <header className="cv-head">
        <div className="cv-title">
          <span className="cv-eyebrow">和弦色彩</span>
          <h3 className="cv-h">
            丰富和弦色彩
            {' '}
            <span className="cv-root">{chordCell.chordRoot}</span>
          </h3>
        </div>
        <button className="cv-custom" type="button" aria-label="自定义和弦">
          <MoreHorizontal size={12} />
          自定义
        </button>
      </header>

      <div className="cv-grid">
        {variants.map((variant) => (
          <article
            className={[
              'cv-card',
              variant.name === chordCell.label ? 'current' : '',
            ].filter(Boolean).join(' ')}
            data-variant={variant.name}
            key={variant.name}
            tabIndex={0}
            onClick={() => {
              onChordCellSelect(0, variant.name);
              onClose();
            }}
          >
            <span className="cv-name">{variant.name}</span>
            <p className="cv-desc">{variant.desc}</p>
            <div className="cv-foot">
              <div className="cv-notes" aria-label="组成音">
                {getChordToneRoots(variant.name).map((note) => (
                  <span className="n" key={note}>{note}</span>
                ))}
              </div>
              <button
                className={['cv-preview', playingVariant === variant.name ? 'playing' : ''].filter(Boolean).join(' ')}
                type="button"
                aria-label={`试听 ${variant.name}`}
                data-action="preview"
                onClick={(event) => handlePreview(event, variant.name)}
              >
                {renderIcon(Piano)}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ChordEditor({
  matrix,
  onChordCellSelect,
  onChordNoteSelect,
  onChordTemplateApply,
  onClearChordBar,
  rootKey,
  selectedBar,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templatePage, setTemplatePage] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const templates = useMemo(() => Object.values(CHORD_TEMPLATES), []);
  const pageCount = Math.ceil(templates.length / TEMPLATE_PAGE_SIZE);
  const visibleTemplates = templates.slice(
    templatePage * TEMPLATE_PAGE_SIZE,
    templatePage * TEMPLATE_PAGE_SIZE + TEMPLATE_PAGE_SIZE,
  );
  const primaryChordCell = getChordCell(matrix, selectedBar, 0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setPickerOpen(false);
      setVariantsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTemplateApply = (templateId) => {
    setSelectedTemplateId(templateId);
    onChordTemplateApply(templateId);
    setPickerOpen(false);
    setVariantsOpen(false);
  };

  const handleClear = () => {
    onClearChordBar();
    setVariantsOpen(false);
  };

  return (
    <section className="editor" data-screen-label="Chord Editor" data-picker={pickerOpen ? 'open' : undefined}>
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(Piano)}
          </div>
          <div className="clip-title">
            <div className="crumb">Chord · Phrase</div>
            <div className="clip-name-input">
              CHORD EDITOR - BAR
              {' '}
              {selectedBar + 1}
              {primaryChordCell?.type === 'chord' ? ` · ${primaryChordCell.label}` : ''}
              {renderIcon(Pencil)}
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className="btn-template"
            aria-label="选择和弦进行模板"
            type="button"
            onClick={() => {
              setPickerOpen(true);
              setVariantsOpen(false);
            }}
          >
            {renderIcon(LayoutTemplate)}
            选择和弦进行模板
          </button>
          <button
            className="tool-icon"
            aria-label="Clear phrase"
            title="Clear phrase"
            type="button"
            onClick={handleClear}
          >
            {renderIcon(Trash2)}
          </button>
          <button className="tool-icon" aria-label="More" title="More" type="button">
            {renderIcon(MoreHorizontal)}
          </button>
          <button className="editor-close" aria-label="Close editor" title="Close" type="button">
            {renderIcon(X)}
          </button>
        </div>
      </header>

      <div className="seq-body">
        <aside className="scale-rail" aria-label="Scale ruler">
          <button className="scale-arrow" aria-label="Scroll up an octave" title="Scroll up an octave">
            {renderIcon(ChevronUp)}
          </button>
          <div className="scale-notes">
            {CHORD_NOTES.map((note) => (
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
          <button className="scale-arrow" aria-label="Scroll down an octave" title="Scroll down an octave">
            {renderIcon(ChevronDown)}
          </button>
        </aside>

        <div className="chord-grid">
            {BEAT_NUMBERS.map((beatNumber) => {
              const spanIndex = beatNumber - 1;
              const chordCell = getChordCell(matrix, selectedBar, spanIndex);
              const isPrimaryBeat = spanIndex === 0;
              const beatNoteLabel = isPrimaryBeat ? null : getBeatNoteLabel(matrix, selectedBar, spanIndex);
              const beatHasValue = isPrimaryBeat ? chordCell?.type === 'chord' : Boolean(beatNoteLabel);

              return (
              <div
                className={[
                  'beat-group',
                  beatHasValue ? 'has-chord' : '',
                ].filter(Boolean).join(' ')}
                data-chord-root={isPrimaryBeat ? chordCell?.chordRoot : beatNoteLabel}
                key={beatNumber}
              >
                <div className="beat-head">
                  <button
                    className={[
                      'add-chord-btn',
                      beatHasValue ? 'filled' : '',
                      isPrimaryBeat && variantsOpen ? 'variants-open' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`Add ${rootKey} chord to beat ${beatNumber}`}
                    type="button"
                    onClick={() => {
                      if (isPrimaryBeat && chordCell?.type === 'chord') {
                        setVariantsOpen((open) => !open);
                        return;
                      }
                      if (isPrimaryBeat) onChordCellSelect(spanIndex, rootKey);
                    }}
                  >
                    {beatHasValue ? null : renderIcon(Plus)}
                    {isPrimaryBeat ? (chordCell?.label ?? '添加和弦') : (beatNoteLabel ?? 'Note')}
                  </button>
                  <span className="beat-num mono">{beatNumber}</span>
                </div>
                <div className="beat-cells">
                  {CHORD_NOTES.flatMap((note, rowIndex) => (
                    BEAT_NUMBERS.map((stepNumber, colIndex) => {
                      const stepCell = isPrimaryBeat
                        ? chordCell
                        : getChordStepCell(matrix, selectedBar, spanIndex, colIndex);
                      const active = isChordCellActive(stepCell, note.label, colIndex);

                      return (
                        <button
                          className={[
                            'cell',
                            active ? 'active' : '',
                            note.sharp ? 'sharp' : '',
                            colIndex === 0 ? 'downbeat' : '',
                          ].filter(Boolean).join(' ')}
                          data-row={rowIndex}
                          data-col={colIndex}
                          data-span-index={spanIndex}
                          data-chord-root={note.label}
                          key={`${note.label}-${stepNumber}`}
                          type="button"
                          aria-label={`${note.label} beat ${beatNumber}.${stepNumber}`}
                          aria-pressed={active}
                          onClick={() => {
                            if (isPrimaryBeat) {
                              onChordCellSelect(spanIndex, note.label);
                              setVariantsOpen(false);
                              return;
                            }
                            onChordNoteSelect(spanIndex, colIndex, note.label);
                          }}
                        />
                      );
                    })
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {variantsOpen ? createElement(VariantPopover, {
        chordCell: primaryChordCell,
        onChordCellSelect,
        onClose: () => setVariantsOpen(false),
      }) : null}

      <div className="tpl-picker" role="dialog" aria-label="选择和弦进行模板" data-screen-label="Chord Template Picker" hidden={!pickerOpen}>
        <header className="tpl-head">
          <div className="tpl-head-left">
            <button className="btn-template-active" aria-label="关闭和弦进行模板" type="button" onClick={() => setPickerOpen(false)}>
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
            <button className="tpl-close" aria-label="关闭" type="button" onClick={() => setPickerOpen(false)}>
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
                  <button className="tpl-play" aria-label="试听" data-action="preview" type="button" onClick={(event) => event.stopPropagation()}>
                    {renderIcon(Piano)}
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
    </section>
  );
}

export { ChordEditor };
