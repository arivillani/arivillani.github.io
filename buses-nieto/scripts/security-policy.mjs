// Single source of truth for the Content-Security-Policy.
// PAGE_CSP goes in each page's <meta>; frame-ancestors only works as a header,
// so the dev server adds it on top.
export const PAGE_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

export const HEADER_CSP = `${PAGE_CSP}; frame-ancestors 'none'`;
