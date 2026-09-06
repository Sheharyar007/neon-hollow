import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const production = process.argv.includes('--production');
const root = path.resolve(fileURLToPath(new URL(production ? './dist/' : '.', import.meta.url)));
const basePath = production ? '/neon-hollow/' : '/';
const port = production ? 4174 : 4173;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const allowed = new Set(['/index.html', '/styles.css']);
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (production && url.pathname === basePath.slice(0, -1)) {
      res.writeHead(301, { Location: basePath }).end(); return;
    }
    if (!url.pathname.startsWith(basePath)) { res.writeHead(404).end('Not found'); return; }
    const relativePath = url.pathname.slice(basePath.length);
    const pathname = decodeURIComponent(relativePath ? '/' + relativePath : '/index.html');
    const filename = path.resolve(root, '.' + pathname);
    const publicPath = allowed.has(pathname) || pathname.startsWith('/src/') || pathname.startsWith('/public/');
    if (!publicPath || !filename.startsWith(root + path.sep) || pathname.includes('..')) {
      res.writeHead(404).end('Not found'); return;
    }
    const data = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Neon Hollow ${production ? 'production artifact' : 'local'} preview: http://localhost:${port}${basePath}`));
