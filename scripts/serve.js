#!/usr/bin/env node
// Serves the exported docs folder as a local static site.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const BASE_PORT = Number(process.env.PORT) || 5500;
const MAX_PORT_ATTEMPTS = 20;
const DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function openInBrowser(url) {
  let command = 'xdg-open';
  switch (process.platform) {
    case 'darwin':
      command = 'open';
      break;
    case 'win32':
      command = 'explorer.exe';
      break;
    default:
      command = 'xdg-open';
  }

  execFile(command, [url], () => undefined);
}

function resolveFile(urlPath) {
  const filePath = path.resolve(DIR, urlPath.replace(/^\/+/, ''));
  if (!filePath.startsWith(DIR + path.sep) && filePath !== DIR) return undefined;
  const candidates = [filePath, path.join(filePath, 'index.html'), filePath + '.html'];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

function createApp() {
  return http.createServer((req, res) => {
    let urlPath;
    try {
      const rawPath = (req.url || '/').split('?')[0];
      urlPath = decodeURIComponent(rawPath);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const file = resolveFile(urlPath);

    if (file) {
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = createApp();
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve({ server, port });
    });
  });
}

async function start() {
  for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
    const port = BASE_PORT + i;
    try {
      const { port: actualPort } = await listen(port);
      const url = 'http://localhost:' + actualPort;
      if (actualPort !== BASE_PORT) {
        console.log('Port ' + BASE_PORT + ' is in use, using ' + actualPort + ' instead.');
      }
      console.log('Serving docs at ' + url);
      if (process.env.NO_OPEN !== '1') openInBrowser(url);
      return;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') throw err;
    }
  }

  console.error('No available port found between ' + BASE_PORT + ' and ' + (BASE_PORT + MAX_PORT_ATTEMPTS - 1) + '.');
  process.exit(1);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
