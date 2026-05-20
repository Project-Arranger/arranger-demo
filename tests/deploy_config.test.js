import assert from 'node:assert/strict';
import { test } from 'node:test';
import viteConfig from '../vite.config.js';

test('GitHub Pages build scopes asset URLs to the arranger-demo project path', () => {
  assert.equal(viteConfig.base, '/arranger-demo/');
});
