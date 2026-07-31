# docs.ziy.cc 文档发布与验收流程实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本仓库提供一个只经用户发布指令触发的 `docs.ziy.cc` 静态站点构建、原子发布、验收与回滚工具链。

**Architecture:** 使用一个无密钥的键值站点配置约束唯一发布目标；Bash 共用库负责配置校验、临时构建和脱敏报告，发布入口负责写入服务器，验收入口严格只读。服务器通过 `index` 软链接指向版本化 `releases/<release-id>`，以保持切换和回滚原子化。

**Tech Stack:** Bash 3.2+、Mintlify CLI、SSH/SCP、OpenResty、curl、zip/unzip、Python 3（仅写 JSON）。

## Global Constraints

- 只允许发布配置中登记的 `docs.ziy.cc` 到 `/opt/1panel/www/sites/docs.ziy.cc`；禁止接收指令中的任意远端路径。
- 仅在用户明确提出“发布 docs.ziy.cc”后运行 `scripts/release-docs.sh`；`--dry-run` 和 `scripts/verify-docs-release.sh` 不写服务器。
- 发布允许源码工作树有未提交文档，但报告必须记录提交号和 `dirty` 状态。
- 不写入私钥、密码、token、Cookie、证书内容、完整构建产物或 HTML 到 Git 或报告。
- 只有新版本通过服务器本机和公网三页 `200` 验收后，才允许清理超过五个的旧版本；不得删除当前或上一个版本。
- 不重启 KUNPO 容器、不改 DNS、证书、服务器环境变量或 OpenResty 全局配置。

---

### Task 1: 站点配置、Git 忽略和发布契约

**Files:**
- Create: `deployment/sites/docs.ziy.cc.conf`
- Create: `DEPLOYMENT.md`
- Modify: `.gitignore`
- Test: `tests/docs-release.test.sh`

**Interfaces:**
- Consumes: 仓库根目录、现有 `scripts/export-docs.sh` 的 Mintlify 导出约定。
- Produces: `load_site_config <path>` 所需的严格 `KEY=VALUE` 文件；唯一允许的配置键为 `SITE_NAME`、`DOMAIN`、`SSH_HOST`、`REMOTE_SITE_ROOT`、`BUILD_COMMAND`、`ENTRY_PATHS`、`RELEASE_KEEP`。

- [ ] **Step 1: 写出配置拒绝未知键和越界目标的失败测试**

在 `tests/docs-release.test.sh` 中建立临时仓库副本和配置夹具，定义以下测试函数：

```bash
test_invalid_config_is_rejected() {
  write_config "$fixture/config.conf" \
    'SITE_NAME=docs.ziy.cc' \
    'DOMAIN=docs.ziy.cc' \
    'SSH_HOST=dify' \
    'REMOTE_SITE_ROOT=/tmp/not-allowed' \
    'BUILD_COMMAND=npx mintlify export --output' \
    'ENTRY_PATHS=/,/quick-start,/api-reference/overview' \
    'RELEASE_KEEP=5'
  assert_fails "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --dry-run
}

test_unknown_config_key_is_rejected() {
  write_valid_config "$fixture/config.conf"
  printf '%s\n' 'UNSAFE_EXTRA=1' >> "$fixture/config.conf"
  assert_fails "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --dry-run
}
```

- [ ] **Step 2: 运行测试，确认入口尚不存在而失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，错误指出 `scripts/release-docs.sh` 尚未创建。

- [ ] **Step 3: 创建固定站点配置和 Agent 契约**

创建 `deployment/sites/docs.ziy.cc.conf`：

```text
SITE_NAME=docs.ziy.cc
DOMAIN=docs.ziy.cc
SSH_HOST=dify
REMOTE_SITE_ROOT=/opt/1panel/www/sites/docs.ziy.cc
BUILD_COMMAND=npx mintlify export --output
ENTRY_PATHS=/,/quick-start,/api-reference/overview
RELEASE_KEEP=5
```

