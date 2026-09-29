import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { contentFindings, auditPublic } from '../scripts/check-public-content.mjs';

test('allows public identifiers, KUNPO URLs and placeholder credentials', () => {
  assert.deepEqual(contentFindings('POST https://llm.ziy.cc/tencent-tokenhub/v1/videos\n`tencent-vod-vs-2.5`\nBearer sk-你的密钥', 'example.mdx'), []);
});

test('ignores library syntax keywords and PEM parser markers', () => {
  assert.deepEqual(contentFindings('verilog-sk-prompt-your-keyword \"-----BEGIN PRIVATE KEY-----\"', 'library.js'), []);
});

test('detects credentials and private details without echoing values', () => {
  for (const text of ['AF Claude 渠道', '/opt/private-service', '192.0.2.10', 'sk-' + 'x'.repeat(40)]) {
    const result = contentFindings(text, 'example.mdx');
    assert.ok(result.length);
    assert.ok(!JSON.stringify(result).includes(text));
  }
});

test('audits included snippets and catches hidden files and stale images in artifacts', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-public-test-'));
  try {
    await mkdir(path.join(root, 'snippets'));
    await writeFile(path.join(root, 'docs.json'), JSON.stringify({ navigation: { pages: ['index'] } }));
    await writeFile(path.join(root, 'index.mdx'), 'title: Home\nimport Shared from "/snippets/shared.mdx";\n<Shared />');
    await writeFile(path.join(root, 'snippets/shared.mdx'), 'AF OpenAI 渠道');
    const dir = path.join(root, 'export');
    await mkdir(path.join(dir, 'images'), { recursive: true });
    await writeFile(path.join(dir, 'AGENTS.md'), 'internal');
    await writeFile(path.join(dir, 'hidden.html'), '<p>hidden</p>');
    await writeFile(path.join(dir, 'index.html'), '<script>"/opt/private-service"</script>');
    await writeFile(path.join(dir, 'images/old.png'), 'old');
    const result = await auditPublic(root, dir);
    assert.equal(result.sources, 2);
    for (const file of ['snippets/shared.mdx', 'AGENTS.md', 'hidden.html', 'index.html', 'images/old.png']) {
      assert.ok(result.findings.some(f => f.file === file), file);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
