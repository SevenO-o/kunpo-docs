# docs.ziy.cc 发布说明

本文是 `docs.ziy.cc` 的唯一发布契约。它只适用于本仓库和已登记的静态站点，不适用于 KUNPO 平台、其他域名或服务器上的其他服务。

## 触发条件

只有用户明确提出“发布 docs.ziy.cc”时，Agent 才能运行真实发布：

```bash
scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf
```

在此之前，Agent 仅可运行下列无服务器写入的检查：

```bash
scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf --dry-run
scripts/verify-docs-release.sh --config deployment/sites/docs.ziy.cc.conf
```

## 固定边界

- 域名只能是 `docs.ziy.cc`。
- 服务器只能使用本机已有的 `dify` SSH 别名。
- 远端目录只能是 `/opt/1panel/www/sites/docs.ziy.cc`。
- 发布允许有未提交文档修改；发布报告会记录源码提交号和脏工作树状态。
- 发布脚本只能构建 Mintlify 静态产物、切换此站点的版本入口并验收三条公开页面。

## 禁止项

- 不得在仓库、配置、报告或命令输出中写入或输出 SSH 私钥、密码、token、Cookie、证书内容或完整构建产物。
- 不得根据发布指令临时改写域名、SSH 主机或远端路径。
- 不得重启 KUNPO 容器、修改 DNS、证书、OpenResty 全局配置或服务器环境变量。
- 发布失败时不得尝试发布其他站点；必须保留或恢复上一已验证版本。
- 不得提交 `artifacts/releases/` 中的报告或 Mintlify 导出产物。

## 结果报告

每次 dry-run、验收或真实发布都会在 `artifacts/releases/` 生成脱敏 JSON 报告。报告只包含 release ID、时间、源码提交、脏工作树状态、域名、三条页面检查结果和回滚状态。

真实发布成功后，Agent 必须报告 release ID、源码提交、脏工作树状态、首页、快速开始、API 概览三条 URL 的 HTTP 状态，以及是否执行过回滚。
