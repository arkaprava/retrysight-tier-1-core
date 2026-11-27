#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

# Run the collector agent natively on Linux or macOS (outside Docker).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAR="$(ls "${ROOT}"/agent/agent-app/target/agent-app-*.jar 2>/dev/null | head -1)"

if [[ -z "$JAR" || ! -f "$JAR" ]]; then
  echo "Agent JAR not found. Run ./scripts/build.sh first." >&2
  exit 1
fi

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-tier-core}"
export AGENT_MANAGER_URL="${AGENT_MANAGER_URL:-http://localhost:${MANAGER_PORT:-28471}}"
export AGENT_API_KEY="${AGENT_API_KEY:-dev-agent-key}"

CONFIG_DIR="${HOME}/.agent-retry"
if [[ ! -f "${CONFIG_DIR}/config.yaml" && -f "${ROOT}/config/agent/config.yaml" ]]; then
  mkdir -p "${CONFIG_DIR}"
  cp "${ROOT}/config/agent/config.yaml" "${CONFIG_DIR}/config.yaml"
  echo "Copied tier-core config to ${CONFIG_DIR}/config.yaml"
fi

echo "Starting agent (profile=${SPRING_PROFILES_ACTIVE}, manager=${AGENT_MANAGER_URL})"
exec java -jar "$JAR"
