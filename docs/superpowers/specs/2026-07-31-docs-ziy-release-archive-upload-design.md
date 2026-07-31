# `docs.ziy.cc` 压缩包发布设计

## 目标

将现有发布流程从“逐文件上传已解压产物”改为“上传一个本次导出的 zip，再在服务器暂存目录解压”。发布仍只由用户明确提出“发布 docs.ziy.cc”时触发。

## 范围与边界

- 发布脚本在没有调用方提供的有效导出包时，先执行 Mintlify 导出，得到本次临时 zip。
- 只将该 zip 上传到 `/opt/1panel/www/sites/docs.ziy.cc/releases/.staging-<release-id>.zip`。
- 服务器只在对应的 `.staging-<release-id>` 目录解压；解压后继续沿用现有的关键页面、原子切换、回滚、版本保留和公网验收逻辑。
- 上传、解压或远端文件检查失败时，删除本次暂存 zip 与暂存目录，不切换 `index`。
- 不使用仓库根目录可能陈旧的 `kunpo-api-docs-export.zip`；不改变域名、OpenResty、KUNPO 容器、证书或凭据处理方式。

## 实现设计

`scripts/lib/docs-release-common.sh` 的本地导出函数保留 zip 路径并增加 zip 完整性检查。`scripts/release-docs.sh` 把 `scp -r <export-dir>/.` 替换为单文件 `scp <export.zip>`，远端 `prepare` 建立空暂存目录，`extract` 对该 zip 执行 `unzip -q` 并验证其内部的 `index.html`、快速开始和 API 概览页面，随后删除暂存 zip。只有 `extract` 成功后才执行既有 `promote`。

调用方仍可用 `--export-dir` 做测试或指定已解压产物；发布脚本会先将该目录重新压缩为本次临时 zip，保证真实网络传输始终只有一个文件。

## 验收

1. 自动导出时，测试证明 `scp` 接收的是单一 `.zip` 文件而非递归目录传输。
2. `--export-dir` 时，测试证明该目录被打成临时 zip 后再上传。
3. 模拟上传失败与模拟远端解压失败都只触发 `discard`，且没有 `promote` 或 `rollback`。
4. 原有 dry-run、原子切换、回滚、保留版本、脱敏报告和只读线上验收测试继续通过。
5. 真实 Mintlify dry-run 能成功生成本次 zip；不运行真实发布。
