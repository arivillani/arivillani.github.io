import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, toWhatsAppNumber, unitTitle } from '../../site/js/format.js';

test('formatPrice shows dollars the way the flyer does', () => {
  assert.equal(formatPrice({ currency: 'USD', amount: 90000 }), 'U$S 90.000');
});

test('formatPrice shows pesos with es-AR thousands separators', () => {
  assert.equal(formatPrice({ currency: 'ARS', amount: 45000000 }), '$ 45.000.000');
});

test('formatPrice without a price asks to enquire', () => {
  assert.equal(formatPrice(null), 'Consultar');
});

test('toWhatsAppNumber turns Argentine mobile numbers into wa.me digits', () => {
  assert.equal(toWhatsAppNumber('3549 442500'), '5493549442500');
  assert.equal(toWhatsAppNumber('11 2511 3132'), '5491125113132');
  assert.equal(toWhatsAppNumber('+54 9 11 2511-3132'), '5491125113132');
});

test('toWhatsAppNumber rejects numbers that are not 10 local digits', () => {
  assert.throws(() => toWhatsAppNumber('12345'), /teléfono/i);
});

test('unitTitle joins chassis brand, body and optional model', () => {
  assert.equal(unitTitle({ brand: 'Scania', body: 'Metalsur' }), 'Scania Metalsur');
  assert.equal(unitTitle({ brand: 'Mercedes-Benz', body: 'Saldivia', model: 'LO 915' }), 'Mercedes-Benz Saldivia LO 915');
});
