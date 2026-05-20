import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('GitHub Pages workflow deploys the Vite dist artifact', async () => {
  const workflow = await readFile('.github/workflows/jekyll-gh-pages.yml', 'utf8');

  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /\bnpm ci\b/);
  assert.match(workflow, /\bnpm run build\b/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /path:\s*\.\/dist/);
  assert.doesNotMatch(workflow, /actions\/jekyll-build-pages/);
});
