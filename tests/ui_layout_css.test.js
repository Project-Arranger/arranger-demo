import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const TRACK_IDS = ['drums', 'chord', 'bass', 'lead', 'pad', 'vocal', 'sample'];

test('ui shell keeps the editor usable and confines mobile overflow to panels', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--app-topbar-height:\s*clamp\(52px,\s*7vh,\s*64px\);/);
  assert.match(css, /--app-editor-height:\s*clamp\(260px,\s*39vh,\s*330px\);/);
  assert.match(css, /--timeline-min-width:\s*min\(640px,\s*100%\);/);
  assert.match(css, /\.app\s*\{[^}]*grid-template-rows:\s*var\(--app-topbar-height\) minmax\(0,\s*1fr\) var\(--app-editor-height\);/s);
  assert.match(css, /\.app\s*\{[^}]*height:\s*100dvh;/s);
  assert.match(css, /\.app\s*\{[^}]*position:\s*relative;/s);
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

test('timeline playhead spans ruler and track grid', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.ruler\s*\{[^}]*position:\s*relative;/s);
  assert.match(css, /\.ruler-playhead,\s*\n\.playhead\s*\{[^}]*position:\s*absolute;/s);
  assert.match(css, /\.ruler-playhead,\s*\n\.playhead\s*\{[^}]*width:\s*2px;/s);
  assert.match(css, /\.ruler-playhead\s*\{[^}]*top:\s*0;/s);
  assert.match(css, /\.ruler-playhead\s*\{[^}]*bottom:\s*-1px;/s);
  assert.match(css, /\.playhead\s*\{[^}]*top:\s*0;/s);
  assert.match(css, /\.playhead\s*\{[^}]*bottom:\s*0;/s);
  assert.match(css, /\.playhead-hit\s*\{[^}]*width:\s*14px;/s);
  assert.match(css, /\.playhead-hit\s*\{[^}]*cursor:\s*ew-resize;/s);
  assert.match(css, /\.playhead-hit\s*\{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.timeline-col\.playhead-dragging\s*\{[^}]*cursor:\s*grabbing;/s);
});

test('editor resize handle overlays the workspace editor boundary', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.app\s*\{[^}]*grid-template-rows:\s*var\(--app-topbar-height\) minmax\(0,\s*1fr\) var\(--app-editor-height\);/s);
  assert.match(css, /\.editor-resizer\s*\{[^}]*position:\s*absolute;/s);
  assert.match(css, /\.editor-resizer\s*\{[^}]*right:\s*0;/s);
  assert.match(css, /\.editor-resizer\s*\{[^}]*bottom:\s*var\(--app-editor-height\);/s);
  assert.match(css, /\.editor-resizer\s*\{[^}]*height:\s*12px;/s);
  assert.match(css, /\.editor-resizer\s*\{[^}]*cursor:\s*ns-resize;/s);
  assert.match(css, /\.editor-resizer::before\s*\{[^}]*height:\s*1px;/s);
  assert.match(css, /\.editor-resizer-grip\s*\{[^}]*width:\s*44px;/s);
  assert.match(css, /\.editor-resizer-grip\s*\{[^}]*height:\s*4px;/s);
  assert.match(css, /\.editor-resizer-grip\s*\{[^}]*border-radius:\s*999px;/s);
  assert.match(css, /\.editor-resizer:hover \.editor-resizer-grip,\s*\n\.app\.editor-resizing \.editor-resizer-grip\s*\{/s);
  assert.match(css, /\.app\.editor-resizing\s*\{[^}]*user-select:\s*none;/s);
  assert.match(css, /\.app\.editor-resizing \.editor-resizer\s*\{[^}]*cursor:\s*ns-resize;/s);
});

