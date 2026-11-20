// Tiny static server for local preview of the app/ folder.
// Usage: node serve.ts [--port 8123]   (default port 8080)

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(fileURLToPath(new URL('.', import.meta.url)), 'app');

function pickPort(argv) {
  const at = argv.indexOf('--port');
  if (at >= 0 && argv[at + 1]) return Number(argv[at + 1]);
  return 8080;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(appDir, safe);
    if (!filePath.startsWith(appDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    const body = readFileSync(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('server error');
  }
});

const port = pickPort(process.argv.slice(2));
server.listen(port, () => {
  console.log('serving app/ on port ' + port);
});
