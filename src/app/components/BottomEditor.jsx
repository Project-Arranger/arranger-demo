import { createElement } from 'react';
import { BassEditor } from './BassEditor.jsx';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { MelodyEditor } from './MelodyEditor.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  activeTutorialTarget,
  canPageDrumsBars = false,
  tutorialLocked = false,
  tutorialTargets,
  selectedClipName = '',
  matrix,
  melodyScaleId,
  onChordCellSelect,
  onChordNoteSelect,
  onChordPick,
  onChordPreview,
  onChordGrooveTemplatePreview,
  onChordGrooveTemplateApply,
  onChordTemplatePreview,
  onChordTemplateApply,
  onPassingChordPick,
  onBassPreview,
  onBassStepToggle,
  onBassGrooveTemplatePreview,
  onBassGrooveTemplateApply,
  onCloseEditor,
  onClearBass,
  onClearBassBar,
  onClearMelody,
  onClearMelodyBar,
  onMelodyPreview,
  onMelodyScaleChange,
  onMelodyStepToggle,
  onRenameClip,
  onClearCurrentDrumsBar,
  onClearChord,
  onClearChordBar,
  onClearDrums,
  onGenerateAllDrumsBars,
  onGenerateCurrentDrumsBar,
  onNextDrumsBar,
  onPreviousDrumsBar,
  onDrumsStepMove,
  onDrumsStepToggle,
  selectedBar,
  selectedClipId,
}) {
  const editorTargetClass = [
    'track-editor-target',
    activeTutorialTarget === 'track-editor' ? 'tutorial-target-active' : '',
  ].filter(Boolean).join(' ');
  let editor;

  if (activeTrackId === 'drums' && selectedClipId) {
    editor = createElement(DrumSequencer, {
      matrix,
      clipName: selectedClipName,
      onClose: onCloseEditor,
      onClearCurrentBar: onClearCurrentDrumsBar,
      onClearDrums,
      canPageBars: canPageDrumsBars,
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onNextBar: onNextDrumsBar,
      onPreviousBar: onPreviousDrumsBar,
      onStepMove: onDrumsStepMove,
      onStepToggle: onDrumsStepToggle,
      onRenameClip,
      selectedBar,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackId === 'bass' && selectedClipId) {
    editor = createElement(BassEditor, {
      matrix,
      clipName: selectedClipName,
      onBassPreview,
      onBassStepToggle,
      onBassGrooveTemplatePreview,
      onBassGrooveTemplateApply,
      onClearBass,
      onClearBassBar,
      onClose: onCloseEditor,
      onRenameClip,
      selectedBar,
    });
  } else if (activeTrackId === 'chord' && selectedClipId) {
    editor = createElement(ChordEditor, {
      matrix,
      clipName: selectedClipName,
      onChordCellSelect,
      onChordNoteSelect,
      onChordPick,
      onChordPreview,
      onChordGrooveTemplatePreview,
      onChordGrooveTemplateApply,
      onChordTemplatePreview,
      onChordTemplateApply,
      onPassingChordPick,
      onClose: onCloseEditor,
      onClearChord,
      onClearChordBar,
      onRenameClip,
      selectedBar,
    });
  } else if (activeTrackId === 'melody' && selectedClipId) {
    editor = createElement(MelodyEditor, {
      matrix,
      clipName: selectedClipName,
      melodyScaleId,
      onClearMelody,
      onClearMelodyBar,
      onClose: onCloseEditor,
      onMelodyPreview,
      onMelodyScaleChange,
      onMelodyStepToggle,
      onRenameClip,
      selectedBar,
    });
  } else {
    editor = createElement(TrackEditorPlaceholder, {
      activeTrackId,
      clipName: selectedClipName,
      onRenameClip,
    });
  }

  return (
    <div className={editorTargetClass} data-tutorial-target="track-editor">
      {editor}
    </div>
  );
}

export { BottomEditor };
