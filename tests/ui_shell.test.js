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

  assert.match(source, /aria-label="Project Arranger workspace"/);
  assert.match(source, /Project Arranger/);
  assert.match(source, /data-screen-label="Main"/);
  assert.doesNotMatch(source, /perc/i);
  assert.match(source, /TRACK_UI\.map/);
  assert.match(source, /BAR_NUMBERS\.map/);

  assert.deepEqual(TRACK_UI.map((track) => track.id), TRACK_IDS);
  assert.equal(BAR_NUMBERS.length, TOTAL_BARS);
  assert.equal(BAR_NUMBERS.at(0), 1);
  assert.equal(BAR_NUMBERS.at(-1), TOTAL_BARS);
});

test('app shell exposes the chord editor preview without wiring audio', async () => {
  const source = await readFile(new URL('../src/app/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /data-screen-label="Chord Editor"/);
  assert.match(source, /Chord 01/);
  assert.match(source, /选择和弦进行模板/);
  assert.match(source, /CHORD_NOTES\.flatMap/);

  assert.equal(BEAT_NUMBERS.length, 4);
  assert.equal(CHORD_NOTES.length, 12);
  assert.equal(CHORD_NOTES.at(-1).label, 'C');
  assert.equal(CHORD_NOTES.at(-1).root, true);
});
