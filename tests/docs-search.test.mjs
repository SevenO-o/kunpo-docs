import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { navigationPages, searchDocument, injectSearch, buildSearch } from '../scripts/build-search.mjs';
import { queryTerms, matchesQuery, matchingSection } from '../scripts/search/matching.mjs';

test('CJK segmentation does not turn model IDs or unknown words into partial matches', () => {
  assert.ok(matchesQuery('Image\u200b-\u200bGPT2 支持透明\u200b背景', queryTerms('"Image-GPT2"')));
  assert.ok(matchesQuery('Image\u200b-\u200bGPT2 支持透明\u200b背景', queryTerms('透明背景')));
  assert.ok(!matchesQuery('Qwen Image 3.0 支持 output URL', queryTerms('Image-GPT2')));
  assert.ok(!matchesQuery('output tokens response_format', queryTerms('output_format')));
  assert.ok(!matchesQuery('不支持该参数', queryTerms('不存在的词abcdef987654')));
  assert.ok(matchesQuery('API 调用需要 Key', queryTerms('API Key')));
  assert.ok(!matchesQuery('API 说明', queryTerms('API Key')));
  assert.ok(!matchesQuery('API', queryTerms('!!!')));
});

test('section title matches take priority over an earlier unrelated anchor', () => {
  const page = { sub_results: [
    { title: '介绍', url: '/image#intro', plain_excerpt: '简介' },
    { title: '透明背景', url: '/image#transparent', plain_excerpt: '设置参数' },
  ] };
  assert.equal(matchingSection(page, queryTerms('透明背景')).url, '/image#transparent');
  assert.equal(matchingSection(page, queryTerms('未知')), undefined);
});

const html = '<!doctype html><html lang="en"><head><title>GPT Image 2</title></head><body>' +
  '<nav>侧栏专用词</nav><main><h1>GPT Image 2</h1><nav>目录专用词</nav>' +
  '<h2 id="透明背景">透明背景</h2><p>Image-GPT2 支持透明背景</p>' +
  '<pre><code>"output_format": "png"</code></pre><button>复制专用词</button>' +
  '<script>window.secret = "脚本专用词"</script></main></body></html>';

test('only navigation pages are indexed, with canonical homepage and section names', () => {
  assert.deepEqual(navigationPages({ navigation: { tabs: [{ tab: '文档', groups: [
    { group: '开始', pages: ['index', 'https://example.com'] },
    { group: 'API 接口', pages: [{ group: '图像生成', pages: ['api/image', 'api/image'] }] },
  ] }] } }), [{ route: 'index', url: '/', category: '开始' }, { route: 'api/image', url: '/api/image', category: '图像生成' }]);
});

test('index keeps model IDs, code, and anchors, excludes navigation and runtime scripts', () => {
  const content = searchDocument(html, '图像生成');
  for (const value of ['Image-GPT2', 'output_format', '透明背景', 'lang="zh"']) assert.ok(content.includes(value));
  for (const value of ['侧栏专用词', '目录专用词', '复制专用词', '脚本专用词']) assert.ok(!content.includes(value));
  assert.ok(content.includes('id="透明背景"'));
});

test('injection is repeatable and preserves all original document bytes', () => {
  const enhanced = injectSearch(html, 'abc123');
  assert.equal(injectSearch(enhanced, 'abc123'), enhanced);
  assert.equal(enhanced.replace(/<!-- kunpo-search:start -->[\s\S]*?<!-- kunpo-search:end -->/, ''), html);
  assert.ok(enhanced.includes('/kunpo-search/search.js?v=abc123'));
});

test('real Pagefind build packages a Chinese index, injects all pages, ignores stray HTML', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'kunpo-search-test-'));
  try {
    await mkdir(path.join(directory, 'api/image'), { recursive: true });
    await writeFile(path.join(directory, 'index.html'), html);
    await writeFile(path.join(directory, 'api/image/index.html'), html);
    await writeFile(path.join(directory, 'draft.html'), '<h1>草稿不应索引</h1>');
    const config = { navigation: { groups: [{ group: '图像生成', pages: ['index', 'api/image'] }] } };
    const manifest = await buildSearch(directory, config);
    assert.equal(manifest.pages.length, 2);
    assert.ok(!manifest.pages.some(page => page.url.includes('draft')));
    const entry = JSON.parse(await readFile(path.join(directory, 'pagefind/pagefind-entry.json'), 'utf8'));
    assert.equal(entry.languages.zh.page_count, 2);
    for (const file of ['pagefind/pagefind.js', 'kunpo-search/search.js', 'kunpo-search/search.css', 'kunpo-search/matching.js']) {
      assert.ok((await readFile(path.join(directory, file))).length > 0);
    }
    assert.ok((await readFile(path.join(directory, 'api/image/index.html'), 'utf8')).includes('kunpo-search:start'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
