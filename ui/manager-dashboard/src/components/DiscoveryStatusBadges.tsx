/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

type DiscoveryEntry = {
  configType: string
  status: 'FOUND' | 'STALE' | 'MISSING' | 'SKIPPED' | 'CONFIGURED'
  watchPath?: string | null
  detail?: string | null
  newestLogAt?: string | null
}

const STATUS_CLASS: Record<DiscoveryEntry['status'], string> = {
  FOUND: 'active',
  CONFIGURED: 'active',
  STALE: 'abandoned',
  MISSING: 'abandoned',
  SKIPPED: 'neutral',
}

function formatConfigType(configType: string): string {
  return configType.replace(/_/g, ' ')
}

export function DiscoveryStatusBadges({ entries }: { entries: DiscoveryEntry[] | null | undefined }) {
  if (!entries || entries.length === 0) {
    return <span className="muted">—</span>
  }

  const visible = entries.filter((entry) => entry.status !== 'SKIPPED')
  if (visible.length === 0) {
    return <span className="muted">No local collectors</span>
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {visible.map((entry) => (
        <span
          key={entry.configType}
          className={`badge ${STATUS_CLASS[entry.status] ?? 'neutral'}`}
          title={[entry.watchPath, entry.detail].filter(Boolean).join(' — ')}
        >
          {formatConfigType(entry.configType)}: {entry.status.toLowerCase()}
        </span>
      ))}
    </div>
  )
}

export function DiscoverySummary({ entries }: { entries: DiscoveryEntry[] | null | undefined }) {
  if (!entries || entries.length === 0) {
    return null
  }
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = (acc[entry.status] ?? 0) + 1
    return acc
  }, {})
  const parts = Object.entries(counts).map(([status, count]) => `${count} ${status.toLowerCase()}`)
  return <span className="muted">{parts.join(', ')}</span>
}
