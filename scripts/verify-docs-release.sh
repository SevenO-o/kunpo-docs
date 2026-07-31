#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/docs-release-common.sh
source "$SCRIPT_ROOT/scripts/lib/docs-release-common.sh"

config_path="$SCRIPT_ROOT/deployment/sites/docs.ziy.cc.conf"
report_path=''

while [ "$#" -gt 0 ]; do
  case "$1" in
    --config) config_path="$2"; shift 2 ;;
    --report) report_path="$2"; shift 2 ;;
    *) release_fail "未知参数：$1"; exit 2 ;;
  esac
done

load_site_config "$config_path"
collect_source_metadata

remote_current_release() {
  ssh "$SSH_HOST" sh -s -- verify "$REMOTE_SITE_ROOT" <<'REMOTE'
set -eu
operation="$1"
remote_root="$2"
[ "$operation" = 'verify' ] || exit 64
[ "$remote_root" = '/opt/1panel/www/sites/docs.ziy.cc' ] || exit 64
if [ -L "$remote_root/index" ]; then
  current_release="$(readlink "$remote_root/index")"
  case "$current_release" in
    releases/*) ;;
    *) exit 66 ;;
  esac
elif [ -d "$remote_root/index" ]; then
  current_release='legacy-static-directory'
else
  exit 65
fi
grep -Eq 'server_name[[:space:]]+docs\.ziy\.cc;' /opt/1panel/www/conf.d/docs.ziy.cc.conf
printf '%s\n' "$current_release"
REMOTE
}

verify_public_pages() {
  local checks_file
  checks_file="$(mktemp /tmp/docs-verify-checks.XXXXXX)"
  local path status passed='true'
  for path in / /quick-start /api-reference/overview; do
    status="$(curl -sSL -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${path}?verify=${RELEASE_ID}" || printf '000')"
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

current_release_path="$(remote_current_release)"
RELEASE_ID="${current_release_path#releases/}"
if [ -z "$report_path" ]; then
  report_path="$SCRIPT_ROOT/artifacts/releases/verify-${RELEASE_ID}.json"
fi

if verify_public_pages; then
  write_report "$report_path" 'verified' 'not-needed' "$RELEASE_CHECKS_JSON"
  printf 'verified: %s\n' "$RELEASE_ID"
  exit 0
fi

write_report "$report_path" 'failed' 'not-needed' "$RELEASE_CHECKS_JSON"
release_fail '公网验收失败'
