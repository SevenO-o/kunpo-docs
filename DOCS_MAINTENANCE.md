# KUNPO API 文档维护规范

> **AI 助手必读**：编辑本仓库任何 `.mdx` / `docs.json` 前，先读本文档。目标是**避免内容重复、模型名不一致、示例不可用**。

> **内容基准**：以原文档为准。模型调用名由 KUNPO 中台定义并适配，未经用户明确确认，不得按供应商官方名称、协议习惯或代码推测修改前缀、大小写和版本号。原文之间有差异时先记录，不自行统一。结构整理应逐块比对代码示例，保留原有接口、模型名、参数与响应字段。

> **前缀说明修正**：用户已指出供应商前缀信息不准确。不得使用“海外模型加供应商前缀、国内模型无前缀”的通用规则，也不得维护按供应商推断的前缀列。引导读者从 `https://llm.ziy.cc/pricing` 复制完整模型 ID；现有调用示例保持原样，不自行增删前缀。

---

## 1. 页面职责（单一信息源）

每类信息**只在一处完整维护**，其他页面用链接引用，禁止复制粘贴大段相同内容。

| 信息类型 | 唯一维护位置 | 其他页面怎么做 |
|----------|-------------|----------------|
| API 端点总览、协议对比 | `api-reference/overview.mdx` | 首页 / 各 API 页只放一句摘要 + 链接 |
| 文本对话完整参数 | `api-reference/text-chat.mdx` | quick-start 只保留最小示例 |
| Claude Messages 完整说明 | `api-reference/claude-messages.mdx` | 不在 text-chat 重复 Messages 示例 |
| 图片模型列表、选择建议、计费 | `api-reference/image-generation/overview.mdx` | sync/async 页不重复计费表和模型表 |
| 图片模型能力、size/quality、专属参数和示例 | `api-reference/image-generation/models/*.mdx` | 概览和协议页直接链接模型章节，不复制完整规则 |
| GI/GI2 共用比例与分辨率规则 | `snippets/image-generation/nano-banana-parameters.mdx` | 两个模型页导入同一片段，各页均可直接阅读 |
| GI/GI2/GPT 共用参考图格式 | `snippets/image-generation/reference-inputs.mdx` | 对应模型页导入；Qwen 的不同输入规则仅在 Qwen 页维护 |
| 同步图片公共请求、响应与多语言示例 | `api-reference/image-generation/synchronous.mdx` | 模型页保留最小请求和结果读取指引，完整协议只链接 |
| 异步图片提交、查询、状态与恢复流程 | `api-reference/image-generation/asynchronous.mdx` | 模型页保留最小请求和查询入口，不复制完整轮询程序 |
| 音频生成参数与示例 | `api-reference/seed-audio.mdx` | 不在其他页面重复参考资源、输出配置或响应约定 |
| 快速开始（第一次调用） | `quick-start.mdx` | 不展开高级参数 |
| 首页卡片与一句话介绍 | `index.mdx` | 必须与真实模型/能力一致，细节链到子页 |
| 客户端接入步骤 | `client-integration/*.mdx` | 不在 API 页重复客户端配置 |

### 禁止行为

- ❌ 在 sync + async + overview 三处各写一份完整参数表
- ❌ 在 index、quick-start、overview 三处各写一份模型列表
- ❌ 新增「错误码页」时把 text-chat 已有错误表原样复制过去（应链接或只写增量）
- ❌ 修改示例模型时只改一处，其他页面遗留旧模型名
- ❌ 在概览重新堆放模型专属尺寸、参考图或透明背景规则
- ❌ 以“推荐同步/异步”替代明确的接口支持范围

---

## 2. 原文模型名（修改须经明确确认）

以下模型名已在当前 Key 下实测或确认可用，**文档示例优先使用这些名称**：

### 快速开始 `quick-start.mdx`

| 用途 | 模型名 |
|------|--------|
| 海外模型示例 | `google/gemini-3.1-flash-lite` |
| 国内推理模型 | `DeepSeek-R1-0528` |

> `DeepSeek-R1-0528` 会返回 `reasoning_content`，quick-start 已有 Note 说明，勿删。

### 文本对话 `text-chat.mdx`

| 用途 | 模型名 |
|------|--------|
| 通用示例 | `anthropic/claude-sonnet-4.6` |
| 视觉理解 | `openai/gpt-5.4` |
| DeepSeek 原生格式 | `DeepSeek-R1-0528` |

### Claude Messages `claude-messages.mdx`

| 用途 | 模型名 |
|------|--------|
| Claude 原生 | `Claude-Sonnet-4.6`（无 `anthropic/` 前缀） |
| DeepSeek 兼容 | `c/deepseek-v4-pro` |

### Chat Completions 中 Claude 模型

| 格式 | 模型名 |
|------|--------|
| OpenAI 兼容 | `anthropic/claude-sonnet-4.6`（小写 + 前缀） |