test('track list rows align with timeline hover rows', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /--track-row-size:\s*minmax\(clamp\(48px,\s*7\.5vh,\s*74px\),\s*1fr\);/);
  assert.match(css, /--track-footer-height:\s*48px;/);
  assert.match(css, /\.tracks-col\s*\{[^}]*grid-template-rows:\s*48px minmax\(0,\s*1fr\) var\(--track-footer-height\);/s);
  assert.match(css, /\.timeline-col\s*\{[^}]*grid-template-rows:\s*48px minmax\(0,\s*1fr\) var\(--track-footer-height\);/s);
  assert.match(css, /\.timeline-footer-spacer\s*\{[^}]*min-height:\s*var\(--track-footer-height\);/s);
  assert.match(css, /\.timeline-footer-spacer\s*\{[^}]*border-top:\s*1px solid var\(--border-soft\);/s);
  assert.match(css, /\.tracks-list\s*\{[^}]*grid-template-rows:\s*repeat\(var\(--track-count,\s*4\),\s*var\(--track-row-size\)\);/s);
  assert.match(css, /\.tracks-list\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.grid-rows,\s*\n\.hover-rows\s*\{[^}]*grid-template-rows:\s*repeat\(var\(--track-count,\s*4\),\s*var\(--track-row-size\)\);/s);
  assert.match(css, /\.add-track\s*\{[^}]*position:\s*static;/s);
  assert.doesNotMatch(css, /\.add-track\s*\{[^}]*position:\s*absolute;/s);
  assert.doesNotMatch(css, /\.add-track\s*\{[^}]*bottom:/s);
  assert.match(css, /\.add-track-row\s*\{[^}]*position:\s*relative;/s);
  assert.match(css, /\.add-track-menu\s*\{[^}]*position:\s*absolute;/s);
  assert.match(css, /\.add-track-menu\s*\{[^}]*bottom:\s*calc\(100% - 4px\);/s);
  assert.doesNotMatch(css, /min-height:\s*74px;/);
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

test('track fill-empty clip button is compact and inherits track color', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.track-main-row\s*\{[^}]*grid-template-columns:\s*minmax\(76px,\s*1fr\) minmax\(0,\s*auto\);/s);
  assert.match(css, /\.track-select\s*\{[^}]*grid-template-columns:\s*38px minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.track-select\s*\{[^}]*min-width:\s*76px;/s);
  assert.match(css, /\.ic\s*\{[^}]*min-width:\s*32px;/s);
  assert.match(css, /\.ic\s*\{[^}]*flex:\s*0 0 32px;/s);
  assert.match(css, /\.fill-empty-clips\s*\{[^}]*height:\s*28px;/s);
  assert.match(css, /\.fill-empty-clips\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.fill-empty-clips\s*\{[^}]*max-width:\s*96px;/s);
  assert.match(css, /\.fill-empty-clips\s*\{[^}]*color:\s*var\(--track-ink,\s*var\(--ink-3\)\);/s);
  assert.match(css, /\.fill-empty-clips\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--track-color,\s*var\(--surface\)\)/s);
  assert.match(css, /\.fill-empty-clips-label\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.fill-empty-clips-label\s*\{[^}]*text-overflow:\s*ellipsis;/s);
  assert.match(css, /\.fill-empty-clips:hover:not\(:disabled\),\s*\n\.fill-empty-clips:focus-visible:not\(:disabled\)\s*\{/s);
  assert.match(css, /\.fill-empty-clips-icon\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*4px\);/s);
  assert.match(css, /\.fill-empty-clips-icon span\s*\{[^}]*background:\s*currentColor;/s);
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
  assert.match(css, /\.editor\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.editor-head\s*\{[^}]*min-height:\s*54px;/s);
  assert.match(css, /\.app:has\(\.editor\[data-screen-label="Chord Editor"\]:not\(\[data-picker="chord"\]\):not\(\[data-picker="groove"\]\)\)\s*\{[^}]*--app-editor-height:\s*clamp\(360px,\s*46vh,\s*430px\);/s);
  assert.match(css, /\.scale-rail\s*\{[^}]*grid-template-rows:\s*22px var\(--chord-cell-grid-height\) 22px;/s);
  assert.match(css, /\.scale-rail\s*\{[^}]*gap:\s*var\(--chord-beat-gap\);/s);
  assert.match(css, /\.scale-notes-viewport\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.scale-notes-viewport\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*grid-template-rows:\s*repeat\(36,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*min-height:\s*calc\(var\(--chord-cell-grid-height\) \* 3\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
  assert.match(css, /\.note-key\s*\{[^}]*min-height:\s*0;/s);
  assert.match(css, /\.beat-cells-viewport\s*\{[^}]*height:\s*var\(--chord-cell-grid-height\);/s);
  assert.match(css, /\.beat-cells-viewport\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*grid-template-rows:\s*repeat\(36,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*min-height:\s*calc\(var\(--chord-cell-grid-height\) \* 3\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*gap:\s*var\(--chord-cell-gap\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*padding:\s*var\(--chord-cell-padding\);/s);
  assert.doesNotMatch(css, /\.cell\.sustain/);
  assert.match(css, /\.chord-grid\s*\{[^}]*overflow-x:\s*auto;[^}]*overflow-y:\s*hidden;/s);
  assert.match(css, /\.chord-label-row\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(128px,\s*1fr\)\);/s);
  assert.match(css, /\.beat-number-row\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(128px,\s*1fr\)\);/s);
  assert.match(css, /\.cell\.added,\s*\.cell\.active\.added\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-chord\) 35%,\s*white\);/s);
  assert.doesNotMatch(css, /\.cell\.active\.added\s*\{[^}]*linear-gradient/s);
  assert.doesNotMatch(css, /--chord-extension:/);
  assert.doesNotMatch(css, /--chord-extension-ink:/);
  assert.doesNotMatch(css, /\.cell\.extension/);
});

