#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail
TIER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${TIER_DIR}"

VERSION="$(tr -d '[:space:]' < "${TIER_DIR}/VERSION" 2>/dev/null || echo local)"
export RETRYSIGHT_VERSION="${RETRYSIGHT_VERSION:-$VERSION}"

ENV_FILE=".env"
[[ -f "$ENV_FILE" ]] || ENV_FILE=".env.example"

if [[ -x scripts/build-product.sh ]]; then
  ./scripts/build-product.sh "$@"
else
  mvn -pl manager/manager-app,agent/agent-app -am package -Dmaven.test.skip=true -B -q
  (cd ui/manager-dashboard && npm ci --silent && npm run build --silent)
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml build "$@"
fi

if [[ "$RETRYSIGHT_VERSION" != "local" ]]; then
  for img in postgres manager frontend agent; do
    docker tag "retrysight/tier-core-${img}:${RETRYSIGHT_VERSION}" "retrysight/tier-core-${img}:local" 2>/dev/null || true
  done
fi

echo "Product images built (tag: ${RETRYSIGHT_VERSION})."
