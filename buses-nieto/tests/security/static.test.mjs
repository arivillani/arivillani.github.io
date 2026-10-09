// Static security gate over the published files (S7). SITE_DIR lets the suite be
// pointed at a mutated copy to prove each check actually catches a violation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { PAGE_CSP } from '../../scripts/security-policy.mjs';
import { parseUnits } from '../../site/js/catalog.js';

const SITE = path.resolve(process.env.SITE_DIR ?? 'site');
const ALLOWED_EXTERNAL_HOSTS = ['wa.me'];

const filesUnder = (dir, ext) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, f));

const pages = filesUnder(SITE, '.html').map((file) => ({ file: path.relative(SITE, file), html: readFileSync(file, 'utf8') }));
const scripts = filesUnder(path.join(SITE, 'js'), '.js').map((file) => ({ file: path.relative(SITE, file), code: readFileSync(file, 'utf8') }));
const styles = filesUnder(path.join(SITE, 'css'), '.css').map((file) => ({ file: path.relative(SITE, file), css: readFileSync(file, 'utf8') }));

function tags(html) {
  const found = [];
  for (const match of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const attributes = {};
    for (const attr of match[2].matchAll(/([^\s=/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attributes[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
    }
    found.push({ name: match[1].toLowerCase(), attributes });
  }
  return found;
}

test('there are pages to check', () => {
  assert.ok(pages.length >= 2, 'se esperaban index.html y terminos.html');
});

for (const { file, html } of pages) {
  const all = tags(html);
  const meta = (predicate) => all.filter((t) => t.name === 'meta' && predicate(t.attributes));

  test(`${file}: declares exactly the shared CSP`, () => {
    const csp = meta((a) => a['http-equiv']?.toLowerCase() === 'content-security-policy');
    assert.equal(csp.length, 1);
    assert.equal(csp[0].attributes.content, PAGE_CSP);
    assert.doesNotMatch(PAGE_CSP, /unsafe-inline|unsafe-eval|https?:|\*/);
  });

  test(`${file}: sets a referrer policy and stays out of search engines while in dev`, () => {
    assert.equal(meta((a) => a.name === 'referrer')[0]?.attributes.content, 'strict-origin-when-cross-origin');
    assert.match(meta((a) => a.name === 'robots')[0]?.attributes.content ?? '', /noindex/);
  });

  test(`${file}: has no inline scripts, inline styles or event handler attributes`, () => {
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'script inline');
    assert.doesNotMatch(html, /<style[\s>]/i, 'bloque <style>');
    for (const tag of all) {
      for (const name of Object.keys(tag.attributes)) {
        assert.ok(name !== 'style', `atributo style en <${tag.name}>`);
        assert.ok(!name.startsWith('on'), `handler ${name} en <${tag.name}>`);
      }
    }
  });

  test(`${file}: loads every script, style, font and image from the site itself`, () => {
    for (const tag of all) {
      for (const name of ['src', 'srcset', 'poster', 'data']) {
        const value = tag.attributes[name];
        if (value !== undefined) assert.doesNotMatch(value, /^(?:[a-z]+:|\/\/)/i, `<${tag.name} ${name}="${value}">`);
      }
      if (tag.name === 'link') assert.doesNotMatch(tag.attributes.href ?? '', /^(?:[a-z]+:|\/\/)/i, `<link href="${tag.attributes.href}">`);
    }
  });

  test(`${file}: external links are https to allowed hosts and open isolated`, () => {
    for (const tag of all.filter((t) => t.name === 'a' && /^[a-z]+:|^\/\//i.test(t.attributes.href ?? ''))) {
      const { href, target, rel = '' } = tag.attributes;
      const url = new URL(href);
      assert.equal(url.protocol, 'https:', href);
      assert.ok(ALLOWED_EXTERNAL_HOSTS.includes(url.hostname), `host no permitido: ${href}`);
      assert.equal(target, '_blank', href);
      assert.ok(rel.split(/\s+/).includes('noopener') && rel.split(/\s+/).includes('noreferrer'), `rel incompleto: ${href}`);
    }
  });

  test(`${file}: every same-page anchor points to an existing id`, () => {
    const ids = new Set(all.map((t) => t.attributes.id).filter(Boolean));
    for (const tag of all.filter((t) => t.name === 'a' && t.attributes.href?.startsWith('#') && t.attributes.href.length > 1)) {
      assert.ok(ids.has(tag.attributes.href.slice(1)), `ancla rota: ${tag.attributes.href}`);
    }
  });
}

for (const { file, code } of scripts) {
  test(`${file}: uses no HTML-injection or code-evaluation sinks`, () => {
    const banned = /\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML|createContextualFragment|document\.write|\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['"`]|setInterval\s*\(\s*['"`]/;
    assert.doesNotMatch(code, banned);
  });
}

for (const { file, css } of styles) {
  test(`${file}: imports nothing from other origins`, () => {
    assert.doesNotMatch(css, /@import|url\(\s*["']?(?:[a-z]+:|\/\/)/i);
  });
}

for (const file of filesUnder(SITE, '.svg')) {
  test(`${path.relative(SITE, file)}: is inert markup with no script, handlers or external references`, () => {
    const svg = readFileSync(file, 'utf8');
    assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+\s*=|javascript:/i);
    for (const ref of svg.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']*)["']/g)) {
      assert.match(ref[1], /^#/, `referencia externa: ${ref[1]}`);
    }
  });
}

test('data/units.json passes the schema and every photo exists', () => {
  const data = JSON.parse(readFileSync(path.join(SITE, 'data', 'units.json'), 'utf8'));
  assert.ok(Array.isArray(data), 'units.json debe ser una lista');
  const { units, rejected } = parseUnits(data);
  assert.equal(rejected, 0);
  assert.equal(new Set(units.map((u) => u.id)).size, units.length, 'ids repetidos');
  for (const unit of units) {
    for (const image of unit.images) assert.ok(existsSync(path.join(SITE, image)), `falta ${image}`);
  }
});
