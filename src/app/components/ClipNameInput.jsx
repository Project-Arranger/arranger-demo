import { Pencil } from 'lucide-react';
import { renderIcon } from './icons.js';

function ClipNameInput({
  clipName = '',
  onRenameClip = () => {},
}) {
  return (
    <div className="clip-name-field">
      <input
        className="clip-name-input"
        type="text"
        aria-label="Clip name"
        value={clipName}
        onChange={(event) => onRenameClip(event.target.value)}
      />
      <span className="clip-name-edit-icon" aria-hidden="true">
        {renderIcon(Pencil)}
      </span>
    </div>
  );
}

export { ClipNameInput };
