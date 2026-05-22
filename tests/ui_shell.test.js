import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { TOTAL_BARS, TRACK_IDS } from '../src/domain/musicConstants.js';
import {
  BAR_NUMBERS,
  BEAT_NUMBERS,
  CHORD_NOTES,
  TRACK_UI,
} from '../src/app/uiShellData.js';

test('app shell renders the v0.22 arranger tracks and eight-bar timeline', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const timelineSource = await readFile(new URL('../src/app/components/Timeline.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const uiDataSource = await readFile(new URL('../src/app/uiShellData.js', import.meta.url), 'utf8');

  assert.match(source, /aria-label="Project Arranger workspace"/);
  assert.match(topBarSource, /Project Arranger/);
  assert.match(topBarSource, /play-glyph/);
  assert.doesNotMatch(topBarSource, /import\s*\{[^}]*Play/);
  assert.match(source, /data-screen-label="Main"/);
  assert.match(source, /drums/);
  assert.match(source, /DRUMS_TOGGLE/);
  assert.match(source, /createTimelineTracks/);
  assert.match(timelineSource, /BAR_NUMBERS\.map/);
  assert.match(source, /clips/);
  assert.match(source, /getClipForTrackBar/);
  assert.match(source, /createClip\(trackId,\s*barIndex\)/);
  assert.match(source, /selectClip\(clipId\)/);
  assert.doesNotMatch(source, /track\.clipName/);
  assert.doesNotMatch(uiDataSource, /trackClips|clipName|selected:/);

  assert.deepEqual(TRACK_UI.map((track) => track.id), TRACK_IDS);
  assert.equal(TRACK_UI.every((track) => !Object.hasOwn(track, 'clipName')), true);
  assert.equal(BAR_NUMBERS.length, TOTAL_BARS);
  assert.equal(BAR_NUMBERS.at(0), 1);
  assert.equal(BAR_NUMBERS.at(-1), TOTAL_BARS);
});

test('app shell exposes the chord editor preview and audio wiring hooks', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const chordEditorSource = await readFile(
    new URL('../src/app/components/ChordEditor.jsx', import.meta.url),
    'utf8',
  );
  const clipNameInputSource = await readFile(
    new URL('../src/app/components/ClipNameInput.jsx', import.meta.url),
    'utf8',
  );
  const drumSequencerSource = await readFile(
    new URL('../src/app/components/DrumSequencer.jsx', import.meta.url),
    'utf8',
  );
  const trackEditorPlaceholderSource = await readFile(
    new URL('../src/app/components/TrackEditorPlaceholder.jsx', import.meta.url),
    'utf8',
  );

  assert.match(chordEditorSource, /data-screen-label="Chord Editor"/);
  assert.match(clipNameInputSource, /function ClipNameInput/);
  assert.match(clipNameInputSource, /Pencil/);
  assert.match(clipNameInputSource, /renderIcon\(Pencil\)/);
  assert.match(clipNameInputSource, /className="clip-name-field"/);
  assert.match(clipNameInputSource, /className="clip-name-input"/);
  assert.match(clipNameInputSource, /className="clip-name-edit-icon"/);
  assert.match(clipNameInputSource, /value=\{clipName\}/);
  assert.match(clipNameInputSource, /onChange=\{\(event\) => onRenameClip\(event\.target\.value\)\}/);
  assert.match(chordEditorSource, /ClipNameInput/);
  assert.match(drumSequencerSource, /ClipNameInput/);
  assert.match(trackEditorPlaceholderSource, /ClipNameInput/);
  assert.match(trackEditorPlaceholderSource, /添加一个片段即可开始编辑/);
  assert.doesNotMatch(trackEditorPlaceholderSource, /clip去编辑/);
  assert.doesNotMatch(trackEditorPlaceholderSource, /Select any track to edit a phrase/);
  assert.doesNotMatch(chordEditorSource, /renderIcon\(Pencil\)/);
  assert.doesNotMatch(chordEditorSource, /import\s*\{[^}]*Pencil/);
  assert.doesNotMatch(chordEditorSource, /clip-name-display/);
  assert.doesNotMatch(drumSequencerSource, /clip-name-display/);
  assert.doesNotMatch(trackEditorPlaceholderSource, /clip-name-display/);
  assert.match(chordEditorSource, /CHORD EDITOR - BAR/);
  assert.match(chordEditorSource, /选择和弦进行模板/);
  assert.match(chordEditorSource, /Chord Template Picker/);
  assert.match(chordEditorSource, /添加经过和弦/);
  assert.match(chordEditorSource, /添加调内和弦/);
  assert.match(chordEditorSource, /丰富和弦/);
  assert.match(chordEditorSource, /AddChordPopover/);
  assert.match(chordEditorSource, /DIATONIC_CHORD_OPTIONS/);
  assert.match(chordEditorSource, /getChordVariantOptions/);
  assert.match(chordEditorSource, /getPassingChordOptions/);
  assert.match(chordEditorSource, /mode:\s*hasChord \? 'filled' : 'empty'/);
  assert.match(chordEditorSource, /setActiveChordTab\(hasChord \? 'enrich' : 'diatonic'\)/);
  assert.match(chordEditorSource, /mode === 'filled'/);
  assert.match(chordEditorSource, /mode === 'empty'/);
  assert.match(chordEditorSource, /cvPanelEnrich/);
  assert.match(chordEditorSource, /暂无可用丰富和弦/);
  assert.match(chordEditorSource, /CHORD_NOTES\.flatMap/);
  assert.match(chordEditorSource, /CHORD_TEMPLATES/);
  assert.match(chordEditorSource, /onChordPick/);
  assert.match(chordEditorSource, /addChordPanel/);
  assert.match(chordEditorSource, /aria-label=\{`添加和弦 beat \$\{beatNumber\}`\}/);
  assert.match(chordEditorSource, /openAddChordPanel\(spanIndex,\s*event\.currentTarget,\s*beatHasChord\)/);
  assert.match(chordEditorSource, /colIndex < 2 \? 'downbeat' : ''/);
  assert.match(chordEditorSource, /colIndex >= 2 \? 'extension' : ''/);
  assert.doesNotMatch(chordEditorSource, /Beat \$\{beatNumber\} 单音/);
  assert.doesNotMatch(chordEditorSource, /disabled=\{!canOpenChordPanel\}/);
  assert.match(chordEditorSource, /getChordCell/);
  assert.match(chordEditorSource, /getChordStepCell/);
  assert.match(chordEditorSource, /getChordBarDisplayLabel/);
  assert.match(chordEditorSource, /isChordCellActive/);
  assert.match(chordEditorSource, /isChordAddedNoteActive/);
  assert.match(chordEditorSource, /onChordNoteSelect/);
  assert.match(chordEditorSource, /onChordPreview/);
  assert.match(chordEditorSource, /onChordTemplatePreview/);
  assert.match(chordEditorSource, /onChordTemplateApply/);
  assert.match(chordEditorSource, /onClearChordBar/);
  assert.match(chordEditorSource, /onClearChord/);
  assert.match(chordEditorSource, /清空本小节/);
  assert.match(chordEditorSource, /清空 Chord/);
  assert.doesNotMatch(chordEditorSource, /Clear phrase/);
  assert.match(chordEditorSource, /aria-pressed=\{active \|\| added\}/);
  assert.match(chordEditorSource, /onChordPreview\(chordName\)/);
  assert.match(chordEditorSource, /onChordTemplatePreview\(template\.chords\)/);
  assert.match(chordEditorSource, /onClose/);
  assert.match(chordEditorSource, /const handleClose = \(\) => \{[\s\S]*setPickerOpen\(false\);[\s\S]*setAddChordPanel\(null\);[\s\S]*onClose\(\);[\s\S]*\}/);
  assert.match(chordEditorSource, /className="editor-close"[\s\S]*onClick=\{handleClose\}/);
  const previewButtons = chordEditorSource.match(/<button[^>]*data-action="preview"[\s\S]*?<\/button>/g) ?? [];
  assert.ok(previewButtons.length >= 2);
  assert.equal(previewButtons.every((button) => button.includes('play-glyph')), true);
  assert.equal(previewButtons.every((button) => !button.includes('renderIcon(Piano)')), true);
  assert.match(source, /useKeyboardCommands/);
  assert.match(source, /createUiAudioDispatcher/);
  assert.match(source, /audioEngine/);
  assert.match(source, /createChordNotes/);
  assert.match(source, /previewChordSequence/);
  assert.match(source, /handleChordPreview/);
  assert.match(source, /handleChordTemplatePreview/);
  assert.match(source, /seedDefaultDrumsPattern/);
  assert.match(source, /handleCloseEditor/);
  assert.match(source, /selectedClip/);
  assert.match(source, /handleRenameClip/);
  assert.match(source, /renameClip\(selectedClipId,\s*name\)/);
  assert.match(source, /setSelectedClipId\(null\)/);
  assert.match(source, /selectedClipId/);
  assert.match(source, /onCloseEditor:\s*handleCloseEditor/);
  assert.match(bottomEditorSource, /selectedClipId/);
  assert.match(bottomEditorSource, /selectedClipName/);
  assert.match(bottomEditorSource, /onRenameClip/);
  assert.match(bottomEditorSource, /activeTrackId === 'chord' && selectedClipId/);
  assert.match(bottomEditorSource, /onClose:\s*onCloseEditor/);
  assert.match(source, /handleChordCellSelect/);
  assert.match(source, /handleChordPick/);
  assert.match(source, /const step = getChordSpanStep\(spanIndex\)/);
  assert.match(source, /setChordCell\(state\.matrix,\s*selectedBar,\s*spanIndex,\s*root\)/);
  assert.doesNotMatch(source, /targetSpanIndex\s*=\s*0/);
  assert.doesNotMatch(chordEditorSource, /sustain/);
  assert.match(source, /handleChordNoteSelect/);
  assert.match(source, /handleChordTemplateApply/);
  assert.match(source, /handleClearChordBar/);
  assert.match(source, /handleClearChord/);
  assert.match(source, /clearTrack\('chord'\)/);
  assert.match(source, /CHORD_SET_CELL/);
  assert.match(source, /CHORD_CLEAR_CELL/);
  assert.match(source, /setChordCell/);
  assert.match(source, /clearChordCell/);
  assert.match(source, /clearChordBar/);
  assert.match(source, /TRANSPORT_TOGGLE_PLAY/);
  assert.match(source, /TRANSPORT_STOP/);
  assert.match(source, /handleDrumsStepToggle/);

  assert.equal(BEAT_NUMBERS.length, 4);
  assert.equal(CHORD_NOTES.length, 12);
  assert.equal(CHORD_NOTES.at(-1).label, 'C');
  assert.equal(CHORD_NOTES.at(-1).root, true);
});

