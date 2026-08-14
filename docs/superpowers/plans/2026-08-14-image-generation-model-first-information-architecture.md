# 图片生成模型优先信息架构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将图片生成文档重组为“模型详情优先、同步/异步协议共享”的导航和页面结构，使读者可按模型找到正确能力、参数和示例。

**Architecture:** 保留 `overview`、`synchronous`、`asynchronous` 三个既有 URL；新增五个模型详情页。概览仅承担选型和价格汇总，协议页仅承担端点和通用请求/响应，模型页承担模型专属能力、参数规则和示例。所有描述必须来自现有已验证的 Gateway 文档，不增加新的付费调用或上游行为结论。

**Tech Stack:** Mintlify 4.2.603、MDX、`docs.json` 导航、Git、`npx mintlify export`。

## Global Constraints

- 只修改 `api-reference/image-generation/` 和 `docs.json`，并新增对应模型 MDX；不改 API 路径、认证、SDK、发布配置或静态发布流程。
- 保留 `/api-reference/image-generation/overview`、`/synchronous`、`/asynchronous` URL；不要创建伪重定向或删除这些页面。
- 请求示例的 `model` 必须是 API 代号：`Image-GI`、`Image-GI2`、`Image-GPT2`、`Image-MI`、`qwen-image-3.0-pro`；展示名不能替代请求值。
- 不发起付费模型调用，不将有限实测写成通用上游规则；尺寸与质量规则沿用现有 Gateway 文档事实。
- 不使用 `example.com` 作为图生图 URL。若仓库中没有可公开访问且已授权展示的 KUNPO CDN 样例，在最终文案中保留“传入你的公网可访问 URL”的说明并向内容负责人索取实际样例 URL；不得伪造可运行 URL。
- `.codex/` 为本地未跟踪内容，不得加入任何提交。

---

## File Structure

| 路径 | 责任 |
|---|---|
| `api-reference/image-generation/models/nano-banana-pro.mdx` | Image-GI 的图生图、比例/质量规则和同步示例的唯一模型说明。 |
| `api-reference/image-generation/models/nano-banana-2.mdx` | Image-GI2 的选型和最小同步示例；其共享比例/质量规则显式链接到 Image-GI。 |
| `api-reference/image-generation/models/gpt-image-2.mdx` | Image-GPT2 的同步/异步选择、自定义 `WxH` 合约、GPT 专属参数。 |
| `api-reference/image-generation/models/qwen-image-3-pro.mdx` | Qwen 的同步、多模态文生图和图生图、`parameters` 与尺寸限制。 |
| `api-reference/image-generation/models/midjourney.mdx` | Image-MI 的最小同步示例、固定四图响应和无效参数限制。 |
| `api-reference/image-generation/overview.mdx` | 模型选型卡片、能力/计费汇总、通用认证与存储；不保留完整模型参数表。 |
| `api-reference/image-generation/synchronous.mdx` | 同步端点、通用请求/响应与一个通用示例；链接模型详情。 |
| `api-reference/image-generation/asynchronous.mdx` | 异步提交/查询/轮询协议；标注适用模型并链接模型详情。 |
| `docs.json` | “图片生成”下的“模型指南”嵌套分组，置于概览与协议页之间。 |

## Task 1: Create the Nano Banana and Midjourney model guides

**Files:**
- Create: `api-reference/image-generation/models/nano-banana-pro.mdx`
- Create: `api-reference/image-generation/models/nano-banana-2.mdx`
- Create: `api-reference/image-generation/models/midjourney.mdx`
- Reference: `api-reference/image-generation/overview.mdx:10-183`
- Reference: `api-reference/image-generation/synchronous.mdx:51-266`

**Interfaces:**
- Consumes: `/api-reference/image-generation/synchronous` as the sole shared endpoint and response contract.
- Produces: stable model-page URLs used by the overview, protocol pages and `docs.json`.

- [ ] **Step 1: Create the model directory and write frontmatter for all three pages.**

  Use the following title/description contract so navigation names, page titles and API aliases remain distinct:

  ```mdx
  ---
  title: "Nano Banana Pro（Image-GI）"
  description: "使用 Image-GI 进行文生图和基于公网参考图的图生图。"
  ---
  ```

  Use corresponding titles `Nano Banana 2（Image-GI2）` and `Midjourney（Image-MI）`. Each page starts with a one-sentence statement that the request body uses its API alias, not the display name.

