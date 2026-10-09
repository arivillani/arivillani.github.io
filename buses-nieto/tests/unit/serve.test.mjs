import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveSafePath, securityHeaders } from '../../scripts/serve.mjs';

const root = path.resolve('site');

test('resolveSafePath maps "/" to index.html inside the root', () => {
  assert.equal(resolveSafePath(root, '/'), path.join(root, 'index.html'));
});

test('resolveSafePath keeps nested paths inside the root', () => {
  assert.equal(resolveSafePath(root, '/css/site.css?v=1'), path.join(root, 'css', 'site.css'));
});

test('resolveSafePath rejects path traversal, encoded or not', () => {
  for (const url of ['/../package.json', '/%2e%2e/package.json', '/css/../../.git/config', '/..%2f..%2fetc/passwd']) {
    assert.equal(resolveSafePath(root, url), null, url);
  }
});

test('resolveSafePath rejects null bytes and malformed encodings', () => {
  assert.equal(resolveSafePath(root, '/index.html%00.js'), null);
  assert.equal(resolveSafePath(root, '/%E0%A4%A'), null);
});

test('securityHeaders sends the same hardening the pages declare', () => {
  const headers = securityHeaders();
  assert.match(headers['Content-Security-Policy'], /default-src 'none'/);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
});