test('timeline add clip controls switch the persistent editor by track row', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const tracksColumnSource = await readFile(
    new URL('../src/app/components/TracksColumn.jsx', import.meta.url),
    'utf8',
  );
  const drumSequencerSource = await readFile(
    new URL('../src/app/components/DrumSequencer.jsx', import.meta.url),
    'utf8',
  );
  const timelineSource = await readFile(
    new URL('../src/app/components/Timeline.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /activeTrackId/);
  assert.match(source, /handleAddClip/);
  assert.match(source, /handleOpenClip/);
  assert.doesNotMatch(source, /onDrumsPreview/);
  assert.match(source, /syncTrackScrollContainers/);
  assert.match(source, /tracksScrollRef/);
  assert.match(source, /timelineScrollRef/);
  assert.match(source, /ref:\s*tracksScrollRef/);
  assert.match(source, /ref:\s*timelineScrollRef/);
  assert.match(source, /onAddClip/);
  assert.match(source, /onTrackSelect:\s*handleTrackSelect/);
  assert.match(timelineSource, /onAddClip\(track\.id,\s*bar\.bar\)/);
  assert.match(timelineSource, /onTrackSelect/);
  assert.match(timelineSource, /handleTrackRowClick/);
  assert.match(timelineSource, /target\.closest\('button'\)/);
  assert.match(timelineSource, /onClick=\{\(event\) => handleTrackRowClick\(event,\s*track\.id\)\}/);
  assert.match(source, /handleMoveClip/);
  assert.match(timelineSource, /onMouseDown/);
  assert.match(timelineSource, /mousemove/);
  assert.match(timelineSource, /mouseup/);
  assert.match(timelineSource, /onMoveClip/);
  assert.match(timelineSource, /dragFeedback/);
  assert.doesNotMatch(timelineSource, /Pencil/);
  assert.doesNotMatch(timelineSource, /clip-mini/);
  assert.doesNotMatch(timelineSource, /onPreview/);
  assert.doesNotMatch(timelineSource, /Preview drums/);
  assert.match(timelineSource, /sourceBar:\s*clip\.bar/);
  assert.match(timelineSource, /drop-move/);
  assert.match(timelineSource, /drop-swap/);
  assert.match(timelineSource, /clip-dragging/);
  assert.match(timelineSource, /clip\.hasContent/);
  assert.match(timelineSource, /bar\.canAddClip/);
  assert.match(source, /createClip\(trackId,\s*barIndex\)/);
  assert.match(source, /moveClipToBar\(clipId,\s*targetBar\)/);
  assert.match(source, /selectClip\(clipId\)/);
  assert.match(source, /volumes/);
  assert.match(source, /setTrackVolume\(trackId,\s*volume\)/);
  assert.match(source, /onVolumeChange:\s*handleTrackVolumeChange/);
  assert.match(source, /setVolumeSource/);
  assert.match(source, /useMusicStore\.getState\(\)\.volumes/);
  assert.match(tracksColumnSource, /type="range"/);
  assert.match(tracksColumnSource, /aria-label=\{`\$\{track\.label\} volume`\}/);
  assert.match(tracksColumnSource, /className=\{classes\}[\s\S]*onClick=\{\(\) => onSelect\(track\.id\)\}/);
  assert.match(tracksColumnSource, /handleVolumePointerDown[\s\S]*onSelect\(track\.id\)/);
  assert.match(tracksColumnSource, /onVolumeChange\(track\.id/);
  assert.match(tracksColumnSource, /handleVolumePointerDown/);
  assert.match(tracksColumnSource, /getTrackVolumeFromClientX/);
  assert.match(timelineSource, /data-track-row=\{track\.id\}/);
  assert.match(timelineSource, /data-track-index=\{trackIndex\}/);
  assert.match(timelineSource, /data-bar-index=\{bar\.bar\}/);
  assert.match(drumSequencerSource, /data-screen-label="Drum Sequencer"/);
  assert.match(drumSequencerSource, /DRUM SEQUENCER - BAR/);
  assert.match(drumSequencerSource, /为本小节生成基础律动/);
  assert.match(drumSequencerSource, /全局生成基础律动/);
  assert.match(drumSequencerSource, /清空本小节/);
  assert.match(drumSequencerSource, /清空 Drums/);
  assert.match(drumSequencerSource, /onClose/);
  assert.match(drumSequencerSource, /className="editor-close"[\s\S]*onClick=\{onClose\}/);
  assert.match(source, /applyBasicDrumsBar/);
  assert.match(source, /getDrumsClipBarIndexes/);
  assert.match(source, /applyBasicDrumsAllBars/);
  assert.match(source, /applyBasicDrumsAllBars\(state\.matrix,\s*drumsClipBars\)/);
  assert.match(source, /clearDrumsBar/);
  assert.match(bottomEditorSource, /activeTrackId === 'drums' && selectedClipId/);
  assert.match(bottomEditorSource, /onClose:\s*onCloseEditor/);
  assert.match(bottomEditorSource, /activeTrackId === 'chord'/);
  assert.match(bottomEditorSource, /onChordPick/);
  assert.match(bottomEditorSource, /onChordNoteSelect/);
  assert.match(bottomEditorSource, /onChordPreview/);
  assert.match(bottomEditorSource, /onChordTemplatePreview/);
  assert.match(bottomEditorSource, /onChordTemplateApply/);
});

test('app mounts the drums tutorial preview overlay', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const overlaySource = await readFile(
    new URL('../src/app/components/TutorialOverlay.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /TutorialOverlay/);
  assert.match(source, /DRUMS_TUTORIAL_STEPS/);
  assert.match(source, /currentTutorialStepIndex/);
  assert.match(source, /getTutorialViewModel/);
  assert.match(source, /tutorialViewModel\.displayCopy/);
  assert.match(overlaySource, /tutorial-panel/);
  assert.match(overlaySource, /getTutorialPlacement/);
  assert.match(overlaySource, /data-placement=/);
  assert.match(overlaySource, /displayCopy/);
  assert.match(overlaySource, /showCompleteButton/);
  assert.match(overlaySource, /onPrimaryAction/);
  assert.match(overlaySource, /跳过教程/);
});

test('tutorial preview points to real app regions', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const timelineSource = await readFile(
    new URL('../src/app/components/Timeline.jsx', import.meta.url),
    'utf8',
  );
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const overlaySource = await readFile(
    new URL('../src/app/components/TutorialOverlay.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /activeTutorialTarget/);
  assert.match(topBarSource, /data-tutorial-target="top-bar"/);
  assert.match(topBarSource, /tutorial-target-active/);
  assert.match(timelineSource, /data-tutorial-target="track-area"/);
  assert.match(timelineSource, /tutorial-target-active/);
  assert.match(bottomEditorSource, /data-tutorial-target="track-editor"/);
  assert.match(bottomEditorSource, /tutorial-target-active/);
  assert.match(overlaySource, /正在指引/);
});

test('app routes drums tutorial tasks through guards and target props', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const timelineSource = await readFile(
    new URL('../src/app/components/Timeline.jsx', import.meta.url),
    'utf8',
  );
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const drumSequencerSource = await readFile(
    new URL('../src/app/components/DrumSequencer.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /handleTutorialDrumToggle/);
  assert.match(source, /handleTutorialDrumMove/);
  assert.match(source, /completeTutorialTask4/);
  assert.match(source, /tutorialViewModel\.targets/);
  assert.match(source, /tutorialViewModel\.locked/);
  assert.match(source, /tutorialViewModel\.suggestedSelectedBar/);
  assert.match(source, /onDrumsStepMove:\s*handleDrumsStepMove/);
  assert.match(timelineSource, /tutorialTargets/);
  assert.match(timelineSource, /tutorial-bar-target/);
  assert.match(bottomEditorSource, /tutorialTargets/);
  assert.match(bottomEditorSource, /tutorialLocked/);
  assert.match(drumSequencerSource, /onStepMove/);
  assert.match(drumSequencerSource, /tutorial-cell-target/);
  assert.match(drumSequencerSource, /tutorial-cell-source/);
  assert.match(drumSequencerSource, /tutorial-cell-completed/);
});
