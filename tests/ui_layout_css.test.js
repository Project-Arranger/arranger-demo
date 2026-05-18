import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const TRACK_IDS = ['drums', 'bass', 'chord', 'lead', 'pad', 'vocal', 'sample'];

test('ui shell keeps the editor usable and confines mobile overflow to panels', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /grid-template-rows:\s*64px minmax\(300px,\s*1fr\) 330px;/);
  assert.match(css, /\.editor\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.seq-body\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.chord-grid\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /grid-template-columns:\s*168px minmax\(0,\s*1fr\);/);
  assert.match(css, /\.stat:nth-child\(4\)\s*\{[^}]*display:\s*none;/s);
});

test('timeline clips stay inside one bar and leave room for add clip controls', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.clip\s*\{[^}]*left:\s*10px;/s);
  assert.match(css, /\.clip\s*\{[^}]*left:\s*calc\(var\(--bar-index\) \* 100% \/ var\(--bars\) \+ 10px\);/s);
  assert.match(css, /\.clip\s*\{[^}]*width:\s*calc\(100% \/ var\(--bars\) - 20px\);/s);
  assert.match(css, /\.clip\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.add-clip\s*\{[^}]*left:\s*calc\(\(var\(--bar-index\) \+ 0\.5\) \* 100% \/ var\(--bars\)\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*transform:\s*translate\(-50%, -50%\);/s);
  assert.doesNotMatch(css, /var\(--bars\) \* 1\.55/);
});

test('track list rows align with timeline hover rows', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--track-row-size:\s*minmax\(74px,\s*1fr\);/);
  assert.match(css, /\.tracks-col\s*\{[^}]*grid-template-rows:\s*48px minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.tracks-list\s*\{[^}]*grid-template-rows:\s*repeat\(7,\s*var\(--track-row-size\)\);/s);
  assert.match(css, /\.grid-rows,\s*\n\.hover-rows\s*\{[^}]*grid-template-rows:\s*repeat\(7,\s*var\(--track-row-size\)\);/s);
  assert.match(css, /\.add-track\s*\{[^}]*position:\s*absolute;/s);
});

test('timeline clips and add controls inherit the left track color map', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  for (const trackId of TRACK_IDS) {
    assert.match(css, new RegExp(`\\[data-type="${trackId}"\\]\\s*\\{[^}]*--track-color:\\s*var\\(--c-${trackId}\\);`, 's'));
    assert.match(css, new RegExp(`\\[data-type="${trackId}"\\]\\s*\\{[^}]*--track-ink:\\s*var\\(--c-${trackId}-ink\\);`, 's'));
  }

  assert.match(css, /\.clip\s*\{[^}]*--clip-bg:\s*var\(--track-color,\s*var\(--c-drums\)\);/s);
  assert.match(css, /\.clip\s*\{[^}]*--clip-ink:\s*var\(--track-ink,\s*var\(--c-drums-ink\)\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*color:\s*var\(--track-ink,\s*var\(--ink-3\)\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--track-color,\s*var\(--surface\)\)/s);
});

test('timeline drag and swap feedback is visually prominent', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.clip\.clip-dragging\s*\{[^}]*transform:\s*translateY\(-3px\) scale\(1\.02\);/s);
  assert.match(css, /\.clip\.drop-move,\s*\n\.clip\.drop-swap\s*\{[^}]*animation:\s*clip-drop-pop 0\.48s ease-out;/s);
  assert.match(css, /\.bar-drop-zone\.drag-over\s*\{[^}]*box-shadow:\s*inset 0 0 0 2px/s);
  assert.match(css, /\.bar-drop-zone\.drop-move,\s*\n\.bar-drop-zone\.drop-swap\s*\{[^}]*animation:\s*bar-drop-pulse 0\.7s ease-out;/s);
  assert.match(css, /@keyframes clip-drop-pop/);
  assert.match(css, /@keyframes bar-drop-pulse/);
});

test('drum sequencer uses three fixed rows and sixteen stable step columns', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.drum-seq-body\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.drum-row\s*\{[^}]*grid-template-columns:\s*118px minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.drum-steps\s*\{[^}]*grid-template-columns:\s*repeat\(16,\s*minmax\(18px,\s*32px\)\);/s);
  assert.match(css, /\.drum-step\.active\[data-instrument="kick"\]/);
  assert.match(css, /\.drum-step\.active\[data-instrument="snare"\]/);
  assert.match(css, /\.drum-step\.active\[data-instrument="hihat"\]/);
});

test('chord pitch rail rows align with chord grid rows', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--chord-cell-grid-height:\s*220px;/);
  assert.match(css, /--chord-cell-gap:\s*3px;/);
  assert.match(css, /--chord-cell-padding:\s*6px;/);
  assert.match(css, /\.scale-rail\s*\{[^}]*grid-template-rows:\s*var\(--chord-beat-head-height\) var\(--chord-cell-grid-height\) 22px;/s);
  assert.match(css, /\.scale-rail\s*\{[^}]*gap:\s*var\(--chord-beat-gap\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
});
