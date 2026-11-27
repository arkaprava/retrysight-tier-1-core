# RetrySight validation guide

Executable validation for RetrySight: functional smoke, agent hardening, tier gating, security review, and capacity probes.

## Quick start

```bash
# Manager must be running (Postgres or -Dspring-boot.run.profiles=dev-h2)
./scripts/validation/smoke.sh

# Tier gating (starts ephemeral managers on free ports — needs built JARs)
./scripts/validation/tier-matrix.sh

# Capacity probe against a live manager (requires agent API key)
./scripts/validation/capacity-probe.sh

# Agent edge-case smoke (collector hardening)
./scripts/validation/agent-edge-cases.sh

# Full local pack: unit tests + smoke (if MANAGER_URL up)
./scripts/validation/run-all.sh
```

Environment overrides:

| Variable | Default | Notes |
|----------|---------|-------|
| `MANAGER_URL` | `http://localhost:28471` | Manager API |
| `UI_URL` | `http://localhost:8080` | Docker nginx dashboard; use `5173` only for Vite dev |
| `APM_EMAIL` / `APM_PASSWORD` | `secadmin@local` / `changeme` | Secadmin login |
| `AGENT_API_KEY` | `dev-agent-key` | Ingest header |

## Objectives

| Area | Goal |
|------|------|
| Functional | Core journeys and APIs work across tiers |
| Security | Authz, secrets, and exposure reviewed with evidence |
| Capacity | Throughput / growth guidance for events & token_usage |
| Recommendations | Prioritized backlog after evidence |

## Environment matrix

| Env | Stack |
|-----|-------|
| E1 Local | Postgres Docker + manager + agent + dashboard (`8080`) or Vite dev UI (`5173`) |
| E2 Compose | Root `docker-compose.yml` |
| E3 Tier profile | `tier-core` only (this repo) |
| E4 Stress | E1/E2 + `capacity-probe.sh` |

## Smoke checklist (S1–S12)

Automated by `scripts/validation/smoke.sh` where noted; UI steps remain manual.

| # | Case | Automated | Expected |
|---|------|-----------|----------|
| S1 | Login JWT | Yes | `POST /api/v1/auth/login` → token |
| S2 | `platformFeatures` | Yes | Tier + flags coherent |
| S3 | `dashboardSummary` | Yes | No GraphQL errors |
| S4 | Live / subscriptions | Manual | UI `/live` no crash |
| S5 | `tasks` + `task` | Yes | List + optional first detail |
| S6 | `agents` | Yes | Array (may be empty) |
| S7 | `costSummary` | Yes | No `INTERNAL_ERROR` / `:toGROUP` |
| S8 | Retries page / analysis | Yes if query present | Loads or skipped |
| S9 | Reports options | Yes | `GET /api/v1/reports/options` |
| S10 | Git `projectContext` | Yes | Field present when capture on |
| S11 | MCP token | Yes | `POST /api/v1/auth/mcp-token` (404 if gated) |
| S12 | Agent ingest auth | Yes | Heartbeat with key → 2xx; without → 401 |

### Manual UI checks

**Docker stack (default):**

1. Open http://localhost:8080 — login  
2. Dashboard KPIs match GraphQL  
3. Hard-refresh `/tasks` and `/tasks/:id` (tier core — skip `/cost`)  
4. `/agents` shows collectors; discovery badges when auto-discovery is enabled  
5. Sign out clears session  

**Vite dev only:** use http://localhost:5173 with `npm run dev` in `ui/manager-dashboard`.

## Tier matrix

This standalone repo ships **`tier-core` only**. `tier-matrix.sh` starts an ephemeral manager with `dev-h2,tier-core` and asserts feature gates (cost, MCP, git query, push ingest all off).

| Profile | Cost / reports | MCP | Git query | Push ingest |
|---------|----------------|-----|-----------|-------------|
| `tier-core` | Off | Off | Off | Off |

Run: `./scripts/validation/tier-matrix.sh`

## Tier-core smoke (manual)

After `./scripts/up-with-agent.sh`:

1. Login at http://localhost:8080 (`secadmin@local` / `changeme`)
2. Dashboard loads without GraphQL errors (no cost/eval fields required)
3. `/tasks` lists ingested sessions; open a task detail page
4. `/live` shows connected live signal; task/heartbeat updates when collector runs
5. `/agents` shows at least one registered collector
6. Sign out clears session

Routes **not** expected in tier-core UI: `/cost`, `/reports`, `/evaluations`, Insights chat FAB.

## Functional deep-dive (manual / future automation)

- **Ingest:** idempotent batch replay; buffer drain after manager outage  
- **Collectors (tier core):** Cursor, Claude Code, Codex only  
- **Cost / retry:** retry metrics from ingest; full cost analytics disabled  
- **Auth:** UI vs SECADMIN; SSO DR when no IdP rows  

## Automated tests and CI

**Release workflow** (`.github/workflows/release.yml`) runs on PRs: manager Docker + Helm packaging, agent `.deb`/`.msi`/`.pkg` builds. See [RELEASE.md](./RELEASE.md).

Local unit tests:

```bash
mvn -pl shared/agent-contract,manager/manager-app,agent/agent-app -am test
cd ui/manager-dashboard && npm run build
```

Manager includes HTTP/GraphQL smoke: `ApiSmokeIntegrationTest` (`dev-h2`, random port).

Agent hardening regression: `./scripts/validation/agent-edge-cases.sh` (5 checks — discovery CLI, idle tracker, ack planner, JSONL rotation, platform paths).

## Exit criteria

- Smoke S1–S12 green on E1  
- `agent-edge-cases.sh` passes  
- Tier matrix executed once  
- No open P0 defects  
- Maven + MCP + UI build green  

## Related docs

- [SECURITY.md](./SECURITY.md) — security analysis checklist & hardening  
- [CAPACITY.md](./CAPACITY.md) — capacity model & probe usage  
