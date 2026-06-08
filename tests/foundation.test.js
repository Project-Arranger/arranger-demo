import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const requiredFiles = [
  'src/data/bassNotes.js',
  'src/data/melodyScales.js',
  'src/data/drumsNotes.js',
  'public/samples/Chords/Chord_C4_v0.22.wav',
  'public/samples/Bass/Bass_C1_v0.22.wav',
  'public/samples/Melody/Melody_C4_v0.22.wav',
  'public/samples/Drums/Kick_v0.22.wav',
];

test('foundation assets and music data are present', () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(file), true, `${file} should exist`);
  }
});

test('stale chord pitch library is removed from the runtime data set', () => {
  assert.equal(existsSync('src/data/chords.js'), false);
});

test('new v0.22 sample assets are playable wav files', () => {
  for (const file of requiredFiles.slice(3)) {
    const header = readFileSync(file).subarray(0, 12);
    assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(header.subarray(8, 12).toString('ascii'), 'WAVE');
  }
});
