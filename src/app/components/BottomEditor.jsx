import { createElement } from 'react';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  matrix,
  onChordCellSelect,
  onChordNoteSelect,
  onChordTemplateApply,
  onClearCurrentDrumsBar,
  onClearChordBar,
  onClearDrums,
  onGenerateAllDrumsBars,
  onGenerateCurrentDrumsBar,
  onDrumsStepToggle,
  rootKey,
  selectedBar,
}) {
  if (activeTrackId === 'drums') {
    return createElement(DrumSequencer, {
      matrix,
      onClearCurrentBar: onClearCurrentDrumsBar,
      onClearDrums,
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onStepToggle: onDrumsStepToggle,
      selectedBar,
    });
  }

  if (activeTrackId === 'chord') {
    return createElement(ChordEditor, {
      matrix,
      onChordCellSelect,
      onChordNoteSelect,
      onChordTemplateApply,
      onClearChordBar,
      rootKey,
      selectedBar,
    });
  }

  return createElement(TrackEditorPlaceholder, { activeTrackId });
}

export { BottomEditor };
