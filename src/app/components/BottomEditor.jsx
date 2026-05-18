import { createElement } from 'react';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  matrix,
  onClearCurrentDrumsBar,
  onClearDrums,
  onGenerateAllDrumsBars,
  onGenerateCurrentDrumsBar,
  onDrumsStepToggle,
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
    return createElement(ChordEditor);
  }

  return createElement(TrackEditorPlaceholder, { activeTrackId });
}

export { BottomEditor };
