import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('genre options expose Pop as the only enabled current genre', async () => {
  const { CURRENT_GENRE_ID, GENRE_OPTIONS } = await import('../src/app/genreOptions.js');

  assert.equal(CURRENT_GENRE_ID, 'pop');
  assert.deepEqual(GENRE_OPTIONS.map((genre) => genre.label), [
    '流行 Pop',
    '嘻哈 Hip-Hop',
    'R&B',
    '电子 Electronic / EDM',
    '摇滚 Rock',
  ]);
  assert.equal(new Set(GENRE_OPTIONS.map((genre) => genre.id)).size, 5);
  assert.equal(GENRE_OPTIONS.find((genre) => genre.id === CURRENT_GENRE_ID)?.enabled, true);
  assert.deepEqual(
    GENRE_OPTIONS
      .filter((genre) => genre.id !== CURRENT_GENRE_ID)
      .map((genre) => genre.enabled),
    [false, false, false, false],
  );
});

test('root gates the arranger behind the genre selection screen', async () => {
  const mainSource = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
  const rootSource = await readFile(new URL('../src/app/Root.jsx', import.meta.url), 'utf8');

  assert.match(mainSource, /import Root from '\.\/app\/Root\.jsx';/);
  assert.match(mainSource, /createElement\(Root\)/);
  assert.match(rootSource, /useState\(null\)/);
  assert.match(rootSource, /selectedGenreId !== CURRENT_GENRE_ID/);
  assert.match(rootSource, /createElement\(GenreSelectScreen/);
  assert.match(rootSource, /createElement\(App\)/);
  assert.match(rootSource, /setSelectedGenreId\(genreId\)/);
  assert.doesNotMatch(rootSource, /localStorage|sessionStorage/);
});

test('genre selection screen renders all styles and locks unavailable choices', async () => {
  const source = await readFile(
    new URL('../src/app/components/GenreSelectScreen.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /function GenreSelectScreen/);
  assert.match(source, /选择曲风/);
  assert.match(source, /genre\.label/);
  assert.match(source, /试听/);
  assert.match(source, /LockKeyhole/);
  assert.match(source, /Play/);
  assert.match(source, /aria-disabled=\{locked\}/);
  assert.match(source, /data-current=\{current \? 'true' : undefined\}/);
  assert.match(source, /data-locked=\{locked \? 'true' : undefined\}/);
  assert.match(source, /disabled=\{locked\}/);
  assert.match(source, /onGenreEnter\(genre\.id\)/);
  assert.doesNotMatch(source, /audioEngine|startAudio|previewChord|triggerDrums|triggerBass|triggerMelody/);
});