test('melody editor mirrors the reference keyboard strip and scale picker layout', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.app:has\(\.editor\[data-screen-label="Melody Editor"\]:not\(\[data-picker="scale"\]\)\)\s*\{[^}]*--app-editor-height:\s*clamp\(360px,\s*46vh,\s*430px\);/s);
  assert.match(css, /\.app:has\(\.editor\[data-picker="scale"\]\)\s*\{[^}]*--app-editor-height:\s*clamp\(380px,\s*55vh,\s*560px\);/s);
  assert.match(css, /\.editor\[data-screen-label="Melody Editor"\]\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0,\s*1fr\);/s);
  assert.match(css, /\.editor\[data-screen-label="Melody Editor"\] \.clip-chip\s*\{[^}]*background:\s*var\(--c-lead\);/s);
  assert.match(css, /\.keyboard-strip\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.ks-keys\s*\{[^}]*grid-template-columns:\s*repeat\(13,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.ks-key\.playing\s*\{[^}]*background:\s*var\(--c-lead\);/s);
  assert.match(css, /\.melody-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(128px,\s*1fr\)\);/s);
  assert.match(css, /\.melody-cell\.active\s*\{[^}]*background:\s*var\(--c-lead\);/s);
  assert.match(css, /\.melody-note-key\.playing\s*\{[^}]*background:\s*var\(--c-lead\)/s);
  assert.match(css, /\.scale-picker\s*\{[^}]*position:\s*absolute;/s);
  assert.match(css, /\.sctpl-card\.selected\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-lead\) 20%,\s*var\(--surface\)\);/s);
});

test('bass editor mirrors the reference piano-roll and groove picker layout', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.app:has\(\.editor\[data-screen-label="Bass Editor"\]:not\(\[data-picker="groove"\]\)\)\s*\{[^}]*--app-editor-height:\s*clamp\(360px,\s*46vh,\s*430px\);/s);
  assert.match(css, /\.editor\[data-screen-label="Bass Editor"\] \.clip-chip\s*\{[^}]*background:\s*var\(--c-bass\);/s);
  assert.match(css, /\.scale-notes\s*\{[^}]*grid-template-rows:\s*repeat\(36,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.beat-cells\s*\{[^}]*grid-template-rows:\s*repeat\(36,\s*minmax\(0,\s*1fr\)\);/s);
  assert.doesNotMatch(css, /\.bass-scale-notes\s*\{[^}]*grid-template-rows:\s*repeat\(12,/s);
  assert.doesNotMatch(css, /\.bass-beat-cells\s*\{[^}]*grid-template-rows:\s*repeat\(12,/s);
  assert.match(css, /\.bass-note-key\.root\s*\{[^}]*color:\s*var\(--c-bass-ink\);/s);
  assert.match(css, /\.bass-note-key:hover\s*\{[^}]*background:\s*var\(--c-bass\);/s);
  assert.match(css, /\.bass-cell\.active\s*\{[^}]*background:\s*var\(--c-bass\);/s);
  assert.match(css, /\.bass-cell:hover\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-bass\) 60%,\s*white\);/s);
  assert.match(css, /\.gtpl-step\.hit-root\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(css, /\.gtpl-step\.hit-root::after\s*\{[^}]*bottom:\s*14%;/s);
  assert.match(css, /\.gtpl-step\.hit-root::after\s*\{[^}]*height:\s*32%;/s);
  assert.match(css, /\.gtpl-step\.hit-root\[data-len="8"\]::after\s*\{[^}]*width:\s*calc\(188% \+ 2px\);/s);
});

test('chord template picker has enough room and can scroll full card content', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.app:has\(\.editor\[data-picker="chord"\]\),\s*\n\.app:has\(\.editor\[data-picker="groove"\]\)\s*\{[^}]*--app-editor-height:\s*clamp\(380px,\s*55vh,\s*560px\);/s);
  assert.match(css, /\.tpl-body\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.tpl-list\s*\{[^}]*height:\s*auto;/s);
  assert.match(css, /\.tpl-list\s*\{[^}]*min-height:\s*100%;/s);
  assert.doesNotMatch(css, /\.tpl-body\s*\{[^}]*overflow:\s*hidden;/s);
});

