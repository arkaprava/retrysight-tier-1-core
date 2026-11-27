# RetrySight Core — capabilities

**Installation tier:** `TIER_1_CORE`  
**Spring profile:** `docker,tier-core` (manager and agent)  
**Enum:** `InstallationTier.TIER_1_CORE`

This document reflects the **current** tier-core deployment and UI (verified against the live `platformFeatures` GraphQL query).

## Platform feature flags (runtime)

| Flag | Tier core |
|------|-----------|
| `phase1Foundation` | **On** — ingest, dashboard, tasks, live feed, collectors registry |
| `phase2Collectors` | **Off** — extended IDE collectors (Kiro, Warp, Copilot, …) |
| `phase3YamlRegistry` | **Off** — YAML registry / source-tools API |
| `phase4PushIngest` | **Off** — push ingest |
| `costEnabled` | **Off** — cost analytics & reports |
| `reportsEnabled` | **Off** |
| `evaluationsEnabled` | **Off** |
| `traceQueryEnabled` | **Off** |
| `patternsEnabled` | **Off** |
| `mcpEnabled` | **Off** |
| `sourceToolsEnabled` | **Off** |
| `gitContextCaptureEnabled` | **Off** |
| `gitContextQueryEnabled` | **Off** |
| `retentionPurgeEnabled` | **On** — scheduled task-event purge |
| `archiveLocalEnabled` | **Off** |
| `archiveNetworkEnabled` | **Off** |
| `archiveObjectStorageEnabled` | **Off** |
| `archiveRestoreEnabled` | **Off** |
| `clickhouseAnalyticsEnabled` | **Off** |
| `pushIngestEnabled` | **Off** |

Docker defaults (`docker-compose.yml`): `CHAT_ENABLED=false`, `CLICKHOUSE_ENABLED=false`, `OTEL_INGEST_ENABLED=false`.

## Enabled collectors

| Tool | Source ID | Enabled |
|------|-----------|---------|
| Cursor | `CURSOR` | Yes |
| Claude Code | `CLAUDE_CODE` | Yes |
| Codex | `CODEX` | Yes |
| All others (Kiro, Warp, Copilot, Windsurf, …) | — | No |

Configure host paths in [`config/agent/config.yaml`](../config/agent/config.yaml). Start the collector with `./scripts/up-with-agent.sh` or run the agent JAR locally against the manager.

## Included capabilities

| Area | What you get |
|------|----------------|
| **Ingest** | Agent pull batches, heartbeats, idempotent event upload |
| **Dashboard** | Task/retry/token KPIs, retry trend charts, LLM turn counts, active collector count, week-over-week deltas |
| **Tasks** | Filterable task list, task detail with event timeline, context usage, session replay |
| **Live** | GraphQL subscriptions (`taskUpdated`, `agentHeartbeat`), latest task/agent panes, session waterfall |
| **Fleet** | Collector registry, stale heartbeat detection, discovery/parse/buffer status on **Agents** page |
| **Admin** | Secadmin local login, OIDC/SAML SSO wizard, API key management |
| **UI** | Theme settings (monitor / light variants) |
| **Retention** | Configurable task-event purge (`RETENTION_TASK_EVENTS_DAYS`, default 90) |

### Dashboard notes (tier core)

- **Token usage** and **estimated cost from token turns** are shown (ingest-time estimates).
- **Cost analytics** charts (cost trend, cost by tool, retry waste %, cost-by-user) are **hidden** because `costEnabled=false`.
- **Eval pass rate** and other evaluation KPIs are **hidden**.

### Task detail notes (tier core)

- Event timeline, context usage, session replay, retry metrics.
- No evaluation panels, git/project context, or trace views.

## UI routes (present in this build)

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | Local login (+ SSO button when configured) |
| `/auth/callback` | Public | SSO redirect handler |
| `/` | UI | Dashboard |
| `/live` | UI | Live activity feed |
| `/tasks` | UI | Task list |
| `/tasks/:id` | UI | Task detail |
| `/agents` | UI | Collector registry + discovery health |
| `/admin/security` | Secadmin | SSO / security settings |
| `/admin/api-keys` | Secadmin | API key management |

Routes **not** shipped in this tier-core UI build: `/cost`, `/reports`, `/evaluations`, `/traces`, `/patterns`, `/admin/archive`, marketing previews, Insights chat.

## Disabled at this tier

| Feature | Min tier |
|---------|----------|
| Cost analytics, reports, billing reconciliation | TIER_2 |
| Extended collectors (Kiro, Warp, Copilot, …) | TIER_2 |
| Git context capture & repo/branch columns | TIER_2 |
| Evaluations, playground, experiments | TIER_2 / TIER_3 |
| Insights chatbot (UI + `CHAT_ENABLED=false` in Docker) | TIER_2+ optional |
| MCP integration | TIER_3 |
| SSO source-tools API | TIER_3 |
| Contract cost apply | TIER_3 |
| ClickHouse analytics, trace search, patterns | TIER_3 |
| Push ingest | TIER_4 |
| Object storage archive | TIER_4 |
| Git enterprise privacy | TIER_4 |

## Database

Single **PostgreSQL 16** instance (`agent_retry_core`). Each collector uses **SQLite** for its upload buffer (`~/.agent-retry/buffer.db` on the host, or a Docker volume in the agent container).

## Verify features yourself

```bash
# After stack is up and you have a JWT (login via UI or REST)
curl -sS -X POST http://localhost:28471/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ platformFeatures { installationTier costEnabled evaluationsEnabled retentionPurgeEnabled } sourceTools { id enabled } }"}'
```

## Validation

```bash
./scripts/validation/tier-matrix.sh   # includes tier-core profile checks
```

See also [VALIDATION.md](./VALIDATION.md), [RELEASE.md](./RELEASE.md), and the tier matrix in [FUNCTIONAL_SPECIFICATION.md](./FUNCTIONAL_SPECIFICATION.md) §10.
