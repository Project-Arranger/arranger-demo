import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  CORE_TRACK_IDS,
  OPTIONAL_TRACK_IDS,
  TOTAL_BARS,
  TRACK_IDS,
} from '../src/domain/musicConstants.js';
import {
  BAR_NUMBERS,
  CHORD_GRID_PITCHES,
  BEAT_NUMBERS,
  CHORD_NOTES,
  getTrackUiByIds,
  OPTIONAL_TRACK_UI,
  TRACK_UI,
} from '../src/app/uiShellData.js';

test('piano-roll row indicator uses one delegated coordinate without per-cell hover state', async () => {
  const rowIndicatorSource = await readFile(
    new URL('../src/app/usePianoRollRowIndicator.js', import.meta.url),
    'utf8',
  );

  assert.match(rowIndicatorSource, /useRef/);
  assert.match(rowIndicatorSource, /closest\?\.\('\[data-row\]'\)/);
  assert.match(rowIndicatorSource, /rowTarget\.offsetTop/);
  assert.match(rowIndicatorSource, /--piano-roll-hover-y/);
  assert.match(rowIndicatorSource, /handlePointerOver/);
  assert.match(rowIndicatorSource, /handlePointerLeave/);
  assert.match(rowIndicatorSource, /handleFocusCapture/);
  assert.match(rowIndicatorSource, /ResizeObserver/);
  assert.doesNotMatch(rowIndicatorSource, /querySelectorAll|classList|row-hovered|useState/);
});