创建 `DEPLOYMENT.md`，包含以下不可省略的规则：仅“发布 docs.ziy.cc”允许写入；先运行 dry-run；`verify-docs-release.sh` 是只读；不得把 `dify` 的凭据、证书或站点产物提交；失败不得尝试发布其他域名；报告必须给出 release ID、提交、dirty、三页状态和回滚状态。

在 `.gitignore` 追加：

```gitignore
# 文档站点发布报告
artifacts/releases/
```

- [ ] **Step 4: 运行测试，确认此时仍因缺少实现而失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，但夹具配置已被测试读取。

- [ ] **Step 5: 提交配置和契约**

```bash
git add deployment/sites/docs.ziy.cc.conf DEPLOYMENT.md .gitignore tests/docs-release.test.sh
git diff --cached --check
git commit -m "docs: add docs site deployment contract"
```

### Task 2: 只读共用库和本地构建验证

**Files:**
- Create: `scripts/lib/docs-release-common.sh`
- Modify: `tests/docs-release.test.sh`
- Test: `tests/docs-release.test.sh`

**Interfaces:**
- Consumes: `deployment/sites/docs.ziy.cc.conf` 和 `REPO_ROOT`。
- Produces: `load_site_config <config>`、`build_site <destination>`、`validate_export <directory>`、`write_report <path> <status> <release_id> <rollback_status>`；所有函数失败时返回非零并向 stderr 给出无密钥原因。

- [ ] **Step 1: 为合法配置、本地导出缺页和脱敏报告添加失败测试**

添加以下断言：

```bash
test_build_rejects_missing_entry_page() {
  make_export "$fixture/export" index.html quick-start/index.html
  assert_fails "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --dry-run --export-dir "$fixture/export"
}

test_report_has_no_secret_fields() {
  write_valid_config "$fixture/config.conf"
  run "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --dry-run --report "$fixture/report.json"
  assert_contains "$fixture/report.json" '"status":"dry-run"'
  assert_not_contains "$fixture/report.json" 'PRIVATE KEY'
  assert_not_contains "$fixture/report.json" 'token'
}
```

- [ ] **Step 2: 运行测试，确认缺少共用库而失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，错误指出找不到 `scripts/lib/docs-release-common.sh` 或函数未定义。

- [ ] **Step 3: 实现严格配置读取和构建验证**

在 `scripts/lib/docs-release-common.sh` 使用 Bash 3.2 兼容代码，拒绝空值、未知键和任何与以下常量不相等的关键值：

```bash
readonly ALLOWED_SITE_NAME='docs.ziy.cc'
readonly ALLOWED_DOMAIN='docs.ziy.cc'
readonly ALLOWED_SSH_HOST='dify'
readonly ALLOWED_REMOTE_ROOT='/opt/1panel/www/sites/docs.ziy.cc'

validate_export() {
  local export_dir="$1"
  test -f "$export_dir/index.html" || fail '导出产物缺少 index.html'
  test -f "$export_dir/quick-start/index.html" || fail '导出产物缺少 quick-start 页面'
  test -f "$export_dir/api-reference/overview/index.html" || fail '导出产物缺少 API 概览页面'
}
```

`build_site` 必须以 `mktemp -d` 创建临时目录，执行配置中的 `BUILD_COMMAND <zip-path>`，用 `unzip -q` 解压并调用 `validate_export`。`write_report` 用 Python 3 的 `json.dump` 写入固定白名单字段：`status`、`releaseId`、`sourceCommit`、`sourceDirty`、`domain`、`entryPaths`、`checks`、`rollbackStatus`、`timestamp`。

- [ ] **Step 4: 运行测试并执行真实的只读构建验证**

Run:

```bash
bash tests/docs-release.test.sh
npx mintlify export --output "$(mktemp -d)/docs.zip"
```

Expected: 测试通过；Mintlify 成功导出静态 zip。

- [ ] **Step 5: 提交共用库与测试**

```bash
git add scripts/lib/docs-release-common.sh tests/docs-release.test.sh
git diff --cached --check
git commit -m "feat: validate docs release inputs and exports"
```

