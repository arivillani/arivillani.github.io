import { unitTitle } from './format.js';

export function buildWhatsAppUrl(number, text) {
  if (!/^\d{8,15}$/.test(number)) throw new Error('El número de WhatsApp debe tener solo dígitos.');
  if (!text) return `https://wa.me/${number}`;
  // encodeURIComponent leaves ' untouched; encode it too so the link stays inside the href allowlist.
  return `https://wa.me/${number}?text=${encodeURIComponent(text).replace(/'/g, '%27')}`;
}

export function unitInquiryMessage(unit) {
  return `Hola Buses Nieto, me interesa la unidad ${unitTitle(unit)} ${unit.year} (${unit.id}).`;
}