test('topbar exposes independent undo redo controls and App wires history', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const undoControllerSource = await readFile(
    new URL('../src/app/useUndoHistoryController.js', import.meta.url),
    'utf8',
  );

  assert.match(topBarSource, /Undo2/);
  assert.match(topBarSource, /Copy/);
  assert.match(topBarSource, /ClipboardPaste/);
  assert.match(topBarSource, /Redo2/);
  assert.match(topBarSource, /canUndo\s*=\s*false/);
  assert.match(topBarSource, /canRedo\s*=\s*false/);
  assert.match(topBarSource, /canCopyClip\s*=\s*false/);
  assert.match(topBarSource, /canPasteClip\s*=\s*false/);
  assert.match(topBarSource, /onUndo/);
  assert.match(topBarSource, /onRedo/);
  assert.match(topBarSource, /onCopyClip/);
  assert.match(topBarSource, /onPasteClip/);
  assert.match(topBarSource, /className="history-controls"/);
  assert.match(topBarSource, /role="toolbar" aria-label="History"/);
  assert.match(topBarSource, /className="t-btn undo"/);
  assert.match(topBarSource, /className="t-btn redo"/);
  assert.match(topBarSource, /aria-label="向前一步"/);
  assert.match(topBarSource, /title="向前一步 \(Ctrl\+Z\)"/);
  assert.match(topBarSource, /aria-label="向后一步"/);
  assert.match(topBarSource, /title="向后一步"/);
  assert.match(topBarSource, /disabled=\{!canUndo\}/);
  assert.match(topBarSource, /disabled=\{!canRedo\}/);
  assert.match(topBarSource, /onClick=\{onUndo\}/);
  assert.match(topBarSource, /onClick=\{onRedo\}/);
  assert.match(topBarSource, /renderIcon\(Undo2\)/);
  assert.match(topBarSource, /renderIcon\(Redo2\)/);
  assert.match(topBarSource, /className="clip-controls"/);
  assert.match(topBarSource, /role="toolbar" aria-label="Clip actions"/);
  assert.match(topBarSource, /aria-label="复制 clip"/);
  assert.match(topBarSource, /title="复制 clip \(Cmd\/Ctrl\+C\)"/);
  assert.match(topBarSource, /disabled=\{!canCopyClip\}/);
  assert.match(topBarSource, /onClick=\{onCopyClip\}/);
  assert.match(topBarSource, /renderIcon\(Copy\)/);
  assert.match(topBarSource, /aria-label="粘贴 clip"/);
  assert.match(topBarSource, /title="粘贴 clip \(Cmd\/Ctrl\+V\)"/);
  assert.match(topBarSource, /disabled=\{!canPasteClip\}/);
  assert.match(topBarSource, /onClick=\{onPasteClip\}/);
  assert.match(topBarSource, /renderIcon\(ClipboardPaste\)/);
  assert.match(topBarSource, /className="history-controls"[\s\S]*className="t-btn undo"[\s\S]*className="t-btn redo"[\s\S]*<div className=\{transportClassName\} role="toolbar" aria-label="Transport">/);
  assert.match(topBarSource, /className="history-controls"[\s\S]*className="clip-controls"[\s\S]*<div className=\{transportClassName\} role="toolbar" aria-label="Transport">/);
  assert.doesNotMatch(topBarSource, /<div className=\{transportClassName\} role="toolbar" aria-label="Transport">[\s\S]*className="t-btn undo"[\s\S]*Back to start/);
  assert.doesNotMatch(topBarSource, /<div className=\{transportClassName\} role="toolbar" aria-label="Transport">[\s\S]*className="t-btn redo"[\s\S]*Back to start/);

  assert.match(source, /useUndoHistoryController\(\{\s*appliedTutorialSetups,\s*clearTutorialAutoAdvanceTimer,\s*clearTutorialCountIn,\s*currentTutorialStepIndex,\s*dispatchAppCommand,/);
  assert.match(undoControllerSource, /createUndoSnapshot/);
  assert.match(undoControllerSource, /createUndoTransition/);
  assert.match(undoControllerSource, /createRedoTransition/);
  assert.match(undoControllerSource, /pushHistoryCheckpoint/);
  assert.match(undoControllerSource, /restoreUndoSnapshot/);
  assert.match(undoControllerSource, /const \[undoHistory,\s*setUndoHistory\] = useState\(\(\) => \[\]\);/);
  assert.match(undoControllerSource, /const \[redoHistory,\s*setRedoHistory\] = useState\(\(\) => \[\]\);/);
  assert.match(undoControllerSource, /canUndo:\s*undoHistory\.length > 0/);
  assert.match(undoControllerSource, /canRedo:\s*redoHistory\.length > 0/);
  assert.match(undoControllerSource, /const withUndoCheckpoint = useCallback/);
  assert.match(undoControllerSource, /const handleUndo = useCallback/);
  assert.match(undoControllerSource, /const handleRedo = useCallback/);
  assert.match(undoControllerSource, /volumeUndoSnapshotRef/);
  assert.match(source, /APP_COMMAND_TYPES\.APP_UNDO/);
  assert.match(source, /APP_COMMAND_TYPES\.APP_REDO/);
  assert.match(source, /APP_COMMAND_TYPES\.CLIP_COPY_SELECTED/);
  assert.match(source, /APP_COMMAND_TYPES\.CLIP_PASTE/);
  assert.match(source, /command\?\.type === APP_COMMAND_TYPES\.APP_UNDO[\s\S]*handleUndo\(\);[\s\S]*return;/);
  assert.match(source, /command\?\.type === APP_COMMAND_TYPES\.APP_REDO[\s\S]*handleRedo\(\);[\s\S]*return;/);
  assert.match(source, /command\?\.type === APP_COMMAND_TYPES\.CLIP_COPY_SELECTED[\s\S]*handleCopySelectedClip\(\);[\s\S]*return;/);
  assert.match(source, /command\?\.type === APP_COMMAND_TYPES\.CLIP_PASTE[\s\S]*handlePasteClipRequest\(\);[\s\S]*return;/);
  assert.match(undoControllerSource, /setRedoHistory\(\(\) => \[\]\)/);
  assert.match(source, /canRedo,\s*\n\s*canUndo,\s*\n\s*currentBar/);
  assert.match(source, /canCopyClip,/);
  assert.match(source, /canPasteClip,/);
  assert.match(source, /onCopyClip:\s*handleCopySelectedClip/);
  assert.match(source, /onPasteClip:\s*handlePasteClipRequest/);
  assert.match(source, /onRedo:\s*handleRedo/);
  assert.match(source, /onUndo:\s*handleUndo/);
  assert.match(source, /withUndoCheckpoint\(\(\) => \{[\s\S]*createClip\(trackId,\s*barIndex\)/);
  assert.match(source, /withUndoCheckpoint\(\(\) => \{[\s\S]*handleTutorialControlAction/);
  assert.match(source, /withUndoCheckpoint\(\(\) => \{[\s\S]*state\.setCell\('drums'/);
  assert.match(source, /withUndoCheckpoint\(\(\) => \{[\s\S]*setTutorialProgress/);
});

test('skeuomorphic workbench structure exposes hardware shell affordances', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const tracksColumnSource = await readFile(
    new URL('../src/app/components/TracksColumn.jsx', import.meta.url),
    'utf8',
  );
  const timelineSource = await readFile(new URL('../src/app/components/Timeline.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );

  assert.match(topBarSource, /className="power-gem"/);
  assert.match(topBarSource, /<span className="btn-new-label">New<\/span>/);
  assert.match(topBarSource, /onNewSong = \(\) => \{\}/);
  assert.match(topBarSource, /<button\s+className="btn-new"\s+aria-label="New song"\s+title="New song"\s+type="button"\s+onClick=\{onNewSong\}>/);
  assert.doesNotMatch(topBarSource, /renderIcon\(Plus\)/);
  assert.doesNotMatch(topBarSource, />\s*New Song\s*</);
  assert.match(appSource, /const handleNewSong = useCallback\(\(\) => \{[\s\S]*const initialAppState = useMusicStore\.getInitialState\(\);[\s\S]*useMusicStore\.setState\(initialAppState, true\);/);
  assert.match(appSource, /onNewSong:\s*requestNewSong/);
  assert.match(topBarSource, /className="hardware-status-display"/);
  assert.match(topBarSource, /className="key-switch tutorial-switch"/);
  assert.match(topBarSource, /className="key-switch save-switch"/);
  assert.match(topBarSource, /className="hardware-export"/);

  assert.match(tracksColumnSource, /className="track-material-layer"/);
  assert.match(tracksColumnSource, /className="volume-knob"/);
  assert.match(tracksColumnSource, /className="fill-gem"/);

  assert.match(timelineSource, /className="timeline-bezel"/);
  assert.match(timelineSource, /className="grid-glass"/);

  assert.match(bottomEditorSource, /className="editor-hardware-shell"/);
});

test('new song flow asks before discarding the current arrangement', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');

  assert.match(topBarSource, /<span className="btn-new-label">New<\/span>/);
  assert.match(appSource, /const \[isNewSongConfirmOpen,\s*setIsNewSongConfirmOpen\] = useState\(false\);/);
  assert.match(appSource, /const requestNewSong = useCallback\(\(\) => \{[\s\S]*setIsNewSongConfirmOpen\(true\);[\s\S]*\}, \[\]\);/);
  assert.match(appSource, /const cancelNewSong = useCallback\(\(\) => \{[\s\S]*setIsNewSongConfirmOpen\(false\);[\s\S]*\}, \[\]\);/);
  assert.match(appSource, /const confirmNewSong = useCallback\(\(\) => \{[\s\S]*setIsNewSongConfirmOpen\(false\);[\s\S]*handleNewSong\(\);[\s\S]*\}, \[handleNewSong\]\);/);
  assert.match(appSource, /onNewSong:\s*requestNewSong/);
  assert.doesNotMatch(appSource, /onNewSong:\s*handleNewSong/);
  assert.match(appSource, /isNewSongConfirmOpen \? \([\s\S]*className="new-song-confirm-overlay"[\s\S]*role="presentation"[\s\S]*className="new-song-confirm-dialog"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*是否放弃当前进度创建新的乐章/);
  assert.match(appSource, /className="new-song-confirm-cancel"[\s\S]*onClick=\{cancelNewSong\}[\s\S]*取消/);
  assert.match(appSource, /className="new-song-confirm-apply"[\s\S]*onClick=\{confirmNewSong\}[\s\S]*创建新乐章/);
  assert.doesNotMatch(appSource, /window\.confirm/);
});

test('clip copy paste flow keeps an app clipboard and confirms destructive paste', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const clipClipboardSource = await readFile(
    new URL('../src/app/useClipClipboardActions.js', import.meta.url),
    'utf8',
  );

  assert.match(appSource, /useClipClipboardActions\(\{\s*activeTrackId,\s*clips,\s*matrix,\s*selectedBar,\s*selectedClipId,\s*withUndoCheckpoint,\s*\}\)/);
  assert.match(clipClipboardSource, /const \[clipClipboard,\s*setClipClipboard\] = useState\(null\);/);
  assert.match(clipClipboardSource, /const \[pendingClipPaste,\s*setPendingClipPaste\] = useState\(null\);/);
  assert.match(clipClipboardSource, /const handleCopySelectedClip = useCallback\(\(\) => \{[\s\S]*createClipClipboardSnapshot\(selectedClipId\)[\s\S]*setClipClipboard\(snapshot\);/);
  assert.match(clipClipboardSource, /const handlePasteClipRequest = useCallback\(\(\) => \{[\s\S]*getCurrentClipPasteTarget\(\)[\s\S]*setPendingClipPaste/);
  assert.match(clipClipboardSource, /const confirmClipPaste = useCallback\(\(\) => \{[\s\S]*pasteClipToTarget\(pendingClipPaste\);[\s\S]*setPendingClipPaste\(null\);/);
  assert.match(clipClipboardSource, /const cancelClipPaste = useCallback\(\(\) => \{[\s\S]*setPendingClipPaste\(null\);[\s\S]*\}, \[\]\);/);
  assert.match(clipClipboardSource, /const clearClipClipboardState = useCallback\(\(\) => \{[\s\S]*setClipClipboard\(null\);[\s\S]*setPendingClipPaste\(null\);/);
  assert.match(appSource, /clearClipClipboardState\(\);[\s\S]*useMusicStore\.setState\(initialAppState, true\);/);
  assert.match(appSource, /pendingClipPaste \? \([\s\S]*className="clip-paste-confirm-overlay"[\s\S]*role="presentation"[\s\S]*className="clip-paste-confirm-dialog"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*确认覆盖这个 clip/);
  assert.match(appSource, /className="clip-paste-confirm-cancel"[\s\S]*onClick=\{cancelClipPaste\}[\s\S]*取消/);
  assert.match(appSource, /className="clip-paste-confirm-apply"[\s\S]*onClick=\{confirmClipPaste\}[\s\S]*覆盖粘贴/);
  assert.doesNotMatch(appSource, /window\.confirm/);
});

test('app shell renders the v0.22 arranger tracks and eight-bar timeline', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const timelineSource = await readFile(new URL('../src/app/components/Timeline.jsx', import.meta.url), 'utf8');
  const tracksColumnSource = await readFile(
    new URL('../src/app/components/TracksColumn.jsx', import.meta.url),
    'utf8',
  );
  const editorResizeSource = await readFile(new URL('../src/app/useEditorResize.js', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const uiDataSource = await readFile(new URL('../src/app/uiShellData.js', import.meta.url), 'utf8');

  assert.match(source, /aria-label="Project Arranger workspace"/);
  assert.match(topBarSource, /Project Arranger/);
  assert.match(topBarSource, /play-glyph/);
  assert.doesNotMatch(topBarSource, /import\s*\{[^}]*Play/);
  assert.match(source, /data-screen-label="Main"/);
  assert.match(source, /useEditorResize\(\{\s*activeTrackId,\s*selectedClipId,?\s*\}\)/);
  assert.match(editorResizeSource, /EDITOR_RESIZE_MIN_HEIGHT\s*=\s*180/);
  assert.match(editorResizeSource, /EDITOR_RESIZE_WORKSPACE_MIN_HEIGHT\s*=\s*180/);
  assert.match(editorResizeSource, /EDITOR_RESIZE_KEYBOARD_STEP\s*=\s*16/);
  assert.match(source, /editorHeightPx/);
  assert.match(editorResizeSource, /setEditorHeightPx/);
  assert.match(source, /handleEditorResizePointerDown/);
  assert.match(source, /handleEditorResizeKeyDown/);
  assert.match(editorResizeSource, /pointermove/);
  assert.match(editorResizeSource, /pointerup/);
  assert.match(source, /--app-editor-height/);
  assert.match(source, /className="editor-resizer"/);
  assert.match(source, /role="separator"/);
  assert.match(source, /aria-orientation="horizontal"/);
  assert.match(source, /aria-valuemin=\{EDITOR_RESIZE_MIN_HEIGHT\}/);
  assert.match(source, /aria-valuemax=\{editorResizeMaxHeight\}/);
  assert.match(source, /aria-valuenow=\{currentEditorResizeValue\}/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(source, /onPointerDown=\{handleEditorResizePointerDown\}/);
  assert.match(source, /onKeyDown=\{handleEditorResizeKeyDown\}/);
  assert.match(source, /className="editor-resizer-grip"/);
  assert.match(source, /<\/main>[\s\S]*className="editor-resizer"[\s\S]*createElement\(BottomEditor/);
  assert.match(editorResizeSource, /case 'ArrowUp':/);
  assert.match(editorResizeSource, /case 'ArrowDown':/);
  assert.match(editorResizeSource, /case 'Home':/);
  assert.match(editorResizeSource, /case 'End':/);
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /drums/);
  assert.match(source, /DRUMS_TOGGLE/);
  assert.match(source, /createTimelineTracks/);
  assert.match(timelineSource, /BAR_NUMBERS\.map/);
  assert.match(timelineSource, /const playheadLeft/);
  assert.match(timelineSource, /className=\{playheadLineClass\}/);
  assert.match(timelineSource, /className=\{playheadGridClass\}/);
  assert.match(timelineSource, /style=\{\{ left: playheadLeft \}\}/);
  assert.match(timelineSource, /onTransportSeek/);
  assert.match(timelineSource, /getTimelinePlayheadSeekPosition/);
  assert.match(timelineSource, /handlePlayheadMouseDown/);
  assert.match(timelineSource, /playhead-hit/);
  assert.match(timelineSource, /className="timeline-footer-spacer"/);
  assert.match(source, /handleTransportSeek/);
  assert.match(source, /onTransportSeek:\s*handleTransportSeek/);
  assert.match(source, /clips/);
  assert.match(source, /getClipForTrackBar/);
  assert.match(source, /createClip\(trackId,\s*barIndex\)/);
  assert.match(source, /handleFillEmptyTrackClips/);
  assert.match(source, /createEmptyClipsForTrack\(trackId\)/);
  assert.match(source, /onFillEmptyTrackClips:\s*handleFillEmptyTrackClips/);
  assert.match(source, /visibleTrackIds/);
  assert.match(source, /getTrackUiByIds\(visibleTrackIds\)/);
  assert.match(source, /handleAddTrack/);
  assert.match(source, /addVisibleTrack\(trackId\)/);
  assert.match(source, /addTrackOptions:\s*availableAddTrackOptions/);
  assert.match(source, /selectClip\(clipId\)/);
  assert.doesNotMatch(source, /track\.clipName/);
  assert.doesNotMatch(uiDataSource, /trackClips|clipName|selected:/);
  assert.match(tracksColumnSource, /onFillEmptyTrackClips/);
  assert.match(tracksColumnSource, /onFillEmptyTrackClips\(track\.id\)/);
  assert.match(tracksColumnSource, /填充整轨/);
  assert.match(tracksColumnSource, /aria-label="填充整轨"/);
  assert.match(tracksColumnSource, /aria-haspopup="menu"/);
  assert.match(tracksColumnSource, /add-track-menu/);
  assert.match(tracksColumnSource, /role="menuitem"/);
  assert.match(tracksColumnSource, /onAddTrack\(track\.id\)/);
  assert.doesNotMatch(tracksColumnSource, /\+8|铺满/);

  assert.deepEqual(TRACK_UI.map((track) => track.id), TRACK_IDS);
  assert.deepEqual(getTrackUiByIds(CORE_TRACK_IDS).map((track) => track.label), ['Drums', 'Chord', 'Bass', 'Melody']);
  assert.deepEqual(OPTIONAL_TRACK_UI.map((track) => track.id), OPTIONAL_TRACK_IDS);
  assert.deepEqual(OPTIONAL_TRACK_UI.map((track) => track.label), ['Pad', 'Vocal', 'Sampler']);
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
  const chordGrooveActionsSource = await readFile(
    new URL('../src/app/chordGrooveActions.js', import.meta.url),
    'utf8',
  );
  const pitchScrollSyncSource = await readFile(
    new URL('../src/app/usePitchScrollSync.js', import.meta.url),
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
  assert.match(chordEditorSource, /tutorialLocked = false/);
  assert.match(chordEditorSource, /tutorialTargets/);
  assert.match(chordEditorSource, /getTutorialControlRole/);
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
  assert.match(drumSequencerSource, /className="drum-step-numbers"/);
  assert.match(drumSequencerSource, /className=\{`drum-step-number\$\{stepNumber % 4 === 0 \? ' beat-end' : ''\} mono`\}/);
  assert.match(drumSequencerSource, />\s*\{stepNumber\}\s*<\/span>/);
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
  assert.match(chordEditorSource, /选择和弦弹奏律动模板/);
  assert.match(chordEditorSource, /chord-template-button/);
  assert.match(chordEditorSource, /chord-template-card:\$\{template\.id\}/);
  assert.match(chordEditorSource, /chord-groove-button/);
  assert.match(chordEditorSource, /chord-groove-card:\$\{template\.id\}/);
  assert.match(chordEditorSource, /function isTutorialControlAllowed\(role\)\s*\{[\s\S]*role === 'target' \|\| role === 'allowed';[\s\S]*\}/);
  assert.match(chordEditorSource, /data-tutorial-role=\{grooveButtonRole\}/);
  assert.match(chordEditorSource, /disabled=\{tutorialLocked && !isTutorialControlAllowed\(grooveButtonRole\)\}/);
  assert.match(chordEditorSource, /const grooveCardDisabled = tutorialLocked && !isTutorialControlAllowed\(grooveCardRole\);/);
  assert.match(chordEditorSource, /data-tutorial-role=\{grooveCardRole\}/);
  assert.match(chordEditorSource, /grooveCardRole === 'target' \? 'tutorial-control-target' : ''/);
  assert.match(chordEditorSource, /chord-enrich-button:\$\{spanIndex\}/);
  assert.match(chordEditorSource, /chord-passing-button/);
  assert.match(chordEditorSource, /tutorial-control-target/);
  assert.match(chordEditorSource, /aria-disabled=\{templateCardDisabled\}/);
  assert.match(chordEditorSource, /aria-disabled=\{grooveCardDisabled\}/);
  assert.ok(
    chordEditorSource.indexOf('aria-label="选择和弦进行模板"')
      < chordEditorSource.indexOf('aria-label="选择和弦弹奏律动模板"'),
    'Chord progression template button should appear before groove template button',
  );
  assert.match(chordEditorSource, /Chord Template Picker/);
  assert.match(chordEditorSource, /Groove Template Picker/);
  assert.match(chordEditorSource, /CHORD_GROOVE_TEMPLATES/);
  assert.match(chordEditorSource, /onChordGrooveTemplatePreview/);
  assert.match(chordEditorSource, /onChordGrooveTemplateApply/);
  assert.match(chordEditorSource, /setPickerMode\('groove'\)/);
  const grooveApplyHandler = chordEditorSource.match(/const handleGrooveTemplateApply = \(templateId\) => \{(?<body>[\s\S]*?)\n {2}\};/)?.groups.body;
  assert.ok(grooveApplyHandler);
  assert.match(grooveApplyHandler, /setSelectedGrooveTemplateId\(templateId\);/);
  assert.match(grooveApplyHandler, /onChordGrooveTemplateApply\(templateId\);/);
  assert.match(grooveApplyHandler, /setPickerMode\(null\);/);
  assert.match(grooveApplyHandler, /closeChordPanels\(\);/);
  assert.match(chordEditorSource, /const \[pendingTemplateId,\s*setPendingTemplateId\] = useState\(null\);/);
  assert.match(chordEditorSource, /shouldConfirmChordTemplateApply = false/);
  const templateRequestHandler = chordEditorSource.match(/const handleTemplateRequest = \(templateId\) => \{(?<body>[\s\S]*?)\n {2}\};/)?.groups.body;
  assert.ok(templateRequestHandler);
  assert.match(templateRequestHandler, /if \(!shouldConfirmChordTemplateApply\) \{/);
  assert.match(templateRequestHandler, /setSelectedTemplateId\(templateId\);/);
  assert.match(templateRequestHandler, /onChordTemplateApply\(templateId\);/);
  assert.match(templateRequestHandler, /setPickerMode\(null\);/);
  assert.match(templateRequestHandler, /closeChordPanels\(\);/);
  assert.match(templateRequestHandler, /return;/);
  assert.match(templateRequestHandler, /setPendingTemplateId\(templateId\);/);
  const templateConfirmHandler = chordEditorSource.match(/const handleTemplateConfirm = \(\) => \{(?<body>[\s\S]*?)\n {2}\};/)?.groups.body;
  assert.ok(templateConfirmHandler);
  assert.match(templateConfirmHandler, /if \(!pendingTemplateId\) return;/);
  assert.match(templateConfirmHandler, /setSelectedTemplateId\(pendingTemplateId\);/);
  assert.match(templateConfirmHandler, /onChordTemplateApply\(pendingTemplateId\);/);
  assert.match(templateConfirmHandler, /setPendingTemplateId\(null\);/);
  assert.match(templateConfirmHandler, /setPickerMode\(null\);/);
  const templateCancelHandler = chordEditorSource.match(/const handleTemplateCancel = \(\) => \{(?<body>[\s\S]*?)\n {2}\};/)?.groups.body;
  assert.ok(templateCancelHandler);
  assert.match(templateCancelHandler, /setPendingTemplateId\(null\);/);
  assert.doesNotMatch(templateCancelHandler, /setPickerMode\(null\)/);
  assert.match(chordEditorSource, /handleTemplateRequest\(template\.id\)/);
  assert.match(chordEditorSource, /aria-label="确认覆盖和弦模板"/);
  assert.match(chordEditorSource, /确认覆盖/);
  assert.match(chordEditorSource, /将覆盖所有已有 Chord clips 的当前模板和弦/);
  assert.match(chordEditorSource, /onClick=\{handleTemplateCancel\}/);
  assert.match(chordEditorSource, /onClick=\{handleTemplateConfirm\}/);
  assert.doesNotMatch(chordEditorSource, /window\.confirm/);
  assert.match(chordEditorSource, /pickerMode === 'chord'/);
  assert.match(chordEditorSource, /pickerMode === 'groove'/);
  assert.match(chordEditorSource, /data-picker=\{pickerMode/);
  assert.match(chordEditorSource, /gtpl-card/);
  assert.match(chordEditorSource, /className="tpl-list gtpl-list-centered"/);
  assert.match(chordEditorSource, /gtpl-rhythm-grid/);
  assert.match(chordGrooveActionsSource, /柱式音型基础律动/);
  assert.match(chordGrooveActionsSource, /柱式音型切分律动/);
  assert.doesNotMatch(chordGrooveActionsSource, /琶音基础律动/);
  assert.match(chordEditorSource, /添加经过和弦/);
  assert.match(chordEditorSource, /'passing-anchor'/);
  assert.match(chordEditorSource, /className=\{passingAnchorClassName\}/);
  assert.match(chordEditorSource, /passingAnchorClassName/);
  assert.match(chordEditorSource, /function getTutorialSafeRight/);
  assert.match(chordEditorSource, /document\.querySelector\('\.tutorial-panel'\)/);
  assert.match(chordEditorSource, /panelRect\.left - VIEWPORT_MARGIN/);
  assert.match(chordEditorSource, /const safeRight = getTutorialSafeRight\(\);/);
  assert.match(chordEditorSource, /const availableWidth = Math\.max\(280,\s*safeRight - VIEWPORT_MARGIN\);/);
  assert.match(chordEditorSource, /Math\.min\(safeRight - width,\s*anchorCenterX - width \/ 2\)/);
  assert.match(chordEditorSource, /passingRole === 'target' \? 'tutorial-passing-anchor-target' : ''/);
  assert.match(chordEditorSource, /className=\{passingButtonClassName\}/);
  assert.match(chordEditorSource, /const passingButtonClassName = \[\s*'add-chord-btn',\s*'passing-btn',/);
  assert.match(chordEditorSource, /PASSING_CHORD_STEP_INDEX/);
  assert.match(chordEditorSource, /onPassingChordPick\(PASSING_CHORD_STEP_INDEX,\s*option\.name\)/);
  const passingChordPopoverSource = chordEditorSource.match(/function PassingChordPopover[\s\S]*?function getGrooveStepClass/)?.[0] ?? '';
  assert.match(passingChordPopoverSource, /onPassingChordPreview/);
  assert.match(passingChordPopoverSource, /if \(!currentChord\) return \[chordName\];/);
  assert.match(passingChordPopoverSource, /\[currentChord,\s*chordName,\s*targetChord\]\.filter\(Boolean\)/);
  assert.match(passingChordPopoverSource, /onPassingChordPreview\(chordNames\);/);
  assert.match(passingChordPopoverSource, /getPassingPreviewLabel\(option\.name\)/);
  assert.match(passingChordPopoverSource, /full-context/);
  assert.match(passingChordPopoverSource, /event\.stopPropagation\(\);/);
  assert.match(passingChordPopoverSource, /试听走向/);
  assert.doesNotMatch(passingChordPopoverSource, /试听完整经过/);
  assert.doesNotMatch(chordEditorSource, /className="cv-tab"[\s\S]{0,260}添加经过和弦/);
  assert.doesNotMatch(chordEditorSource, /添加调内和弦/);
  assert.match(chordEditorSource, /丰富和弦/);
  assert.match(chordEditorSource, /AddChordPopover/);
  assert.doesNotMatch(chordEditorSource, /DIATONIC_CHORD_OPTIONS/);
  assert.doesNotMatch(chordEditorSource, /cvPanelDiatonic/);
  assert.doesNotMatch(chordEditorSource, /getDoowopPassingTargetChord/);
  assert.match(chordEditorSource, /getChordVariantOptions/);
  assert.match(chordEditorSource, /getPassingChordOptions/);
  assert.match(chordEditorSource, /getPassingChordContext/);
  assert.match(chordEditorSource, /getChordEnrichTargetLabel/);
  assert.doesNotMatch(chordEditorSource, /if \(!hasChord\) return;/);
  assert.doesNotMatch(chordEditorSource, /activeChordTab/);
  assert.doesNotMatch(chordEditorSource, /setActiveChordTab/);
  assert.doesNotMatch(chordEditorSource, /mode === 'empty'/);
  assert.match(chordEditorSource, /cvPanelEnrich/);
  assert.match(chordEditorSource, /暂无可用丰富和弦/);
  const addChordPopoverSource = chordEditorSource.match(/function AddChordPopover[\s\S]*?function PassingChordPopover/)?.[0] ?? '';
  assert.match(addChordPopoverSource, /className="cv-title"[\s\S]*丰富和弦/);
  assert.doesNotMatch(addChordPopoverSource, /className="cv-tab"/);
  assert.doesNotMatch(addChordPopoverSource, /className="cv-custom"/);
  assert.match(addChordPopoverSource, /className=\{currentChordPreviewClassName\}/);
  assert.match(addChordPopoverSource, /aria-label=\{`试听当前和弦 \$\{currentChord\}`\}/);
  assert.match(addChordPopoverSource, /onClick=\{\(event\) => handlePreview\(event,\s*currentChord\)\}/);
  assert.match(addChordPopoverSource, /playingChord === currentChord \? 'playing' : ''/);
  assert.doesNotMatch(addChordPopoverSource, /onCurrentChordPreview/);
  assert.match(addChordPopoverSource, /data-action="preview"/);
  assert.match(chordEditorSource, /CHORD_GRID_PITCHES\.flatMap/);
  assert.match(chordEditorSource, /usePitchRowHover/);
  assert.match(chordEditorSource, /pitchRowHoverRef/);
  assert.match(chordEditorSource, /handlePitchRowPointerOver/);
  assert.match(chordEditorSource, /handlePitchRowPointerOut/);
  assert.doesNotMatch(chordEditorSource, /setHoveredPitchRow/);
  assert.match(chordEditorSource, /CHORD_GRID_PITCHES\.map\(\(note,\s*rowIndex\)/);
  assert.match(chordEditorSource, /ref=\{pitchRowHoverRef\}/);
  assert.match(chordEditorSource, /onPointerOver=\{handlePitchRowPointerOver\}/);
  assert.match(chordEditorSource, /onPointerOut=\{handlePitchRowPointerOut\}/);
  assert.match(chordEditorSource, /usePitchScrollSync/);
  assert.match(chordEditorSource, /scalePitchViewportRef/);
  assert.match(pitchScrollSyncSource, /beatCellsViewportRefs/);
  assert.match(pitchScrollSyncSource, /syncPitchScroll/);
  assert.match(chordEditorSource, /handlePitchViewportScroll/);
  assert.match(chordEditorSource, /handlePitchWheel/);
  assert.doesNotMatch(chordEditorSource, /closest\('\.scale-notes-viewport, \.beat-cells-viewport'\)\) return/);
  assert.match(pitchScrollSyncSource, /syncPitchScroll\(pitchScrollTopRef\.current \+ event\.deltaY/);
  assert.match(chordEditorSource, /scrollPitchByOctave/);
  assert.match(pitchScrollSyncSource, /window\.requestAnimationFrame/);
  assert.match(chordEditorSource, /className="scale-notes-viewport"/);
  assert.match(chordEditorSource, /className="beat-cells-viewport"/);
  assert.match(chordEditorSource, /disabled=\{!canScrollPitchUp\}/);
  assert.match(chordEditorSource, /disabled=\{!canScrollPitchDown\}/);
  assert.match(chordEditorSource, /className="beat-head"/);
  assert.match(chordEditorSource, /className=\{beatHeadAddButtonClassName\}/);
  assert.match(chordEditorSource, /className=\{passingAnchorClassName\}/);
  assert.doesNotMatch(chordEditorSource, /className="beat-num mono"/);
  assert.match(chordEditorSource, /getChordSpanDisplayLabel/);
  assert.match(chordEditorSource, /getPassingChordDisplayLabel/);
  assert.match(chordEditorSource, /const passingChordContext = getPassingChordContext\(matrix,\s*clips,\s*selectedBar\);/);
  assert.match(chordEditorSource, /const passingSourceChord = passingChordContext\.currentChord;/);
  assert.match(chordEditorSource, /const passingTargetChord = passingChordContext\.targetChord;/);
  assert.match(chordEditorSource, /const passingChordDisplayLabel = getPassingChordDisplayLabel\(matrix,\s*selectedBar,\s*PASSING_CHORD_STEP_INDEX\);/);
  assert.match(chordEditorSource, /\{passingChordDisplayLabel \? null : renderIcon\(Plus\)\}/);
  assert.match(chordEditorSource, /\{passingChordDisplayLabel \?\? '经过和弦'\}/);
  assert.doesNotMatch(chordEditorSource, /className="chord-label-row"/);
  assert.doesNotMatch(chordEditorSource, /className="beat-number-row"/);
  assert.doesNotMatch(chordEditorSource, /getChordBeatDisplaySegments/);
  assert.match(chordEditorSource, /CHORD_TEMPLATES/);
  assert.match(chordEditorSource, /onChordPick/);
  assert.match(chordEditorSource, /onPassingChordPick/);
  assert.match(chordEditorSource, /addChordPanel/);
  assert.match(chordEditorSource, /aria-label=\{`添加和弦 beat \$\{beatNumber\}`\}/);
  assert.match(chordEditorSource, /openAddChordPanel\(spanIndex,\s*event\.currentTarget,\s*enrichTargetLabel\)/);
  assert.doesNotMatch(chordEditorSource, /\{label \?\? '添加和弦'\}/);
  assert.doesNotMatch(chordEditorSource, /colIndex < 2 \? 'downbeat' : ''/);
  assert.doesNotMatch(chordEditorSource, /colIndex >= 2 \? 'extension' : ''/);
  assert.doesNotMatch(chordEditorSource, /Beat \$\{beatNumber\} 单音/);
  assert.doesNotMatch(chordEditorSource, /disabled=\{!canOpenChordPanel\}/);
  assert.doesNotMatch(chordEditorSource, /getChordCell/);
  assert.match(chordEditorSource, /getChordStepCell/);
  assert.match(chordEditorSource, /getChordBarDisplayLabel/);
  assert.match(chordEditorSource, /isChordCellActive/);
  assert.match(chordEditorSource, /isChordAddedNoteActive/);
  assert.match(chordEditorSource, /onChordNoteSelect/);
  assert.match(chordEditorSource, /onChordPreview/);
  assert.match(chordEditorSource, /onPassingChordPreview/);
  assert.match(chordEditorSource, /onChordTemplatePreview/);
  assert.match(chordEditorSource, /onChordTemplateApply/);
  assert.match(chordEditorSource, /onClearChordBar/);
  assert.match(chordEditorSource, /onClearChord/);
  assert.match(chordEditorSource, /清空本小节/);
  assert.match(chordEditorSource, /清空整轨/);
  assert.doesNotMatch(chordEditorSource, /清空 Chord/);
  assert.doesNotMatch(chordEditorSource, /Clear phrase/);
  assert.match(chordEditorSource, /aria-pressed=\{active \|\| added\}/);
  assert.match(chordEditorSource, /onChordPreview\(chordName\)/);
  assert.match(chordEditorSource, /onChordTemplatePreview\(template\.chords\)/);
  assert.match(chordEditorSource, /onClose/);
  assert.match(chordEditorSource, /const handleClose = \(\) => \{[\s\S]*setPickerMode\(null\);[\s\S]*closeChordPanels\(\);[\s\S]*onClose\(\);[\s\S]*\}/);
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
  assert.match(source, /handlePassingChordPreview/);
  assert.match(source, /previewChordNames\(chordNames\)/);
  assert.match(source, /handleChordTemplatePreview/);
  assert.match(source, /handleChordGrooveTemplatePreview/);
  assert.doesNotMatch(source, /seedDefaultDrumsPattern/);
  assert.match(source, /handleCloseEditor/);
  assert.match(source, /selectedClip/);
  assert.match(source, /handleRenameClip/);
  assert.match(source, /renameClip\(selectedClipId,\s*name\)/);
  assert.match(source, /setSelectedClipId\(null\)/);
  assert.match(source, /selectedClipId/);
  assert.match(source, /clips/);
  assert.match(source, /clips,\s*\n\s*melodyScaleId/);
  assert.match(source, /onCloseEditor:\s*handleCloseEditor/);
  assert.match(bottomEditorSource, /selectedClipId/);
  assert.match(bottomEditorSource, /selectedClipName/);
  assert.match(bottomEditorSource, /clips/);
  assert.match(bottomEditorSource, /clips,\s*\n\s*clipName:\s*selectedClipName/);
  assert.match(bottomEditorSource, /onRenameClip/);
  assert.match(bottomEditorSource, /activeTrackId === 'chord' && selectedClipId/);
  assert.match(bottomEditorSource, /onClose:\s*onCloseEditor/);
  assert.match(source, /handleChordCellSelect/);
  assert.match(source, /handleChordPick/);
  assert.match(source, /handlePassingChordPick/);
  assert.match(source, /onPassingChordPreview:\s*handlePassingChordPreview/);
  assert.match(source, /setChordStepChord\(state\.matrix,\s*selectedBar,\s*stepIndex,\s*chordName\)/);
  assert.match(source, /const step = getChordSpanStep\(spanIndex\)/);
  assert.match(source, /setChordCell\(state\.matrix,\s*selectedBar,\s*spanIndex,\s*root\)/);
  assert.doesNotMatch(source, /targetSpanIndex\s*=\s*0/);
  assert.doesNotMatch(chordEditorSource, /sustain/);
  assert.match(source, /handleChordNoteSelect/);
  assert.match(source, /handleChordTemplateApply/);
  assert.match(source, /hasExistingChordClipContent\(matrix,\s*clips\)/);
  assert.match(source, /handleChordGrooveTemplateApply/);
  assert.match(source, /applyChordGrooveTemplateToExistingClips/);
  assert.match(source, /createChordGroovePreviewEvents/);
  assert.match(source, /previewChordPattern/);
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
  assert.equal(CHORD_GRID_PITCHES.length, 36);
  assert.equal(CHORD_GRID_PITCHES.at(0).label, 'B5');
  assert.equal(CHORD_GRID_PITCHES.at(12).label, 'B4');
  assert.equal(CHORD_GRID_PITCHES.at(23).label, 'C4');
  assert.equal(CHORD_GRID_PITCHES.at(-1).label, 'C3');
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
  const chordEditorSource = await readFile(
    new URL('../src/app/components/ChordEditor.jsx', import.meta.url),
    'utf8',
  );
  const bassEditorSource = await readFile(
    new URL('../src/app/components/BassEditor.jsx', import.meta.url),
    'utf8',
  );
  const melodyEditorSource = await readFile(
    new URL('../src/app/components/MelodyEditor.jsx', import.meta.url),
    'utf8',
  );
  const trackEditorPlaceholderSource = await readFile(
    new URL('../src/app/components/TrackEditorPlaceholder.jsx', import.meta.url),
    'utf8',
  );
  const trackBarPagerSource = await readFile(
    new URL('../src/app/components/TrackBarPager.jsx', import.meta.url),
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
  assert.match(trackBarPagerSource, /ChevronLeft/);
  assert.match(trackBarPagerSource, /ChevronRight/);
  assert.match(trackBarPagerSource, /aria-label="上一小节"/);
  assert.match(trackBarPagerSource, /aria-label="下一小节"/);
  assert.match(trackBarPagerSource, /disabled=\{!canPageBars\}/);
  assert.match(trackBarPagerSource, /track-editor-pager-shell/);
  assert.match(trackBarPagerSource, /track-page-btn previous/);
  assert.match(trackBarPagerSource, /track-page-btn next/);
  assert.match(trackBarPagerSource, /data-type=\{trackId\}/);
  assert.match(drumSequencerSource, /TrackBarPager/);
  assert.match(drumSequencerSource, /trackId:\s*'drums'/);
  assert.match(chordEditorSource, /TrackBarPager/);
  assert.match(chordEditorSource, /trackId = 'chord'/);
  assert.match(bassEditorSource, /TrackBarPager/);
  assert.match(bassEditorSource, /trackId = 'bass'/);
  assert.match(melodyEditorSource, /TrackBarPager/);
  assert.match(melodyEditorSource, /trackId = 'melody'/);
  assert.match(trackEditorPlaceholderSource, /TrackBarPager/);
  assert.match(trackEditorPlaceholderSource, /trackId:\s*activeTrackId/);
  assert.match(drumSequencerSource, /drum-step-groups/);
  assert.match(drumSequencerSource, /drum-step-group/);
  assert.match(drumSequencerSource, /DRUM SEQUENCER - BAR/);
  assert.match(drumSequencerSource, /drumTemplatePickerOpen/);
  assert.match(drumSequencerSource, /data-picker=\{drumTemplatePickerOpen \? 'drum-template' : undefined\}/);
  assert.match(drumSequencerSource, /选择律动模板/);
  assert.match(drumSequencerSource, /drum-template-picker/);
  assert.match(drumSequencerSource, /drum-template-card/);
  assert.match(drumSequencerSource, /DRUM_TEMPLATE_HIT_LABELS/);
  assert.match(drumSequencerSource, /getDrumTemplateHitLabel\(row\.id,\s*stepIndex\)/);
  assert.match(drumSequencerSource, /drum-template-beat-markers/);
  assert.match(drumSequencerSource, /drum-template-hit-label/);
  assert.match(drumSequencerSource, /data-hit-label=\{hitLabel \?\? undefined\}/);
  assert.doesNotMatch(drumSequencerSource, /drum-template-(?:legend|row-icon)/);
  assert.match(drumSequencerSource, /基础律动/);
  assert.match(drumSequencerSource, /应用到本小节/);
  assert.match(drumSequencerSource, /应用到整轨/);
  assert.doesNotMatch(drumSequencerSource, />\s*生成本小节\s*</);
  assert.doesNotMatch(drumSequencerSource, />\s*生成全局\s*</);
  assert.match(drumSequencerSource, /清本小节/);
  assert.match(drumSequencerSource, /清整轨/);
  assert.doesNotMatch(drumSequencerSource, /为本小节生成基础律动|全局生成基础律动|清空本小节|清空整轨/);
  assert.doesNotMatch(drumSequencerSource, /清空 Drums/);
  assert.match(drumSequencerSource, /onClose/);
  assert.match(drumSequencerSource, /const handleClose = \(\) => \{[\s\S]*setDrumTemplatePickerOpen\(false\);[\s\S]*onClose\(\);/);
  assert.match(drumSequencerSource, /className="editor-close"[\s\S]*onClick=\{handleClose\}/);
  assert.match(source, /applyBasicDrumsBar/);
  assert.match(source, /getDrumsClipBarIndexes/);
  assert.match(source, /applyBasicDrumsAllBars/);
  assert.match(source, /applyBasicDrumsAllBars\(state\.matrix,\s*drumsClipBars\)/);
  assert.doesNotMatch(source, /createBasicDrumsBarWithoutKick/);
  assert.match(source, /clearDrumsBar/);
  assert.match(source, /getAdjacentTrackClipBar/);
  assert.match(source, /canPageTrackClipBars/);
  assert.doesNotMatch(source, /getAdjacentDrumsClipBar/);
  assert.doesNotMatch(source, /canPageDrumsClipBars/);
  assert.match(source, /handlePreviousBar/);
  assert.match(source, /handleNextBar/);
  assert.match(source, /handlePageTrackBar\('previous'\)/);
  assert.match(source, /handlePageTrackBar\('next'\)/);
  assert.match(source, /getAdjacentTrackClipBar\(\s*state\.clips,\s*state\.activeTrackId,\s*state\.selectedBar,\s*direction,\s*\)/);
  assert.match(bottomEditorSource, /activeTrackId === 'drums' && selectedClipId/);
  assert.match(bottomEditorSource, /canPageBars/);
  assert.match(bottomEditorSource, /onPreviousBar/);
  assert.match(bottomEditorSource, /onNextBar/);
  assert.match(bottomEditorSource, /trackId:\s*activeTrackId/);
  assert.doesNotMatch(bottomEditorSource, /onPreviousDrumsBar/);
  assert.doesNotMatch(bottomEditorSource, /onNextDrumsBar/);
  assert.doesNotMatch(bottomEditorSource, /canPageDrumsBars/);
  assert.match(bottomEditorSource, /canPageBars/);
  assert.match(bottomEditorSource, /onNextBar/);
  assert.match(bottomEditorSource, /onPreviousBar/);
  assert.match(bottomEditorSource, /onClose:\s*onCloseEditor/);
  assert.match(bottomEditorSource, /activeTrackId === 'chord'/);
  assert.match(bottomEditorSource, /onChordPick/);
  assert.match(bottomEditorSource, /onPassingChordPick/);
  assert.match(bottomEditorSource, /onPassingChordPreview/);
  assert.match(bottomEditorSource, /onChordNoteSelect/);
  assert.match(bottomEditorSource, /onChordPreview/);
  assert.match(bottomEditorSource, /onChordTemplatePreview/);
  assert.match(bottomEditorSource, /onChordTemplateApply/);
  assert.match(bottomEditorSource, /tutorialLocked/);
  assert.match(bottomEditorSource, /tutorialTargets/);
  assert.match(bottomEditorSource, /createElement\(ChordEditor,[\s\S]*tutorialLocked,[\s\S]*tutorialTargets/);
  assert.match(bottomEditorSource, /shouldConfirmChordTemplateApply/);
  assert.match(bottomEditorSource, /onChordGrooveTemplatePreview/);
  assert.match(bottomEditorSource, /onChordGrooveTemplateApply/);
});

test('track editors reuse the full track-select identity style in editor-left headers', async () => {
  const tracksColumnSource = await readFile(
    new URL('../src/app/components/TracksColumn.jsx', import.meta.url),
    'utf8',
  );
  const editorTrackIdentitySource = await readFile(
    new URL('../src/app/components/EditorTrackIdentity.jsx', import.meta.url),
    'utf8',
  );
  const editorFiles = [
    ['DrumSequencer.jsx', 'drums', 'Drums'],
    ['ChordEditor.jsx', 'chord', 'Chord'],
    ['BassEditor.jsx', 'bass', 'Bass'],
    ['MelodyEditor.jsx', 'melody', 'Melody'],
  ];

  assert.match(tracksColumnSource, /const Icon = TRACK_ICONS\[track\.id\];/);
  assert.match(tracksColumnSource, /className="track-select"[\s\S]*renderIcon\(Icon\)/);
  assert.match(editorTrackIdentitySource, /import\s*\{[^}]*TRACK_ICONS[^}]*renderIcon[^}]*\}\s*from '\.\/icons\.js';/s);
  assert.match(editorTrackIdentitySource, /className=\{[^}]*editor-track-identity[^}]*track-select/s);
  assert.match(editorTrackIdentitySource, /const Icon = TRACK_ICONS\[trackId\];/);
  assert.match(editorTrackIdentitySource, /<span className="ic">[\s\S]*renderIcon\(Icon\)/);
  assert.match(editorTrackIdentitySource, /<span className="track-name">\{label\}<\/span>/);

  for (const [fileName, trackId, label] of editorFiles) {
    const source = await readFile(
      new URL(`../src/app/components/${fileName}`, import.meta.url),
      'utf8',
    );

    assert.match(
      source,
      /import\s*\{\s*EditorTrackIdentity\s*\}\s*from '\.\/EditorTrackIdentity\.jsx';/,
    );
    assert.match(
      source,
      new RegExp(`createElement\\(EditorTrackIdentity, \\{ trackId: '${trackId}', label: '${label}' \\}\\)`),
    );
    assert.doesNotMatch(source, /className="clip-chip"[\s\S]*TRACK_ICONS\./);
  }

  const melodyEditorSource = await readFile(
    new URL('../src/app/components/MelodyEditor.jsx', import.meta.url),
    'utf8',
  );
  const keyboardIntro = melodyEditorSource.match(/className="ks-glyph"[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(keyboardIntro, /renderIcon\(Keyboard\)/);
  assert.doesNotMatch(keyboardIntro, /TRACK_ICONS\.melody/);
});

test('bass and melody share the reusable PianoRoll component', async () => {
  const editorFiles = ['BassEditor.jsx', 'MelodyEditor.jsx'];

  for (const fileName of editorFiles) {
    const source = await readFile(
      new URL(`../src/app/components/${fileName}`, import.meta.url),
      'utf8',
    );

    assert.match(source, /import \{ PianoRoll \} from '\.\/PianoRoll\.jsx';/);
    assert.match(source, /createElement\(PianoRoll,/);
    assert.doesNotMatch(source, /notes\.flatMap|className="scale-notes-viewport"|pitch-step-cell/);
  }

  const pianoRollSource = await readFile(
    new URL('../src/app/components/PianoRoll.jsx', import.meta.url),
    'utf8',
  );
  assert.match(pianoRollSource, /className=\{`piano-roll-grid \$\{trackId\}-grid`\}/);
  assert.match(pianoRollSource, /'pitch-step-cell'/);
  assert.match(pianoRollSource, /`\$\{trackId\}-cell`/);
  assert.match(pianoRollSource, /notes\.flatMap/);
  assert.match(pianoRollSource, /useLayoutEffect\(\(\) => \{/);
  assert.match(pianoRollSource, /nextActiveNoteIds\.forEach/);
  assert.match(pianoRollSource, /revealPitchRow\(noteIndexById\.get\(latestAddedNoteId\)\)/);

  const chordEditorSource = await readFile(
    new URL('../src/app/components/ChordEditor.jsx', import.meta.url),
    'utf8',
  );

  assert.match(chordEditorSource, /'pitch-step-cell',\s*\n\s*'chord-cell'/);
  assert.doesNotMatch(chordEditorSource, /'cell',\s*\n\s*(?:active \? 'active'|'chord-cell')/);
});

test('app exposes the melody editor and keeps melody as the internal track id', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const melodyEditorSource = await readFile(
    new URL('../src/app/components/MelodyEditor.jsx', import.meta.url),
    'utf8',
  );
  const audioBridgeSource = await readFile(new URL('../src/app/audioUiBridge.js', import.meta.url), 'utf8');
  const melodyDataSource = await readFile(new URL('../src/data/melodyScales.js', import.meta.url), 'utf8');
  const uiDataSource = await readFile(new URL('../src/app/uiShellData.js', import.meta.url), 'utf8');
  const contextSliceSource = await readFile(
    new URL('../src/store/slices/contextSlice.js', import.meta.url),
    'utf8',
  );

  assert.match(uiDataSource, /melody:\s*'Melody'/);
  assert.match(contextSliceSource, /melodyScaleId:\s*'major'/);
  assert.match(contextSliceSource, /setMelodyScaleId/);
  assert.match(bottomEditorSource, /MelodyEditor/);
  assert.match(bottomEditorSource, /activeTrackId === 'melody' && selectedClipId/);
  assert.match(bottomEditorSource, /onMelodyStepToggle/);
  assert.match(bottomEditorSource, /onMelodyPreview/);
  assert.match(bottomEditorSource, /onMelodyScaleChange/);
  assert.match(bottomEditorSource, /createElement\(MelodyEditor,[\s\S]*tutorialLocked,[\s\S]*tutorialTargets/);
  assert.match(melodyEditorSource, /data-screen-label="Melody Editor"/);
  assert.match(melodyEditorSource, /tutorialLocked = false/);
  assert.match(melodyEditorSource, /tutorialTargets/);
  assert.match(melodyEditorSource, /getTutorialControlRole/);
  assert.match(melodyEditorSource, /Melody · Phrase/);
  assert.match(melodyEditorSource, /MELODY EDITOR - BAR/);
  assert.match(melodyEditorSource, /keyboard-strip/);
  assert.match(melodyEditorSource, /QWERTY ↔ 音阶 对应关系/);
  assert.match(melodyEditorSource, /选择音阶/);
  assert.match(melodyEditorSource, /melody-scale-button/);
  assert.match(melodyEditorSource, /melody-scale-card:\$\{scale\.id\}/);
  assert.match(melodyEditorSource, /tutorial-control-target/);
  assert.match(melodyEditorSource, /data-tutorial-role=\{scaleButtonRole/);
  assert.match(melodyEditorSource, /data-tutorial-role=\{scaleCardRole/);
  assert.match(melodyEditorSource, /aria-disabled=\{scaleCardDisabled\}/);
  assert.match(melodyEditorSource, /Scale Picker/);
  assert.doesNotMatch(melodyEditorSource, /className="melody-beat-number-row"/);
  assert.doesNotMatch(melodyEditorSource, /className="beat-num mono"/);
  assert.doesNotMatch(melodyEditorSource, /const \[melodyRailOctave,\s*setMelodyRailOctave\]/);
  assert.doesNotMatch(melodyEditorSource, /clampMelodyRailOctave/);
  assert.doesNotMatch(melodyEditorSource, /DEFAULT_MELODY_RAIL_OCTAVE/);
  assert.match(melodyEditorSource, /createElement\(PianoRoll,\s*\{/);
  assert.match(melodyEditorSource, /activeNoteIds:\s*activePlayedNotes/);
  assert.match(melodyEditorSource, /autoRevealActiveNote:\s*true/);
  assert.match(melodyEditorSource, /import \{ flushSync \} from 'react-dom';/);
  assert.match(melodyEditorSource, /flushSync\(\(\) => \{\s*setPlayingKeys/s);
  assert.match(melodyEditorSource, /initialTopNote:\s*'B4'/);
  assert.match(melodyEditorSource, /notes:\s*MELODY_NOTES/);
  assert.match(melodyEditorSource, /onCellToggle:\s*onMelodyStepToggle/);
  assert.doesNotMatch(melodyEditorSource, /usePitchRowHover|getMelodyScaleRailNotes|setHoveredPitchRow/);
  assert.doesNotMatch(melodyEditorSource, /usePitchScrollSync/);
  assert.doesNotMatch(melodyEditorSource, /initializeToMiddleOctave/);
  assert.doesNotMatch(melodyEditorSource, /scalePitchViewportRef/);
  assert.doesNotMatch(melodyEditorSource, /setBeatCellsViewportRef/);
  assert.doesNotMatch(melodyEditorSource, /handlePitchViewportScroll/);
  assert.doesNotMatch(melodyEditorSource, /handlePitchWheel/);
  assert.doesNotMatch(melodyEditorSource, /scrollPitchByOctave/);
  assert.doesNotMatch(melodyEditorSource, /className="scale-notes-viewport"|className="beat-cells-viewport"|pitch-grid-head-spacer/);
  assert.match(melodyDataSource, /自然大调音阶/);
  assert.match(melodyDataSource, /五声音阶/);
  assert.match(melodyEditorSource, /清空本小节/);
  assert.match(melodyEditorSource, /清空整轨/);
  assert.doesNotMatch(melodyEditorSource, /清空 Melody/);
  assert.doesNotMatch(melodyEditorSource, /Clear phrase/);
  assert.match(melodyEditorSource, /createElement\(TrackBarPager,\s*\{[\s\S]*className:\s*'melody-editor-pager-shell'/);
  assert.match(melodyEditorSource, /createElement\(TrackBarPager,\s*\{[\s\S]*contentClassName:\s*'melody-editor-scroll'/);
  assert.match(melodyEditorSource, /MELODY_KEY_SEQUENCE/);
  assert.match(melodyEditorSource, /isMelodyCellActive/);
  assert.doesNotMatch(melodyEditorSource, /pitch-step-cell|melody-cell|colIndex === 0 \? 'downbeat'/);
  assert.match(melodyEditorSource, /setPlayingKeys/);
  assert.match(melodyEditorSource, /activePlayedNotes/);
  assert.match(melodyEditorSource, /onMelodyPreview\(note\)/);
  assert.match(melodyEditorSource, /melody-example-keys/);
  assert.match(melodyEditorSource, /data-tutorial-role=\{exampleKeysRole/);
  assert.doesNotMatch(melodyEditorSource, /recordMelodyKeyInput/);
  assert.doesNotMatch(audioBridgeSource, /recordMelodyKeyInput/);
  assert.match(source, /melodyScaleId/);
  assert.match(source, /handleMelodyStepToggle/);
  assert.match(source, /handleMelodyPreview/);
  assert.match(source, /handleMelodyScaleChange/);
  assert.match(source, /currentTutorialStep\?\.id === TUTORIAL_STEP_IDS\.MELODY_SELECT_SCALE/);
  assert.match(source, /control:\s*`melody-scale-card:\$\{scaleId\}`/);
  assert.match(source, /handleClearMelodyBar/);
  assert.match(source, /clearTrack\('melody'\)/);
  assert.match(source, /activeTrackId === 'melody' && selectedClipId/);
  assert.match(source, /audioEngine\.startAudio/);
});

test('app exposes the bass editor and existing-clip groove template workflow', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const bottomEditorSource = await readFile(
    new URL('../src/app/components/BottomEditor.jsx', import.meta.url),
    'utf8',
  );
  const bassEditorSource = await readFile(
    new URL('../src/app/components/BassEditor.jsx', import.meta.url),
    'utf8',
  );
  const bassActionsSource = await readFile(new URL('../src/app/bassActions.js', import.meta.url), 'utf8');
  const bassNotesSource = await readFile(new URL('../src/data/bassNotes.js', import.meta.url), 'utf8');

  assert.match(bottomEditorSource, /BassEditor/);
  assert.match(bottomEditorSource, /activeTrackId === 'bass' && selectedClipId/);
  assert.match(bottomEditorSource, /onBassStepToggle/);
  assert.match(bottomEditorSource, /onBassGrooveTemplatePreview/);
  assert.match(bottomEditorSource, /onBassGrooveTemplateApply/);
  assert.match(bottomEditorSource, /onClearBassBar/);
  assert.match(bottomEditorSource, /onClearBass/);
  assert.match(bottomEditorSource, /createElement\(BassEditor,[\s\S]*tutorialLocked,[\s\S]*tutorialTargets/);
  assert.match(bassEditorSource, /data-screen-label="Bass Editor"/);
  assert.match(bassEditorSource, /tutorialLocked = false/);
  assert.match(bassEditorSource, /tutorialTargets/);
  assert.match(bassEditorSource, /getTutorialControlRole/);
  assert.match(bassEditorSource, /Bass · Phrase/);
  assert.match(bassEditorSource, /BASS EDITOR - BAR/);
  assert.match(bassEditorSource, /createElement\(PianoRoll,\s*\{/);
  assert.match(bassEditorSource, /initialTopNote:\s*'D1'/);
  assert.match(bassEditorSource, /notes:\s*BASS_NOTES/);
  assert.match(bassEditorSource, /onCellToggle:\s*onBassStepToggle/);
  assert.match(bassEditorSource, /onNotePreview:\s*onBassPreview/);
  assert.match(bassEditorSource, /onPitchInteraction:\s*closeBassPicker/);
  assert.doesNotMatch(bassEditorSource, /BASS_NOTES\.(?:flatMap|map)|usePitchRowHover|usePitchScrollSync/);
  assert.doesNotMatch(bassEditorSource, /scalePitchViewportRef|setBeatCellsViewportRef|pitch-step-cell|bass-cell/);
  assert.doesNotMatch(bassEditorSource, /className="beat-number-row bass-beat-number-row"/);
  assert.doesNotMatch(bassEditorSource, /className="beat-num mono"/);
  assert.match(bassEditorSource, /BASS_GROOVE_TEMPLATES/);
  assert.match(bassEditorSource, /选择Bass弹奏律动模板/);
  assert.match(bassEditorSource, /bass-groove-button/);
  assert.match(bassEditorSource, /bass-groove-card:\$\{template\.id\}/);
  assert.match(bassEditorSource, /tutorial-control-target/);
  assert.match(bassEditorSource, /function isTutorialControlAllowed\(role\)\s*\{\s*return role === 'target' \|\| role === 'allowed';\s*\}/);
  assert.match(bassEditorSource, /grooveButtonRole === 'target' \? 'tutorial-control-target' : ''/);
  assert.match(bassEditorSource, /disabled=\{tutorialLocked && !isTutorialControlAllowed\(grooveButtonRole\)\}/);
  assert.match(bassEditorSource, /const templateCardDisabled = tutorialLocked && !isTutorialControlAllowed\(templateCardRole\);/);
  assert.match(bassEditorSource, /templateCardRole === 'target' \? 'tutorial-control-target' : ''/);
  assert.match(bassEditorSource, /data-tutorial-role=\{grooveButtonRole/);
  assert.match(bassEditorSource, /data-tutorial-role=\{templateCardRole/);
  assert.match(bassEditorSource, /aria-disabled=\{templateCardDisabled\}/);
  assert.match(bassEditorSource, /Bass Groove Template Picker/);
  assert.match(bassEditorSource, /getBassGroovePreviewSteps/);
  assert.match(bassEditorSource, /const previewHitStepSet = new Set\(getBassGroovePreviewSteps\(template\)\);/);
  assert.match(bassEditorSource, /const isHit = previewHitStepSet\.has\(step\);/);
  assert.match(bassEditorSource, /gtpl-step/);
  assert.match(bassEditorSource, /hit-root/);
  assert.match(bassEditorSource, /data-len/);
  assert.match(bassEditorSource, /onBassGrooveTemplatePreview\(template\.id\)/);
  assert.match(bassEditorSource, /onBassGrooveTemplateApply\(templateId\)/);
  assert.match(bassEditorSource, /closest\?\.\('\[data-action="bgpreview"\]'\)/);
  assert.match(bassEditorSource, /清空本小节/);
  assert.match(bassEditorSource, /清空整轨/);
  assert.doesNotMatch(bassEditorSource, /清空 Bass/);
  assert.match(bassActionsSource, /bass-8th-basic/);
  assert.match(bassActionsSource, /bass-8th-swing/);
  assert.match(bassActionsSource, /bass-16th-swing/);
  assert.match(bassActionsSource, /applyBassGrooveTemplateToBar/);
  assert.match(bassActionsSource, /applyBassGrooveTemplateToExistingClips/);
  assert.match(bassActionsSource, /createBassPreviewEvents/);
  assert.match(bassNotesSource, /BASS_NOTE_IDS/);
  assert.match(bassNotesSource, /createPianoRollNotes\(\{ lowestOctave: 0 \}\)/);
  assert.doesNotMatch(bassNotesSource, /CHORD_GRID_PITCHES/);
  assert.match(source, /handleBassStepToggle/);
  assert.match(source, /handleBassGrooveTemplatePreview/);
  assert.match(source, /createBassPreviewEvents\(state\.matrix,\s*selectedBar,\s*templateId\)/);
  assert.match(source, /handleBassGrooveTemplateApply/);
  assert.match(source, /currentTutorialStep\?\.id === TUTORIAL_STEP_IDS\.BASS_SELECT_GROOVE_TEMPLATE/);
  assert.match(source, /control:\s*`bass-groove-card:\$\{templateId\}`/);
  assert.match(source, /applyTutorialActionProgress\(tutorialAction\)/);
  assert.match(source, /applyBassGrooveTemplateToExistingClips\(state\.matrix,\s*state\.clips,\s*templateId\)/);
  assert.match(source, /state\.setTrackMatrix\('bass',\s*nextMatrix\.bass\)/);
  assert.doesNotMatch(source, /nextMatrix\.bass\[clip\.bar\]\.forEach\(\(cell,\s*step\) => \{[\s\S]*state\.setCell\('bass',\s*clip\.bar,\s*step,\s*cell\);/);
  assert.match(source, /handleClearBassBar/);
  assert.match(source, /clearTrack\('bass'\)/);
  assert.match(source, /triggerBassNote/);
  assert.match(source, /previewBassPattern/);
});

test('app keeps the editor focused on the playback bar while transport is playing', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /syncEditorToPlaybackBar/);
  assert.match(source, /syncEditorToPlaybackBar\(useMusicStore\.getState\(\),\s*currentBar\)/);
  assert.match(source, /\[\s*activeTrackId,\s*currentBar,\s*isPlaying,\s*selectedBar\s*\]/);
});

test('app mounts the drums tutorial right sidebar', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const tutorialControllerSource = await readFile(
    new URL('../src/app/useTutorialController.js', import.meta.url),
    'utf8',
  );
  const overlaySource = await readFile(
    new URL('../src/app/components/TutorialOverlay.jsx', import.meta.url),
    'utf8',
  );
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');

  assert.match(source, /TutorialOverlay/);
  assert.match(source, /className="app-main"/);
  assert.match(source, /const workspaceClassName = \[/);
  assert.match(source, /<main className=\{workspaceClassName\}>/);
  assert.match(source, /<main className=\{workspaceClassName\}>[\s\S]*createElement\(TracksColumn[\s\S]*createElement\(Timeline[\s\S]*createElement\(TutorialOverlay[\s\S]*<\/main>/);
  assert.match(source, /tutorialSidebarCollapsed/);
  assert.match(source, /setTutorialSidebarCollapsed/);
  assert.match(source, /tutorialModeActive/);
  assert.match(source, /useTutorialController\(\{/);
  assert.match(tutorialControllerSource, /const tutorialActive = tutorialVisible && tutorialModeActive;/);
  assert.match(source, /showTutorialToggle:\s*tutorialVisible/);
  assert.match(source, /onTutorialToggle:\s*handleTutorialSidebarToggle/);
  assert.match(source, /tutorialCollapsed:\s*tutorialSidebarCollapsed/);
  assert.doesNotMatch(source, /showTutorialReopen/);
  assert.doesNotMatch(source, /onTutorialReopen/);
  assert.match(source, /DRUMS_TUTORIAL_STEPS/);
  assert.match(source, /currentTutorialStepIndex/);
  assert.match(tutorialControllerSource, /getTutorialViewModel/);
  assert.match(tutorialControllerSource, /const activeTutorialTarget = tutorialActive \? currentTutorialStep\?\.target\?\.name \?\? null : null;/);
  assert.match(tutorialControllerSource, /const activeTutorialTargets = tutorialActive \? tutorialViewModel\.targets : undefined;/);
  assert.match(tutorialControllerSource, /const activeTutorialLocked = tutorialActive && tutorialViewModel\.locked;/);
  assert.match(source, /tutorialViewModel\.displayCopy/);
  assert.match(source, /countInValue:\s*tutorialCountInValue/);
  assert.match(source, /APP_COMMAND_TYPES\.TRANSPORT_STOP/);
  assert.match(source, /stopTutorialPreviewPlayback/);
  assert.match(overlaySource, /tutorial-panel/);
  assert.match(overlaySource, /collapsed/);
  assert.match(overlaySource, /directoryItems/);
  assert.match(overlaySource, /onDirectorySelect/);
  assert.match(overlaySource, /<div className="tutorial-panel-header">\s*\n\s*<div className="tutorial-panel-label">教程<\/div>[\s\S]*className="tutorial-directory"[\s\S]*<\/div>\s*\n\s*<div className="tutorial-panel-body">/);
  assert.doesNotMatch(overlaySource, /tutorial-panel-title-row/);
  assert.doesNotMatch(overlaySource, /<div className="tutorial-panel-body">[\s\S]*className="tutorial-directory"[\s\S]*renderTutorialCopy/);
  assert.match(overlaySource, /className="tutorial-directory"/);
  assert.match(overlaySource, /className=\{directoryButtonClassName\}/);
  assert.match(overlaySource, /onClick=\{\(\) => onDirectorySelect\(item\.stepIndex\)\}/);
  assert.doesNotMatch(overlaySource, /onToggleCollapsed/);
  assert.doesNotMatch(overlaySource, /\bonClose\b/);
  assert.match(overlaySource, /if \(collapsed\) return null;/);
  assert.doesNotMatch(overlaySource, /tutorial-panel-tools/);
  assert.doesNotMatch(overlaySource, /tutorial-icon-button/);
  assert.doesNotMatch(overlaySource, /ChevronLeft/);
  assert.doesNotMatch(overlaySource, /\bX\b/);
  assert.doesNotMatch(overlaySource, /tutorial-reopen-button/);
  assert.doesNotMatch(topBarSource, /ChevronLeft/);
  assert.doesNotMatch(topBarSource, /ChevronRight/);
  assert.match(topBarSource, /showTutorialToggle/);
  assert.match(topBarSource, /onTutorialToggle/);
  assert.match(topBarSource, /tutorialCollapsed/);
  assert.match(topBarSource, /const tutorialToggleLabel = tutorialCollapsed \? '展开教程' : '收起教程';/);
  assert.doesNotMatch(topBarSource, /TutorialToggleIcon/);
  assert.match(topBarSource, /className="key-switch tutorial-switch"/);
  assert.doesNotMatch(topBarSource, /className="tutorial-topbar-button icon-btn"/);
  assert.match(topBarSource, /aria-label=\{tutorialToggleLabel\}/);
  assert.match(topBarSource, /title=\{tutorialToggleLabel\}/);
  assert.match(topBarSource, />\s*教程\s*<\/button>/);
  assert.doesNotMatch(topBarSource, /showTutorialReopen/);
  assert.doesNotMatch(topBarSource, /onTutorialReopen/);
  assert.match(overlaySource, /displayCopy/);
  assert.match(overlaySource, /countInValue/);
  assert.match(overlaySource, /renderTutorialCopy/);
  assert.match(overlaySource, /\.split\('\\n\\n'\)/);
  assert.match(overlaySource, /\.split\('\\n'\)/);
  assert.match(overlaySource, /className="tutorial-copy"/);
  assert.match(overlaySource, /className="tutorial-copy-title"/);
  assert.match(overlaySource, /className="tutorial-copy-subtitle"/);
  assert.match(overlaySource, /className="tutorial-copy-body"/);
  assert.match(overlaySource, /className="tutorial-count-in"/);
  assert.match(overlaySource, /aria-live="assertive"/);
  assert.doesNotMatch(overlaySource, /isTutorialActionHintLine/);
  assert.doesNotMatch(overlaySource, /tutorial-copy-action-hint/);
  assert.doesNotMatch(overlaySource, /className="tutorial-copy-line"/);
  assert.doesNotMatch(overlaySource, /<p>\{displayCopy \?\? step\.copy\}<\/p>/);
  assert.match(overlaySource, /showCompleteButton/);
  assert.match(overlaySource, /const showPrimaryButton = showCompleteButton \|\| canManualNext;/);
  assert.match(overlaySource, /\{showPrimaryButton \? \(\s*<button[\s\S]*className="tutorial-primary"[\s\S]*<\/button>\s*\) : null\}/);
  assert.match(overlaySource, /primaryLabel/);
  assert.match(overlaySource, /primaryDisabled/);
  assert.match(overlaySource, /onPrimaryAction/);
  assert.match(overlaySource, /跳过教程/);
  assert.doesNotMatch(overlaySource, /getTutorialPlacement/);
  assert.doesNotMatch(overlaySource, /data-placement=/);
  assert.doesNotMatch(overlaySource, /targetName/);
  assert.doesNotMatch(overlaySource, /step\.phase/);
  assert.doesNotMatch(overlaySource, /step\.title/);
  assert.doesNotMatch(overlaySource, /tutorial-phase/);
  assert.doesNotMatch(overlaySource, /正在指引/);
  assert.doesNotMatch(overlaySource, /tutorial-target-note/);
});

test('tutorial navigation buttons interrupt preview playback', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const tutorialControllerSource = await readFile(
    new URL('../src/app/useTutorialController.js', import.meta.url),
    'utf8',
  );

  assert.match(source, /const stopTutorialPreviewPlayback = useCallback/);
  assert.match(source, /const resetTutorialTransportToStart = useCallback/);
  assert.match(source, /resetTutorialTransportToStart = useCallback\(async \(\) => \{[\s\S]*APP_COMMAND_TYPES\.TRANSPORT_STOP[\s\S]*APP_COMMAND_TYPES\.TRANSPORT_SEEK,\s*bar:\s*0,\s*step:\s*0/);
  assert.match(source, /handleBackToStart = useCallback\(\(\) => \{[\s\S]*clearTutorialCountIn\(\);[\s\S]*APP_COMMAND_TYPES\.TRANSPORT_SEEK,\s*bar:\s*0,\s*step:\s*0/);
  assert.match(source, /handleStop = useCallback\(\(\) => \{[\s\S]*clearTutorialCountIn\(\);[\s\S]*APP_COMMAND_TYPES\.TRANSPORT_STOP/);
  assert.doesNotMatch(source, /tutorialPlaybackStateRef/);
  assert.match(source, /let tutorialAutoAdvanceTimerId = null/);
  assert.match(source, /function clearTutorialAutoAdvanceTimer\(\)/);
  assert.match(source, /window\.clearTimeout\(tutorialAutoAdvanceTimerId\)/);
  assert.match(source, /function scheduleTutorialAutoAdvance\(callback\)/);
  assert.match(tutorialControllerSource, /const \[tutorialCountInValue,\s*setTutorialCountInValue\] = useState\(null\);/);
  assert.match(tutorialControllerSource, /const tutorialCountInTimerIdsRef = useRef\(\[\]\);/);
  assert.match(tutorialControllerSource, /const clearTutorialCountIn = useCallback\(\(\) => \{[\s\S]*tutorialCountInTimerIdsRef\.current\.forEach\(\(timerId\) => window\.clearTimeout\(timerId\)\);[\s\S]*setTutorialCountInValue\(null\);/);
  assert.match(tutorialControllerSource, /const TUTORIAL_COUNT_IN_BEATS = Object\.freeze\(\[1,\s*2,\s*3\]\);/);
  assert.match(tutorialControllerSource, /const TUTORIAL_COUNT_IN_BEAT_MULTIPLIER = 1\.5;/);
  assert.match(tutorialControllerSource, /const startTutorialCountInPlayback = useCallback\(\(\) => \{[\s\S]*clearTutorialCountIn\(\);[\s\S]*const secondsPerBeat = \(60 \/ bpm\) \* TUTORIAL_COUNT_IN_BEAT_MULTIPLIER;[\s\S]*TUTORIAL_COUNT_IN_BEATS\.forEach/);
  assert.match(tutorialControllerSource, /startTutorialCountInPlayback[\s\S]*audioEngine\.triggerDrumsStep\('hihat'\)/);
  assert.match(tutorialControllerSource, /startTutorialCountInPlayback[\s\S]*APP_COMMAND_TYPES\.TRANSPORT_TOGGLE_PLAY/);
  assert.match(tutorialControllerSource, /tutorialCountInTimerIdsRef\.current = nextTimerIds;/);
  assert.match(source, /handleTutorialPlaybackComplete/);
  assert.match(source, /handleTutorialPlaybackPosition/);
  assert.match(source, /onPositionChange[\s\S]*handleTutorialPlaybackComplete/);
  assert.match(source, /onPositionChange[\s\S]*handleTutorialPlaybackPosition/);
  assert.match(source, /setTutorialProgress\(\(progress\) => \{[\s\S]*handleTutorialPlaybackPosition\(\{[\s\S]*progress,[\s\S]*step: currentTutorialStep/);
  assert.doesNotMatch(source, /handleTutorialPlaybackPosition\(\{[\s\S]*progress: tutorialProgress,[\s\S]*trackId: 'chord'/);
  assert.match(source, /const dispatchKeyboardCommand = useCallback\(\(command\) => \{[\s\S]*command\?\.type === APP_COMMAND_TYPES\.TRANSPORT_TOGGLE_PLAY[\s\S]*handlePlayToggle\(\);[\s\S]*return;[\s\S]*void dispatchAppCommand\(command\);/);
  assert.match(source, /useKeyboardCommands\(\{ dispatch: dispatchKeyboardCommand \}\)/);
  assert.doesNotMatch(source, /useKeyboardCommands\(\{ dispatch: dispatchAppCommand \}\)/);
  assert.match(source, /applyTutorialActionProgress,[\s\S]*currentTutorialStep,[\s\S]*tutorialProgress,[\s\S]*tutorialActive/);
  assert.match(tutorialControllerSource, /const tutorialDirectoryItems = useMemo/);
  assert.match(tutorialControllerSource, /TUTORIAL_DIRECTORY_ITEMS\.map/);
  assert.match(tutorialControllerSource, /DRUMS_TUTORIAL_STEPS\.findIndex\(\(step\) => step\.id === item\.stepId\)/);
  assert.doesNotMatch(tutorialControllerSource, /disabled:\s*!tutorialStepCheckpoints\[stepIndex\]/);
  assert.match(tutorialControllerSource, /disabled:\s*false/);
  assert.match(tutorialControllerSource, /active:\s*stepIndex <= currentTutorialStepIndex && nextDirectoryStepIndex > currentTutorialStepIndex/);
  assert.match(source, /ensureTutorialStepCheckpoint = useCallback/);
  assert.match(source, /stopTutorialPreviewPlayback\(\);[\s\S]*setCurrentTutorialStepIndex/);
  assert.match(source, /handleTutorialBack = useCallback\(\(\) => \{[\s\S]*stopTutorialPreviewPlayback\(\);/);
  assert.match(source, /handleTutorialBack = useCallback\(\(\) => \{[\s\S]*clearTutorialAutoAdvanceTimer\(\);[\s\S]*stopTutorialPreviewPlayback\(\);/);
  assert.match(source, /tutorialStepCheckpoints/);
  assert.match(source, /createTutorialCheckpoint/);
  assert.match(source, /restoreTutorialCheckpoint/);
  assert.match(source, /pruneTutorialCheckpoints/);
  assert.match(source, /enterTutorialStepIndex/);
  assert.match(source, /const nextStepCheckpoint = createTutorialCheckpoint\(\{[\s\S]*appState: useMusicStore\.getState\(\)/);
  assert.match(source, /setTutorialStepCheckpoints\(\(checkpoints\) => \(\{[\s\S]*\[nextStepIndex\]: nextStepCheckpoint/);
  assert.match(source, /setTutorialStepCheckpoints\(\(checkpoints\) => \(\{[\s\S]*applyTutorialStepSetup\(nextStep\)/);
  assert.match(source, /advanceTutorialToNextStep\([\s\S]*tutorialAction\.nextProgress,\s*\{[\s\S]*startPlaybackAfterAdvance:\s*tutorialAction\.shouldStartPlaybackAfterAdvance/);
  assert.match(source, /const advanceTutorialToNextStep = useCallback\(\([\s\S]*checkpointProgress = tutorialProgress,[\s\S]*options = \{\},[\s\S]*\) => \{[\s\S]*await resetTutorialTransportToStart\(\);[\s\S]*enterTutorialStepIndex\(currentTutorialStepIndex \+ 1,\s*checkpointProgress\);[\s\S]*if \(options\.startPlaybackAfterAdvance\)[\s\S]*startTutorialCountInPlayback\(\);/);
  assert.doesNotMatch(source, /if \(options\.startPlaybackAfterAdvance\) \{\s*\n\s*await dispatchAppCommand\(\{ type: APP_COMMAND_TYPES\.TRANSPORT_TOGGLE_PLAY \}\);/);
  assert.match(source, /const targetStepIndex = Math\.max\(currentTutorialStepIndex - 1, 0\);/);
  assert.match(source, /const targetCheckpoint = ensureTutorialStepCheckpoint\(targetStepIndex\);/);
  assert.match(source, /restoreTutorialCheckpoint\(\{[\s\S]*checkpoint:\s*targetCheckpoint/);
  assert.match(source, /applyTutorialStepSetup\([\s\S]*DRUMS_TUTORIAL_STEPS\[targetStepIndex\],[\s\S]*targetCheckpoint\?\.appliedTutorialSetups/);
  assert.match(source, /pruneTutorialCheckpoints\([\s\S]*targetStepIndex \+ 1/);
  assert.match(source, /setCurrentTutorialStepIndex\(targetStepIndex\)/);
  assert.match(source, /handleTutorialJumpToSection = useCallback\(\(targetStepIndex\) => \{[\s\S]*clearTutorialAutoAdvanceTimer\(\);[\s\S]*stopTutorialPreviewPlayback\(\);[\s\S]*const targetCheckpoint = ensureTutorialStepCheckpoint\(targetStepIndex\);[\s\S]*restoreTutorialCheckpoint\(\{[\s\S]*checkpoint:\s*targetCheckpoint/);
  assert.match(source, /handleTutorialJumpToSection = useCallback\(\(targetStepIndex\) => \{[\s\S]*applyTutorialStepSetup\([\s\S]*DRUMS_TUTORIAL_STEPS\[targetStepIndex\],[\s\S]*targetCheckpoint\?\.appliedTutorialSetups/);
  assert.match(source, /handleTutorialJumpToSection = useCallback\(\(targetStepIndex\) => \{[\s\S]*setCurrentTutorialStepIndex\(targetStepIndex\);[\s\S]*setTutorialModeActive\(true\);[\s\S]*setTutorialSidebarCollapsed\(false\);/);
  assert.doesNotMatch(source, /tutorialStepCheckpoints\[currentTutorialStepIndex\]/);
  assert.doesNotMatch(source, /TUTORIAL_BACK_TARGET_RESET_STEP_IDS/);
  assert.doesNotMatch(source, /resetTutorialStepsForBack/);
  assert.doesNotMatch(source, /resetTutorialStepForRetry/);
  assert.match(source, /handleTutorialNext = useCallback\(\(\) => \{[\s\S]*clearTutorialAutoAdvanceTimer\(\);[\s\S]*clearTutorialCountIn\(\);[\s\S]*advanceTutorialToNextStep\(tutorialProgress\);/);
  assert.match(source, /handleTutorialOpenClip = useCallback\(\(clip\) => \{[\s\S]*advanceTutorialToNextStep\(tutorialAction\.nextProgress\);/);
  assert.match(source, /if \(tutorialAction\.shouldCompleteTutorial\)[\s\S]*clearTutorialAutoAdvanceTimer\(\);[\s\S]*clearTutorialCountIn\(\);[\s\S]*stopTutorialPreviewPlayback\(\);[\s\S]*resetTutorialTransportToStart\(\);[\s\S]*setTutorialModeActive\(false\);[\s\S]*setTutorialSidebarCollapsed\(true\);[\s\S]*return;/);
  assert.match(source, /handleTutorialSkip = useCallback\(\(\) => \{[\s\S]*clearTutorialAutoAdvanceTimer\(\);[\s\S]*clearTutorialCountIn\(\);[\s\S]*stopTutorialPreviewPlayback\(\);[\s\S]*useMusicStore\.setState\(useMusicStore\.getInitialState\(\), true\);[\s\S]*setCurrentTutorialStepIndex\(0\);[\s\S]*setTutorialProgress\(createTutorialState\(\)\);[\s\S]*setAppliedTutorialSetups\(\(\) => new Set\(\)\);[\s\S]*setTutorialStepCheckpoints\(\(\) => \(\{[\s\S]*0: createTutorialCheckpoint\(\{[\s\S]*appState: useMusicStore\.getInitialState\(\),[\s\S]*appliedTutorialSetups: new Set\(\),[\s\S]*tutorialProgress: createTutorialState\(\),[\s\S]*\}\),[\s\S]*\}\)\);[\s\S]*setTutorialModeActive\(false\);[\s\S]*setTutorialSidebarCollapsed\(true\);[\s\S]*setTutorialVisible\(true\);/);
  assert.doesNotMatch(source, /handleTutorialSkip = useCallback\(\(\) => \{[\s\S]*setTutorialVisible\(false\);/);
  assert.doesNotMatch(source, /handleTutorialSkip = useCallback\(\(\) => \{[\s\S]*restoreTutorialCheckpoint/);
  assert.match(source, /tutorialTargets:\s*activeTutorialTargets/);
  assert.match(source, /tutorialLocked:\s*activeTutorialLocked/);
  assert.doesNotMatch(source, /tutorialTargets:\s*tutorialViewModel\.targets/);
  assert.doesNotMatch(source, /tutorialLocked:\s*tutorialViewModel\.locked/);
  assert.doesNotMatch(source, /tutorialLocked:\s*tutorialVisible && tutorialViewModel\.locked/);
  assert.match(source, /onSkip:\s*handleTutorialSkip/);
  assert.match(source, /directoryItems:\s*tutorialDirectoryItems/);
  assert.match(source, /onDirectorySelect:\s*handleTutorialJumpToSection/);
  assert.doesNotMatch(source, /onClose:\s*handleTutorialSkip/);
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
  assert.doesNotMatch(timelineSource, /tutorial-target-active/);
  assert.doesNotMatch(timelineSource, /activeTutorialTarget === 'track-area'/);
  assert.match(bottomEditorSource, /data-tutorial-target="track-editor"/);
  assert.match(bottomEditorSource, /tutorial-target-active/);
  assert.doesNotMatch(overlaySource, /getTutorialPlacement\(targetName\)/);
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
  const tracksColumnSource = await readFile(
    new URL('../src/app/components/TracksColumn.jsx', import.meta.url),
    'utf8',
  );
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const tutorialControllerSource = await readFile(
    new URL('../src/app/useTutorialController.js', import.meta.url),
    'utf8',
  );
  const tutorialRuntimeSource = await readFile(
    new URL('../src/tutorial/drumsTutorialRuntime.js', import.meta.url),
    'utf8',
  );

  assert.match(source, /handleTutorialDrumToggle/);
  assert.match(source, /handleTutorialDrumMove/);
  assert.match(source, /handleTutorialClipOpen/);
  assert.match(source, /handleTutorialControlAction/);
  assert.match(source, /handleTutorialPlaybackComplete/);
  assert.match(source, /handleTutorialPlaybackPosition/);
  assert.doesNotMatch(source, /handleTutorialPlayheadDrag/);
  assert.match(source, /handleTransportSeek/);
  assert.match(source, /if \(!tutorialAction\.allowed\) return false;\n\n {4}withUndoCheckpoint\(\(\) => \{\n {6}setTutorialProgress\(tutorialAction\.nextProgress\);\n\n {6}if \(tutorialAction\.shouldAdvance\)/);
  assert.match(source, /if \(tutorialAction\.shouldEnd\)[\s\S]*setTutorialVisible\(false\)/);
  assert.match(source, /if \(tutorialAction\.shouldCompleteTutorial\)[\s\S]*setTutorialSidebarCollapsed\(true\)/);
  assert.match(source, /handleTutorialOpenClip/);
  assert.match(source, /createDrumsStepMovePatch/);
  assert.match(source, /completeTutorialPrimaryAction/);
  assert.doesNotMatch(source, /completeTutorialTask4/);
  assert.match(source, /getDrumsCellInstruments/);
  assert.match(source, /previewInstruments:\s*getDrumsCellInstruments\(nextCell\)/);
  assert.match(tutorialControllerSource, /tutorialViewModel\.targets/);
  assert.match(tutorialControllerSource, /tutorialViewModel\.locked/);
  assert.match(source, /tutorialViewModel\.primaryLabel/);
  assert.match(source, /tutorialViewModel\.primaryDisabled/);
  assert.match(source, /onDrumsStepMove:\s*handleDrumsStepMove/);
  assert.match(topBarSource, /tutorialTargets/);
  assert.match(topBarSource, /getTutorialControlRole\(tutorialTargets,\s*'transport-play'\)/);
  assert.match(topBarSource, /const transportClassName = \[/);
  assert.match(topBarSource, /playTutorialRole === 'target' \? 'tutorial-control-target tutorial-transport-target' : ''/);
  assert.match(topBarSource, /<div className=\{transportClassName\} role="toolbar" aria-label="Transport">/);
  assert.doesNotMatch(topBarSource, /playTutorialRole === 'target' \? 'tutorial-control-target' : ''/);
  assert.match(topBarSource, /tutorial-control-target/);
  assert.match(tracksColumnSource, /tutorialTargets/);
  assert.match(tracksColumnSource, /getTutorialControlRole\(tutorialTargets,\s*`fill-empty-clips:\$\{track\.id\}`\)/);
  assert.match(tracksColumnSource, /tutorial-control-target/);
  assert.match(timelineSource, /tutorialTargets/);
  assert.match(timelineSource, /tutorial-bar-target/);
  assert.match(timelineSource, /getTutorialBarClass\(tutorialBarRole\)/);
  assert.doesNotMatch(timelineSource, /className=\{\[dropZoneClass,\s*getTutorialBarClass\(tutorialBarRole\)\]/);
  assert.match(timelineSource, /tutorialTargets\?\.playhead/);
  assert.match(timelineSource, /tutorial-playhead-target/);
  assert.match(timelineSource, /playheadLineClass/);
  assert.match(timelineSource, /className=\{playheadLineClass\}/);
  assert.match(timelineSource, /className=\{playheadGridClass\}/);
  assert.doesNotMatch(timelineSource, /playhead-hit',\s*\n\s*tutorialPlayheadRole === 'target'/);
  assert.match(timelineSource, /onTutorialOpenClip/);
  assert.match(bottomEditorSource, /tutorialTargets/);
  assert.match(bottomEditorSource, /tutorialLocked/);
  assert.match(bottomEditorSource, /createElement\(ChordEditor,[\s\S]*tutorialLocked,[\s\S]*tutorialTargets/);
  const chordEditorSource = await readFile(
    new URL('../src/app/components/ChordEditor.jsx', import.meta.url),
    'utf8',
  );
  assert.match(chordEditorSource, /getTutorialControlRole/);
  assert.match(chordEditorSource, /chord-template-button/);
  assert.match(chordEditorSource, /chord-template-card:\$\{template\.id\}/);
  assert.match(chordEditorSource, /chord-groove-button/);
  assert.match(chordEditorSource, /chord-groove-card:\$\{template\.id\}/);
  assert.match(chordEditorSource, /chord-enrich-button:\$\{spanIndex\}/);
  assert.match(chordEditorSource, /chord-passing-button/);
  assert.match(chordEditorSource, /tutorial-control-target/);
  assert.match(source, /handleChordTemplateApply = useCallback\(\(templateId\) => \{[\s\S]*handleTutorialControlAction\(\{[\s\S]*`chord-template-card:\$\{templateId\}`/);
  assert.match(source, /handleChordGrooveTemplateApply = useCallback\(\(templateId\) => \{[\s\S]*handleTutorialControlAction\(\{[\s\S]*`chord-groove-card:\$\{templateId\}`/);
  assert.match(tutorialRuntimeSource, /CHORD_LISTEN_LOOP[\s\S]*CHORD_GROOVE_BUTTON[\s\S]*CHORD_GROOVE_CARD_PREFIX/);
  assert.match(tutorialRuntimeSource, /BASS_LISTEN_LOOP[\s\S]*BASS_GROOVE_BUTTON[\s\S]*BASS_GROOVE_CARD_PREFIX/);
  assert.match(source, /handleChordPick = useCallback\(\(spanIndex,\s*root\) => \{[\s\S]*handleTutorialControlAction\(\{[\s\S]*`chord-enrich-button:\$\{spanIndex\}`/);
  assert.match(source, /handlePassingChordPick = useCallback\(\(stepIndex,\s*chordName\) => \{[\s\S]*handleTutorialControlAction\(\{[\s\S]*'chord-passing-button'/);
  assert.match(drumSequencerSource, /getTutorialControlRole\(tutorialTargets,\s*'generate-current-drums-bar'\)/);
  assert.match(drumSequencerSource, /getTutorialControlRole\(tutorialTargets,\s*'generate-all-drums-bars'\)/);
  assert.match(drumSequencerSource, /data-tutorial-role=\{templateButtonRole/);
  assert.match(drumSequencerSource, /data-tutorial-role=\{generateCurrentRole/);
  assert.match(drumSequencerSource, /data-tutorial-role=\{generateAllRole/);
  assert.match(drumSequencerSource, /onStepMove/);
  assert.match(drumSequencerSource, /handleMouseDownStep/);
  assert.match(drumSequencerSource, /getDropTargetFromPoint/);
  assert.match(drumSequencerSource, /drag-over/);
  assert.match(drumSequencerSource, /tutorial-cell-target/);
  assert.match(drumSequencerSource, /tutorial-cell-target-blue/);
  assert.match(drumSequencerSource, /tutorial-cell-target-green/);
  assert.match(drumSequencerSource, /tutorial-cell-target-yellow/);
  assert.doesNotMatch(drumSequencerSource, /tutorial-cell-existing/);
  assert.doesNotMatch(drumSequencerSource, /tutorial-cell-existing-blue/);
  assert.doesNotMatch(drumSequencerSource, /tutorial-cell-existing-green/);
  assert.doesNotMatch(drumSequencerSource, /tutorial-cell-existing-yellow/);
  assert.doesNotMatch(drumSequencerSource, /tutorial-cell-completed/);
  assert.doesNotMatch(drumSequencerSource, /tutorialRole\.startsWith\('existing'\)/);
  assert.doesNotMatch(drumSequencerSource, /tutorialRole\.startsWith\('completed'\)/);
  assert.match(drumSequencerSource, /getTutorialControlRole\(tutorialTargets,\s*'generate-current-drums-bar'\)/);
  assert.match(drumSequencerSource, /getTutorialControlRole\(tutorialTargets,\s*'generate-all-drums-bars'\)/);
  assert.match(drumSequencerSource, /tutorial-cell-source/);
});
