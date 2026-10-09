import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessRisk } from '../../scripts/rdd-assess.mjs';

test('docs, specs, receipts and binary assets are passive with no review lens', () => {
  const result = assessRisk(['buses-nieto/sdd/buses-nieto-mvp.md', 'buses-nieto/site/img/units/a/01.webp', 'buses-nieto/site/fonts/barlow-400.woff2']);
  assert.equal(result.tier, 'passive');
  assert.deepEqual(result.lenses, []);
});

test('styles, data and tests are medium with one focus lens', () => {
  const result = assessRisk(['buses-nieto/site/css/site.css', 'buses-nieto/tests/unit/x.test.mjs']);
  assert.equal(result.tier, 'medium');
  assert.equal(result.lenses.length, 1);
});

test('site code, workflows, dependencies and the dev server are high with the 4R lenses', () => {
  for (const file of ['buses-nieto/site/js/catalog.js', '.github/workflows/buses-nieto.yml', 'buses-nieto/package-lock.json', 'buses-nieto/scripts/serve.mjs']) {
    const result = assessRisk([file]);
    assert.equal(result.tier, 'high', file);
    assert.deepEqual(result.lenses, ['Risk', 'Resilience', 'Readability', 'Reliability']);
  }
});

test('an HTML change that touches the CSP is high even though HTML is otherwise medium', () => {
  assert.equal(assessRisk(['buses-nieto/site/index.html']).tier, 'medium');
  const diff = '+<meta http-equiv="Content-Security-Policy" content="default-src *">';
  assert.equal(assessRisk(['buses-nieto/site/index.html'], { diff }).tier, 'high');
});

test('the tier is the highest of all changed files and reasons name the files', () => {
  const result = assessRisk(['buses-nieto/README.md', 'buses-nieto/site/js/format.js']);
  assert.equal(result.tier, 'high');
  assert.ok(result.reasons.some((r) => r.includes('site/js/format.js')));
});

test('an empty change is passive', () => {
  assert.equal(assessRisk([]).tier, 'passive');
});
