import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUnit, parseUnits, filterUnits, sortUnits, brandsOf } from '../../site/js/catalog.js';
import { scania, unit } from '../fixtures/units.mjs';

const opts = { currentYear: 2026 };

test('validateUnit accepts the flyer unit and keeps only known fields', () => {
  const result = validateUnit({ ...scania, onclick: 'alert(1)' }, opts);
  assert.equal(result.id, 'scania-metalsur-2014');
  assert.deepEqual(result.price, { currency: 'USD', amount: 90000 });
  assert.equal('onclick' in result, false);
});

test('validateUnit rejects entries outside the schema', () => {
  const bad = [
    unit({ id: 'Con Espacios' }),
    unit({ type: 'camion' }),
    unit({ year: 1975 }),
    unit({ year: 2028 }),
    unit({ seats: 0 }),
    unit({ price: { currency: 'EUR', amount: 1 } }),
    unit({ price: { currency: 'USD', amount: -5 } }),
    unit({ brand: '' }),
    unit({ features: 'Cama suite' }),
    unit({ status: 'reservada-xx' }),
  ];
  for (const raw of bad) assert.equal(validateUnit(raw, opts), null, JSON.stringify(raw));
});

test('validateUnit only accepts relative image paths inside img/', () => {
  for (const image of ['https://evil.example/x.webp', 'javascript:alert(1)', 'img/../../secret.webp', '/img/a.webp', 'img/a.svg', 'img/a b.webp']) {
    assert.equal(validateUnit(unit({ images: [image] }), opts), null, image);
  }
});

test('parseUnits keeps valid units and counts the rejected ones', () => {
  const { units, rejected } = parseUnits([scania, unit({ id: 'x', type: 'tren' }), 'basura'], opts);
  assert.equal(units.length, 1);
  assert.equal(rejected, 2);
  assert.deepEqual(parseUnits({ not: 'an array' }, opts), { units: [], rejected: 0 });
});

test('parseUnits drops repeated ids so a card never opens another unit', () => {
  const { units, rejected } = parseUnits([scania, unit({ seats: 50 })], opts);
  assert.equal(units.length, 1);
  assert.equal(units[0].seats, 43);
  assert.equal(rejected, 1);
});

const catalog = [
  unit(),
  unit({ id: 'mb-saldivia-2010', type: 'minibus', brand: 'Mercedes-Benz', body: 'Saldivia', year: 2010, seats: 24, fuel: 'Diésel', price: { currency: 'USD', amount: 32000 }, featured: false }),
  unit({ id: 'sprinter-2019', type: 'combi', brand: 'Mercedes-Benz', body: 'Sprinter', year: 2019, seats: 19, price: null, featured: false }),
  unit({ id: 'volvo-2008', brand: 'Volvo', body: 'Marcopolo', year: 2008, price: { currency: 'USD', amount: 55000 }, status: 'vendida', featured: false }),
];

test('filterUnits shows units for sale (available or reserved) by default and filters by type', () => {
  assert.deepEqual(filterUnits(catalog, {}).map((u) => u.id), ['scania-metalsur-2014', 'mb-saldivia-2010', 'sprinter-2019']);
  const reserved = unit({ id: 'reservada-1', status: 'reservada' });
  assert.deepEqual(filterUnits([reserved], {}).map((u) => u.id), ['reservada-1']);
  assert.deepEqual(filterUnits(catalog, { type: 'minibus' }).map((u) => u.id), ['mb-saldivia-2010']);
  assert.deepEqual(filterUnits(catalog, { status: 'vendida' }).map((u) => u.id), ['volvo-2008']);
});

test('filterUnits filters by brand, minimum year and maximum dollar price', () => {
  assert.deepEqual(filterUnits(catalog, { brand: 'mercedes-benz' }).map((u) => u.id), ['mb-saldivia-2010', 'sprinter-2019']);
  assert.deepEqual(filterUnits(catalog, { minYear: 2014 }).map((u) => u.id), ['scania-metalsur-2014', 'sprinter-2019']);
  assert.deepEqual(filterUnits(catalog, { maxPriceUsd: 50000 }).map((u) => u.id), ['mb-saldivia-2010']);
});

test('filterUnits text search ignores case and accents', () => {
  assert.deepEqual(filterUnits(catalog, { q: 'METALSUR' }).map((u) => u.id), ['scania-metalsur-2014']);
  assert.equal(filterUnits(catalog, { q: 'diesel' }).length, 3);
  assert.deepEqual(filterUnits(catalog, { q: 'cama suite scania' }).map((u) => u.id), ['scania-metalsur-2014']);
});

test('sortUnits puts featured units first by default, then the most recent', () => {
  assert.deepEqual(sortUnits(catalog).map((u) => u.id), ['scania-metalsur-2014', 'sprinter-2019', 'mb-saldivia-2010', 'volvo-2008']);
  assert.deepEqual(sortUnits(catalog, 'featured'), sortUnits(catalog));
});

test('sortUnits orders by year or price, leaves unpriced units last and does not mutate', () => {
  const copy = [...catalog];
  assert.deepEqual(sortUnits(catalog, 'recent').map((u) => u.year), [2019, 2014, 2010, 2008]);
  assert.deepEqual(sortUnits(catalog, 'price-asc').map((u) => u.id), ['mb-saldivia-2010', 'volvo-2008', 'scania-metalsur-2014', 'sprinter-2019']);
  assert.deepEqual(sortUnits(catalog, 'price-desc').map((u) => u.id), ['scania-metalsur-2014', 'volvo-2008', 'mb-saldivia-2010', 'sprinter-2019']);
  assert.deepEqual(catalog, copy);
});

test('brandsOf lists each brand once, sorted', () => {
  assert.deepEqual(brandsOf(catalog), ['Mercedes-Benz', 'Scania', 'Volvo']);
});
