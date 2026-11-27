#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail
TIER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${TIER_DIR}"

ENV_FILE=".env"
[[ -f "$ENV_FILE" ]] || ENV_FILE=".env.example"

COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.yml)
PROFILE_ARGS=()
UP_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --profile|--profile=*)
      PROFILE_ARGS+=("$arg")
      ;;
    *)
      UP_ARGS+=("$arg")
      ;;
  esac
done

if [[ -n "${INCLUDE_AGENT:-}" ]]; then
  PROFILE_ARGS+=(--profile agent)
fi

"${COMPOSE[@]}" "${PROFILE_ARGS[@]}" up -d "${UP_ARGS[@]}"
echo "Stack started (see README.md for URLs)."
