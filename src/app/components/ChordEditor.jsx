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
  BEAT_NUMBERS,
  CHORD_NOTES,
} from '../uiShellData.js';
import { getChordCell } from '../chordActions.js';
import { isChordCellActive } from '../../domain/chordCells.js';
import { renderIcon } from './icons.js';

function ChordEditor({
  matrix,
  onChordCellSelect,
  onClearChordBar,
  rootKey,
  selectedBar,
}) {
  return (
    <section className="editor" data-screen-label="Chord Editor">
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
              {renderIcon(Pencil)}
            </div>
          </div>
        </div>

        <div className="tools">
          <button className="btn-template" aria-label="选择和弦进行模板" type="button">
            {renderIcon(LayoutTemplate)}
            选择和弦进行模板
          </button>
          <button
            className="tool-icon"
            aria-label="Clear phrase"
            title="Clear phrase"
            type="button"
            onClick={onClearChordBar}
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

            return (
              <div className="beat-group" key={beatNumber}>
                <div className="beat-head">
                  <button
                    className="add-chord-btn"
                    aria-label={`Add ${rootKey} chord to beat ${beatNumber}`}
                    type="button"
                    onClick={() => onChordCellSelect(spanIndex, rootKey)}
                  >
                    {renderIcon(Plus)}
                    {chordCell?.label ?? 'Chord'}
                  </button>
                  <span className="beat-num mono">{beatNumber}</span>
                </div>
                <div className="beat-cells">
                  {CHORD_NOTES.flatMap((note, rowIndex) => (
                    BEAT_NUMBERS.map((stepNumber, colIndex) => {
                      const active = isChordCellActive(chordCell, note.label, colIndex);

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
                          onClick={() => onChordCellSelect(spanIndex, note.label)}
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
    </section>
  );
}

export { ChordEditor };
