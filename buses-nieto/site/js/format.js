const NUMBER = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const CURRENCY_SYMBOLS = { USD: 'U$S', ARS: '$' };

/** "U$S 90.000", "$ 45.000.000" or "Consultar" when there is no published price. */
export function formatPrice(price) {
  if (!price) return 'Consultar';
  return `${CURRENCY_SYMBOLS[price.currency]} ${NUMBER.format(price.amount)}`;
}

/** Argentine mobile number (area code + number, with or without +54 9) → wa.me digits. */
export function toWhatsAppNumber(phone) {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('549')) digits = digits.slice(3);
  else if (digits.startsWith('54')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 10) throw new Error(`Número de teléfono inválido: ${phone}`);
  return `549${digits}`;
}

export function unitTitle(unit) {
  return [unit.brand, unit.model, unit.body].filter(Boolean).join(' ');
}
