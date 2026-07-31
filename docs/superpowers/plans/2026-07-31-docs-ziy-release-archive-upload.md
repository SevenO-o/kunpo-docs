# docs.ziy.cc 压缩包发布实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `docs.ziy.cc` 的真实发布网络传输收敛为单一、经本次构建验证的 zip 文件。

**Architecture:** 本地导出或调用方提供的解压目录均归一为临时 zip；发布入口只上传 zip，远端在版本暂存目录解压和校验后再复用原子切换路径。失败分支只清理以 release ID 命名的暂存 zip/目录。

**Tech Stack:** Bash 3.2+、Mintlify CLI、zip/unzip、SCP、SSH、现有 Bash 测试夹具。

## Global Constraints

- 真实发布仍只在用户明确提出“发布 docs.ziy.cc”后触发。
- 网络上传只允许一个本次生成的 `.zip` 文件；禁止递归上传导出目录。
- 远端操作范围仍固定为 `/opt/1panel/www/sites/docs.ziy.cc/releases/.staging-<release-id>{,.zip}`。
- 失败时不得切换 `index`，不得修改 KUNPO、OpenResty、DNS、证书或凭据。
- 不使用 `kunpo-api-docs-export.zip` 作为发布输入。

---

### Task 1: 归一化导出包并覆盖单文件上传测试

**Files:**
- Modify: `scripts/lib/docs-release-common.sh`
- Modify: `tests/docs-release.test.sh`

**Interfaces:**
- Produces: `EXPORT_ARCHIVE`，一个可由 `unzip -tq "$EXPORT_ARCHIVE"` 验证的本次临时 zip；`build_site` 和 `archive_export_dir <dir>` 都必须设置它。
- Consumes: 已验证的 `EXPORT_DIR`。

- [ ] **Step 1: 添加失败测试**

扩展伪 `scp` 日志断言，使发布成功测试要求：

```bash
assert_file_contains "$SCP_LOG" 'docs-release-archive'
assert_file_contains "$SCP_LOG" '.zip dify:/opt/1panel/www/sites/docs.ziy.cc/releases/.staging-'
assert_file_not_contains "$SCP_LOG" '-r '
```

新增 `test_export_directory_is_archived_before_upload`，用 `--export-dir` 运行发布并断言伪 `scp` 的源参数以 `.zip` 结尾。

- [ ] **Step 2: 确认测试失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，现有发布仍记录 `scp -r`。

- [ ] **Step 3: 实现本地导出包函数**

在共用库实现：

```bash
archive_export_dir() {
  local source_dir="$1"
  local archive_dir
  archive_dir="$(mktemp -d /tmp/docs-release-archive.XXXXXX)"
  EXPORT_ARCHIVE="$archive_dir/docs.zip"
  (cd "$source_dir" && zip -qr "$EXPORT_ARCHIVE" .)
  unzip -tq "$EXPORT_ARCHIVE" >/dev/null
}
```

`build_site` 在解压并校验 `EXPORT_DIR` 后，把 Mintlify 生成的 zip 赋给 `EXPORT_ARCHIVE`；`--export-dir` 分支调用 `archive_export_dir`。

- [ ] **Step 4: 确认测试通过并提交**

Run: `bash tests/docs-release.test.sh`

Expected: PASS。

```bash
git add scripts/lib/docs-release-common.sh tests/docs-release.test.sh
git diff --cached --check
git commit -m "feat: archive docs release payload"
```

### Task 2: 远端解压、失败清理与完整验证

**Files:**
- Modify: `scripts/release-docs.sh`
- Modify: `tests/docs-release.test.sh`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Consumes: `EXPORT_ARCHIVE` 与 `remote_operation prepare|extract|discard|promote`。
- Produces: 只有 `extract` 成功后才能调用的 `promote`；`discard` 同时清理对应暂存 zip 和目录。

- [ ] **Step 1: 添加解压失败的测试**

让伪 `ssh` 在 `DOCS_RELEASE_EXTRACT_STATUS=1` 时对 `extract` 返回非零。新增：

```bash
test_failed_remote_extract_discards_staging_without_promotion() {
  run_expect_failure env ... DOCS_RELEASE_EXTRACT_STATUS=1 "$ROOT/scripts/release-docs.sh" --config "$config" --export-dir "$export_dir"
  assert_file_contains "$SSH_LOG" ' discard /opt/1panel/www/sites/docs.ziy.cc '
  assert_file_not_contains "$SSH_LOG" ' promote /opt/1panel/www/sites/docs.ziy.cc '
}
```

- [ ] **Step 2: 确认测试失败**

Run: `bash tests/docs-release.test.sh`

Expected: FAIL，尚不存在 `extract` 操作。

- [ ] **Step 3: 替换远端传输与暂存流程**

发布入口使用：

```bash
remote_operation prepare
if ! scp "$EXPORT_ARCHIVE" "${SSH_HOST}:${REMOTE_SITE_ROOT}/releases/.staging-${RELEASE_ID}.zip"; then
  remote_operation discard || true
  write_report "$report_path" 'failed' 'not-needed'
  exit 1
fi
if ! remote_operation extract; then
  remote_operation discard || true
  write_report "$report_path" 'failed' 'not-needed'
  exit 1
fi
previous_release="$(remote_operation promote)"
```

远端 `extract` 必须执行 `unzip -tq`，`unzip -q <staging-zip> -d <staging-dir>`，删除该暂存 zip，再检查三条页面。`discard` 只能删除与当前 release ID 完全匹配的暂存 zip 和目录。

- [ ] **Step 4: 更新发布说明、运行完整验证并提交**

在 `DEPLOYMENT.md` 标注“上传一个 zip，服务器暂存解压”；运行：

```bash
bash -n scripts/lib/docs-release-common.sh scripts/release-docs.sh tests/docs-release.test.sh
bash tests/docs-release.test.sh
scripts/release-docs.sh --config deployment/sites/docs.ziy.cc.conf --dry-run
scripts/verify-docs-release.sh --config deployment/sites/docs.ziy.cc.conf
git diff --check
```

Expected: 测试和 dry-run 通过；只读线上验收通过；没有真实发布。

```bash
git add scripts/release-docs.sh tests/docs-release.test.sh DEPLOYMENT.md
git diff --cached --check
git commit -m "feat: upload docs releases as archives"
```

## Plan Self-Review

- 规格中的自动导出、单文件上传、远端解压、失败清理与不真实发布均有对应任务和验证。
- 文件接口仅使用 `EXPORT_ARCHIVE`、`archive_export_dir` 和固定的 `extract` 操作，前后名称一致。
- 计划不包含待补内容或笼统处理描述。
