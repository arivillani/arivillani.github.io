// "Vendé tu unidad": validated client-side and handed to WhatsApp by the user.
// Nothing is stored or sent anywhere else.
// eslint-disable-next-line no-control-regex -- matching control characters is the point: they are stripped from user input.
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

const clean = (value) => String(value ?? '').replace(CONTROL_CHARS, '').trim();
const oneLine = (value) => clean(value).replace(/\s+/g, ' ');

export function validateSellForm(values, { currentYear = new Date().getFullYear() } = {}) {
  const errors = {};
  const nombre = oneLine(values.nombre);
  const telefono = oneLine(values.telefono);
  const unidad = oneLine(values.unidad);
  const anio = oneLine(values.anio);
  const asientos = oneLine(values.asientos);
  const mensaje = clean(values.mensaje);
  const phoneDigits = telefono.replace(/[\s()+-]/g, '');

  if (nombre.length < 2 || nombre.length > 60) errors.nombre = 'Ingresá tu nombre.';
  if (!/^[\d\s()+-]+$/.test(telefono) || !/^\d{8,15}$/.test(phoneDigits)) {
    errors.telefono = 'Ingresá un teléfono válido, con característica (8 a 15 números).';
  }
  if (unidad.length < 2 || unidad.length > 80) errors.unidad = 'Indicá marca y modelo de la unidad.';
  if (!/^\d{4}$/.test(anio) || Number(anio) < 1980 || Number(anio) > currentYear + 1) {
    errors.anio = `Ingresá un año entre 1980 y ${currentYear + 1}.`;
  }
  if (!/^\d{1,2}$/.test(asientos) || Number(asientos) < 1 || Number(asientos) > 90) {
    errors.asientos = 'Ingresá la cantidad de asientos (1 a 90).';
  }
  if (mensaje.length > 500) errors.mensaje = 'El mensaje no puede superar los 500 caracteres.';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildSellMessage(values) {
  const lines = [
    'Hola Buses Nieto, quiero vender mi unidad.',
    `Nombre: ${oneLine(values.nombre)}`,
    `Teléfono: ${oneLine(values.telefono)}`,
    `Unidad: ${oneLine(values.unidad)}`,
    `Año: ${oneLine(values.anio)}`,
    `Asientos: ${oneLine(values.asientos)}`,
  ];
  const mensaje = clean(values.mensaje);
  if (mensaje) lines.push(`Comentarios: ${mensaje}`);
  return lines.join('\n');
}
