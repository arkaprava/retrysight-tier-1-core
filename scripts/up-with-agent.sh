#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail
TIER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export INCLUDE_AGENT=1
exec "${TIER_DIR}/scripts/up.sh" "$@"
