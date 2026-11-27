#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

# Assert tier-core feature gates on a running or ephemeral manager.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

require_cmd curl
require_cmd python3
require_cmd java

JAR="${ROOT}/manager/manager-app/target/manager-app-1.0.0.jar"
if [[ ! -f "$JAR" ]]; then
  echo "Building manager JAR..."
  (cd "$ROOT" && mvn -q -pl manager/manager-app -am package -DskipTests)
fi

pick_port() {
  python3 - <<'PY'
import socket
s = socket.socket()
s.bind(('127.0.0.1', 0))
print(s.getsockname()[1])
s.close()
PY
}

assert_features() {
  local label="$1" port="$2"
  local url="http://127.0.0.1:${port}"
  local token resp cost mcp gitq review apply
  token="$(MANAGER_URL="$url" login_token)"
  [[ -n "$token" ]] || { fail "${label}: login"; return; }
  resp="$(MANAGER_URL="$url" graphql "$token" \
    'query { platformFeatures { costEnabled mcpEnabled gitContextQueryEnabled pushIngestEnabled contractCostReviewEnabled contractCostApplyEnabled installationTier } }')"
  if MANAGER_URL="$url" graphql_has_errors "$resp"; then
    fail "${label}: platformFeatures errors"
    return
  fi
  cost="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["costEnabled"])')"
  mcp="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["mcpEnabled"])')"
  gitq="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["gitContextQueryEnabled"])')"
  review="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["contractCostReviewEnabled"])')"
  apply="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["contractCostApplyEnabled"])')"
  tier="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["platformFeatures"]["installationTier"])')"

  cost="$(echo "$cost" | tr '[:upper:]' '[:lower:]')"
  mcp="$(echo "$mcp" | tr '[:upper:]' '[:lower:]')"
  gitq="$(echo "$gitq" | tr '[:upper:]' '[:lower:]')"
  review="$(echo "$review" | tr '[:upper:]' '[:lower:]')"
  apply="$(echo "$apply" | tr '[:upper:]' '[:lower:]')"

  local ok=1
  [[ "$tier" == "TIER_1_CORE" ]] || { fail "${label}: installationTier want=TIER_1_CORE got=${tier}"; ok=0; }
  [[ "$cost" == "false" ]] || { fail "${label}: costEnabled want=false got=${cost}"; ok=0; }
  [[ "$mcp" == "false" ]] || { fail "${label}: mcpEnabled want=false got=${mcp}"; ok=0; }
  [[ "$gitq" == "false" ]] || { fail "${label}: gitContextQueryEnabled want=false got=${gitq}"; ok=0; }
  [[ "$review" == "false" ]] || { fail "${label}: contractCostReviewEnabled want=false got=${review}"; ok=0; }
  [[ "$apply" == "false" ]] || { fail "${label}: contractCostApplyEnabled want=false got=${apply}"; ok=0; }

  mcp_http="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${url}/api/v1/auth/mcp-token" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${APM_EMAIL}\",\"password\":\"${APM_PASSWORD}\"}")"
  [[ "$mcp_http" == "404" ]] || { fail "${label}: MCP token HTTP want=404 got=${mcp_http}"; ok=0; }

  if [[ "$ok" -eq 1 ]]; then
    pass "${label}: tier=${tier} cost=${cost} mcp=${mcp} gitQuery=${gitq}"
  fi
}

run_tier_core() {
  local port pid log
  port="$(pick_port)"
  log="/tmp/apm-tier-core-${port}.log"
  echo "Starting profile=tier-core on port ${port}..."
  java -jar "$JAR" \
    --spring.profiles.active="dev-h2,tier-core" \
    --server.port="${port}" \
    >"$log" 2>&1 &
  pid=$!

  local ready=0 i
  for i in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:${port}/graphiql" >/dev/null 2>&1 \
      || curl -sf -o /dev/null -w '' "http://127.0.0.1:${port}/api/v1/auth/login" >/dev/null 2>&1; then
      if MANAGER_URL="http://127.0.0.1:${port}" login_token >/dev/null 2>&1; then
        ready=1
        break
      fi
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      fail "tier-core: manager exited early — see ${log}"
      return
    fi
    sleep 1
  done

  if [[ "$ready" -ne 1 ]]; then
    fail "tier-core: manager did not become ready — see ${log}"
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    return
  fi

  assert_features "tier-core" "$port"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}

echo "Tier-core feature gate validation"
echo
run_tier_core
summary
