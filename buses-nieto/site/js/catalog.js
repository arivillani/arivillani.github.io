// Catalog data rules: units.json is validated against an allowlist schema before
// anything is rendered, then filtered and sorted without mutating the source list.
import { unitTitle } from './format.js';

export const UNIT_TYPES = { bus: 'Bus', minibus: 'Minibús', combi: 'Combi' };
const STATUSES = ['disponible', 'reservada', 'vendida'];
const CURRENCIES = ['USD', 'ARS'];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Relative raster images under img/ only: no schemes, no absolute paths, no "..".
const IMAGE_PATTERN = /^img\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:webp|jpg|png)$/;

const INVALID = Symbol('invalid');

function requiredText(value, max) {
  if (typeof value !== 'string') return INVALID;
  const text = value.trim();
  return text && text.length <= max ? text : INVALID;
}

function optionalText(value, max) {
  return value === undefined ? undefined : requiredText(value, max);
}

function integer(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max ? value : INVALID;
}

function price(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || !CURRENCIES.includes(value.currency)) return INVALID;
  const amount = integer(value.amount, 1, 1e11);
  return amount === INVALID ? INVALID : { currency: value.currency, amount };
}

function list(value, maxItems, check) {
  if (!Array.isArray(value) || value.length > maxItems) return INVALID;
  const items = value.map(check);
  return items.includes(INVALID) ? INVALID : items;
}

/** Returns a clean unit with only known fields, or null if any field breaks the schema. */
export function validateUnit(raw, { currentYear = new Date().getFullYear() } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const unit = {
    id: typeof raw.id === 'string' && raw.id.length <= 60 && ID_PATTERN.test(raw.id) ? raw.id : INVALID,
    type: Object.hasOwn(UNIT_TYPES, raw.type) ? raw.type : INVALID,
    brand: requiredText(raw.brand, 40),
    body: requiredText(raw.body, 40),
    model: optionalText(raw.model, 40),
    year: integer(raw.year, 1980, currentYear + 1),
    seats: integer(raw.seats, 1, 90),
    seatType: optionalText(raw.seatType, 40),
    fuel: optionalText(raw.fuel, 20),
    km: raw.km === undefined ? undefined : integer(raw.km, 0, 5_000_000),
    features: list(raw.features ?? [], 8, (f) => requiredText(f, 40)),
    price: price(raw.price),
    financing: raw.financing === true,
    tradeIn: raw.tradeIn === true,
    status: STATUSES.includes(raw.status) ? raw.status : INVALID,
    featured: raw.featured === true,
    demo: raw.demo === true,
    images: list(raw.images ?? [], 12, (p) => (typeof p === 'string' && IMAGE_PATTERN.test(p) ? p : INVALID)),
  };
  if (Object.values(unit).includes(INVALID)) return null;
  for (const key of Object.keys(unit)) if (unit[key] === undefined) delete unit[key];
  return unit;
}

export function parseUnits(data, options) {
  if (!Array.isArray(data)) return { units: [], rejected: 0 };
  const units = data.map((raw) => validateUnit(raw, options)).filter(Boolean);
  return { units, rejected: data.length - units.length };
}

const normalize = (text) => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const isSet = (value) => value !== undefined && value !== null && value !== '';
const usdAmount = (unit) => (unit.price?.currency === 'USD' ? unit.price.amount : null);

function haystack(unit) {
  return normalize([unitTitle(unit), UNIT_TYPES[unit.type], unit.year, unit.fuel, unit.seatType, ...unit.features].filter(Boolean).join(' '));
}

export function filterUnits(units, { type, brand, minYear, maxPriceUsd, q, status = 'disponible' } = {}) {
  const words = isSet(q) ? normalize(q).split(/\s+/).filter(Boolean) : [];
  return units.filter((unit) => {
    if (unit.status !== status) return false;
    if (isSet(type) && unit.type !== type) return false;
    if (isSet(brand) && normalize(unit.brand) !== normalize(brand)) return false;
    if (Number.isFinite(minYear) && unit.year < minYear) return false;
    if (Number.isFinite(maxPriceUsd)) {
      const amount = usdAmount(unit);
      if (amount === null || amount > maxPriceUsd) return false;
    }
    if (words.length) {
      const text = haystack(unit);
      if (!words.every((word) => text.includes(word))) return false;
    }
    return true;
  });
}

const byPrice = (direction) => (a, b) => {
  const pa = usdAmount(a);
  const pb = usdAmount(b);
  if (pa === null || pb === null) return (pa === null) - (pb === null);
  return direction * (pa - pb);
};

const ORDERS = {
  featured: (a, b) => b.featured - a.featured || b.year - a.year,
  recent: (a, b) => b.year - a.year,
  'price-asc': byPrice(1),
  'price-desc': byPrice(-1),
};

export function sortUnits(units, order = 'featured') {
  return [...units].sort(ORDERS[order] ?? ORDERS.featured);
}

export function brandsOf(units) {
  return [...new Set(units.map((unit) => unit.brand))].sort((a, b) => a.localeCompare(b, 'es'));
}
