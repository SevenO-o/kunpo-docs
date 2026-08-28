# Seed Audio Content Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将线上旧版音频生成页的独有实用信息增量合并到当前 Seed Audio 唯一维护页。

**Architecture:** 只修改 `api-reference/seed-audio.mdx`，沿用现有章节与 Mintlify 组件约定。保留当前更完整的参数、响应和实测范围，仅在对应位置补充端点避坑、计费结算、三语言最简示例和图片抓取回退说明。

**Tech Stack:** Mintlify、MDX、`CodeGroup`、Markdown

## Global Constraints

- 不新增或复制音频生成页面，不修改 `docs.json`。
- 不覆盖当前页面已有的实测结论与完整参数说明。
- 不发起真实音频生成，不验证计费或上游抓取行为。
- 不修改构建产物、发布配置或无关未跟踪文件。
- 不提交、不推送、不发布。

---

### Task 1: 增量补充 Seed Audio 使用说明

**Files:**
- Modify: `api-reference/seed-audio.mdx:6-160`
- Test: Mintlify 配置校验与 broken-links 检查

**Interfaces:**
- Consumes: 线上旧页 `/api/audio-generation/` 的公开文档内容，以及当前 `api-reference/seed-audio.mdx` 的参数和实测结论
- Produces: 一个继续由 `api-reference/seed-audio.mdx` 单点维护、可通过 Mintlify 校验的音频生成参考页

- [x] **Step 1: 确认增量内容当前不存在**

Run:

```bash
rg -n '不要使用.*chat/completions|预扣|from openai import OpenAI|改用.*image_data' api-reference/seed-audio.mdx
```

Expected: 无匹配；若出现匹配，先保留已有等价表述，避免重复添加。

- [x] **Step 2: 补充端点与计费边界**

在认证和计费说明处加入以下内容：

```mdx
<Warning>
  音频生成必须调用 `/v1/audio/speech`，不要使用 `/v1/chat/completions`。
</Warning>

<Note>
  最大生成时长为 120 秒。计费为 ¥1/分钟：请求时按最长 120 秒预扣，完成后按上游返回的 `original_duration` 实际时长结算并退回差额。
</Note>
```

- [x] **Step 3: 将最简调用扩展为三种等价示例**

把当前“最简调用”中的单个 cURL 代码块替换为下面的 `CodeGroup`：

````mdx
<CodeGroup>
```bash cURL
curl https://llm.ziy.cc/v1/audio/speech \
  -H "Authorization: Bearer sk-你的密钥" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seed-audio-1.0-multilingual",
    "input": "生成十秒钟轻柔雨声，无人声",
    "response_format": "mp3"
  }' \
  --output rain.mp3
```

```python Python
from pathlib import Path

import requests

response = requests.post(
    "https://llm.ziy.cc/v1/audio/speech",
    headers={"Authorization": "Bearer sk-你的密钥"},
    json={
        "model": "seed-audio-1.0-multilingual",
        "input": "生成十秒钟轻柔雨声，无人声",
        "response_format": "mp3",
    },
    timeout=180,
)
response.raise_for_status()
Path("rain.mp3").write_bytes(response.content)
```

```python OpenAI SDK
from openai import OpenAI

client = OpenAI(
    base_url="https://llm.ziy.cc/v1",
    api_key="sk-你的密钥",
)

audio = client.audio.speech.create(
    model="seed-audio-1.0-multilingual",
    voice="alloy",  # OpenAI SDK 要求传入；Seed Audio 会忽略
    input="生成十秒钟轻柔雨声，无人声",
    response_format="mp3",
)
audio.write_to_file("rain.mp3")
```
</CodeGroup>
````

- [x] **Step 4: 补充公开图片抓取失败时的回退方式**

将现有参考图片 `<Tip>` 的正文扩展为：

```mdx
<Tip>
  `references[].image_url` 已通过 Pexels 公网图片实测。使用时提供火山服务可访问的公开图片 URL；它不能与任意音频类型的参考资源同时出现。如果图片站点阻止上游抓取，请改用 `image_data` 传递不带 Data URI 前缀的 Base64。
</Tip>
```

- [x] **Step 5: 检查变更范围与格式**

Run:

```bash
git diff --check -- api-reference/seed-audio.mdx
git diff -- api-reference/seed-audio.mdx
```

Expected: `git diff --check` 无输出；diff 只包含本计划列出的四类增量内容。

- [x] **Step 6: 运行 Mintlify 文档检查**

Run:

```bash
npx --no-install mintlify validate --telemetry false
npx --no-install mintlify broken-links --check-redirects
```

Expected: Mintlify 配置验证通过，且没有 broken links。

- [x] **Step 7: 确认没有越界修改**

Run:

```bash
git status --short
```

Expected: 本任务新增设计与计划说明，并修改 `api-reference/seed-audio.mdx`；原有无关未跟踪文件保持原状。不要执行 `git add`、`git commit`、`git push` 或发布命令。
