import { Music } from 'lucide-react';
import { createElement } from 'react';
import { ClipNameInput } from './ClipNameInput.jsx';
import { TRACK_ICONS, renderIcon } from './icons.js';

function TrackEditorPlaceholder({
  activeTrackId,
  clipName,
  onRenameClip,
}) {
  return (
    <section className="editor" data-screen-label="Track Editor">
      <header className="editor-head">
        <div className="editor-left">
          <div className="clip-chip">
            {renderIcon(TRACK_ICONS[activeTrackId] ?? Music)}
          </div>
          <div className="clip-title">
            <div className="crumb">Track · Phrase</div>
            {createElement(ClipNameInput, { clipName, onRenameClip })}
          </div>
        </div>
      </header>
      <div className="empty-editor">
        添加一个片段即可开始编辑
      </div>
    </section>
  );
}

export { TrackEditorPlaceholder };
