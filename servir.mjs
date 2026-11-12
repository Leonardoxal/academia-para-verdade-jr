// Servidor local de conferência da Academia para Verdade Jr.: node servir.mjs → http://127.0.0.1:5179
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const RAIZ = join(import.meta.dirname, 'app');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    const arquivo = resolve(RAIZ, caminho);
    const relativo = relative(RAIZ, arquivo);
    if (relativo === '..' || relativo.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(relativo)) { res.writeHead(403).end(); return; }
    const corpo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': `${TIPOS[extname(arquivo)] || 'application/octet-stream'}${TIPOS[extname(arquivo)]?.startsWith('text/') || ['.js', '.mjs', '.css', '.json', '.svg'].includes(extname(arquivo)) ? '; charset=utf-8' : ''}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }).end(req.method === 'HEAD' ? undefined : corpo);
  } catch { res.writeHead(404).end('não encontrado'); }
}).listen(5179, '127.0.0.1');