### Task 3: 原子发布入口与安全回滚

**Files:**
- Create: `scripts/release-docs.sh`
- Modify: `tests/docs-release.test.sh`
- Test: `tests/docs-release.test.sh`

**Interfaces:**
- Consumes: `load_site_config`、`build_site`、`validate_export`、`write_report`。
- Produces: `release-docs.sh [--config <path>] [--dry-run] [--report <path>]`；没有 `--dry-run` 时才允许通过 `dify` 写入唯一站点目录。

- [ ] **Step 1: 为 dry-run、首次迁移、验收失败回滚和保留版本添加失败测试**

使用放入测试 `PATH` 的伪 `ssh`、`scp` 和 `curl` 记录参数，而不是连接服务器：

```bash
test_dry_run_does_not_call_remote_write() {
  run "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --dry-run
  assert_file_empty "$fixture/ssh-calls.log"
  assert_contains "$fixture/report.json" '"status":"dry-run"'
}

test_failed_public_check_restores_previous_release() {
  export FAKE_PUBLIC_STATUS=500
  assert_fails "$ROOT/scripts/release-docs.sh" --config "$fixture/config.conf" --report "$fixture/report.json"
  assert_contains "$fixture/ssh-calls.log" 'ln -sfn releases/previous index'
  assert_contains "$fixture/report.json" '"rollbackStatus":"restored"'
}
```

- [ ] **Step 2: 运行测试，确认发布入口不存在而失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，错误指出 `scripts/release-docs.sh` 尚未创建。

- [ ] **Step 3: 实现发布顺序和受限远端命令**

`release-docs.sh` 必须按以下顺序实现：

```bash
load_site_config "$config_path"
collect_source_metadata
prepare_or_accept_export
if [ "$dry_run" = 'true' ]; then
  write_report "$report_path" 'dry-run' "$release_id" 'not-needed'
  exit 0
fi
upload_to_remote_staging "$release_id" "$export_dir"
remote_validate_and_promote "$release_id"
if ! verify_release_urls; then
  restore_previous_release "$previous_release"
  write_report "$report_path" 'failed' "$release_id" 'restored'
  exit 1
fi
prune_old_releases "$RELEASE_KEEP"
write_report "$report_path" 'published' "$release_id" 'not-needed'
```

远端命令必须把 `REMOTE_SITE_ROOT` 与配置常量逐字比较后再执行，并且只可创建或读取：`releases/.staging-<release-id>`、`releases/<release-id>`、`releases/legacy-<timestamp>`、`index`。首次发布用 `mv index releases/legacy-<timestamp>` 保存旧目录，再用 `ln -s releases/<release-id> index`；后续只用 `ln -sfn` 更新软链接。切换前捕获 `readlink index` 作为唯一回滚目标。

- [ ] **Step 4: 运行测试和真实 dry-run**

Run:

```bash
bash tests/docs-release.test.sh
scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf --dry-run
```

Expected: 全部测试通过；dry-run 报告状态为 `dry-run`，服务器入口和远端版本目录无变化。

- [ ] **Step 5: 提交原子发布入口**

```bash
git add scripts/release-docs.sh tests/docs-release.test.sh
git diff --cached --check
git commit -m "feat: add atomic docs site release command"
```

### Task 4: 只读线上验收、文档说明和完整回归

**Files:**
- Create: `scripts/verify-docs-release.sh`
- Modify: `DEPLOYMENT.md`
- Modify: `README.md`
- Modify: `tests/docs-release.test.sh`
- Test: `tests/docs-release.test.sh`

**Interfaces:**
- Consumes: 已登记的配置和远端站点当前 `index` 入口。
- Produces: `verify-docs-release.sh [--config <path>] [--report <path>]`，只读输出当前 release ID、OpenResty server_name 检查、远端入口状态及三条公开 URL 的 HTTP 状态。

- [ ] **Step 1: 添加只读验收的失败测试**

