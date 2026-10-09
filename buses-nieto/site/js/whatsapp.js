import { unitTitle } from './format.js';

export function buildWhatsAppUrl(number, text) {
  if (!/^\d{8,15}$/.test(number)) throw new Error('El número de WhatsApp debe tener solo dígitos.');
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}

export function unitInquiryMessage(unit) {
  return `Hola Buses Nieto, me interesa la unidad ${unitTitle(unit)} ${unit.year} (${unit.id}).`;
}
