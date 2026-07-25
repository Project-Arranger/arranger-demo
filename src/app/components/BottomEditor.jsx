import { createElement } from 'react';
import { BassEditor } from './BassEditor.jsx';
import { ChordEditor } from './ChordEditor.jsx';
import { DrumSequencer } from './DrumSequencer.jsx';
import { MelodyEditor } from './MelodyEditor.jsx';
import { TrackEditorPlaceholder } from './TrackEditorPlaceholder.jsx';

function BottomEditor({
  activeTrackId,
  activeTrackName,
  activeTrackType,
  activeTutorialTarget,
  canPageBars = false,
  tutorialLocked = false,
  tutorialTargets,
  selectedClipName = '',
  isPlaying = false,
  matrix,
  clips,
  drumsRecordingState,
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
  onClearChord,
  onClearChordBar,
  onClearDrums,
  onGenerateAllDrumsBars,
  onGenerateCurrentDrumsBar,
  onNextBar,
  onPreviousBar,
  onDrumsStepMove,
  onDrumsStepToggle,
  onDrumsRecordCancel,
  onDrumsRecordConfirm,
  onDrumsWriteToggle,
  selectedBar,
  selectedClipId,
}) {
  const editorTargetClass = [
    'track-editor-target',
    activeTutorialTarget === 'track-editor' ? 'tutorial-target-active' : '',
  ].filter(Boolean).join(' ');
  let editor;

  const drumsWriting = Boolean(
    drumsRecordingState?.phase
    && drumsRecordingState.phase !== 'idle',
  );

  if (activeTrackType === 'drums' && (selectedClipId || drumsWriting)) {
    editor = createElement(DrumSequencer, {
      clips,
      matrix,
      clipName: selectedClipName,
      drumsRecordingState,
      hasClip: Boolean(selectedClipId),
      onClose: onCloseEditor,
      onClearCurrentBar: onClearCurrentDrumsBar,
      onClearDrums,
      canPageBars,
      onGenerateAllBars: onGenerateAllDrumsBars,
      onGenerateCurrentBar: onGenerateCurrentDrumsBar,
      onNextBar,
      onPreviousBar,
      onRecordCancel: onDrumsRecordCancel,
      onRecordConfirm: onDrumsRecordConfirm,
      onStepMove: onDrumsStepMove,
      onStepToggle: onDrumsStepToggle,
      onWriteToggle: onDrumsWriteToggle,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
      trackName: activeTrackName,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackType === 'bass' && selectedClipId) {
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
      trackName: activeTrackName,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackType === 'chord' && selectedClipId) {
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
      onClearChord,
      onClearChordBar,
      onNextBar,
      onPreviousBar,
      onRenameClip,
      selectedBar,
      trackId: activeTrackId,
      trackName: activeTrackName,
      tutorialLocked,
      tutorialTargets,
    });
  } else if (activeTrackType === 'melody' && selectedClipId) {
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
      trackName: activeTrackName,
      tutorialLocked,
      tutorialTargets,
    });
  } else {
    editor = createElement(TrackEditorPlaceholder, {
      activeTrackId,
      activeTrackName,
      activeTrackType,
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