test('groove template picker mirrors the reference secondary menu layout', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.btn-template-groove\s*\{[^}]*display:\s*inline-flex;/s);
  assert.match(css, /\.btn-template-groove-active\s*\{[^}]*display:\s*inline-flex;/s);
  assert.match(css, /\.btn-template-groove-active\s*\{[^}]*align-items:\s*center;/s);
  assert.match(css, /\.btn-template-groove-active\s*\{[^}]*justify-content:\s*center;/s);
  assert.match(css, /\.gtpl-picker\s*\{[^}]*grid-template-rows:\s*48px 1fr 52px;/s);
  assert.match(css, /\.gtpl-card\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.gtpl-rhythm-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\);/s);
  assert.match(css, /\.gtpl-beat\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\);/s);
  assert.match(css, /\.gtpl-step\.hit-block::after\s*\{/s);
  assert.match(css, /\.gtpl-step\.hit-arp::after\s*\{[^}]*height:\s*calc\(28% \+ var\(--h,\s*1\) \* 18%\);/s);
  assert.match(css, /\.gtpl-picker \.tpl-pager-btn:hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--ink\);/s);
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

test('tutorial preview panel floats above the workspace', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.tutorial-panel\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*width:\s*min\(360px,\s*calc\(100vw - 32px\)\);/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*height:\s*auto;/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*padding:\s*16px;/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*background:\s*oklch\(98% 0\.012 165 \/ 0\.84\);/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*backdrop-filter:\s*blur\(12px\);/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*border-radius:\s*8px;/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*font-family:\s*"Baloo 2",\s*"Nunito",\s*"Arial Rounded MT Bold",\s*"Avenir Next Rounded",\s*"Trebuchet MS",\s*"PingFang SC",\s*"Microsoft YaHei",\s*sans-serif;/s);
  assert.match(css, /\.tutorial-panel\s*\{[^}]*text-align:\s*center;/s);
  assert.match(css, /\.tutorial-panel-body\s*\{[^}]*justify-items:\s*center;/s);
  assert.match(css, /\.tutorial-panel p\s*\{[^}]*font-size:\s*15px;/s);
  assert.match(css, /\.tutorial-panel p\s*\{[^}]*font-weight:\s*800;/s);
  assert.match(css, /\.tutorial-panel p\s*\{[^}]*text-align:\s*center;/s);
  assert.match(css, /\.tutorial-panel-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /\.tutorial-panel-actions\s*\{[^}]*gap:\s*6px;/s);
  assert.match(css, /\.tutorial-panel-actions\s*\{[^}]*margin-top:\s*12px;/s);
  assert.match(css, /\.tutorial-primary,\s*\n\.tutorial-secondary,\s*\n\.tutorial-link\s*\{[^}]*min-height:\s*36px;/s);
  assert.match(css, /\.tutorial-primary,\s*\n\.tutorial-secondary,\s*\n\.tutorial-link\s*\{[^}]*border-radius:\s*999px;/s);
  assert.match(css, /\.tutorial-primary,\s*\n\.tutorial-secondary,\s*\n\.tutorial-link\s*\{[^}]*font-size:\s*13px;/s);
  assert.doesNotMatch(css, /\.tutorial-panel\s*\{[^}]*right:\s*0;/s);
  assert.doesNotMatch(css, /\.tutorial-panel\s*\{[^}]*height:\s*100dvh;/s);
  assert.match(css, /\.tutorial-panel\[data-placement="center"\]\s*\{[^}]*top:\s*50%;/s);
  assert.match(css, /\.tutorial-panel\[data-placement="center"\]\s*\{[^}]*left:\s*50%;/s);
  assert.match(css, /\.tutorial-panel\[data-placement="top"\]\s*\{[^}]*top:\s*calc\(var\(--app-topbar-height\) \+ 14px\);/s);
  assert.match(css, /\.tutorial-panel\[data-placement="editor"\]\s*\{[^}]*bottom:\s*calc\(var\(--app-editor-height\) \+ 14px\);/s);
  assert.match(css, /\.tutorial-target-active\s*\{[^}]*outline:\s*0;/s);
  assert.match(css, /\.tutorial-target-active\s*\{[^}]*box-shadow:\s*inset 0 0 0 2px/s);
  assert.doesNotMatch(css, /\.tutorial-target-active\s*\{[^}]*0 0 0 6px white/s);
  assert.doesNotMatch(css, /\.tutorial-target-active\s*\{[^}]*0 0 0 18px/s);
  assert.match(css, /\.tutorial-target-active\s*\{[^}]*animation:\s*tutorial-target-pulse/s);
  assert.match(css, /\.app:has\(\.tutorial-target-active\)::before\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.app:has\(\.tutorial-target-active\)::before\s*\{[^}]*background:\s*color-mix\(in oklab,\s*black 34%,\s*transparent\);/s);
  assert.match(css, /\.app:has\(\.tutorial-target-active\)::before\s*\{[^}]*z-index:\s*50;/s);
  assert.match(css, /\.tutorial-target-active::after\s*\{[^}]*content:\s*"当前步骤";/s);
  assert.match(css, /\.tutorial-target-active::after\s*\{[^}]*font-size:\s*13px;/s);
  assert.match(css, /@keyframes tutorial-target-pulse/);
});

