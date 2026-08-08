import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  audioBufferToWavBlob,
  collectProjectEvents,
  getAudioExportTrackIds,
  getDurationSeconds,
} from '../src/export/audioFile.js';
import {
  createMidiFile,
  MIDI_TICKS_PER_STEP,
  noteNameToMidi,
} from '../src/export/midiFile.js';
import {
  createProjectFile,
  PROJECT_FILE_SCHEMA_VERSION,
} from '../src/export/projectFile.js';
import { createDefaultTrackState } from '../src/domain/trackInstances.js';
import createInitialMatrix from '../src/store/createInitialMatrix.js';

function createExportState() {
  const matrix = createInitialMatrix();
  matrix.drums[0][0] = { instruments: ['kick', 'hihat'] };
  matrix.chord[0][0] = {
    type: 'chord',
    root: 'C',
    quality: 'maj',
    label: 'C',
    toneRoots: ['C', 'E', 'G'],
  };
  matrix.bass[0][4] = { type: 'bass', note: 'C1', duration: '8n' };
  matrix.melody[0][8] = { type: 'melody', note: 'C4', durationSteps: 3 };
  return {
    ...createDefaultTrackState(),
    bpm: 120,
    clips: { byId: {}, ids: [] },
    matrix,
    melodyRhythmTemplateId: 'chinese',
    melodyScaleId: 'chinese',
    melodyTimbreId: 'piano',
    mutedTracks: { bass: false, chord: false, drums: false, melody: false },
    rootKey: 'C',
    scale: 'Ionian',
    volumes: { bass: -3, chord: 0, drums: 0, melody: -1 },
  };
}

test('MIDI export creates a standard multitrack file with drums and melodic notes', () => {
  const midi = createMidiFile(createExportState());

  assert.deepEqual([...midi.slice(0, 4)], [77, 84, 104, 100]);
  assert.equal(midi[9], 1, 'MIDI format is type 1');
  assert.equal(midi[11], 5, 'conductor plus four arranger tracks');
  assert.ok(midi.includes(0x99), 'drums use the General MIDI percussion channel');
  assert.ok(midi.includes(36), 'kick maps to General MIDI note 36');
  assert.ok(midi.includes(60), 'C4 maps to MIDI note 60');
  assert.ok(midi.includes(77) && midi.includes(84) && midi.includes(114) && midi.includes(107));
});

test('MIDI note and duration conversion preserve editable musical timing', () => {
  assert.equal(noteNameToMidi('C4'), 60);
  assert.equal(noteNameToMidi('A0'), 21);
  assert.equal(noteNameToMidi('H4'), null);
  assert.equal(getDurationSeconds({ duration: '8n' }, 120), 0.25);
  assert.equal(getDurationSeconds({ durationSteps: 3 }, 120), 0.375);
  assert.equal(MIDI_TICKS_PER_STEP, 120);
});

test('exported project backup preserves the arrangement and useful project settings', () => {
  const state = createExportState();
  const project = createProjectFile(state, { exportedAt: '2026-08-07T00:00:00.000Z' });

  assert.equal(project.schemaVersion, PROJECT_FILE_SCHEMA_VERSION);
  assert.equal(project.exportedAt, '2026-08-07T00:00:00.000Z');
  assert.equal(project.transport.bpm, 120);
  assert.equal(project.editor.melodyTimbreId, 'piano');
  assert.deepEqual(project.arrangement.matrix, state.matrix);
  assert.notEqual(project.arrangement.matrix, state.matrix);
});

test('audio export helpers omit muted tracks and write a WAV container', async () => {
  const state = createExportState();
  state.mutedTracks.chord = true;
  const events = collectProjectEvents(state);
  assert.equal(events.some((event) => event.type === 'chord'), false);
  assert.equal(events.some((event) => event.type === 'drums'), true);
  assert.deepEqual(getAudioExportTrackIds(state), ['drums', 'bass', 'melody']);
  assert.deepEqual(
    collectProjectEvents(createExportState(), { trackIds: ['bass'] }).map((event) => event.trackId),
    ['bass'],
  );

  const wav = audioBufferToWavBlob({
    getChannelData: () => new Float32Array([0, 1, -1]),
    length: 3,
    numberOfChannels: 2,
    sampleRate: 44_100,
  });
  const bytes = new Uint8Array(await wav.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), 'RIFF');
  assert.equal(new TextDecoder().decode(bytes.slice(8, 12)), 'WAVE');
  assert.equal(wav.type, 'audio/wav');
});

test('export UI wires WAV, Ableton-compatible MIDI, and project backup actions', async () => {
  const appSource = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');
  const topBarSource = await readFile(new URL('../src/app/components/TopBar.jsx', import.meta.url), 'utf8');
  const dialogSource = await readFile(new URL('../src/app/components/ExportDialog.jsx', import.meta.url), 'utf8');

  assert.match(topBarSource, /onExport = \(\) => \{\}/);
  assert.match(topBarSource, /aria-label="导出项目"/);
  assert.match(appSource, /renderProjectToWav/);
  assert.match(appSource, /createMidiFileBlob/);
  assert.match(appSource, /createProjectFileBlob/);
  assert.match(appSource, /onExport: openExportDialog/);
  assert.match(appSource, /handleExportStems/);
  assert.match(appSource, /getAudioExportTrackIds/);
  assert.match(dialogSource, /导出完整 WAV/);
  assert.match(dialogSource, /导出 Live 音频分轨/);
  assert.match(dialogSource, /导出 Ableton MIDI/);
  assert.match(dialogSource, /导出工程备份/);
});
