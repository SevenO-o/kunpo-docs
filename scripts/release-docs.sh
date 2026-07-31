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

if [ "$dry_run" = 'true' ]; then
  write_report "$report_path" 'dry-run' 'not-needed'
  printf 'dry-run passed: %s\n' "$RELEASE_ID"
  exit 0
fi

release_fail '真实发布入口尚未实现；请先完成原子发布任务'
