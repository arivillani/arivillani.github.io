import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { el, icon, isSafeHref } from '../../site/js/dom.js';

// Minimal stand-in for the browser DOM: records attributes and children, and fails
// loudly if anything tries to parse markup through innerHTML/outerHTML.
class FakeNode {
  constructor(tag, namespace = null) {
    this.tag = tag;
    this.namespace = namespace;
    this.attributes = {};
    this.children = [];
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  set innerHTML(_) {
    throw new Error('innerHTML no debe usarse');
  }
  set outerHTML(_) {
    throw new Error('outerHTML no debe usarse');
  }
}

beforeEach(() => {
  globalThis.document = {
    createElement: (tag) => new FakeNode(tag),
    createElementNS: (namespace, tag) => new FakeNode(tag, namespace),
  };
});

test('el sets attributes, maps className to class and skips empty values', () => {
  const node = el('a', { className: 'btn', href: '#unidades', hidden: true, title: undefined, disabled: false, 'data-x': null });
  assert.deepEqual(node.attributes, { class: 'btn', href: '#unidades', hidden: '' });
});

test('el appends text as-is and never routes it through markup parsing', () => {
  const node = el('p', {}, '<img src=x onerror=alert(1)>', null, false, ['a', undefined, 'b']);
  assert.deepEqual(node.children, ['<img src=x onerror=alert(1)>', 'a', 'b']);
});

test('el refuses event handlers, inline styles, srcdoc and formaction', () => {
  for (const name of ['onclick', 'ONERROR', 'style', 'srcdoc', 'formaction']) {
    assert.throws(() => el('div', { [name]: 'x' }), /Atributo no permitido/, name);
  }
});

test('el refuses links outside the allowlist', () => {
  assert.throws(() => el('a', { href: 'javascript:alert(1)' }), /Enlace no permitido/);
});

test('icon builds an aria-hidden SVG that uses a sprite symbol', () => {
  const svg = icon('i-wa');
  assert.equal(svg.namespace, 'http://www.w3.org/2000/svg');
  assert.equal(svg.attributes['aria-hidden'], 'true');
  assert.equal(svg.children[0].tag, 'use');
  assert.equal(svg.children[0].attributes.href, '#i-wa');
});

test('isSafeHref allows in-page anchors and wa.me chats only', () => {
  for (const href of ['#unidades', '#', 'https://wa.me/5493549442500', 'https://wa.me/5493549442500?text=Hola%20Buses']) {
    assert.equal(isSafeHref(href), true, href);
  }
  for (const href of ['javascript:alert(1)', 'https://evil.example', 'https://wa.me.evil.example/1', 'http://wa.me/5493549442500', "https://wa.me/5493549442500?text=a'b", 'https://wa.me/5493549442500?text=a b']) {
    assert.equal(isSafeHref(href), false, href);
  }
});
