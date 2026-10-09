import { el, icon } from './dom.js';
import { formatPrice, unitTitle } from './format.js';
import { UNIT_TYPES } from './catalog.js';
import { buildWhatsAppUrl, unitInquiryMessage } from './whatsapp.js';
import { PRIMARY_WHATSAPP } from './config.js';

const PLACEHOLDER = 'img/placeholder-bus.svg';
const KM = new Intl.NumberFormat('es-AR');
const STATUS_LABELS = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida' };

function photo(unit, index) {
  const src = unit.images[index];
  return src
    ? { src, alt: `${unitTitle(unit)} ${unit.year}, foto ${index + 1} de ${unit.images.length}` }
    : { src: PLACEHOLDER, alt: 'Unidad sin foto publicada' };
}

function unitMeta(unit) {
  return [String(unit.year), `${unit.seats} asientos`, unit.seatType, unit.fuel].filter(Boolean).join(' · ');
}

function whatsappLink(unit, className, label) {
  return el(
    'a',
    {
      className,
      href: buildWhatsAppUrl(PRIMARY_WHATSAPP, unitInquiryMessage(unit)),
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `${label} por WhatsApp: ${unitTitle(unit)} ${unit.year}`,
    },
    icon('i-wa'),
    label,
  );
}

function badge(unit) {
  if (unit.demo) return el('span', { className: 'badge badge--demo' }, 'Unidad de ejemplo');
  if (unit.status === 'vendida') return el('span', { className: 'badge badge--sold' }, 'Vendida');
  if (unit.status === 'reservada') return el('span', { className: 'badge badge--sold' }, 'Reservada');
  return null;
}

export function renderUnitCard(unit) {
  const titleId = `unit-${unit.id}`;
  const forSale = unit.status !== 'vendida';
  const cover = photo(unit, 0);
  return el(
    'li',
    {},
    el(
      'article',
      { className: 'unit-card', 'data-unit': unit.id, 'aria-labelledby': titleId },
      el(
        'figure',
        { className: 'unit-card__media' },
        el('img', { src: cover.src, alt: cover.alt, width: 640, height: 400, loading: 'lazy' }),
        el('span', { className: 'badge badge--type' }, UNIT_TYPES[unit.type]),
        badge(unit),
      ),
      el(
        'div',
        { className: 'unit-card__body' },
        el('h3', { id: titleId }, unitTitle(unit)),
        el('p', { className: 'unit-card__meta' }, unitMeta(unit)),
        unit.features.length ? el('ul', { className: 'chips' }, unit.features.slice(0, 4).map((f) => el('li', {}, f))) : null,
        forSale ? el('p', { className: 'unit-card__price' }, formatPrice(unit.price)) : null,
        forSale
          ? el(
              'div',
              { className: 'unit-card__actions' },
              el(
                'button',
                { className: 'btn btn--ghost', type: 'button', 'data-open-unit': unit.id, 'aria-label': `Ver ficha: ${unitTitle(unit)} ${unit.year}` },
                'Ver ficha',
              ),
              whatsappLink(unit, 'btn btn--wa', 'Consultar'),
            )
          : null,
      ),
    ),
  );
}

function specRows(unit) {
  const rows = [
    ['Tipo', UNIT_TYPES[unit.type]],
    ['Chasis', [unit.brand, unit.model].filter(Boolean).join(' ')],
    ['Carrocería', unit.body],
    ['Año', String(unit.year)],
    ['Asientos', String(unit.seats)],
    ['Butacas', unit.seatType],
    ['Combustible', unit.fuel],
    ['Kilometraje', unit.km === undefined ? undefined : `${KM.format(unit.km)} km`],
    ['Estado', STATUS_LABELS[unit.status]],
  ];
  return rows.filter(([, value]) => value).flatMap(([term, value]) => [el('dt', {}, term), el('dd', {}, value)]);
}

export function renderUnitDetail(unit) {
  const cover = photo(unit, 0);
  const deal = [unit.financing && 'Posibilidad de financiación', unit.tradeIn && 'Tomamos permutas'].filter(Boolean).join(' – ');
  return el(
    'div',
    { className: 'unit-dialog__inner' },
    el(
      'div',
      { className: 'unit-dialog__gallery' },
      el('img', { className: 'unit-dialog__main', src: cover.src, alt: cover.alt, width: 800, height: 600 }),
      unit.images.length > 1
        ? el(
            'ul',
            { className: 'unit-dialog__thumbs', 'aria-label': 'Fotos de la unidad' },
            unit.images.map((src, index) =>
              el(
                'li',
                {},
                el(
                  'button',
                  { type: 'button', 'data-photo': index, 'aria-current': index === 0 ? 'true' : 'false', 'aria-label': `Ver foto ${index + 1} de ${unit.images.length}` },
                  el('img', { src, alt: '', width: 96, height: 72, loading: 'lazy' }),
                ),
              ),
            ),
          )
        : null,
    ),
    el(
      'div',
      { className: 'unit-dialog__details' },
      el('p', { className: 'eyebrow' }, UNIT_TYPES[unit.type]),
      el('h2', { id: 'unit-dialog-title' }, `${unitTitle(unit)} ${unit.year}`),
      unit.demo ? el('p', { className: 'demo-note' }, 'Unidad de ejemplo: datos ilustrativos, no está a la venta.') : null,
      el('p', { className: 'unit-card__price' }, formatPrice(unit.price)),
      el('dl', { className: 'spec-table' }, specRows(unit)),
      unit.features.length ? el('ul', { className: 'chips' }, unit.features.map((f) => el('li', {}, f))) : null,
      deal ? el('p', { className: 'deal-band' }, deal) : null,
      unit.status === 'vendida' ? null : whatsappLink(unit, 'btn btn--wa btn--block', 'Consultar'),
    ),
  );
}

export function showPhoto(dialogContent, unit, index) {
  const main = dialogContent.querySelector('.unit-dialog__main');
  const current = photo(unit, index);
  main.src = current.src;
  main.alt = current.alt;
  for (const button of dialogContent.querySelectorAll('[data-photo]')) {
    button.setAttribute('aria-current', String(Number(button.dataset.photo) === index));
  }
}
