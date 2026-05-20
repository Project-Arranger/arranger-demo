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
  const chordEditorSource = await readFile(
    new URL('../src/app/components/ChordEditor.jsx', import.meta.url),
    'utf8',
  );

  assert.match(chordEditorSource, /data-screen-label="Chord Editor"/);
  assert.match(chordEditorSource, /CHORD EDITOR - BAR/);
  assert.match(chordEditorSource, /选择和弦进行模板/);
  assert.match(chordEditorSource, /Chord Template Picker/);
  assert.match(chordEditorSource, /丰富和弦色彩/);
  assert.match(chordEditorSource, /CHORD_NOTES\.flatMap/);
  assert.match(chordEditorSource, /CHORD_TEMPLATES/);
  assert.match(chordEditorSource, /CHORD_VARIANTS/);
  assert.match(chordEditorSource, /getChordCell/);
  assert.match(chordEditorSource, /getChordStepCell/);
  assert.match(chordEditorSource, /isChordCellActive/);
  assert.match(chordEditorSource, /onChordCellSelect/);
  assert.match(chordEditorSource, /onChordNoteSelect/);
  assert.match(chordEditorSource, /onChordTemplateApply/);
  assert.match(chordEditorSource, /onClearChordBar/);
  assert.match(chordEditorSource, /aria-pressed=\{active\}/);
  assert.match(source, /useKeyboardCommands/);
  assert.match(source, /createUiAudioDispatcher/);
  assert.match(source, /audioEngine/);
  assert.match(source, /seedDefaultDrumsPattern/);
  assert.match(source, /handleChordCellSelect/);
  assert.match(source, /handleChordNoteSelect/);
  assert.match(source, /handleChordTemplateApply/);
  assert.match(source, /handleClearChordBar/);
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
  assert.match(timelineSource, /onAddClip\(track\.id,\s*bar\.bar\)/);
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
  assert.match(timelineSource, /bar\.canAddClip/);
  assert.match(source, /createClip\(trackId,\s*barIndex\)/);
  assert.match(source, /moveClipToBar\(clipId,\s*targetBar\)/);
  assert.match(source, /selectClip\(clipId\)/);
  assert.match(source, /volumes/);
  assert.match(source, /setTrackVolume\(trackId,\s*volume\)/);
  assert.match(source, /onVolumeChange:\s*handleTrackVolumeChange/);
  assert.match(tracksColumnSource, /type="range"/);
  assert.match(tracksColumnSource, /aria-label=\{`\$\{track\.label\} volume`\}/);
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
  assert.match(source, /applyBasicDrumsBar/);
  assert.match(source, /getDrumsClipBarIndexes/);
  assert.match(source, /applyBasicDrumsAllBars/);
  assert.match(source, /applyBasicDrumsAllBars\(state\.matrix,\s*drumsClipBars\)/);
  assert.match(source, /clearDrumsBar/);
  assert.match(bottomEditorSource, /activeTrackId === 'drums'/);
  assert.match(bottomEditorSource, /activeTrackId === 'chord'/);
  assert.match(bottomEditorSource, /onChordNoteSelect/);
  assert.match(bottomEditorSource, /onChordTemplateApply/);
});