- [ ] **Step 2: Write the Image-GI page as the shared Nano Banana parameter source.**

  Add sections in this exact order: `适用场景`、`调用方式`、`最小同步示例`、`尺寸与质量规则`、`图生图`、`限制与常见误用`、`相关文档`.

  The `尺寸与质量规则` section is the one complete source for the shared GI/GI2 table:

  ```mdx
  | 标准比例 | `size` 映射 |
  |----------|-------------|
  | 1:1 | `1024x1024` |
  | 16:9 | `1792x1024`、`1536x1024`、`1280x720`、`1536x864` |
  | 9:16 | `1024x1792`、`1024x1536`、`720x1280`、`864x1536` |
  | `auto` | 不支持 |
  ```

  State that unmatched or omitted `size` uses 1:1 and usually returns `1024×1024`; `quality` maps `low`/`medium`/`high` to `1K`/`2K`/`4K`; returned pixels are authoritative. Include a curl request with `model: "Image-GI"`, a ratio size and quality. Link to the shared synchronous protocol instead of reproducing the response schema.

- [ ] **Step 3: Write the Image-GI image-to-image boundary without retaining the invalid historical URL.**

  State that `images` is an array of publicly reachable URLs and recommend a KUNPO CDN image. Do not copy `https://example.com/ref.png`. The example must use the exact placeholder shape below until a content owner provides a verified public sample:

  ```json
  "images": ["<你的公网可访问参考图 URL>"]
  ```

  Add a Note that this placeholder is not a runnable URL and that inaccessible URLs can cause upstream download failures. This prevents a false working example while making the required input explicit.

- [ ] **Step 4: Write the Image-GI2 and Image-MI pages.**

  For Image-GI2, use a `model: "Image-GI2"` minimal synchronous request and link its `尺寸与质量规则` section to `/api-reference/image-generation/models/nano-banana-pro#尺寸与质量规则`, explicitly saying that GI2 follows the listed ratio and quality behavior.

  For Image-MI, use a `model: "Image-MI"` prompt-only request, show a four-item `data` response, and include this restriction text:

  ```mdx
  `Image-MI` 仅支持文生图（`model` + `prompt`）。`size`、`quality`、`images` 等参数对其无效；每次请求固定返回 4 张图片。
  ```

- [ ] **Step 5: Run focused content-contract checks.**

  Run:

  ```bash
  rg -n 'model": "(Image-GI|Image-GI2|Image-MI)"|example\.com|固定返回 4 张|`auto` \| 不支持' \
    api-reference/image-generation/models/{nano-banana-pro,nano-banana-2,midjourney}.mdx
  ```

  Expected: all three API aliases and the two documented restrictions are found; `example.com` has no match. Then run `git diff --check` and expect exit code 0.

- [ ] **Step 6: Commit the independent model-guide slice.**

  ```bash
  git add api-reference/image-generation/models/nano-banana-pro.mdx \
    api-reference/image-generation/models/nano-banana-2.mdx \
    api-reference/image-generation/models/midjourney.mdx
  git diff --cached --check
  git commit -m "docs: add nano banana and midjourney guides"
  ```

## Task 2: Create the GPT Image 2 and Qwen model guides

**Files:**
- Create: `api-reference/image-generation/models/gpt-image-2.mdx`
- Create: `api-reference/image-generation/models/qwen-image-3-pro.mdx`
- Reference: `api-reference/image-generation/overview.mdx:98-167`
- Reference: `api-reference/image-generation/synchronous.mdx:121-261`

**Interfaces:**
- Consumes: the shared sync URL `/api-reference/image-generation/synchronous` and async URL `/api-reference/image-generation/asynchronous`.
- Produces: one canonical home for GPT-specific settings and one canonical home for Qwen multimodal payloads.

- [ ] **Step 1: Write the GPT Image 2 page and its protocol choice.**

  Add the standard section order from Task 1. Under `调用方式`, label async as recommended for long jobs and sync as supported; link to both protocol pages. Its minimal example must use:

  ```json
  {
    "model": "Image-GPT2",
    "prompt": "扁平插画，一杯咖啡",
    "size": "1024x1536",
    "quality": "medium",
    "output_format": "png"
  }
  ```

  Add the standard-ratio table (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 and supported `auto`) and the exact custom-size contract: positive integer dimensions divisible by 16; each side at most 3840; ratio 1:3 through 3:1; total pixels 655,360 through 8,294,400; invalid values fall back to `1024×1024`.

- [ ] **Step 2: Write the Qwen page with all model-specific payloads.**

  Add a `仅支持同步调用` note with the 1 RPM/50–60 second boundary. Include three requests: prompt-only text-to-image; multimodal text-to-image; multimodal image-to-image. The two multimodal examples must retain both top-level `prompt` and this container shape:

  ```json
  "input": {
    "messages": [{
      "role": "user",
      "content": [{ "text": "..." }]
    }]
  },
  "parameters": {
    "prompt_extend": false,
    "n": 1,
    "watermark": false,
    "size": "1024*1024"
  }
  ```

  Preserve the image-to-image ordering requirement: image objects before the text instruction, and the text identifies the role of image 1 and image 2. Do not use top-level `image` or `images` in these Qwen examples.