```bash
test_verify_reports_public_failure_without_remote_write() {
  export FAKE_PUBLIC_STATUS=503
  assert_fails "$ROOT/scripts/verify-docs-release.sh" --config "$fixture/config.conf" --report "$fixture/verify.json"
  assert_file_empty "$fixture/ssh-write-calls.log"
  assert_contains "$fixture/verify.json" '"status":"failed"'
}
```

- [ ] **Step 2: 运行测试，确认验收脚本缺失而失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，错误指出 `scripts/verify-docs-release.sh` 尚未创建。

- [ ] **Step 3: 实现只读验收与使用说明**

`verify-docs-release.sh` 必须：

```bash
load_site_config "$config_path"
remote_read_current_release
remote_assert_openresty_server_name 'docs.ziy.cc'
for path in / /quick-start /api-reference/overview; do
  public_assert_200 "https://docs.ziy.cc$path"
done
write_report "$report_path" "$verification_status" "$current_release" 'not-needed'
```

在 `DEPLOYMENT.md` 写出三条精确命令：安全预演、只读线上验收、用户明确指令后的真实发布。`README.md` 增加到 `DEPLOYMENT.md` 的维护链接，不新增自动发布承诺。

- [ ] **Step 4: 运行全套本地回归与当前线上只读验收**

Run:

```bash
bash tests/docs-release.test.sh
scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf --dry-run
scripts/verify-docs-release.sh --config deployment/sites/docs.ziy.cc.conf
git diff --check
```

Expected: 测试通过；dry-run 没有服务器写入；只读验收显示当前入口、OpenResty 域名和三页均为 `200`。

- [ ] **Step 5: 提交验收入口和用户文档**

```bash
git add scripts/verify-docs-release.sh DEPLOYMENT.md README.md tests/docs-release.test.sh
git diff --cached --check
git commit -m "docs: document docs site release verification"
```

### Task 5: 真实首次发布（仅收到新的明确发布指令后）

**Files:**
- Create: `artifacts/releases/<release-id>.json`（Git 忽略，不提交）
- Test: `scripts/release-docs.sh`

**Interfaces:**
- Consumes: 已通过 Task 4 的发布和验收脚本。
- Produces: 已验证的服务器版本、可回滚的 `index` 软链接和本地脱敏报告。

- [ ] **Step 1: 再次展示本次目标并获取用户的明确发布指令**

仅在用户明确说“发布 docs.ziy.cc”后继续。输出：源码目录、本次提交号、dirty 状态、域名、远端根目录、当前 release ID；不输出任何凭据。

- [ ] **Step 2: 运行发布前 dry-run**

Run: `scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf --dry-run`

Expected: 返回 `0`，报告状态为 `dry-run`，远端没有写入。

- [ ] **Step 3: 运行真实发布并保留报告**

Run: `scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf`

Expected: 返回 `0`，报告状态为 `published`，服务器 `index` 指向新 `releases/<release-id>`。

- [ ] **Step 4: 运行独立的线上复验**

Run: `scripts/verify-docs-release.sh --config deployment/sites/docs.ziy.cc.conf`

Expected: 远端入口、OpenResty `server_name docs.ziy.cc`、首页、快速开始和 API 概览均通过。

- [ ] **Step 5: 报告发布结果，不提交构建产物或报告**

报告 release ID、Git 提交、dirty 状态、三页 HTTP 状态、回滚状态和报告绝对路径。不得执行 Git push，除非用户另行要求。

## Plan Self-Review

- 规格覆盖：任务 1 对应发布契约和配置；任务 2 对应构建、产物和脱敏报告；任务 3 对应远端版本化、原子切换、首次迁移、回滚和保留策略；任务 4 对应只读验收；任务 5 明确隔离了未来真正发布授权。
- 占位扫描：本计划未包含 `TODO`、`TBD` 或未定义的“适当处理”步骤；每个失败分支给出明确停止或回滚行为。
- 接口一致性：`load_site_config`、`build_site`、`validate_export` 和 `write_report` 由 Task 2 定义，后续发布和验收入口仅使用这些名称；配置文件路径固定为 `deployment/sites/docs.ziy.cc.conf`。
