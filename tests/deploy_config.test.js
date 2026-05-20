import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import viteConfig from '../vite.config.js';

test('GitHub Pages build scopes asset URLs to the arranger-demo project path', () => {
  assert.equal(viteConfig.base, '/arranger-demo/');
});

test('index declares a project-scoped favicon for GitHub Pages', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="%BASE_URL%favicon\.svg" \/>/);
  assert.equal(existsSync('public/favicon.svg'), true);
});
