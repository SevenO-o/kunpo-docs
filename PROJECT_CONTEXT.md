# KUNPO API 文档项目上下文

> 本文档供 AI 助手阅读，以便快速理解项目全貌并继续维护文档。
> **编辑文档前务必先读 [DOCS_MAINTENANCE.md](./DOCS_MAINTENANCE.md)**（防重复、模型名、页面职责的完整规范）。
> 最后更新：2026-07-31

---

## 项目概述

KUNPO API 是一个统一的大语言模型（LLM）网关服务，用户通过一个 API Key 即可调用 150+ 主流模型（Claude、GPT、Gemini、DeepSeek、Qwen、GLM 等）。API 地址为 `https://llm.ziy.cc`。

本文档项目是该服务的官方 API 文档站点，面向开发者，内容包含文本、图片、音频、视频接口说明、请求示例与客户端接入指南等。

---

## 技术栈

- **文档框架**：[Mintlify](https://mintlify.com)（主题：maple）
- **文件格式**：MDX（Markdown + JSX 组件）
- **配置文件**：`docs.json`（导航结构、主题色、页脚等）
- **开发服务器**：`npx mintlify dev --port 3333`
- **静态导出**：`npx mintlify export`（输出 `export.zip`）
- **线上地址**：https://docs.ziy.cc

---

## 文件结构

```
docs/
├── docs.json                                  # Mintlify 配置（导航、主题等）
├── index.mdx                                  # 首页：热门模型卡片 + 核心能力 + 接入方式
├── quick-start.mdx                            # 快速开始：获取 Key → 第一个请求 → 流式输出
├── api-reference/
│   ├── overview.mdx                           # API 总览索引
│   ├── text-chat.mdx                          # 文本对话 (Chat Completions)
│   ├── claude-messages.mdx                    # Claude Messages API (Anthropic 原生)
│   ├── seed-audio.mdx                          # 豆包 Seed Audio 音频生成
│   ├── doubao-video.mdx                       # 豆包视频生成 (Seedance 2.0)
│   └── image-generation/
│       ├── overview.mdx                       # 图片生成概览：模型列表、参数映射、计费
│       ├── synchronous.mdx                    # 同步接口 POST /v1/images/generations
│       └── asynchronous.mdx                   # 异步接口 POST /v1/images/tasks
└── client-integration/
    ├── claude-code.mdx                        # Claude Code 接入
    ├── cc-switch.mdx                          # CC Switch 接入
    ├── lobechat.mdx                           # LobeChat 接入
    └── openai-compatible.mdx                  # 通用 OpenAI 兼容客户端
```

---

## 导航结构（docs.json）

| 分组 | 页面 |
|------|------|
| 开始 | index, quick-start |
| API 接口 | overview, text-chat, claude-messages, image-generation/*, seed-audio, doubao-video |
| 客户端接入 | claude-code, cc-switch, lobechat, openai-compatible |

---

## Mintlify 组件使用约定

项目中已使用的 Mintlify 内置组件，编辑时须遵循以下写法：

| 组件 | 用途 | 示例 |
|------|------|------|
| `<CodeGroup>` | 多语言代码标签切换 | 包裹多个 ` ```bash cURL ` / ` ```python Python ` 块 |
| `<ParamField>` | API 参数说明 | `<ParamField path="model" type="string" required>` |
| `<Accordion>` / `<AccordionGroup>` | 折叠面板 | 用于详细示例、可选参数说明 |
| `<Warning>` | 黄色警告横幅 | 重要限制、注意事项 |
| `<Note>` | 蓝色提示横幅 | 补充说明、备注 |
| `<Tip>` | 绿色建议横幅 | 最佳实践、小技巧 |
| `<Card>` / `<CardGroup>` | 卡片链接 | 首页导航、模型展示 |
| `<Steps>` / `<Step>` | 步骤引导 | LobeChat 配置流程 |

**注意**：Mintlify 的 `<Endpoint>` 组件不支持显示完整 URL，项目中已改用普通代码块展示接口地址：
````
```
POST https://llm.ziy.cc/v1/chat/completions
```
````

---

## 各页面当前状态

### index.mdx（首页）
- 热门模型卡片：Gemini 3.1 Flash Lite、Claude Sonnet 4.6、DeepSeek-R1（链到 quick-start 锚点）
- 图片生成卡片：对外展示 Nano Banana Pro / Nano Banana 2 / GPT Image 2 / Midjourney（API 调用仍用 Image-GI 等代号）
- 无 GitHub 等占位外链

### quick-start.mdx（快速开始）
- 示例模型：`google/gemini-3.1-flash-lite`、`DeepSeek-R1-0528`
- DeepSeek Note：说明 `reasoning_content` 字段
- 锚点：`#gemini-3-1-flash-lite`、`#deepseek-r1-0528`

### text-chat.mdx（文本对话）
- 接口地址以代码块展示：`POST https://llm.ziy.cc/v1/chat/completions`
- 通用参数：model, messages, stream, temperature, max_tokens, top_p
- Gemini 专属参数：
  - `extra_body.generationConfig.thinkingConfig.thinkingBudget`（0 关闭，1~65536，建议 8000/16000）
  - Warning：仅对 Gemini 2.5 Pro/Flash 有效
  - `extra_body.generationConfig.responseMimeType`（JSON 输出）
  - `extra_body.safetySettings`（4 个安全类别 + 4 个 threshold 级别）
- 请求示例：基础对话、多轮对话、流式输出
- 响应格式：非流式 + 流式（SSE）
- 视觉理解（多模态）示例
- DeepSeek 系列说明：无前缀（OpenAI 兼容）vs `c/` 前缀（Claude 兼容）

### claude-messages.mdx（Claude Messages API）
- 接口地址：`POST https://llm.ziy.cc/v1/messages`
- 模型名不带 `anthropic/` 前缀：`Claude-Sonnet-4.6`、`claude-opus-4.6`、`claude-haiku-4.5`
- Python SDK `base_url` 设为 `https://llm.ziy.cc`（不加 `/v1`）
- DeepSeek 兼容模型（`c/` 前缀）：v3-2、v4-flash、v4-pro + 选择建议表
- Chat Completions vs Messages 对比表

### image-generation/overview.mdx（图片生成概览）
- 支持模型表含「API 模型名 ↔ 对应名称」：Nano Banana Pro / Nano Banana 2 / GPT Image 2 / Midjourney
- 模型选择建议表、按次计费表（唯一维护位置）

### image-generation/synchronous.mdx（同步接口）
- 接口：`POST https://llm.ziy.cc/v1/images/generations`
- 参数表含 `response_format`：传入 `b64_json` 仍返回 URL
- 代码示例：cURL / Python / Node.js / Python (OpenAI SDK)
- Accordion 示例：
  - Image-GPT2 文生图（含 `response_format: b64_json` + Note 说明实际返回 URL）
  - 图生图（参考图 URL）
  - Image-MI 文生图（一次返回 4 张）
- Warning：同步最长等待 15 分钟

### image-generation/asynchronous.mdx（异步接口）
- 提交：`POST https://llm.ziy.cc/v1/images/tasks`
- 查询：`GET https://llm.ziy.cc/v1/images/tasks/:task_id`
- metadata 参数：quality、output_format、background、input_fidelity 等
- 完整 Python 异步工作流示例

### seed-audio.mdx（豆包 Seed Audio 音频生成）
- 接口：`POST https://llm.ziy.cc/v1/audio/speech`，成功时返回音频二进制
- 支持 OpenAI 兼容参数与豆包原生参数、参考音频/图片、音频输出配置和水印
- `references[].image_url` 已通过 Pexels 公网图片实测

### doubao-video.mdx（豆包视频生成）
- 模型：doubao-seedance-2-0-260128（高品质）/ doubao-seedance-2-0-fast-260128（快速）
- 异步模式：提交 → 轮询
- 文生视频 / 图生视频 / 首尾帧控制
- metadata.content 多模态输入

### client-integration/claude-code.mdx
- `ANTHROPIC_BASE_URL=https://llm.ziy.cc`（不加 `/v1`）
- 环境变量 / 配置文件两种方式
- 常见问题：404、超时、切换模型

### client-integration/cc-switch.mdx
- 通过 CC Switch 统一管理 Claude Code、Codex、Gemini CLI 等工具的 KUNPO API Provider 配置
- 包含安装、Claude Code 接入、其他 CLI 配置与常见问题

### client-integration/lobechat.mdx
- API Base URL：`https://llm.ziy.cc/v1`
- Steps 组件引导配置

### client-integration/openai-compatible.mdx
- base_url：`https://llm.ziy.cc/v1`
- 模型命名规则：海外 `供应商/模型名`，国内直接用名称
- 已验证客户端列表：Claude Code、LobeChat、Cherry Studio、Open WebUI、ChatBox、BoltAI

---

## 重要约定和决策

1. **API 地址展示**：统一使用代码块（非 Endpoint 组件），格式为 `POST https://llm.ziy.cc/v1/...`
2. **API Key 占位符**：统一使用 `sk-你的密钥`
3. **Claude 模型名**：
   - Anthropic 原生格式（Messages API）：不带前缀，如 `Claude-Sonnet-4.6`
   - OpenAI 兼容格式（Chat Completions）：带前缀，如 `anthropic/claude-sonnet-4.6`
4. **DeepSeek 模型名**：quick-start / text-chat 示例用 `DeepSeek-R1-0528`；首页卡片标题仍为 DeepSeek-R1
5. **图片生成**：参数映射/计费只在 overview 维护；sync/async 不重复
6. **图片 response_format**：传入 `b64_json` 仍返回 CDN URL
7. **docs.json**：无 navbar/footer GitHub 占位链接
8. **Seed Audio 响应**：成功时读取音频二进制，不调用 `response.json()`；图片参考使用火山服务可访问的公网 URL

---

## 已知问题和备注

- Mintlify 搜索功能在本地预览不可用（需登录 CLI），这是 Mintlify 限制，非配置问题
- `npx mintlify export` 导出的 zip 中 `Start Docs.command` 需要 `chmod +x` 才能在 macOS 直接双击运行
- 静态导出的 serve.js 默认使用 3000 端口，可能被占用
- Image-GPT2 的 `response_format: b64_json` 实际仍返回 URL，这是网关行为，非 bug

---

## 开发命令速查

```bash
# 启动开发服务器
cd /Users/kunpo/Projects/work/doc/docs
npx mintlify dev --port 3333

# 导出静态 HTML 到项目目录
rm -rf kunpo-api-docs-export
mintlify export --output /tmp/export.zip && unzip -q /tmp/export.zip -d kunpo-api-docs-export
```

---

## 后续可扩展方向

以下是目前文档中尚未覆盖但可能需要新增的内容：

- 更多客户端接入（如 BoltAI、Cherry Studio、Open WebUI 的详细配置）
- Tool Use / Function Calling 接口文档
- 语音/音频相关 API（如有上线）
- 批量请求 (Batch API) 文档
- 模型列表页面（当前引导至后台控制台）
- 错误码详细说明
- 速率限制 / 配额说明
