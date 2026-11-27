/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import LoadingState from '../components/LoadingState'
import { DiscoveryStatusBadges } from '../components/DiscoveryStatusBadges'
import { SortableTableHeader } from '../components/SortableTableHeader'
import { AGENTS_QUERY } from '../graphql/client'
import { useTableSort } from '../hooks/useTableSort'
import { formatAgentUserDetail } from '../agentUser'

type DiscoveryEntry = {
  configType: string
  status: 'FOUND' | 'STALE' | 'MISSING' | 'SKIPPED' | 'CONFIGURED'
  watchPath?: string | null
  detail?: string | null
  newestLogAt?: string | null
}

type AgentRow = {
  id: string
  hostname: string
  developerEmail: string
  osUsername?: string | null
  displayName?: string | null
  gitEmail?: string | null
  lastHeartbeatAt: string | null
  installedCollectors: string | null
  stale?: boolean | null
  queueDepth?: number | null
  autoDiscovery?: boolean | null
  bufferDroppedTotal?: number | null
  discoveryResults?: DiscoveryEntry[] | null
  parseErrors?: { sourceTool: string; errorCount: number }[] | null
}

const AGENT_SORT_COLUMNS = [
  { key: 'hostname', type: 'text' as const, getValue: (agent: AgentRow) => agent.hostname },
  { key: 'user', type: 'text' as const, getValue: (agent: AgentRow) => formatAgentUserDetail(agent) },
  { key: 'osUsername', type: 'text' as const, getValue: (agent: AgentRow) => agent.osUsername ?? '' },
  { key: 'developerEmail', type: 'text' as const, getValue: (agent: AgentRow) => agent.developerEmail },
  {
    key: 'status',
    type: 'text' as const,
    getValue: (agent: AgentRow) => (agent.stale ? 'stale' : 'online'),
  },
  {
    key: 'lastHeartbeatAt',
    type: 'date' as const,
    getValue: (agent: AgentRow) => agent.lastHeartbeatAt,
  },
  {
    key: 'discovery',
    type: 'text' as const,
    getValue: (agent: AgentRow) =>
      (agent.discoveryResults ?? [])
        .map((entry) => `${entry.configType}:${entry.status}`)
        .join(','),
  },
  {
    key: 'queueDepth',
    type: 'number' as const,
    getValue: (agent: AgentRow) => agent.queueDepth ?? 0,
  },
]

function formatQueue(agent: AgentRow): string {
  const depth = agent.queueDepth ?? 0
  if (agent.bufferDroppedTotal && agent.bufferDroppedTotal > 0) {
    return `${depth} (${agent.bufferDroppedTotal} dropped)`
  }
  return String(depth)
}

export default function AgentsPage() {
  const { data, loading, error } = useQuery(AGENTS_QUERY, {
    pollInterval: 15000,
  })
  const [staleOnly, setStaleOnly] = useState(false)

  const agents: AgentRow[] = data?.agents ?? []
  const visibleAgents = useMemo(
    () => (staleOnly ? agents.filter((agent) => agent.stale) : agents),
    [agents, staleOnly],
  )
  const staleCount = useMemo(() => agents.filter((agent) => agent.stale).length, [agents])
  const discoveryIssueCount = useMemo(
    () =>
      agents.filter((agent) =>
        (agent.discoveryResults ?? []).some(
          (entry) => entry.status === 'MISSING' || entry.status === 'STALE',
        ),
      ).length,
    [agents],
  )
  const sortColumns = useMemo(() => AGENT_SORT_COLUMNS, [])
  const { sortedData: sortedAgents, sortKey, sortDirection, toggleSort } = useTableSort(
    visibleAgents,
    sortColumns,
  )

  if (loading) return <LoadingState label="Loading collectors…" />
  if (error) return <p className="empty" role="alert">Failed to load collectors: {error.message}</p>

  return (
    <>
      <header className="page-header">
        <h2 className="page-title">Collectors</h2>
        <p className="page-subtitle">Developer machines running the collector service</p>
      </header>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={staleOnly}
              onChange={(event) => setStaleOnly(event.target.checked)}
            />
            Stale only
          </label>
          {staleCount > 0 && (
            <span className="badge abandoned" title="No recent heartbeat">
              {staleCount} stale
            </span>
          )}
          {discoveryIssueCount > 0 && (
            <span className="badge abandoned" title="Collectors with missing or stale log paths">
              {discoveryIssueCount} discovery issues
            </span>
          )}
        </div>
        {agents.length === 0 ? (
          <p className="empty">No collectors registered yet.</p>
        ) : visibleAgents.length === 0 ? (
          <p className="empty">No stale collectors.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <SortableTableHeader
                    label="Hostname"
                    columnKey="hostname"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="User"
                    columnKey="user"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="OS Username"
                    columnKey="osUsername"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="Email"
                    columnKey="developerEmail"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="Status"
                    columnKey="status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="Last Heartbeat"
                    columnKey="lastHeartbeatAt"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="Discovery"
                    columnKey="discovery"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    label="Queue"
                    columnKey="queueDepth"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td><strong>{agent.hostname}</strong></td>
                    <td>{formatAgentUserDetail(agent)}</td>
                    <td>{agent.osUsername ?? '—'}</td>
                    <td>{agent.developerEmail}</td>
                    <td>
                      {agent.stale ? (
                        <span className="badge abandoned">Stale</span>
                      ) : (
                        <span className="badge active">Online</span>
                      )}
                      {agent.autoDiscovery === false && (
                        <span className="badge neutral" style={{ marginLeft: '0.35rem' }} title="Fixed collector paths">
                          fixed
                        </span>
                      )}
                    </td>
                    <td>
                      {agent.lastHeartbeatAt
                        ? new Date(agent.lastHeartbeatAt).toLocaleString()
                        : '—'}
                    </td>
                    <td><DiscoveryStatusBadges entries={agent.discoveryResults} /></td>
                    <td>{formatQueue(agent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