### 图片生成（API 调用代号 vs 首页展示名）

对外展示名（首页「核心能力」等用户向文案）与 API `model` 参数对照：

| API `model` | 对外展示名 |
|-------------|-----------|
| `Image-GI` | Nano Banana Pro |
| `Image-GI2` | Nano Banana 2 |
| `Image-GPT2` | GPT Image 2 |
| `Image-MI` | Midjourney |
| `qwen-image-3.0-pro` | Qwen Image 3.0 Pro |

- **首页 / 营销文案**：使用上表「对外展示名」，不写 `Image-GI` 等代号
- **API 文档 / 代码示例**：继续使用 `Image-GI`、`Image-GI2`、`Image-GPT2`、`Image-MI`、`qwen-image-3.0-pro`
- **模型页标题 / 侧栏**：使用对外展示名；正文开头醒目标注 API 调用名，示例 `model` 必须使用调用代号

**禁止**在 API 示例页把 `model` 改成展示名；**禁止**在首页把展示名改成未上表所列的别称（如即梦、DALL-E）。

### 已知不可用（勿放入 quick-start 示例）

- `google/gemini-2.5-pro-preview-06-05`
- `deepseek/deepseek-chat-v3-0324`
- `gpt-image-2`（已更名为 `Image-GPT2`）

---

## 3. 平台行为（文档须如实描述，勿按 OpenAI 原文抄）

| 行为 | 正确描述 |
|------|----------|
| 图片 `response_format: b64_json` | 实际仍返回 CDN `url`，`b64_json` 为空；公共定义在同步页，GPT 页说明与 `output_format` 的区别 |
| 图片存储 | 统一转存 KUNPO CDN：`https://kunpoapiimg.ziy.cc/...` |
| 图片计费 | 五款模型均为**按次计费**，价格表只在 overview 维护 |
| 图生图参考图 | `Image-GI`、`Image-GI2`、`Image-GPT2` 的 `images[]` 支持公网 URL、Base64 或 data URL；Qwen 多模态 `content[].image` 支持公网 URL 或 data URL，不支持裸 Base64 |
| Claude Code Base URL | `https://llm.ziy.cc`（不加 `/v1`） |
| OpenAI 兼容 Base URL | `https://llm.ziy.cc/v1` |
| API Key 占位符 | 统一 `sk-你的密钥` |

---

## 4. 导航与配置 `docs.json`

- 新页面**必须**加入 `docs.json` 对应分组，否则 export 不会包含
- **不要**添加 GitHub 等占位外链（已移除 navbar/footer socials）
- API 接口分组顺序：`overview` → `text-chat` → `claude-messages` → 图像生成子组 → `seed-audio` → `doubao-video`
- 图像生成子组顺序：概览与模型选择 → Nano Banana Pro → Nano Banana 2 → GPT Image 2 → Qwen Image 3.0 Pro → Midjourney → 同步调用 → 异步任务与结果查询
- 五个模型页直接放在图像生成子组内，不再嵌套“模型指南”分组
- 保留现有 `overview`、`synchronous`、`asynchronous` URL；迁移内容时保留旧锚点，并提供指向新章节的短链接说明
- 概览按需求提供快捷入口；模型支持范围与计费只在概览汇总
- 文本、音频、视频页面标题统一使用“能力（协议或产品）”；这只改变导航展示，不修改代码中的模型调用名
- 首页按用途提供文本、图像、音频、视频入口，再列出首次使用、客户端接入、常用入口和原有热门模型
- 快速开始先展示原有 Gemini 的 cURL / Python / Node.js 示例和结果读取方式，再放下一步、原有 DeepSeek 示例、流式用法与可用模型表

---

## 5. Mintlify 组件约定

| 组件 | 用途 |
|------|------|
| `<CodeGroup>` | 多语言/多 Tab 代码切换 |
| `<ParamField>` | API 参数（text-chat、doubao-video） |
| `<Accordion>` | 可选示例，避免正文过长 |
| `<Note>` / `<Warning>` / `<Tip>` | 补充说明，不重复正文已有表格 |
| `<Card href="...">` | 导航卡片；跳转到子页或锚点 |
| MDX import + 组件 | 从 `snippets/` 导入共用内容；片段不加入侧栏，不作为独立页面 |

模型页正文顺序：模型简介与 API 调用名 → 支持及推荐的调用方式 → 最小示例与结果获取 → 能力用法 → 参数限制 → 常见问题 → 相关文档。参考图格式等必要说明直接展示，不藏在可选示例折叠区。

所有页面使用 frontmatter 的 `title` 作为页面主标题，正文从介绍和二级标题开始，不再写重复的 `# 标题`。旧主标题锚点可用 `<span id="..." />` 保留。代码块内的 `#` 注释不能当成页面标题删除。

