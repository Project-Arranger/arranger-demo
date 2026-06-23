import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('genre options expose six styles with Pop as the only enabled current genre', async () => {
  const { CURRENT_GENRE_ID, GENRE_OPTIONS } = await import('../src/app/genreOptions.js');

  assert.equal(CURRENT_GENRE_ID, 'pop');
  assert.deepEqual(GENRE_OPTIONS.map((genre) => genre.label), [
    '流行 Pop',
    '嘻哈 Hip-Hop',
    'R&B',
    '电子 Electronic / EDM',
    '摇滚 Rock',
    '爵士 Jazz',
  ]);
  assert.deepEqual(GENRE_OPTIONS.map((genre) => genre.shortLabel), [
    'POP',
    'HIP-HOP',
    'R&B',
    'ELECTRONIC',
    'ROCK',
    'JAZZ',
  ]);
  assert.deepEqual(GENRE_OPTIONS.map((genre) => genre.artImage), [
    '/assets/genre-art/pop-neon.png',
    '/assets/genre-art/hip-hop-neon.png',
    '/assets/genre-art/rnb-neon.png',
    '/assets/genre-art/electronic-neon.png',
    '/assets/genre-art/rock-neon.png',
    '/assets/genre-art/jazz-neon.png',
  ]);
  assert.deepEqual(GENRE_OPTIONS.map((genre) => genre.gemTone), [
    'blue',
    'purple',
    'amber',
    'green',
    'amber',
    'blue',
  ]);
  assert.equal(new Set(GENRE_OPTIONS.map((genre) => genre.id)).size, 6);
  assert.equal(GENRE_OPTIONS.find((genre) => genre.id === CURRENT_GENRE_ID)?.enabled, true);
  assert.deepEqual(
    GENRE_OPTIONS
      .filter((genre) => genre.id !== CURRENT_GENRE_ID)
      .map((genre) => genre.enabled),
    [false, false, false, false, false],
  );
  assert.equal(GENRE_OPTIONS.every((genre) => genre.neon && genre.artImage), true);
  assert.equal(GENRE_OPTIONS.every((genre) => !('artKey' in genre)), true);
  assert.equal(GENRE_OPTIONS.every((genre) => !('subtitle' in genre)), true);
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

test('genre selection screen renders previewable hardware cards and only enters Pop', async () => {
  const source = await readFile(
    new URL('../src/app/components/GenreSelectScreen.jsx', import.meta.url),
    'utf8',
  );
  const cardHandler = source.match(/const handleGenreSelect = \(genre\) => \{[\s\S]*?\n\s{2}\};/)?.[0] ?? '';
  const auditionHandler = source.match(/const handleGenreAudition = \(genre\) => \{[\s\S]*?\n\s{2}\};/)?.[0] ?? '';

  assert.match(source, /function GenreSelectScreen/);
  assert.match(source, /useState\(currentGenreId\)/);
  assert.match(source, /selectedPreviewGenreId/);
  assert.match(cardHandler, /setSelectedPreviewGenreId\(genre\.id\)/);
  assert.match(cardHandler, /if \(genre\.id === currentGenreId\) \{/);
  assert.match(cardHandler, /onGenreEnter\(genre\.id\)/);
  assert.match(auditionHandler, /setSelectedPreviewGenreId\(genre\.id\)/);
  assert.doesNotMatch(auditionHandler, /onGenreEnter/);
  assert.match(source, /aria-pressed=\{selected\}/);
  assert.match(source, /data-selected=\{selected \? 'true' : undefined\}/);
  assert.match(source, /data-enabled=\{genre\.enabled \? 'true' : 'false'\}/);
  assert.match(source, /onClick=\{\(\) => handleGenreSelect\(genre\)\}/);
  assert.match(source, /className="genre-art-frame"/);
  assert.match(source, /className="genre-art-image"/);
  assert.match(source, /src=\{genre\.artImage\}/);
  assert.match(source, /alt=""/);
  assert.match(source, /className="genre-gem-button"/);
  assert.match(source, /type="button"[\s\S]*aria-label=\{`试听 \$\{genre\.label\}`\}/);
  assert.match(source, /data-gem-tone=\{genre\.gemTone \?\? 'amber'\}/);
  assert.match(source, /onClick=\{\(\) => handleGenreAudition\(genre\)\}/);
  assert.match(source, /className="genre-gem-socket"/);
  assert.match(source, /className="genre-gem-label"[\s\S]*试听/);
  assert.doesNotMatch(source, /genre-subtitle/);
  assert.doesNotMatch(source, /genre\.subtitle/);
  assert.match(source, /genre-side-rail/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /genre-knob/);
  assert.match(source, /genre-control-button/);
  assert.match(source, /className=\{`genre-hardware-control \$\{control\.type\}`\}/);
  assert.match(source, /Volume2/);
  assert.doesNotMatch(source, /GENRE_ART_ICONS/);
  assert.doesNotMatch(source, /renderGenreArt/);
  assert.doesNotMatch(source, /genre-art-icon|genre-art-line/);
  assert.doesNotMatch(source, /\b(AudioWaveform|Building2|CircuitBoard|Disc3|Guitar|Mic2|Music2|SprayCan|Zap)\b/);
  assert.doesNotMatch(source, /LockKeyhole/);
  assert.doesNotMatch(source, /disabled=\{/);
  assert.doesNotMatch(source, /audioEngine|startAudio|previewChord|triggerDrums|triggerBass|triggerMelody/);
});
