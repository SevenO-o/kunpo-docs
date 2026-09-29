import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { navigationPages } from './build-search.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Public protocol paths/model IDs may contain tencent-*; infrastructure prose may not.
const rules = [
  ['routing-details', /agentsflare|\bAF\s*(?:Claude|OpenAI|上游|渠道|模型)|\bAIPing\b|openrouter\.ai|腾讯云|腾讯侧|火山(?:方舟|引擎|直连|账号)|上游|渠道|(?<!tencent-)\bTokenHub\b/i],
  ['private-path', /\/(?:opt|root|Users|home)\/[\w.-]+|1[Pp]anel|SQL_DSN|REDIS_CONN_STRING|SSH_HOST/],
  ['credential', /(?<![\w-])sk-[a-zA-Z0-9_-]{20,}|\b(?:AKID|ghp_|github_pat_)[a-zA-Z0-9_]{16,}|\beyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----(?:\s|\\n)+[a-zA-Z0-9+/=]{40,}/],
  ['ip-address', /(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/],
  ['removed-screenshot', /\/images\/cc-switch\//],
];

export function contentFindings(text, label) {
  const findings = [];
  for (const [rule, pattern] of rules) {
    const match = pattern.exec(text);
    if (match) findings.push({ file: label, line: text.slice(0, match.index).split('\n').length, rule });
  }
  return findings;
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Public symlinks are not allowed: ${entry.name}`);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

export async function auditPublic(root = repo, exportDir) {
  const config = JSON.parse(await readFile(path.join(root, 'docs.json'), 'utf8'));
  const pages = navigationPages(config);
  const sourceFiles = new Set(pages.map(p => `${p.route}.mdx`));
  const pending = [...sourceFiles];
  const findings = contentFindings(JSON.stringify(config), 'docs.json');
  for (const file of pending) {
    if (!file.endsWith('.mdx') || file.split('/').includes('..')) throw new Error('Invalid public source');
    const text = await readFile(path.join(root, file), 'utf8');
    findings.push(...contentFindings(text, file));
    for (const [, reference] of text.matchAll(/^import\s+\w+\s+from\s+["'](\/snippets\/[^"']+\.mdx)["']/gm)) {
      const snippet = reference.slice(1);
      if (!sourceFiles.has(snippet)) { sourceFiles.add(snippet); pending.push(snippet); }
    }
  }
  if (exportDir) {
    const html = new Set(['index.html', 'index/index.html', '404.html', '404/index.html', ...pages.filter(p => p.route !== 'index').map(p => `${p.route}/index.html`)]);
    const markdown = new Set(['llms.txt', ...pages.map(p => `${p.route}.md`), ...[...sourceFiles].filter(p => p.startsWith('snippets/'))]);
    for (const file of await walk(exportDir)) {
      const relative = path.relative(exportDir, file).split(path.sep).join('/');
      const ext = path.extname(file);
      const internal = /(?:^|\/)(?:AGENTS\.md|DOCS_MAINTENANCE\.md|PROJECT_CONTEXT\.md|DEPLOYMENT\.md|\.env[^/]*|\.git|deployment|artifacts|docs|tests)(?:\/|$)/i.test(relative);
      if (internal || ['.conf', '.toml', '.yaml', '.yml', '.pem', '.key', '.zip', '.sql', '.dump', '.log', '.map'].includes(ext) || (ext === '.html' && !html.has(relative)) || (['.md', '.mdx', '.txt'].includes(ext) && !markdown.has(relative)) || relative.startsWith('images/cc-switch/')) {
        findings.push({ file: relative, rule: 'unexpected-public-file' });
      }
      if (relative.startsWith('images/')) {
        // Old/untracked images must never survive a new release.
        const original = path.join(root, relative);
        try { await lstat(original); } catch { findings.push({ file: relative, rule: 'stale-public-image' }); }
      }
      // Framework JavaScript contains vendor names/examples unrelated to our pages.
      // Scan page bodies + serialized page payloads and exported text; source is scanned above.
      if (['.html', '.md', '.mdx', '.txt', '.json'].includes(ext)) {
        findings.push(...contentFindings(await readFile(file, 'utf8'), relative));
      }
      if (ext === '.js') {
        const text = await readFile(file, 'utf8');
        findings.push(...contentFindings(text, relative).filter(f => ['credential', 'private-key', 'private-path', 'removed-screenshot'].includes(f.rule)));
      }
    }
  }
  return { pages: pages.length, sources: sourceFiles.size, findings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await auditPublic(repo, process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  // Report only location/category; never echo a matched credential or private value.
  console.log(JSON.stringify(result, null, 2));
  if (result.findings.length) process.exitCode = 1;
}