- [ ] **Step 3: Add Qwen size and quality constraints exactly once.**

  Include: normal top-level `size` takes concrete `宽x高`; ratio forms such as `16:9` return HTTP 400 with `Expected format: '<width>*<height>'`; omitted size is model-recommended rather than fixed; allowed area is 262,144–4,194,304 pixels and ratio 1:8–8:1; `quality` is unsupported and should not be sent. Distinguish `parameters.size` (`1024*1024`) from normal top-level `size` (`宽x高`).

- [ ] **Step 4: Run focused content-contract checks.**

  ```bash
  rg -n 'Image-GPT2|655,360|8,294,400|qwen-image-3\.0-pro|input\.messages|1024\*1024|Expected format|quality.*不支持' \
    api-reference/image-generation/models/{gpt-image-2,qwen-image-3-pro}.mdx
  git diff --check
  ```

  Expected: every contract token is found and `git diff --check` exits 0.

- [ ] **Step 5: Commit the GPT and Qwen model-guide slice.**

  ```bash
  git add api-reference/image-generation/models/gpt-image-2.mdx \
    api-reference/image-generation/models/qwen-image-3-pro.mdx
  git diff --cached --check
  git commit -m "docs: add gpt and qwen image guides"
  ```

## Task 3: Reduce the overview to selection and shared platform facts

**Files:**
- Modify: `api-reference/image-generation/overview.mdx:10-183`

**Interfaces:**
- Consumes: all five stable model URLs from Tasks 1–2 and the two existing protocol URLs.
- Produces: the canonical model-selection, pricing and shared-authentication page.

- [ ] **Step 1: Replace the model table with a linked selection table.**

  Keep API aliases, display names, capability summaries, typical duration and the existing price table. Change each model name or a dedicated `查看指南` column to link to its new detail page. The table must not retain complete `size`/`quality` rules or model request bodies.

- [ ] **Step 2: Preserve only shared platform facts.**

  Keep authentication, CDN storage, `response_format: url` behavior, the two protocol cards and the pricing caveat. Replace the existing long `请求参数` through `quality` sections with a short common-parameter table (`model`, `prompt`, `response_format`) plus a callout linking each model page for model-specific fields.

- [ ] **Step 3: Move model-specific notes to their pages and leave a compact choice aid.**

  Retain the scenario-to-model choice table, but link its model values to the relevant guides. Remove Qwen payload details, GPT custom-dimension limits, GI/GI2 mapping lists and Midjourney parameter restrictions from this page; those complete facts must live on the model pages created earlier.

- [ ] **Step 4: Verify page responsibility by searching the overview.**

  ```bash
  rg -n 'Image-GI|Image-GI2|Image-GPT2|Image-MI|qwen-image-3\.0-pro|\$0\.18|\$0\.069' \
    api-reference/image-generation/overview.mdx
  ! rg -n '655,360|Expected format|1024\*1024|1792x1024' \
    api-reference/image-generation/overview.mdx
  git diff --check
  ```

  Expected: all aliases and price values remain discoverable; the specialized-rule tokens are absent; whitespace validation exits 0.

- [ ] **Step 5: Commit the overview migration.**

  ```bash
  git add api-reference/image-generation/overview.mdx
  git diff --cached --check
  git commit -m "docs: make image overview model-first"
  ```

## Task 4: Turn existing endpoint pages into protocol-only references

**Files:**
- Modify: `api-reference/image-generation/synchronous.mdx:10-267`
- Modify: `api-reference/image-generation/asynchronous.mdx:8-220`

**Interfaces:**
- Consumes: model-guide URLs and the existing endpoint URLs.
- Produces: protocol pages with no duplicate complete model-specific requests or parameter rules.

- [ ] **Step 1: Refactor the synchronous page.**

  Keep the endpoint, request/response schema, polling timeout warning and one generic `Image-GI2` multi-language example. Replace the model-specific Accordion group (GPT, Image-GI image-to-image, Image-MI and all Qwen examples) with a `CardGroup` whose cards link to all five model guides. Reduce the parameter descriptions for `size`, `quality`, `images`, `image`, `input`, `parameters`, `background`, `output_format` and `input_fidelity` to links to the owning model page.

- [ ] **Step 2: Refactor the asynchronous page.**

  Keep create/query endpoints, response schemas, status table, polling cadence and the Python workflow. Replace the static full model list with a short statement that readers must select a model guide first; add a link to GPT Image 2 as the long-running recommended example and an explicit Qwen synchronous-only link. Do not duplicate GPT size/quality rules or model-specific payloads.

