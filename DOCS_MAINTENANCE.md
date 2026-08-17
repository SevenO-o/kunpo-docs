# KUNPO API 文档维护规范

> **AI 助手必读**：编辑本仓库任何 `.mdx` / `docs.json` 前，先读本文档。目标是**避免内容重复、模型名不一致、示例不可用**。

---

## 1. 页面职责（单一信息源）

每类信息**只在一处完整维护**，其他页面用链接引用，禁止复制粘贴大段相同内容。

| 信息类型 | 唯一维护位置 | 其他页面怎么做 |
|----------|-------------|----------------|
| API 端点总览、协议对比 | `api-reference/overview.mdx` | 首页 / 各 API 页只放一句摘要 + 链接 |
| 文本对话完整参数 | `api-reference/text-chat.mdx` | quick-start 只保留最小示例 |
| Claude Messages 完整说明 | `api-reference/claude-messages.mdx` | 不在 text-chat 重复 Messages 示例 |
| 图片模型列表、选择建议、计费 | `api-reference/image-generation/overview.mdx` | sync/async 页不重复计费表和模型表 |
| 图片 size/quality 映射规则 | `image-generation/overview.mdx` | sync 页参数表写「详见概览页」 |
| 同步图片接口参数与示例 | `image-generation/synchronous.mdx` | 不写完整映射规则 |
| 异步图片接口参数与示例 | `image-generation/asynchronous.mdx` | 不写完整映射规则 |
| 音频生成参数与示例 | `api-reference/seed-audio.mdx` | 不在其他页面重复参考资源、输出配置或响应约定 |
| 快速开始（第一次调用） | `quick-start.mdx` | 不展开高级参数 |
| 首页卡片与一句话介绍 | `index.mdx` | 必须与真实模型/能力一致，细节链到子页 |
| 客户端接入步骤 | `client-integration/*.mdx` | 不在 API 页重复客户端配置 |

### 禁止行为

- ❌ 在 sync + async + overview 三处各写一份完整参数表
- ❌ 在 index、quick-start、overview 三处各写一份模型列表
- ❌ 新增「错误码页」时把 text-chat 已有错误表原样复制过去（应链接或只写增量）
- ❌ 修改示例模型时只改一处，其他页面遗留旧模型名

---

## 2. 已验证模型名（修改须全局搜索替换）

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

**禁止**在 API 示例页把 `model` 改成展示名；**禁止**在首页把展示名改成未上表所列的别称（如即梦、DALL-E）。

### 已知不可用（勿放入 quick-start 示例）

- `google/gemini-2.5-pro-preview-06-05`
- `deepseek/deepseek-chat-v3-0324`
- `gpt-image-2`（已更名为 `Image-GPT2`）

---

## 3. 平台行为（文档须如实描述，勿按 OpenAI 原文抄）

| 行为 | 正确描述 |
|------|----------|
| 图片 `response_format: b64_json` | 实际仍返回 CDN `url`，`b64_json` 为空；overview + sync 已说明 |
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
- API 接口分组顺序：`overview` → `text-chat` → `claude-messages` → 图片生成子组 → `seed-audio` → `doubao-video`
- 图片生成子组顺序：`overview` → `synchronous` → `asynchronous`

---

## 5. Mintlify 组件约定

| 组件 | 用途 |
|------|------|
| `<CodeGroup>` | 多语言/多 Tab 代码切换 |
| `<ParamField>` | API 参数（text-chat、doubao-video） |
| `<Accordion>` | 可选示例，避免正文过长 |
| `<Note>` / `<Warning>` / `<Tip>` | 补充说明，不重复正文已有表格 |
| `<Card href="...">` | 导航卡片；跳转到子页或锚点 |

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

---

## 7. 构建产物（勿手动编辑）

| 路径 | 说明 |
|------|------|
| `kunpo-api-docs-export/` | 静态 HTML 导出目录，由命令生成 |
| `.mintlify/` | 本地缓存 |
| `*.zip` | 导出压缩包 |

修改源文档后重新导出：

```bash
cd docs
rm -rf kunpo-api-docs-export
mintlify export --output /tmp/export.zip
unzip -q /tmp/export.zip -d kunpo-api-docs-export
```

本地预览：

```bash
mintlify dev --port 3000
# 或进入 kunpo-api-docs-export && node serve.js
```

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
│       ├── overview.mdx               # 图片：模型/计费/映射（主）
│       ├── synchronous.mdx            # 图片：同步接口
│       └── asynchronous.mdx           # 图片：异步接口
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
