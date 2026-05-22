import { createElement } from 'react';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  activeTutorialTarget,
  tutorialLocked = false,
  tutorialTargets,
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
  onDrumsStepMove,
  onDrumsStepToggle,
  rootKey,
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
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onStepMove: onDrumsStepMove,
      onStepToggle: onDrumsStepToggle,
      onRenameClip,
      selectedBar,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackId === 'chord' && selectedClipId) {
    editor = createElement(ChordEditor, {
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
