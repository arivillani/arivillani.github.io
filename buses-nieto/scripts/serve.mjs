// Dev-only static server for site/: no dependencies, read-only, localhost by default.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEADER_CSP } from './security-policy.mjs';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

export function securityHeaders() {
  return {
    'Content-Security-Policy': HEADER_CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

/** Maps a request URL to a file inside root, or null when it would escape it. */
export function resolveSafePath(root, requestUrl) {
  let rawPath;
  let pathname;
  try {
    rawPath = decodeURIComponent(requestUrl.split(/[?#]/)[0]);
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }
  // Reject ".." segments and null bytes outright, even when they would normalize back inside root.
  if (rawPath.includes('\0') || rawPath.split(/[\\/]/).includes('..')) return null;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, `.${path.posix.normalize(pathname)}`);
  if (!target.startsWith(resolvedRoot + path.sep)) return null;
  return target;
}

export function createServer(root) {
  return http.createServer(async (req, res) => {
    const headers = securityHeaders();
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }).end();
      return;
    }
    const filePath = resolveSafePath(root, req.url ?? '/');
    try {
      if (!filePath || !(await stat(filePath)).isFile()) throw new Error('not found');
      const body = await readFile(filePath);
      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, { ...headers, 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../site/', import.meta.url));
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? '127.0.0.1';
  createServer(root).listen(port, host, () => {
    console.log(`Buses Nieto (dev) → http://${host}:${port}/`);
  });
}
