#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

# Validate RetrySight Core environment before deploy.
set -euo pipefail

TIER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${TIER_DIR}/.env"
STRICT=0
WARNINGS=0
ERRORS=0

usage() {
  cat <<'EOF'
Usage: validate-env.sh [--strict] [path/to/.env]

Checks RetrySight Core .env for production readiness.

  --strict   Treat weak/default secrets and localhost SSO URLs as errors
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict) STRICT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) ENV_FILE="$1"; shift ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf 'WARN  %s\n' "$*" >&2
}

fail() {
  ERRORS=$((ERRORS + 1))
  printf 'ERROR %s\n' "$*" >&2
}

check_nonempty() {
  local name="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    fail "${name} is required"
  fi
}

check_min_length() {
  local name="$1"
  local value="$2"
  local min="$3"
  if [[ "${#value}" -lt "$min" ]]; then
    fail "${name} must be at least ${min} characters"
  fi
}

is_default_secret() {
  local value="$1"
  case "$value" in
    changeme|changeme-core|dev-agent-key|agent-retry-platform-dev-secret-key-32chars|dev-sso-secret-encryption-key-32)
      return 0
      ;;
  esac
  return 1
}

looks_localhost() {
  local value="$1"
  [[ "$value" == *localhost* || "$value" == *127.0.0.1* ]]
}

echo "Validating ${ENV_FILE}"

check_nonempty POSTGRES_DB "${POSTGRES_DB:-}"
check_nonempty POSTGRES_USER "${POSTGRES_USER:-}"
check_nonempty POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
check_nonempty JWT_SECRET "${JWT_SECRET:-}"
check_nonempty SECADMIN_PASSWORD "${SECADMIN_PASSWORD:-}"
check_nonempty AGENT_API_KEY "${AGENT_API_KEY:-}"
check_nonempty SSO_SECRET_KEY "${SSO_SECRET_KEY:-}"

check_min_length JWT_SECRET "${JWT_SECRET:-}" 32
check_min_length SSO_SECRET_KEY "${SSO_SECRET_KEY:-}" 32

if [[ "${SPRING_PROFILES_ACTIVE:-}" != *tier-core* ]]; then
  warn "SPRING_PROFILES_ACTIVE should include tier-core (got: ${SPRING_PROFILES_ACTIVE:-unset})"
fi

if [[ "${SECURITY_ALLOW_DEFAULT_SECRETS:-true}" == "true" ]]; then
  if [[ "$STRICT" -eq 1 ]]; then
    fail "SECURITY_ALLOW_DEFAULT_SECRETS must be false in production"
  else
    warn "SECURITY_ALLOW_DEFAULT_SECRETS=true (dev only)"
  fi
fi

for pair in \
  "JWT_SECRET:${JWT_SECRET:-}" \
  "SECADMIN_PASSWORD:${SECADMIN_PASSWORD:-}" \
  "AGENT_API_KEY:${AGENT_API_KEY:-}" \
  "POSTGRES_PASSWORD:${POSTGRES_PASSWORD:-}" \
  "SSO_SECRET_KEY:${SSO_SECRET_KEY:-}"; do
  name="${pair%%:*}"
  value="${pair#*:}"
  if is_default_secret "$value"; then
    if [[ "$STRICT" -eq 1 ]]; then
      fail "${name} uses a known default value"
    else
      warn "${name} uses a known default value"
    fi
  fi
done

for url_var in SSO_CALLBACK_BASE_URL SSO_MANAGER_BASE_URL CORS_ALLOWED_ORIGINS; do
  value="${!url_var:-}"
  if [[ -n "$value" ]] && looks_localhost "$value" && [[ "$STRICT" -eq 1 ]]; then
    fail "${url_var} contains localhost/127.0.0.1 in strict mode"
  fi
done

if [[ -n "${SSO_IDP_BROWSER_BASE_URL:-}" ]] && [[ -n "${SSO_IDP_INTERNAL_BASE_URL:-}" ]]; then
  if [[ "${SSO_IDP_BROWSER_BASE_URL}" == "${SSO_IDP_INTERNAL_BASE_URL}" ]]; then
    warn "SSO_IDP_BROWSER_BASE_URL and SSO_IDP_INTERNAL_BASE_URL are identical — split URLs are usually required when manager runs in Docker"
  fi
fi

if [[ "$ERRORS" -gt 0 ]]; then
  printf '\nValidation failed: %d error(s), %d warning(s)\n' "$ERRORS" "$WARNINGS" >&2
  exit 1
fi

printf 'Validation passed: 0 errors, %d warning(s)\n' "$WARNINGS"
exit 0
