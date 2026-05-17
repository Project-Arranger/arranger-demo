import { existsSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const requiredFiles = [
  'src/data/chords.js',
  'src/data/bassNotes.js',
  'src/data/leadNotes.js',
  'src/data/percNotes.js',
  'public/samples/chords/C4.wav',
  'public/samples/bass/Bass_C1.wav',
  'public/samples/lead/Lead C3.wav',
  'public/samples/808/kick.wav',
];

test('foundation assets and music data are present', () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(file), true, `${file} should exist`);
  }
});
