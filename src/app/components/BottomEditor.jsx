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
  isPlaying = false,
  matrix,
  clips,
  launchpadHarmonySelection,
  launchpadHarmonyTarget,
  melodyScaleId,
  melodyActiveInputNotes,
  melodyRecordingState,
  melodyRhythmTemplateId,
  onChordRhythmStepToggle,
  onChordStepHarmonyApply,
  onChordStepHarmonyPreview,
  onChordStepHarmonyPreviewStop,
  onLaunchpadHarmonyClose,
  onChordTemplateWorkspacePreview,
  onChordTemplateWorkspacePreviewStop,
  onChordTemplateWorkspaceApply,
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
  onMelodyNoteOff,
  onMelodyNoteOn,
  onMelodyRecordCancel,
  onMelodyRecordConfirm,
  onMelodyWriteToggle,
  onMelodyRhythmTemplateApply,
  onMelodyScaleChange,
  onMelodyStepToggle,
  onRenameClip,
  onClearCurrentDrumsBar,
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
      clips,
      isPlaying,
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
      launchpadHarmonySelection,
      launchpadHarmonyTarget,
      onChordRhythmStepToggle,
      onChordStepHarmonyApply,
      onChordStepHarmonyPreview,
      onChordStepHarmonyPreviewStop,
      onChordTemplateWorkspacePreview,
      onChordTemplateWorkspacePreviewStop,
      onChordTemplateWorkspaceApply,
      onLaunchpadHarmonyClose,
      canPageBars,
      onClose: onCloseEditor,
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
      activeInputNotes: melodyActiveInputNotes,
      melodyRecordingState,
      melodyRhythmTemplateId,
      onClearMelody,
      onClearMelodyBar,
      onClose: onCloseEditor,
      onNextBar,
      onPreviousBar,
      onMelodyPreview,
      onMelodyNoteOff,
      onMelodyNoteOn,
      onMelodyRecordCancel,
      onMelodyRecordConfirm,
      onMelodyWriteToggle,
      onMelodyRhythmTemplateApply,
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
      <div className="editor-hardware-shell">
        {editor}
      </div>
    </div>
  );
}

export { BottomEditor };
