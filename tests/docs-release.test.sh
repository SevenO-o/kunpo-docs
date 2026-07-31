#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="$(mktemp -d /tmp/docs-release-test.XXXXXX)"

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

write_config() {
  local path="$1"
  shift
  : > "$path"
  local line
  for line in "$@"; do
    printf '%s\n' "$line" >> "$path"
  done
}

run_expect_failure() {
  set +e
  COMMAND_OUTPUT="$("$@" 2>&1)"
  COMMAND_STATUS=$?
  set -e
  [ "$COMMAND_STATUS" -ne 0 ] || fail "命令应失败：$*"
}

assert_output_contains() {
  case "$COMMAND_OUTPUT" in
    *"$1"*) ;;
    *) fail "预期输出包含：$1；实际输出：$COMMAND_OUTPUT" ;;
  esac
}

run_expect_success() {
  set +e
  COMMAND_OUTPUT="$("$@" 2>&1)"
  COMMAND_STATUS=$?
  set -e
  [ "$COMMAND_STATUS" -eq 0 ] || fail "命令应成功：$*；实际输出：$COMMAND_OUTPUT"
}

assert_file_contains() {
  local path="$1"
  local expected="$2"
  [ -f "$path" ] || fail "文件不存在：$path"
  grep -Fq "$expected" "$path" || fail "文件 $path 不包含：$expected"
}

assert_file_not_contains() {
  local path="$1"
  local unexpected="$2"
  [ -f "$path" ] || fail "文件不存在：$path"
  if grep -Fiq "$unexpected" "$path"; then
    fail "文件 $path 不应包含：$unexpected"
  fi
}

valid_config_lines() {
  printf '%s\n' \
    'SITE_NAME=docs.ziy.cc' \
    'DOMAIN=docs.ziy.cc' \
    'SSH_HOST=dify' \
    'REMOTE_SITE_ROOT=/opt/1panel/www/sites/docs.ziy.cc' \
    'BUILD_COMMAND=npx mintlify export --output' \
    'ENTRY_PATHS=/,/quick-start,/api-reference/overview' \
    'RELEASE_KEEP=5'
}

write_valid_config() {
  valid_config_lines > "$1"
}

make_export() {
  local export_dir="$1"
  shift
  local page
  for page in "$@"; do
    mkdir -p "$export_dir/$(dirname "$page")"
    printf '<html><body>%s</body></html>\n' "$page" > "$export_dir/$page"
  done
}

test_invalid_remote_root_is_rejected() {
  local config="$FIXTURE_DIR/invalid-root.conf"
  write_config "$config" \
    'SITE_NAME=docs.ziy.cc' \
    'DOMAIN=docs.ziy.cc' \
    'SSH_HOST=dify' \
    'REMOTE_SITE_ROOT=/tmp/not-allowed' \
    'BUILD_COMMAND=npx mintlify export --output' \
    'ENTRY_PATHS=/,/quick-start,/api-reference/overview' \
    'RELEASE_KEEP=5'
  run_expect_failure "$ROOT/scripts/release-docs.sh" --config "$config" --dry-run
  assert_output_contains '不允许的 REMOTE_SITE_ROOT'
}

test_unknown_config_key_is_rejected() {
  local config="$FIXTURE_DIR/unknown-key.conf"
  write_valid_config "$config"
  printf '%s\n' 'UNSAFE_EXTRA=1' >> "$config"
  run_expect_failure "$ROOT/scripts/release-docs.sh" --config "$config" --dry-run
  assert_output_contains '未知配置项 UNSAFE_EXTRA'
}

test_missing_export_page_is_rejected() {
  local config="$FIXTURE_DIR/valid.conf"
  local export_dir="$FIXTURE_DIR/missing-page-export"
  write_valid_config "$config"
  make_export "$export_dir" index.html quick-start/index.html
  run_expect_failure "$ROOT/scripts/release-docs.sh" --config "$config" --dry-run --export-dir "$export_dir"
  assert_output_contains '导出产物缺少 api-reference/overview 页面'
}

test_dry_run_writes_a_sanitized_report() {
  local config="$FIXTURE_DIR/report.conf"
  local export_dir="$FIXTURE_DIR/complete-export"
  local report="$FIXTURE_DIR/report.json"
  write_valid_config "$config"
  make_export "$export_dir" index.html quick-start/index.html api-reference/overview/index.html
  run_expect_success "$ROOT/scripts/release-docs.sh" --config "$config" --dry-run --export-dir "$export_dir" --report "$report"
  assert_file_contains "$report" '"status": "dry-run"'
  assert_file_contains "$report" '"domain": "docs.ziy.cc"'
  assert_file_not_contains "$report" 'private key'
  assert_file_not_contains "$report" 'token'
}

test_invalid_remote_root_is_rejected
test_unknown_config_key_is_rejected
test_missing_export_page_is_rejected
test_dry_run_writes_a_sanitized_report
printf 'PASS: docs release configuration validation\n'