test('tutorial task targets make allowed cells and bars obvious', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

  assert.match(css, /\.tutorial-cell-target\s*\{[^}]*animation:\s*tutorial-cell-pulse/s);
  assert.match(css, /\.tutorial-cell-target\s*\{[^}]*outline:\s*3px solid/s);
  assert.match(css, /\.tutorial-cell-target\s*\{[^}]*box-shadow:\s*0 0 0 4px/s);
  assert.match(css, /\.tutorial-cell-source\s*\{[^}]*cursor:\s*grab;/s);
  assert.match(css, /\.tutorial-cell-completed\s*\{[^}]*box-shadow:\s*inset 0 0 0 2px/s);
  assert.match(css, /\.drum-step\.tutorial-locked:not\(\.active\):not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*opacity:\s*0\.18;/s);
  assert.match(css, /\.drum-step\.tutorial-locked:not\(\.active\):not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--surface\) 45%,\s*var\(--ink-4\)\);/s);
  assert.match(css, /\.drum-step\.tutorial-locked:not\(\.active\):not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*border-color:\s*color-mix\(in oklab,\s*var\(--border\) 42%,\s*var\(--ink-4\)\);/s);
  assert.match(css, /\.drum-step\.tutorial-locked:not\(\.active\):not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*filter:\s*grayscale\(1\) saturate\(0\.2\);/s);
  assert.match(css, /\.drum-step\.tutorial-locked:not\(\.active\):not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*transform:\s*none;/s);
  assert.doesNotMatch(css, /\.drum-step\.tutorial-locked:not\(\.tutorial-cell-target\):not\(\.tutorial-cell-source\)\s*\{[^}]*opacity:\s*0\.18;/s);
  assert.match(css, /\.tutorial-bar-target\s*\{[^}]*animation:\s*tutorial-bar-pulse/s);
  assert.match(css, /\.tutorial-bar-target\s*\{[^}]*outline:\s*3px solid/s);
  assert.match(css, /\.tutorial-bar-target\s*\{[^}]*box-shadow:\s*inset 0 0 0 4px/s);
  assert.match(css, /\.tutorial-bar-completed\s*\{[^}]*box-shadow:\s*inset 0 0 0 2px/s);
  assert.match(css, /\.playhead\.tutorial-playhead-target\s*\{[^}]*animation:\s*tutorial-playhead-pulse/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target\s*\{[^}]*z-index:\s*12;/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target\s*\{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target\s*\{[^}]*animation:\s*none;/s);
  assert.match(css, /\.playhead\.tutorial-playhead-target\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-drums-ink\) 86%,\s*white\);/s);
  assert.match(css, /\.playhead\.tutorial-playhead-target\s*\{[^}]*box-shadow:/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target::after,\s*\n\.ruler-playhead\.tutorial-playhead-completed::after\s*\{[^}]*z-index:\s*13;[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*border-radius:\s*50%;/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target::after\s*\{[^}]*background:\s*color-mix\(in oklab,\s*var\(--c-drums-ink\) 88%,\s*black\);/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target::after\s*\{[^}]*border:\s*2px solid color-mix\(in oklab,\s*white 90%,\s*transparent\);/s);
  assert.match(css, /\.ruler-playhead\.tutorial-playhead-target::after\s*\{[^}]*box-shadow:[^}]*0 0 14px/s);
  assert.doesNotMatch(css, /\.playhead-hit\.tutorial-playhead-target/);
  assert.doesNotMatch(css, /\.ruler-playhead\.tutorial-playhead-target::before/);
  assert.doesNotMatch(css, /\.ruler-playhead\.tutorial-playhead-completed::before/);
  assert.doesNotMatch(css, /\.playhead\.tutorial-playhead-target::after/);
  assert.doesNotMatch(css, /\.tutorial-playhead-target\s*\{[^}]*outline:\s*3px solid/s);
  assert.match(css, /@keyframes tutorial-cell-pulse/);
  assert.match(css, /@keyframes tutorial-bar-pulse/);
  assert.match(css, /@keyframes tutorial-playhead-pulse/);
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
