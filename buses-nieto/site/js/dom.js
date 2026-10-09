// Element builder for rendering data: children are appended as text nodes, never parsed as HTML.
const BLOCKED_ATTRIBUTE = /^(on|style$|srcdoc$|formaction$)/i;
const SAFE_HREF = /^(#[\w-]*|https:\/\/wa\.me\/\d{8,15}(\?text=[^\s"'<>]*)?)$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

export function isSafeHref(href) {
  return SAFE_HREF.test(href);
}

export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (BLOCKED_ATTRIBUTE.test(name)) throw new Error(`Atributo no permitido: ${name}`);
    if (name === 'href' && !isSafeHref(value)) throw new Error(`Enlace no permitido: ${value}`);
    node.setAttribute(name === 'className' ? 'class' : name, value === true ? '' : String(value));
  }
  node.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

export function icon(id) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
