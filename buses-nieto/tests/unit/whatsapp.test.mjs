import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppUrl, unitInquiryMessage } from '../../site/js/whatsapp.js';
import { unit } from '../fixtures/units.mjs';
import { isSafeHref } from '../../site/js/dom.js';

test('buildWhatsAppUrl builds an encoded wa.me link', () => {
  assert.equal(
    buildWhatsAppUrl('5493549442500', 'Hola, ¿qué tal?'),
    'https://wa.me/5493549442500?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F',
  );
});

test('buildWhatsAppUrl without text links straight to the chat', () => {
  assert.equal(buildWhatsAppUrl('5491125113132'), 'https://wa.me/5491125113132');
});

test('buildWhatsAppUrl refuses anything but digits as the number', () => {
  assert.throws(() => buildWhatsAppUrl('549354/evil', 'x'), /número/i);
});

test('unitInquiryMessage names the unit, its year and its id', () => {
  assert.equal(
    unitInquiryMessage(unit()),
    'Hola Buses Nieto, me interesa la unidad Scania Metalsur 2014 (scania-metalsur-2014).',
  );
});

test('unit text cannot inject extra query parameters into the link', () => {
  const url = new URL(buildWhatsAppUrl('5493549442500', unitInquiryMessage(unit({ brand: 'A&text=x#frag' }))));
  assert.equal(url.searchParams.getAll('text').length, 1);
  assert.equal(url.hash, '');
  assert.match(url.searchParams.get('text'), /A&text=x#frag Metalsur/);
});

test('buildWhatsAppUrl encodes apostrophes so names like O\'Higgins still produce an allowed link', () => {
  const url = buildWhatsAppUrl('5493549442500', unitInquiryMessage(unit({ model: "O'500 RS" })));
  assert.doesNotMatch(url, /'/);
  assert.equal(isSafeHref(url), true);
  assert.match(new URL(url).searchParams.get('text'), /O'500 RS/);
});
