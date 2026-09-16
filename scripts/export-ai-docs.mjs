import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navigationPages } from './build-search.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exportDir = path.resolve(process.argv[2] || path.join(root, 'kunpo-api-docs-export'));
const config = JSON.parse(await readFile(path.join(root, 'docs.json'), 'utf8'));
const pages = navigationPages(config);

// Preserve the original code blocks and tables; inline only the repository's
// explicit public snippets so AI readers do not need to execute MDX imports.
async function expandSnippets(source, visited = new Set()) {
  const imports = [...source.matchAll(/^import\s+(\w+)\s+from\s+["'](\/snippets\/[^"']+\.mdx)["'];?\s*$/gm)];
  for (const [statement, name, reference] of imports) {
    const file = path.resolve(root, '.' + reference);
    if (!file.startsWith(path.join(root, 'snippets') + path.sep) || visited.has(file)) {
      throw new Error(`Invalid or cyclic public snippet: ${reference}`);
    }
    const content = await expandSnippets(await readFile(file, 'utf8'), new Set([...visited, file]));
    const marker = new RegExp(`<${name}\\s*\\/>`, 'g');
    if (!marker.test(source)) throw new Error(`Unused or parameterized snippet: ${name}`);
    source = source.replace(statement, '').replace(marker, () => content.trim());
  }
  return source;
}

const index = [
  '# KUNPO API',
  '',
  '> API 接入文档，供 AI 生成调用代码。API 根地址：https://llm.ziy.cc；鉴权：Authorization: Bearer sk-你的密钥。',
  '',
  '以下 Markdown 由已加入公开导航的 MDX 页面自动生成，保留完整代码块、协议表与 Mintlify 组件标记，共用参数片段已展开。模型 ID、参数默认值、异步状态与计费以对应模型页为准；不要按供应商命名推断。',
  '',
  '## 文档',
  '',
];

for (const page of pages) {
  const source = await readFile(path.join(root, page.route + '.mdx'), 'utf8');
  const markdown = await expandSnippets(source);
  const title = source.match(/^title:\s*["']?([^\n"']+)["']?\s*$/m)?.[1] || page.route;
  const description = source.match(/^description:\s*["']?([^\n"']+)["']?\s*$/m)?.[1] || page.category;
  const destination = path.join(exportDir, page.route + '.md');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, markdown);
  index.push(`- [${title}](https://docs.ziy.cc/${page.route}.md): ${description}`);
}
await writeFile(path.join(exportDir, 'llms.txt'), index.join('\n') + '\n');
console.log(`AI docs ready: ${pages.length} public Markdown pages and llms.txt`);
