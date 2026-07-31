#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/docs-release-common.sh
source "$SCRIPT_ROOT/scripts/lib/docs-release-common.sh"

config_path="$SCRIPT_ROOT/deployment/sites/docs.ziy.cc.conf"
dry_run='false'
export_dir=''
report_path=''

while [ "$#" -gt 0 ]; do
  case "$1" in
    --config) config_path="$2"; shift 2 ;;
    --dry-run) dry_run='true'; shift ;;
    --export-dir) export_dir="$2"; shift 2 ;;
    --report) report_path="$2"; shift 2 ;;
    *) release_fail "未知参数：$1"; exit 2 ;;
  esac
done

load_site_config "$config_path"
collect_source_metadata
create_release_id

if [ -n "$export_dir" ]; then
  validate_export "$export_dir"
  EXPORT_DIR="$export_dir"
else
  build_site
fi

if [ -z "$report_path" ]; then
  report_path="$SCRIPT_ROOT/artifacts/releases/${RELEASE_ID}.json"
fi

remote_operation() {
  local operation="$1"
  local previous_release="${2:-}"
  ssh "$SSH_HOST" sh -s -- "$operation" "$REMOTE_SITE_ROOT" "$RELEASE_ID" "$previous_release" <<'REMOTE'
set -eu
operation="$1"
remote_root="$2"
release_id="$3"
previous_release="$4"
[ "$remote_root" = '/opt/1panel/www/sites/docs.ziy.cc' ] || exit 64
case "$release_id" in
  *[!0-9A-Za-zT-Z-]*|'') exit 64 ;;
esac
stage_dir="$remote_root/releases/.staging-$release_id"
release_dir="$remote_root/releases/$release_id"

case "$operation" in
  prepare)
    [ -d "$remote_root" ] || exit 65
    mkdir -p "$remote_root/releases"
    [ ! -e "$stage_dir" ] || exit 66
    mkdir "$stage_dir"
    ;;
  promote)
    [ -f "$stage_dir/index.html" ] || exit 67
    [ -f "$stage_dir/quick-start/index.html" ] || exit 67
    [ -f "$stage_dir/api-reference/overview/index.html" ] || exit 67
    [ ! -e "$release_dir" ] || exit 68
    if [ -d "$remote_root/index" ] && [ ! -L "$remote_root/index" ]; then
      legacy_dir="$remote_root/releases/legacy-$release_id"
      [ ! -e "$legacy_dir" ] || exit 69
      mv "$remote_root/index" "$legacy_dir"
      ln -s "releases/legacy-$release_id" "$remote_root/index"
    fi
    previous_release="$(readlink "$remote_root/index")"
    case "$previous_release" in
      releases/*) ;;
      *) exit 70 ;;
    esac
    mv "$stage_dir" "$release_dir"
    ln -sfn "releases/$release_id" "$remote_root/index"
    printf '%s\n' "$previous_release"
    ;;
  rollback)
    case "$previous_release" in
      releases/*) ln -sfn "$previous_release" "$remote_root/index" ;;
      *) exit 71 ;;
    esac
    ;;
  *) exit 64 ;;
esac
REMOTE
}

verify_public_pages() {
  local checks_file
  checks_file="$(mktemp /tmp/docs-release-checks.XXXXXX)"
  local path status passed='true'
  for path in / /quick-start /api-reference/overview; do
    status="$(curl -sSL -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${path}?release=${RELEASE_ID}" || printf '000')"
    printf '%s\t%s\n' "$path" "$status" >> "$checks_file"
    [ "$status" = '200' ] || passed='false'
  done
  RELEASE_CHECKS_JSON="$(python3 - "$checks_file" <<'PY'
import json
import sys

checks = []
for line in open(sys.argv[1], encoding='utf-8'):
    path, status = line.rstrip('\n').split('\t', 1)
    checks.append({'path': path, 'httpStatus': int(status) if status.isdigit() else 0})
print(json.dumps(checks, ensure_ascii=False))
PY
)"
  [ "$passed" = 'true' ]
}

if [ "$dry_run" = 'true' ]; then
  write_report "$report_path" 'dry-run' 'not-needed'
  printf 'dry-run passed: %s\n' "$RELEASE_ID"
  exit 0
fi

remote_operation prepare
scp -r "$EXPORT_DIR/." "${SSH_HOST}:${REMOTE_SITE_ROOT}/releases/.staging-${RELEASE_ID}/"
previous_release="$(remote_operation promote)"
if ! verify_public_pages; then
  remote_operation rollback "$previous_release"
  write_report "$report_path" 'failed' 'restored' "$RELEASE_CHECKS_JSON"
  release_fail '公网验收失败，已恢复上一版本'
  exit 1
fi

write_report "$report_path" 'published' 'not-needed' "$RELEASE_CHECKS_JSON"
printf 'published: %s\n' "$RELEASE_ID"
