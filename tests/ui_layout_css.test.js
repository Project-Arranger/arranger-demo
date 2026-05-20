import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const TRACK_IDS = ['drums', 'bass', 'chord', 'lead', 'pad', 'vocal', 'sample'];

test('ui shell keeps the editor usable and confines mobile overflow to panels', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--app-topbar-height:\s*clamp\(52px,\s*7vh,\s*64px\);/);
  assert.match(css, /--app-editor-height:\s*clamp\(260px,\s*39vh,\s*330px\);/);
  assert.match(css, /--timeline-min-width:\s*min\(640px,\s*100%\);/);
  assert.match(css, /\.app\s*\{[^}]*grid-template-rows:\s*var\(--app-topbar-height\) minmax\(0,\s*1fr\) var\(--app-editor-height\);/s);
  assert.match(css, /\.app\s*\{[^}]*height:\s*100dvh;/s);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-columns:\s*clamp\(188px,\s*18vw,\s*246px\) minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.editor\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.seq-body\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.chord-grid\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /grid-template-columns:\s*168px minmax\(0,\s*1fr\);/);
  assert.match(css, /\.stat:nth-child\(4\)\s*\{[^}]*display:\s*none;/s);
});

test('timeline clips fill exactly one bar grid cell', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.clip\s*\{[^}]*left:\s*0;/s);
  assert.match(css, /\.clip\s*\{[^}]*left:\s*calc\(var\(--bar-index\) \* 100% \/ var\(--bars\)\);/s);
  assert.match(css, /\.clip\s*\{[^}]*width:\s*calc\(100% \/ var\(--bars\)\);/s);
  assert.match(css, /\.clip\s*\{[^}]*top:\s*6px;/s);
  assert.match(css, /\.clip\s*\{[^}]*bottom:\s*6px;/s);
  assert.match(css, /\.clip\s*\{[^}]*box-sizing:\s*border-box;/s);
  assert.match(css, /\.clip\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.ruler\s*\{[^}]*grid-template-columns:\s*repeat\(var\(--bars\),\s*minmax\(80px,\s*1fr\)\);/s);
  assert.match(css, /\.ruler\s*\{[^}]*min-width:\s*var\(--timeline-min-width\);/s);
  assert.match(css, /\.grid\s*\{[^}]*min-width:\s*var\(--timeline-min-width\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*left:\s*calc\(\(var\(--bar-index\) \+ 0\.5\) \* 100% \/ var\(--bars\)\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*transform:\s*translate\(-50%, -50%\);/s);
  assert.doesNotMatch(css, /\.clip\s*\{[^}]*\+ 10px/s);
  assert.doesNotMatch(css, /\.clip\s*\{[^}]*- 20px/s);
  assert.doesNotMatch(css, /\.clip-mini\s*\{/);
  assert.doesNotMatch(css, /var\(--bars\) \* 1\.55/);
});

test('track list rows align with timeline hover rows', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--track-row-size:\s*minmax\(clamp\(48px,\s*7\.5vh,\s*74px\),\s*1fr\);/);
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
  assert.doesNotMatch(css, /\.drum-step(?:-number)?\.beat-end\s*\{[^}]*margin-right:/s);
  assert.match(css, /\.drum-step\.beat-end::after\s*\{[^}]*position:\s*absolute;/s);
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
  assert.match(css, /\.scale-notes\s*\{[^}]*grid-template-rows:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
  assert.match(css, /\.note-key\s*\{[^}]*min-height:\s*0;/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*grid-template-rows:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
  assert.doesNotMatch(css, /\.cell\.sustain/);
  assert.match(css, /--chord-extension:\s*oklch\(84% 0\.075 215\);/);
  assert.match(css, /--chord-extension-ink:\s*oklch\(37% 0\.08 215\);/);
  assert.match(css, /\.cell\.added,\s*\.cell\.active\.added\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-chord\) 35%,\s*white\);/s);
  assert.doesNotMatch(css, /\.cell\.active\.added\s*\{[^}]*linear-gradient/s);
  assert.match(css, /\.cell\.extension\.active,\s*\.cell\.extension\.added,\s*\.cell\.extension\.active\.added\s*\{/s);
  assert.match(css, /\.cell\.extension\.active,\s*\.cell\.extension\.added,\s*\.cell\.extension\.active\.added\s*\{[^}]*background:\s*var\(--chord-extension\);/s);
  assert.match(css, /\.cell\.extension\.active,\s*\.cell\.extension\.added,\s*\.cell\.extension\.active\.added\s*\{[^}]*border-color:\s*color-mix\(in oklab,\s*var\(--chord-extension-ink\) 45%,\s*var\(--border\)\);/s);
});

test('chord template picker has enough room and can scroll full card content', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.app:has\(\.editor\[data-picker="open"\]\)\s*\{[^}]*--app-editor-height:\s*clamp\(380px,\s*55vh,\s*560px\);/s);
  assert.match(css, /\.tpl-body\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.tpl-list\s*\{[^}]*height:\s*auto;/s);
  assert.match(css, /\.tpl-list\s*\{[^}]*min-height:\s*100%;/s);
  assert.doesNotMatch(css, /\.tpl-body\s*\{[^}]*overflow:\s*hidden;/s);
});

test('active chord template button aligns icon and label on one baseline', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.btn-template-active\s*\{[^}]*display:\s*inline-flex;/s);
  assert.match(css, /\.btn-template-active\s*\{[^}]*align-items:\s*center;/s);
  assert.match(css, /\.btn-template-active\s*\{[^}]*justify-content:\s*center;/s);
  assert.match(css, /\.btn-template-active\s*\{[^}]*line-height:\s*1;/s);
  assert.match(css, /\.btn-template-active svg\s*\{[^}]*width:\s*14px;/s);
  assert.match(css, /\.btn-template-active svg\s*\{[^}]*height:\s*14px;/s);
  assert.match(css, /\.btn-template-active svg\s*\{[^}]*flex:\s*0 0 auto;/s);
});

test('clip name edit icon sits beside the shared clip name input', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.clip-name-field\s*\{[^}]*display:\s*inline-flex;/s);
  assert.match(css, /\.clip-name-field\s*\{[^}]*align-items:\s*center;/s);
  assert.match(css, /\.clip-name-edit-icon\s*\{[^}]*flex:\s*0 0 auto;/s);
  assert.match(css, /\.clip-name-edit-icon\s*\{[^}]*pointer-events:\s*none;/s);
});

test('add chord secondary panel matches the two-tab reference picker layout', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.chord-variants\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.chord-variants\s*\{[^}]*width:\s*min\(760px,\s*calc\(100vw - 32px\)\);/s);
  assert.match(css, /\.cv-tabs\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.cv-tab\[aria-selected="true"\]::after\s*\{/);
  assert.match(css, /\.cv-panel\[hidden\]\s*\{[^}]*display:\s*none !important;/s);
  assert.match(css, /\.cv-grid\.diatonic\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.cv-grid\.enrich\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.cv-grid\.diatonic \.cv-card\s*\{[^}]*min-height:\s*150px;/s);
  assert.match(css, /\.cv-grid\.diatonic \.cv-foot\s*\{[^}]*margin-top:\s*auto;/s);
  assert.match(css, /\.cv-context\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.cv-empty\s*\{[^}]*border:\s*1px dashed var\(--border\);/s);
  assert.match(css, /\.cv-roman\s*\{/);
});
