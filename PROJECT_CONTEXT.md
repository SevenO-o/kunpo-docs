# KUNPO API 文档项目上下文

> 本文档供 AI 助手阅读，以便快速理解项目全貌并继续维护文档。
> **编辑文档前务必先读 [DOCS_MAINTENANCE.md](./DOCS_MAINTENANCE.md)**（防重复、模型名、页面职责的完整规范）。
> 最后更新：2026-09-03（图像生成第一阶段及首页、快速开始结构调整）

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
- **静态导出**：`npm run docs:export`（含 Pagefind 搜索，输出 `kunpo-api-docs-export.zip`）
- **静态预览**：`npm run docs:preview`（默认端口 5500）
- **线上地址**：https://docs.ziy.cc

---

## 文件结构

```
docs/
├── docs.json                                  # Mintlify 配置（导航、主题等）
├── index.mdx                                  # 首页：按用途开始 → 首次使用 → 客户端与常用入口
├── quick-start.mdx                            # 快速开始：原有 Gemini 主线 → DeepSeek 与流式用法
├── api-reference/
│   ├── overview.mdx                           # API 总览索引
│   ├── text-chat.mdx                          # 文本对话 (Chat Completions)
│   ├── claude-messages.mdx                    # Claude Messages API (Anthropic 原生)
│   ├── seed-audio.mdx                          # 豆包 Seed Audio 音频生成
│   ├── doubao-video.mdx                       # 豆包视频生成 (Seedance 2.0)
│   └── image-generation/
│       ├── overview.mdx                       # 概览与模型选择：需求入口、能力矩阵、计费
│       ├── synchronous.mdx                    # 同步调用：公共请求、响应和多语言示例
│       ├── asynchronous.mdx                   # 异步任务与结果查询：状态、轮询和恢复
│       └── models/
│           ├── nano-banana-pro.mdx
│           ├── nano-banana-2.mdx
│           ├── gpt-image-2.mdx
│           ├── qwen-image-3-pro.mdx
│           └── midjourney.mdx
├── snippets/image-generation/
│   ├── nano-banana-parameters.mdx             # GI/GI2 共用尺寸与分辨率规则
│   └── reference-inputs.mdx                   # GI/GI2/GPT 共用参考图格式
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

图像生成子组直接展示“概览与模型选择 → 五个模型页 → 同步调用 → 异步任务与结果查询”，不再增加模型指南层级。侧栏显示产品名，正文和代码明确 API 调用名。原有三页 URL 和内容迁移涉及的旧锚点保留为入口。

文本、音频和视频导航标题统一为“能力（协议或产品）”。所有页面只保留一个可见主标题，旧标题锚点保留。页面路径不变。

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
- 按用途进入文本对话、图像生成、音频生成、视频生成；音视频介绍沿用现有 API 总览
- 首次使用路径、四个客户端入口（含 CC Switch）、API 总览和常见 HTTP 状态码入口
- 原有热门模型卡片和基础信息置后；保留其内容及旧入口锚点
- 图像生成卡片继续使用原有展示名，代码中的 API 调用名不变
- 无 GitHub 等占位外链

### quick-start.mdx（快速开始）
- 主线使用原有 `google/gemini-3.1-flash-lite` 示例，cURL / Python / Node.js 合并为同一 CodeGroup
- 原有 `DeepSeek-R1-0528` 请求和响应放在后续推理模型示例章节，流式用法随后展示
- 可用模型表收进折叠区，保留模型示例，移除不准确的供应商前缀列；折叠区外引导从模型广场复制完整模型 ID
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
- DeepSeek 章节增加稳定锚点 `deepseek-compatible-models`，修复文本对话页跳转并保留原有入口

### image-generation/overview.mdx（概览与模型选择）
- 按需求进入第一张图、参考图、透明背景和多张候选图的具体模型章节
- 模型矩阵区分文生图、图生图、同步支持、异步支持与推荐方式
- 模型选择建议、按次计费表（唯一维护位置）、认证和图片存储约定
- 参数规则迁入模型页；旧参数与透明背景锚点保留短链接说明

### image-generation/models/*.mdx（模型用法）
- 五个模型分别提供调用名、调用方式、最小示例、能力用法、参数限制与常见问题
- Nano Banana Pro / 2 导入同一份尺寸和质量片段，避免两份规则漂移
- GI/GI2/GPT 导入共用参考图格式；每个模型保留可直接复制的请求示例
- GPT 页集中维护自定义尺寸、透明背景、Alpha 验收和专属参数
- Qwen 页直接展示多模态文生图、图生图、输入限制和两种尺寸写法
- Midjourney 页解释固定四图、遍历结果与无效参数

### image-generation/synchronous.mdx（同步调用）
- 接口：`POST https://llm.ziy.cc/v1/images/generations`
- 参数表含 `response_format`：传入 `b64_json` 仍返回 URL
- 代码示例：cURL / Python / Node.js / Python (OpenAI SDK)
- 模型示例迁入模型页，协议页提供直达链接并保留旧入口锚点
- Warning：同步最长等待约 15 分钟，长耗时推荐异步；补充超时处理提示

