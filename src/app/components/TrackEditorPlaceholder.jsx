import { Music } from 'lucide-react';
import { TRACK_ICONS, renderIcon } from './icons.js';

function TrackEditorPlaceholder({ activeTrackId }) {
  return (
    <section className="editor" data-screen-label="Track Editor">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(TRACK_ICONS[activeTrackId] ?? Music)}
          </div>
          <div className="clip-title">
            <div className="crumb">Track · Phrase</div>
            <div className="clip-name-input">{activeTrackId} editor</div>
          </div>
        </div>
      </header>
      <div className="empty-editor">
        Select Drums or Chord to edit a phrase.
      </div>
    </section>
  );
}

export { TrackEditorPlaceholder };
