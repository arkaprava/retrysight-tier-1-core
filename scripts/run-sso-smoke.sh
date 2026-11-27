#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

# Run RetrySight SSO integration tests (phases 1–6) against the local stack.
set -euo pipefail

TIER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSO_DIR="${SSO_TEST_DIR:-${TIER_DIR}/../retrysight-sso-integration-testing}"

if [[ ! -d "$SSO_DIR/scripts" ]]; then
  echo "ERROR: SSO test repo not found at ${SSO_DIR}" >&2
  echo "Clone retrysight-sso-integration-testing alongside tier-1-core or set SSO_TEST_DIR." >&2
  exit 1
fi

INCLUDE_SAML=0
for arg in "$@"; do
  case "$arg" in
    --include-saml) INCLUDE_SAML=1 ;;
    -h|--help)
      echo "Usage: $0 [--include-saml]"
      exit 0
      ;;
  esac
done

echo "Running SSO smoke tests from ${SSO_DIR}"
if [[ "$INCLUDE_SAML" -eq 1 ]]; then
  exec bash "${SSO_DIR}/scripts/run-all.sh" --include-saml
else
  exec bash "${SSO_DIR}/scripts/run-all.sh"
fi