### image-generation/asynchronous.mdx（异步任务与结果查询）
- 提交：`POST https://llm.ziy.cc/v1/images/tasks`
- 查询：`GET https://llm.ziy.cc/v1/images/tasks/:task_id`
- metadata 参数：quality、output_format、background、input_fidelity 等
- 支持模型链接到概览矩阵，Qwen 仅同步的限制保留
- 完整 Python 异步工作流将提交与查询分开，查询临时失败时使用同一个 task_id 恢复
- 透明背景示例迁入 GPT 页，保留旧锚点入口

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
- 模型 ID 填写：从模型广场复制完整 ID，不按供应商或国内／海外分类推断前缀；保留原有示例和旧章节锚点
- 已验证客户端列表：Claude Code、LobeChat、Cherry Studio、Open WebUI、ChatBox、BoltAI

---

## 重要约定和决策

本轮以原文档为内容基准。模型名由中台定义并适配，前缀、大小写及版本差异不得自行修正；外部供应商文档或本地代码不能替代用户对调用名的确认。结构整理不改写原有代码示例。

用户随后指出模型前缀信息不准确：已移除快速开始的前缀列，以及 API 总览、文本对话、通用客户端中的国内／海外通用前缀规则；统一引导使用模型广场中的完整模型 ID，不改写调用示例。

1. **API 地址展示**：统一使用代码块（非 Endpoint 组件），格式为 `POST https://llm.ziy.cc/v1/...`
2. **API Key 占位符**：统一使用 `sk-你的密钥`
3. **Claude 模型名**：
   - Anthropic 原生格式（Messages API）：不带前缀，如 `Claude-Sonnet-4.6`
   - OpenAI 兼容格式（Chat Completions）：带前缀，如 `anthropic/claude-sonnet-4.6`
4. **DeepSeek 模型名**：quick-start / text-chat 示例用 `DeepSeek-R1-0528`；首页卡片标题仍为 DeepSeek-R1
5. **图片生成**：选型和计费在 overview；模型参数在 models；共用规则在 snippets；公共请求/响应和轮询在 sync/async，各自单一维护
6. **图片 response_format**：传入 `b64_json` 仍返回 CDN URL
7. **docs.json**：无 navbar/footer GitHub 占位链接
8. **Seed Audio 响应**：成功时读取音频二进制，不调用 `response.json()`；图片参考使用火山服务可访问的公网 URL

---

## 已知问题和备注

- `mintlify dev` 的原生搜索需要登录 CLI；本项目在静态导出时接入 Pagefind，访客无需登录。体验搜索请使用静态预览。
- 导出及发布脚本自动运行 `scripts/post-export.sh`，生成搜索资源并修复启动器；不要直接上传原始 Mintlify ZIP。
- 静态预览默认从 5500 端口起寻找空闲端口；可用 `PORT` 指定起始端口。
- Image-GPT2 的 `response_format: b64_json` 实际仍返回 URL，这是网关行为，非 bug

---

## 开发命令速查

```bash
# 启动开发服务器
cd /Users/kunpo/Projects/work/doc/docs
npx mintlify dev --port 3333

# 导出静态 HTML 到项目目录
npm ci
npm run docs:export
npm run docs:preview

# 检查搜索与发布脚本（无服务器写入）
npm run test:search
bash tests/docs-release.test.sh
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
