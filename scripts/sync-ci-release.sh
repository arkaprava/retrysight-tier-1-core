#!/usr/bin/env bash
# Copyright (c) 2026 Arka Prava Ghosh
# SPDX-License-Identifier: Apache-2.0

# Copy CI release assets from tier-1-core to sibling tier repos.
set -euo pipefail

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RETRYSIGHT_ROOT="$(cd "${SOURCE}/.." && pwd)"

TARGETS=(
  retrysight-tier-2-analytics
  retrysight-tier-3-integration
  retrysight-tier-4-cloud
)

for target in "${TARGETS[@]}"; do
  DEST="${RETRYSIGHT_ROOT}/${target}"
  if [[ ! -d "${DEST}" ]]; then
    echo "Skip missing ${DEST}" >&2
    continue
  fi
  echo "Syncing CI release assets -> ${target}"
  mkdir -p "${DEST}/helm/retrysight/templates" "${DEST}/scripts/ci" "${DEST}/.github/workflows"
  rsync -a "${SOURCE}/helm/retrysight/templates/" "${DEST}/helm/retrysight/templates/"
  cp "${SOURCE}/helm/retrysight/Chart.yaml" "${DEST}/helm/retrysight/Chart.yaml"
  cp "${SOURCE}/scripts/ci/"* "${DEST}/scripts/ci/"
  cp "${SOURCE}/.github/workflows/release.yml" "${DEST}/.github/workflows/release.yml"
  cp "${SOURCE}/.github/cdn.env" "${DEST}/.github/cdn.env"
  cp "${SOURCE}/docs/CDN_RELEASE_PATHS.md" "${DEST}/docs/CDN_RELEASE_PATHS.md"
  cp "${SOURCE}/VERSION" "${DEST}/VERSION"
  chmod +x "${DEST}/scripts/ci/"*.sh
  echo "  (tier.env and values.yaml remain tier-specific — edit manually if needed)"
done

echo "Done. Verify .github/tier.env and helm/retrysight/values.yaml in each target repo."
