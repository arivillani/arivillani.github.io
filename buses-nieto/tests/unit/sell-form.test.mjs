import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSellForm, buildSellMessage } from '../../site/js/sell-form.js';

const valid = {
  nombre: 'Juan Pérez',
  telefono: '3549 44-2500',
  unidad: 'Mercedes-Benz O500 Italbus',
  anio: '2012',
  asientos: '46',
  mensaje: 'Service al día.',
};
const opts = { currentYear: 2026 };

test('validateSellForm accepts a complete form', () => {
  assert.deepEqual(validateSellForm(valid, opts), { valid: true, errors: {} });
});

test('validateSellForm explains each invalid field in Spanish', () => {
  const { valid: ok, errors } = validateSellForm(
    { nombre: ' ', telefono: '12ab', unidad: '', anio: '1970', asientos: '0', mensaje: 'x'.repeat(501) },
    opts,
  );
  assert.equal(ok, false);
  assert.deepEqual(errors, {
    nombre: 'Ingresá tu nombre.',
    telefono: 'Ingresá un teléfono válido, con característica (8 a 15 números).',
    unidad: 'Indicá marca y modelo de la unidad.',
    anio: 'Ingresá un año entre 1980 y 2027.',
    asientos: 'Ingresá la cantidad de asientos (1 a 90).',
    mensaje: 'El mensaje no puede superar los 500 caracteres.',
  });
});

test('buildSellMessage summarises the form for WhatsApp', () => {
  assert.equal(
    buildSellMessage(valid),
    [
      'Hola Buses Nieto, quiero vender mi unidad.',
      'Nombre: Juan Pérez',
      'Teléfono: 3549 44-2500',
      'Unidad: Mercedes-Benz O500 Italbus',
      'Año: 2012',
      'Asientos: 46',
      'Comentarios: Service al día.',
    ].join('\n'),
  );
});

test('buildSellMessage trims, drops control characters and skips an empty comment', () => {
  const text = buildSellMessage({ ...valid, nombre: '  Ana\u0000\u0007 ', mensaje: '   ' });
  assert.match(text, /^Nombre: Ana$/m);
  assert.doesNotMatch(text, /Comentarios/);
});