接口地址用代码块，不用 `<Endpoint>`：

```
POST https://llm.ziy.cc/v1/chat/completions
```

锚点写法（quick-start 模型跳转）：

```markdown
### Gemini 3.1 Flash Lite {#gemini-3-1-flash-lite}
```

---

## 6. 修改检查清单（AI 完成后必做）

编辑文档后，逐项确认：

- [ ] 是否与其他页面**重复**了参数表、模型表、计费表、错误表？
- [ ] 模型名变更是否已 `grep` 全仓库 `.mdx`？
- [ ] 首页 `index.mdx` 描述是否与 overview 一致？
- [ ] 示例 URL 是否避免 `example.com`？
- [ ] `docs.json` 导航是否需同步？
- [ ] `PROJECT_CONTEXT.md` 页面状态摘要是否需更新（仅结构性变更时）？
- [ ] 模型专属规则是否只在模型页或共用片段维护？
- [ ] 老链接和锚点是否仍可访问并引导到新内容？
- [ ] 是否通过 Mintlify validate、broken-links（含锚点和重定向目标）及页面预览检查？
- [ ] 结构调整前后的代码块是否一致（仅允许整体缩进、位置和语言标签变化）？涉及技术内容变更时是否已有用户明确确认？

---

## 7. 构建产物（勿手动编辑）

| 路径 | 说明 |
|------|------|
| `kunpo-api-docs-export/` | 静态 HTML 导出目录，由命令生成 |
| `.mintlify/` | 本地缓存 |
| `*.zip` | 导出压缩包 |

修改源文档后重新导出：

```bash
npm ci
npm run docs:export
```

脚本会导出 Mintlify 页面、生成 Pagefind 中文索引、接入搜索弹窗，再打包为 `kunpo-api-docs-export.zip`。搜索只索引 `docs.json` 导航中的页面正文、标题与代码示例，不索引侧栏或仓库草稿。模型 ID 和参数名按原文检索，多个关键词按全部包含匹配。

本地体验完整静态站点（含搜索，默认端口 5500）：

```bash
npm run docs:preview
```

日常 MDX 热更新仍可使用 `mintlify dev --port 3333`；该模式是 Mintlify 原生搜索，Pagefind 搜索在导出后生效。修改源文档或搜索脚本后须重新导出。访客点击侧栏搜索或按 `⌘K` / `Ctrl+K` 即可使用，无需登录。

搜索实现位于 `scripts/build-search.mjs` 和 `scripts/search/`；运行 `npm run test:search` 检查索引生成、模型 ID 匹配、正文隔离与 HTML 注入。发布流程也会自动生成并校验搜索资源，不能直接上传未经后处理的 Mintlify 原始 ZIP。

---

## 8. 文件结构速查

```
docs/
├── docs.json                          # 导航（改页面必改此文件）
├── DOCS_MAINTENANCE.md                # 本文档
├── PROJECT_CONTEXT.md                 # 项目上下文摘要
├── index.mdx                          # 首页（摘要 + 卡片）
├── quick-start.mdx                    # 快速开始
├── api-reference/
│   ├── overview.mdx                   # API 总览索引
│   ├── text-chat.mdx
│   ├── claude-messages.mdx
│   ├── seed-audio.mdx
│   ├── doubao-video.mdx
│   └── image-generation/
│       ├── overview.mdx               # 模型选择、支持矩阵、计费与快捷入口
│       ├── synchronous.mdx            # 同步公共请求与响应
│       ├── asynchronous.mdx           # 异步提交、查询、状态与恢复
│       └── models/
│           ├── nano-banana-pro.mdx
│           ├── nano-banana-2.mdx
│           ├── gpt-image-2.mdx
│           ├── qwen-image-3-pro.mdx
│           └── midjourney.mdx
├── snippets/image-generation/
│   ├── nano-banana-parameters.mdx     # GI/GI2 共用规则
│   └── reference-inputs.mdx           # GI/GI2/GPT 共用参考图格式
└── client-integration/
    ├── claude-code.mdx
    ├── cc-switch.mdx
    ├── lobechat.mdx
    └── openai-compatible.mdx
```

---

## 9. 常见错误案例（勿再犯）

| 错误 | 正确做法 |
|------|----------|
| 在 sync 页新增完整计费表 | 只在 overview 维护，sync 加链接 |
| quick-start 用未验证模型 | 只用第 2 节已验证模型 |
| 首页写「DALL-E / 即梦」等未接入模型 | 首页图片能力写展示名表五款；API 页用 API `model` 名 |
| Image-GPT2 写成 OpenAI 直连 | API 页用代号 `Image-GPT2`，展示名 GPT Image 2 |
| 三处都写 DeepSeek 说明 | text-chat 写 OpenAI 格式，claude-messages 写 c/ 前缀，互相链接 |
| 导出后手动改 HTML | 改 `.mdx` 后重新 export |
