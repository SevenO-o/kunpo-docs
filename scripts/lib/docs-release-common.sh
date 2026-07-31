#!/usr/bin/env bash

readonly RELEASE_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly ALLOWED_SITE_NAME='docs.ziy.cc'
readonly ALLOWED_DOMAIN='docs.ziy.cc'
readonly ALLOWED_SSH_HOST='dify'
readonly ALLOWED_REMOTE_ROOT='/opt/1panel/www/sites/docs.ziy.cc'
readonly ALLOWED_BUILD_COMMAND='npx mintlify export --output'
readonly ALLOWED_ENTRY_PATHS='/,/quick-start,/api-reference/overview'

release_fail() {
  printf '%s\n' "$*" >&2
  return 1
}

load_site_config() {
  local config_path="$1"
  SITE_NAME=''
  DOMAIN=''
  SSH_HOST=''
  REMOTE_SITE_ROOT=''
  BUILD_COMMAND=''
  ENTRY_PATHS=''
  RELEASE_KEEP=''

  [ -f "$config_path" ] || release_fail "配置文件不存在：$config_path" || return 1

  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|'#'*) continue ;;
    esac
    case "$line" in
      *=*)
        key="${line%%=*}"
        value="${line#*=}"
        ;;
      *) release_fail "配置行格式错误：$line" || return 1 ;;
    esac
    [ -n "$value" ] || release_fail "配置项不能为空：$key" || return 1
    case "$key" in
      SITE_NAME|DOMAIN|SSH_HOST|REMOTE_SITE_ROOT|BUILD_COMMAND|ENTRY_PATHS|RELEASE_KEEP)
        printf -v "$key" '%s' "$value"
        ;;
      *) release_fail "未知配置项 $key" || return 1 ;;
    esac
  done < "$config_path"

  [ "$SITE_NAME" = "$ALLOWED_SITE_NAME" ] || release_fail '不允许的 SITE_NAME' || return 1
  [ "$DOMAIN" = "$ALLOWED_DOMAIN" ] || release_fail '不允许的 DOMAIN' || return 1
  [ "$SSH_HOST" = "$ALLOWED_SSH_HOST" ] || release_fail '不允许的 SSH_HOST' || return 1
  [ "$REMOTE_SITE_ROOT" = "$ALLOWED_REMOTE_ROOT" ] || release_fail '不允许的 REMOTE_SITE_ROOT' || return 1
  [ "$BUILD_COMMAND" = "$ALLOWED_BUILD_COMMAND" ] || release_fail '不允许的 BUILD_COMMAND' || return 1
  [ "$ENTRY_PATHS" = "$ALLOWED_ENTRY_PATHS" ] || release_fail '不允许的 ENTRY_PATHS' || return 1
  case "$RELEASE_KEEP" in
    5) ;;
    *) release_fail '不允许的 RELEASE_KEEP' || return 1 ;;
  esac
}

collect_source_metadata() {
  SOURCE_COMMIT="$(git -C "$RELEASE_REPO_ROOT" rev-parse --short HEAD)"
  if [ -n "$(git -C "$RELEASE_REPO_ROOT" status --porcelain)" ]; then
    SOURCE_DIRTY='true'
  else
    SOURCE_DIRTY='false'
  fi
}

create_release_id() {
  local suffix="$SOURCE_COMMIT"
  [ "$SOURCE_DIRTY" = 'false' ] || suffix="${suffix}-dirty"
  RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${suffix}"
}

validate_export() {
  local export_dir="$1"
  [ -f "$export_dir/index.html" ] || release_fail '导出产物缺少 index 页面' || return 1
  [ -f "$export_dir/quick-start/index.html" ] || release_fail '导出产物缺少 quick-start 页面' || return 1
  [ -f "$export_dir/api-reference/overview/index.html" ] || release_fail '导出产物缺少 api-reference/overview 页面' || return 1
}

build_site() {
  local work_dir
  work_dir="$(mktemp -d /tmp/docs-release-build.XXXXXX)"
  local zip_path="$work_dir/export.zip"
  EXPORT_DIR="$work_dir/export"
  (
    cd "$RELEASE_REPO_ROOT"
    npx mintlify export --output "$zip_path"
  ) || return 1
  unzip -tq "$zip_path" >/dev/null || return 1
  unzip -q "$zip_path" -d "$EXPORT_DIR" || return 1
  validate_export "$EXPORT_DIR"
  EXPORT_ARCHIVE="$zip_path"
}

archive_export_dir() {
  local export_dir="$1"
  local archive_dir
  archive_dir="$(mktemp -d /tmp/docs-release-archive.XXXXXX)"
  EXPORT_ARCHIVE="$archive_dir/docs.zip"
  (
    cd "$export_dir"
    zip -qr "$EXPORT_ARCHIVE" .
  ) || return 1
  unzip -tq "$EXPORT_ARCHIVE" >/dev/null || return 1
}

write_report() {
  local report_path="$1"
  local status="$2"
  local rollback_status="$3"
  local checks_json="${4:-[]}"
  mkdir -p "$(dirname "$report_path")"
  python3 - "$report_path" "$status" "$RELEASE_ID" "$SOURCE_COMMIT" "$SOURCE_DIRTY" "$DOMAIN" "$ENTRY_PATHS" "$rollback_status" "$checks_json" <<'PY'
import json
import sys
from datetime import datetime, timezone

path, status, release_id, source_commit, source_dirty, domain, entry_paths, rollback_status, checks_json = sys.argv[1:]
report = {
    "status": status,
    "releaseId": release_id,
    "sourceCommit": source_commit,
    "sourceDirty": source_dirty == "true",
    "domain": domain,
    "entryPaths": entry_paths.split(","),
    "checks": json.loads(checks_json),
    "rollbackStatus": rollback_status,
    "timestamp": datetime.now(timezone.utc).isoformat(),
}
with open(path, "w", encoding="utf-8") as handle:
    json.dump(report, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
PY
}
