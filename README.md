# KUNPO API 文档

KUNPO API 统一大模型网关的官方文档站点，基于 [Mintlify](https://mintlify.com) 构建。

## 简介

KUNPO API 提供统一的大模型调用接口，兼容 OpenAI / Anthropic 接口格式。通过一个 API Key 即可访问 Claude、GPT、Gemini、DeepSeek、Qwen、GLM 等 150+ 主流模型。

- API 地址：`https://llm.ziy.cc`
- 在线文档：https://docs.ziy.cc

## 文档内容

| 模块 | 说明 |
|------|------|
| 快速开始 | 获取 API Key，5 分钟完成第一次调用 |
| 文本对话 | OpenAI 兼容的 Chat Completions 接口，支持流式输出、Gemini 思考模式 |
| Claude Messages | Anthropic 原生 Messages API，支持 Extended Thinking |
| 图片生成 | 同步/异步两种模式，支持 Image-GI、Image-GI2、Image-GPT2、Image-MI、qwen-image-3.0-pro 等模型 |
| 豆包 Seed Audio | 音频生成接口，兼容 OpenAI 请求参数与豆包原生参数，成功时返回音频二进制 |
| 豆包视频生成 | 基于 Seedance 2.0 的文生视频、图生视频 API |
| [VS 2.5 视频生成](./api-reference/video-vs25.mdx) | 腾讯云点播 VS 2.5；三种接口、参考素材、CDN 保存与按秒价格 |
| 客户端接入 | Claude Code、CC Switch、LobeChat 及通用 OpenAI 兼容客户端配置指南 |

## 维护文档

本仓库的 API 文档主要给 AI 阅读，用于生成准确的接入代码。持久约定见 [AGENTS.md](./AGENTS.md)。编辑 `.mdx` 或 `docs.json` 前，请先阅读 **[DOCS_MAINTENANCE.md](./DOCS_MAINTENANCE.md)**（协议精确性、页面职责、模型名与防重复规范）。

发布或验收 `docs.ziy.cc` 前，请阅读 **[DEPLOYMENT.md](./DEPLOYMENT.md)**。真实发布只在用户明确提出发布指令后执行。

## 本地开发

```bash
# 安装依赖（首次运行会自动安装 Mintlify）
npm install

# 启动本地预览
npx mintlify dev --port 3333
```

访问 http://localhost:3333 预览文档。

## 导出静态站点

```bash
npm run docs:export
```

生成包含 Pagefind 搜索的 `kunpo-api-docs-export/` 与 `kunpo-api-docs-export.zip`；使用 `npm run docs:preview` 预览。同时按公开导航生成 `/llms.txt` 和每页 `.md`（例如 `/api-reference/video-vs25.md`），供 AI 直接读取。代码与协议表保留，共用片段自动展开，内部维护文档不对外导出。发布使用 [DEPLOYMENT.md](./DEPLOYMENT.md) 的固定站点脚本，不直接发布未经后处理的 Mintlify 导出包。

## 项目结构

```
docs/
├── docs.json                        # 站点配置（导航、主题）
├── index.mdx                        # 首页
├── quick-start.mdx                  # 快速开始
├── api-reference/                   # API 接口文档
│   ├── text-chat.mdx                # 文本对话
│   ├── claude-messages.mdx          # Claude Messages API
│   ├── seed-audio.mdx                # 豆包 Seed Audio 音频生成
│   ├── doubao-video.mdx             # 豆包视频生成
│   ├── video-se.mdx                 # 腾讯 SE 视频生成
│   ├── video-vs25.mdx               # VS 2.5 视频契约与价格
│   └── image-generation/            # 图片生成
│       ├── overview.mdx             # 概览
│       ├── synchronous.mdx          # 同步接口
│       └── asynchronous.mdx         # 异步接口
└── client-integration/              # 客户端接入指南
    ├── claude-code.mdx
    ├── cc-switch.mdx
    ├── lobechat.mdx
    └── openai-compatible.mdx
```

## 技术栈

- [Mintlify](https://mintlify.com) — 文档框架（maple 主题）
- MDX — Markdown + JSX 组件

## License

Private — KUNPO Team