- [ ] **Step 3: Check for removed model payload duplication and retained protocol facts.**

  ```bash
  ! rg -n 'Qwen Image 3\.0 Pro 多模态|1024\*1024|Image-MI 文生图（一次返回 4 张）|Image-GPT2 文生图' \
    api-reference/image-generation/synchronous.mdx
  rg -n 'POST https://llm\.ziy\.cc/v1/images/generations|data\[\]\.url|最长约 15 分钟' \
    api-reference/image-generation/synchronous.mdx
  rg -n 'POST https://llm\.ziy\.cc/v1/images/tasks|GET https://llm\.ziy\.cc/v1/images/tasks/:task_id|SUCCESS|FAILURE' \
    api-reference/image-generation/asynchronous.mdx
  git diff --check
  ```

  Expected: old model-specific accordion labels are absent, every common protocol token remains, and whitespace validation exits 0.

- [ ] **Step 4: Commit the protocol-page migration.**

  ```bash
  git add api-reference/image-generation/synchronous.mdx \
    api-reference/image-generation/asynchronous.mdx
  git diff --cached --check
  git commit -m "docs: separate image protocols from model guides"
  ```

## Task 5: Add navigation and run the final document regression suite

**Files:**
- Modify: `docs.json:29-34`
- Verify: `api-reference/image-generation/**/*.mdx`

**Interfaces:**
- Consumes: the five files created in Tasks 1–2 and preserved protocol URLs.
- Produces: a reachable Mintlify navigation tree and a verified static documentation archive.

- [ ] **Step 1: Update the nested image-generation navigation.**

  Replace the current three-item `pages` list with this exact order:

  ```json
  [
    "api-reference/image-generation/overview",
    {
      "group": "模型指南",
      "pages": [
        "api-reference/image-generation/models/nano-banana-pro",
        "api-reference/image-generation/models/nano-banana-2",
        "api-reference/image-generation/models/gpt-image-2",
        "api-reference/image-generation/models/qwen-image-3-pro",
        "api-reference/image-generation/models/midjourney"
      ]
    },
    "api-reference/image-generation/synchronous",
    "api-reference/image-generation/asynchronous"
  ]
  ```

- [ ] **Step 2: Validate paths, aliases and invalid reference URLs before export.**

  ```bash
  for path in \
    api-reference/image-generation/models/nano-banana-pro.mdx \
    api-reference/image-generation/models/nano-banana-2.mdx \
    api-reference/image-generation/models/gpt-image-2.mdx \
    api-reference/image-generation/models/qwen-image-3-pro.mdx \
    api-reference/image-generation/models/midjourney.mdx; do
    test -f "$path"
  done
  ! rg -n 'example\.com' api-reference/image-generation
  rg -n '"model": "(Image-GI|Image-GI2|Image-GPT2|Image-MI|qwen-image-3\.0-pro)"' \
    api-reference/image-generation/models
  git diff --check
  ```

  Expected: all five files exist, no invalid example URL remains, every API alias appears inside a request, and the diff has no whitespace errors.

- [ ] **Step 3: Run the Mintlify export and archive integrity check.**

  ```bash
  npx --no-install mintlify export --output /tmp/kunpo-image-model-guide-verify.zip
  unzip -t /tmp/kunpo-image-model-guide-verify.zip
  ```

  Expected: Mintlify reports a successful export and `unzip -t` reports no archive errors.

- [ ] **Step 4: Run a local visual/navigation check without displacing an existing preview.**

  First inspect port 3333 with `lsof -nP -iTCP:3333 -sTCP:LISTEN`. If it is free, start `npx --no-install mintlify dev --port 3333`; otherwise start it on 3334. Open the overview, each model guide, synchronous and asynchronous pages. Confirm the “模型指南” group is visible, code blocks render, each link resolves and no page contains duplicated full protocol content.

- [ ] **Step 5: Perform the final staged review and commit.**

  ```bash
  git add -- docs.json
  git diff --cached --check
  git diff --cached --unified=0 | \
    rg -n -i '^\+[^+].*(api[_-]?key|authorization:|bearer[[:space:]]|secret|password|token[[:space:]]*[:=])' | \
    rg -v 'Authorization: Bearer sk-你的密钥' || true
  git diff --cached --stat
  git commit -m "docs: organize image generation by model"
  ```

  Expected: the sensitive-pattern command prints nothing after excluding the standard key placeholder, the stat contains only `docs.json` because earlier tasks committed their own MDX slices, and the commit does not include `.codex/`.
