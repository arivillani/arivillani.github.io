import { parseUnits, filterUnits, sortUnits, brandsOf } from './catalog.js';
import { renderUnitCard, renderUnitDetail, showPhoto } from './render.js';
import { validateSellForm, buildSellMessage } from './sell-form.js';
import { buildWhatsAppUrl } from './whatsapp.js';
import { PRIMARY_WHATSAPP } from './config.js';
import { el } from './dom.js';

document.documentElement.classList.replace('no-js', 'js');

const $ = (selector) => document.querySelector(selector);
const state = { units: [], openUnit: null, opener: null };

const filtersForm = $('#filters');
const dialog = $('#unit-dialog');
const dialogContent = $('#unit-dialog-content');

function readFilters() {
  const data = new FormData(filtersForm);
  const number = (key) => (data.get(key) ? Number(data.get(key)) : undefined);
  return {
    type: data.get('type'),
    brand: data.get('brand'),
    minYear: number('minYear'),
    maxPriceUsd: number('maxPriceUsd'),
    q: String(data.get('q') ?? '').slice(0, 60),
  };
}

function renderCatalog() {
  const units = sortUnits(filterUnits(state.units, readFilters()), filtersForm.elements.sort.value);
  $('#unit-grid').replaceChildren(...units.map(renderUnitCard));
  $('#results-count').textContent = units.length === 1 ? '1 unidad' : `${units.length} unidades`;
  $('#empty-state').hidden = units.length > 0;
}

function renderSold() {
  const sold = sortUnits(filterUnits(state.units, { status: 'vendida' }), 'recent');
  $('#sold-grid').replaceChildren(...sold.map(renderUnitCard));
}

function renderCategoryCounts() {
  for (const counter of document.querySelectorAll('[data-count]')) {
    const count = filterUnits(state.units, { type: counter.dataset.count }).length;
    counter.textContent = `${counter.textContent} · ${count} ${count === 1 ? 'disponible' : 'disponibles'}`;
  }
}

function fillBrands() {
  const brands = brandsOf(state.units);
  for (const select of [$('#f-brand'), $('#hero-brand')]) {
    select.append(...brands.map((brand) => new Option(brand, brand)));
  }
}

function applyFilters(values) {
  filtersForm.reset();
  for (const [name, value] of Object.entries(values)) filtersForm.elements[name].value = value;
  renderCatalog();
}

function openUnit(id, opener) {
  const unit = state.units.find((candidate) => candidate.id === id);
  if (!unit) return;
  state.openUnit = unit;
  state.opener = opener;
  dialogContent.replaceChildren(renderUnitDetail(unit));
  dialog.showModal();
}

async function loadUnits() {
  const response = await fetch('data/units.json', { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { units, rejected } = parseUnits(await response.json());
  if (rejected) console.warn(`${rejected} unidad(es) descartadas por no cumplir el esquema.`);
  return units;
}

// Navegación mobile
const navToggle = $('.nav-toggle');
const nav = $('#site-nav');
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
});

// Catálogo
filtersForm.addEventListener('input', renderCatalog);
filtersForm.addEventListener('change', renderCatalog);
filtersForm.addEventListener('submit', (event) => event.preventDefault());
$('#clear-filters').addEventListener('click', () => applyFilters({}));

$('#hero-search').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  applyFilters({ type: data.get('type'), brand: data.get('brand'), maxPriceUsd: data.get('maxPriceUsd') });
  $('#unidades').scrollIntoView();
});

for (const category of document.querySelectorAll('.category[data-type]')) {
  category.addEventListener('click', () => applyFilters({ type: category.dataset.type }));
}

// Ficha de unidad
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-unit]');
  if (trigger) openUnit(trigger.dataset.openUnit, trigger);
});
$('#unit-dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
  const thumb = event.target.closest('[data-photo]');
  if (thumb) showPhoto(dialogContent, state.openUnit, Number(thumb.dataset.photo));
});
dialog.addEventListener('close', () => {
  state.opener?.focus();
  state.opener = null;
});

// Vendé tu unidad
const sellForm = $('#sell-form');
sellForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(sellForm));
  const { valid, errors } = validateSellForm(values);
  for (const name of ['nombre', 'telefono', 'unidad', 'anio', 'asientos', 'mensaje']) {
    const input = sellForm.elements[name];
    input.setAttribute('aria-invalid', String(Boolean(errors[name])));
    $(`#sell-${name}-error`).textContent = errors[name] ?? '';
  }
  const status = $('#sell-status');
  if (!valid) {
    status.textContent = 'Revisá los campos marcados.';
    sellForm.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  const url = buildWhatsAppUrl(PRIMARY_WHATSAPP, buildSellMessage(values));
  window.open(url, '_blank', 'noopener,noreferrer');
  status.replaceChildren(
    'Listo: abrimos WhatsApp con tu mensaje. Si no se abrió, ',
    el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, 'tocá acá'),
    '.',
  );
});

$('#year').textContent = String(new Date().getFullYear());

try {
  state.units = await loadUnits();
  fillBrands();
  renderCategoryCounts();
  renderCatalog();
  renderSold();
} catch (error) {
  console.error(error);
  $('#results-count').textContent = 'No pudimos cargar el catálogo. Escribinos por WhatsApp y te enviamos el listado.';
}
