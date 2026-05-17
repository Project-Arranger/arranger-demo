import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

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
  assert.match(css, /\.clip\s*\{[^}]*width:\s*calc\(100% \/ var\(--bars\) - 20px\);/s);
  assert.match(css, /\.clip\s*\{[^}]*min-width:\s*0;/s);
  assert.match(css, /\.add-clip\s*\{[^}]*left:\s*calc\(100% \/ var\(--bars\) \* 1\.5\);/s);
  assert.match(css, /\.add-clip\s*\{[^}]*transform:\s*translate\(-50%, -50%\);/s);
  assert.doesNotMatch(css, /var\(--bars\) \* 1\.55/);
});
