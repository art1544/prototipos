#!/usr/bin/env node
// Servidor estático de desenvolvimento, sem dependências.
// Reproduz o que a Vercel faz em produção (ver vercel.json):
//   - pastas sem barra final redirecionam para "/pasta/" (os protótipos usam caminhos relativos);
//   - endereço inexistente responde 404.html;
//   - nada fica em cache, para cada alteração aparecer ao recarregar.
//
// Uso: npm run dev            (porta 3000)
//      PORT=8080 npm run dev
//      npm run dev -- --host  (aceita conexões da rede local, para testar no celular)

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.argv.includes('--host') ? '0.0.0.0' : '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const BLOCKED = ['node_modules', '.git', '.vercel', 'scripts', 'templates'];

async function fileInfo(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

function send(res, status, path, info) {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(path).pipe(res);
}

async function notFound(res) {
  const page = join(ROOT, '404.html');
  const info = await fileInfo(page);
  if (info) return send(res, 404, page, info);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  return res.end('404 – não encontrado');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound(res);
  }

  const target = normalize(join(ROOT, pathname));
  const firstSegment = pathname.split('/').filter(Boolean)[0] || '';
  if ((target !== ROOT && !target.startsWith(ROOT + sep)) || BLOCKED.includes(firstSegment) || firstSegment.startsWith('.')) {
    return notFound(res);
  }

  const info = await fileInfo(target);
  if (info && info.isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(308, { Location: `${pathname}/${url.search}` });
      return res.end();
    }
    const index = join(target, 'index.html');
    const indexInfo = await fileInfo(index);
    return indexInfo ? send(res, 200, index, indexInfo) : notFound(res);
  }
  if (info && info.isFile()) return send(res, 200, target, info);
  return notFound(res);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Catálogo de protótipos: http://localhost:${PORT}/`);
  if (HOST === '0.0.0.0') {
    Object.values(networkInterfaces()).flat()
      .filter((net) => net && net.family === 'IPv4' && !net.internal)
      .forEach((net) => console.log(`  Na rede local (celular): http://${net.address}:${PORT}/`));
  } else {
    console.log('  Para abrir no celular pela rede local: npm run dev -- --host');
  }
  console.log('');
});
