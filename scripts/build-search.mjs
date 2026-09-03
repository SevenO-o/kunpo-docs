import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import * as pagefind from 'pagefind';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchAssets = ['search.js', 'search.css', 'matching.mjs'];
const injectionPattern = /<!-- kunpo-search:start -->[\s\S]*?<!-- kunpo-search:end -->/g;

export function navigationPages(config) {
  const pages = new Map();
  function visit(node, category = '') {
    if (typeof node === 'string') {
      if (/^(https?:\/\/|#)/.test(node)) return;
      const route = node.replace(/^\/+|\.mdx?$/g, '');
      if (!route || route.split('/').includes('..')) throw new Error(`Invalid navigation route: ${node}`);
      const url = route === 'index' ? '/' : `/${route}`;
      pages.set(url, { route, url, category });
    } else if (Array.isArray(node)) {
      for (const item of node) visit(item, category);
    } else if (node && typeof node === 'object') {
      for (const key of ['tabs', 'groups', 'pages']) if (node[key]) visit(node[key], node.group || category);
    }
  }
  visit(config.navigation);
  return [...pages.values()];
}

// Parse a separate index document; never reserialize the page React hydrates.
export function searchDocument(html, category) {
  const { document } = parseHTML(html);
  const main = document.querySelector('main');
  if (!main?.querySelector('h1')) throw new Error('Exported page is missing main content or its title');
  main.querySelectorAll('nav, aside, script, style, button, [aria-label="Navigate to header"]').forEach(node => node.remove());
  for (const link of main.querySelectorAll('a')) {
    if (link.href?.includes('mintlify.com?') || /(?:^Previous$|Next$)/.test(link.textContent.trim())) link.remove();
  }
  main.setAttribute('data-pagefind-body', '');
  main.querySelector('h1').setAttribute('data-pagefind-meta', 'title');
  main.querySelector('h1').setAttribute('data-pagefind-weight', '8');
  main.querySelectorAll('h2, h3').forEach(node => node.setAttribute('data-pagefind-weight', '3'));
  const group = document.createElement('span');
  group.setAttribute('data-pagefind-meta', 'category');
  group.setAttribute('data-pagefind-ignore', '');
  group.textContent = category;
  main.prepend(group);
  return `<!doctype html><html lang="zh"><head></head><body>${main.outerHTML}</body></html>`;
}

export function injectSearch(html, version) {
  const clean = html.replace(injectionPattern, '');
  if (!clean.includes('</head>')) throw new Error('Exported HTML is missing </head>');
  const assets = '<!-- kunpo-search:start -->' +
    `<link rel="stylesheet" href="/kunpo-search/search.css?v=${version}">` +
    `<script src="/kunpo-search/search.js?v=${version}"></script>` +
    '<!-- kunpo-search:end -->';
  return clean.replace('</head>', `${assets}</head>`);
}

function checked(response) {
  if (response.errors?.length) throw new Error(response.errors.join('\n'));
  return response;
}

export async function buildSearch(exportDir, config) {
  exportDir = path.resolve(exportDir);
  config ??= JSON.parse(await readFile(path.join(root, 'docs.json'), 'utf8'));
  const pages = navigationPages(config);
  if (!pages.length) throw new Error('No navigation pages to index');
  // Read every input before writing, so an incomplete export fails immediately.
  const sources = await Promise.all(pages.map(async page => {
    const file = path.join(exportDir, page.route === 'index' ? 'index.html' : `${page.route}/index.html`);
    const html = (await readFile(file, 'utf8')).replace(injectionPattern, '');
    return { ...page, file, html, content: searchDocument(html, page.category) };
  }));
  const assets = await Promise.all(searchAssets.map(name => readFile(path.join(root, 'scripts/search', name))));
  const hash = createHash('sha256');
  for (const source of sources) hash.update(source.url).update(source.content);
  for (const asset of assets) hash.update(asset);
  const version = hash.digest('hex').slice(0, 12);
  try {
    const { index } = checked(await pagefind.createIndex({ forceLanguage: 'zh', includeCharacters: '._-', writePlayground: false }));
    for (const source of sources) checked(await index.addHTMLFile({ url: source.url, content: source.content }));
    checked(await index.writeFiles({ outputPath: path.join(exportDir, 'pagefind') }));
  } finally { await pagefind.close(); }
  const assetDir = path.join(exportDir, 'kunpo-search');
  await mkdir(assetDir, { recursive: true });
  for (const name of searchAssets) await copyFile(path.join(root, 'scripts/search', name), path.join(assetDir, name.replace(/\.mjs$/, '.js')));
  for (const source of sources) await writeFile(source.file, injectSearch(source.html, version));
  // Mintlify also exports /index as a duplicate of /. Keep it usable, but don't index it twice.
  const duplicateHome = path.join(exportDir, 'index/index.html');
  try { await writeFile(duplicateHome, injectSearch(await readFile(duplicateHome, 'utf8'), version)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const manifest = { version, language: 'zh', pages: pages.map(({ url, category }) => ({ url, category })) };
  await writeFile(path.join(assetDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/build-search.mjs <export-directory>');
  const result = await buildSearch(process.argv[2]);
  console.log(`Search ready: ${result.pages.length} pages, Chinese index, version ${result.version}`);
}
