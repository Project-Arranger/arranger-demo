import { createElement } from 'react';
import { BassEditor } from './BassEditor.jsx';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { MelodyEditor } from './MelodyEditor.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  activeTutorialTarget,
  canPageBars = false,
  tutorialLocked = false,
  tutorialTargets,
  selectedClipName = '',
  matrix,
  clips,
  melodyScaleId,
  onChordCellSelect,
  onChordNoteSelect,
  onChordPick,
  onChordPreview,
  onChordGrooveTemplatePreview,
  onChordGrooveTemplateApply,
  onChordTemplatePreview,
  onChordTemplateApply,
  onPassingChordPreview,
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
  onNextBar,
  onPreviousBar,
  onDrumsStepMove,
  onDrumsStepToggle,
  selectedBar,
  selectedClipId,
  shouldConfirmChordTemplateApply = false,
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
      canPageBars,
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onNextBar,
      onPreviousBar,
      onStepMove: onDrumsStepMove,
      onStepToggle: onDrumsStepToggle,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
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
      canPageBars,
      onClearBass,
      onClearBassBar,
      onClose: onCloseEditor,
      onNextBar,
      onPreviousBar,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackId === 'chord' && selectedClipId) {
    editor = createElement(ChordEditor, {
      matrix,
      clips,
      clipName: selectedClipName,
      onChordCellSelect,
      onChordNoteSelect,
      onChordPick,
      onChordPreview,
      onChordGrooveTemplatePreview,
      onChordGrooveTemplateApply,
      onChordTemplatePreview,
      onChordTemplateApply,
      onPassingChordPreview,
      onPassingChordPick,
      canPageBars,
      shouldConfirmChordTemplateApply,
      onClose: onCloseEditor,
      onClearChord,
      onClearChordBar,
      onNextBar,
      onPreviousBar,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackId === 'melody' && selectedClipId) {
    editor = createElement(MelodyEditor, {
      matrix,
      clipName: selectedClipName,
      canPageBars,
      melodyScaleId,
      onClearMelody,
      onClearMelodyBar,
      onClose: onCloseEditor,
      onNextBar,
      onPreviousBar,
      onMelodyPreview,
      onMelodyScaleChange,
      onMelodyStepToggle,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
      tutorialLocked,
      tutorialTargets,
    });
  } else {
    editor = createElement(TrackEditorPlaceholder, {
      activeTrackId,
      canPageBars,
      clipName: selectedClipName,
      onNextBar,
      onPreviousBar,
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
