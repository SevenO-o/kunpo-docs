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
  valid_config_lines > "$config"
  printf '%s\n' 'UNSAFE_EXTRA=1' >> "$config"
  run_expect_failure "$ROOT/scripts/release-docs.sh" --config "$config" --dry-run
  assert_output_contains '未知配置项 UNSAFE_EXTRA'
}

test_invalid_remote_root_is_rejected
test_unknown_config_key_is_rejected
printf 'PASS: docs release configuration validation\n'
