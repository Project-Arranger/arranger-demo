import { createElement } from 'react';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  selectedClipName = '',
  matrix,
  onChordCellSelect,
  onChordNoteSelect,
  onChordPick,
  onChordPreview,
  onChordTemplatePreview,
  onChordTemplateApply,
  onCloseEditor,
  onRenameClip,
  onClearCurrentDrumsBar,
  onClearChord,
  onClearChordBar,
  onClearDrums,
  onGenerateAllDrumsBars,
  onGenerateCurrentDrumsBar,
  onDrumsStepToggle,
  rootKey,
  selectedBar,
  selectedClipId,
}) {
  if (activeTrackId === 'drums' && selectedClipId) {
    return createElement(DrumSequencer, {
      matrix,
      clipName: selectedClipName,
      onClose: onCloseEditor,
      onClearCurrentBar: onClearCurrentDrumsBar,
      onClearDrums,
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onStepToggle: onDrumsStepToggle,
      onRenameClip,
      selectedBar,
    });
  }

  if (activeTrackId === 'chord' && selectedClipId) {
    return createElement(ChordEditor, {
      matrix,
      clipName: selectedClipName,
      onChordCellSelect,
      onChordNoteSelect,
      onChordPick,
      onChordPreview,
      onChordTemplatePreview,
      onChordTemplateApply,
      onClose: onCloseEditor,
      onClearChord,
      onClearChordBar,
      onRenameClip,
      rootKey,
      selectedBar,
    });
  }

  return createElement(TrackEditorPlaceholder, {
    activeTrackId,
    clipName: selectedClipName,
    onRenameClip,
  });
}

export { BottomEditor };
