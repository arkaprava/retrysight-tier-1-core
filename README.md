# RetrySight Core

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/arkaprava/retrysight-tier-1-core?sort=semver)](https://github.com/arkaprava/retrysight-tier-1-core/releases)

**See every retry. Know every dollar.** RetrySight is self-hosted observability for AI coding agents
(Cursor, Claude Code, Codex and more): tasks, retries, tokens and cost across your whole fleet.

Foundation tier: agent ingest, dashboard, tasks, live feed, collector registry, and retention. No cost analytics, evaluations, MCP, ClickHouse, Insights chat, or extended collectors.

Installation tier `TIER_1_CORE` · Spring profile `docker,tier-core` · [retrysight.com](https://retrysight.com)

## The RetrySight lineup

Each tier is a standalone, self-contained repository. Higher tiers include everything below them.

| Tier | Repository | Adds |
|------|------------|------|
| **Core** | [`retrysight-tier-1-core`](https://github.com/arkaprava/retrysight-tier-1-core) | Ingest, dashboard, tasks, live feed, collector registry, retention |
| Analytics | [`retrysight-tier-2-analytics`](https://github.com/arkaprava/retrysight-tier-2-analytics) | + cost analytics, reports, evaluations, extended collectors, git context |
| Integration | [`retrysight-tier-3-integration`](https://github.com/arkaprava/retrysight-tier-3-integration) | + MCP server, SSO tools API, ClickHouse analytics, traces, patterns |
| Cloud | [`retrysight-tier-4-cloud`](https://github.com/arkaprava/retrysight-tier-4-cloud) | + push ingest, S3/MinIO archive, cold restore, git enterprise privacy |

Looking for a single-user desktop console? See [RetrySight Lite](https://github.com/arkaprava/retrysight-lite).

## Install

### Docker Compose (prebuilt images)

```bash
curl -fsSL https://app.retrysight.com/enterprise/tier-core/latest/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

Dashboard: http://localhost:8080 · Manager API: http://localhost:28471

Multi-arch images (amd64, arm64) are published to GHCR (`docker pull ghcr.io/arkaprava/retrysight-tier-1-core/manager:1.0.0`), and as
`docker save` tarballs on the [releases page](https://github.com/arkaprava/retrysight-tier-1-core/releases) and at
`https://app.retrysight.com/enterprise/tier-core/latest/` for air-gapped installs (`docker load -i retrysight-manager-1.0.0-linux-amd64.tar.gz`; arm64 tarballs too).

### Kubernetes (Helm)

```bash
curl -fsSLO https://app.retrysight.com/enterprise/tier-core/latest/retrysight-1.0.0.tgz
helm upgrade --install retrysight ./retrysight-1.0.0.tgz -n retrysight --create-namespace
```

The chart generates the database password, JWT secret, admin password and agent API key on first
install and keeps them across upgrades. `helm status retrysight -n retrysight` prints how to read them.
See [`docs/RELEASE.md`](docs/RELEASE.md) for values and ingress options.

### Collector agent

Native installers (Windows `.msi`, macOS `.pkg`, Linux `.deb`) and the agent jar are attached to each
[release](https://github.com/arkaprava/retrysight-tier-1-core/releases).

## Build from source

### Components

| Component | Image | Notes |
|-----------|-------|-------|
| PostgreSQL 16 | `retrysight/tier-core-postgres:local` | OLTP — database `agent_retry_core` |
| Manager | `retrysight/tier-core-manager:local` | Spring profile `docker,tier-core` |
| Dashboard | `retrysight/tier-core-frontend:local` | nginx + React UI (core nav only) |
| Collector (optional) | `retrysight/tier-core-agent:local` | Cursor, Claude Code, Codex only |

### Quick start

```bash
cp .env.example .env
./scripts/build.sh
./scripts/up.sh
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:8080 |
| Manager API | http://localhost:28471 |
| PostgreSQL | localhost:5432 |

Login: `secadmin@local` / `changeme` — compose **dev defaults** from `.env.example`. Change them (and set `SECURITY_ALLOW_DEFAULT_SECRETS=false`) before exposing the stack to anyone else.

### With collector container

Collectors must be running for tasks to appear in the dashboard:

```bash
./scripts/up-with-agent.sh
# or: ./scripts/up.sh --profile agent
```

### What's included (UI)

- **Dashboard** — tasks, retries, tokens, retry trends, active collectors
- **Live** — real-time task and heartbeat subscriptions
- **Tasks** — list, filters, task detail (timeline, replay, context usage)
- **Collectors** — fleet registry, stale heartbeat detection, collector discovery status (auto-discovery, parse health, buffer drops)
- **Admin** (secadmin) — SSO configuration, API keys
- **Settings** — theme selection

### What's not included

Cost analytics, reports, evaluations, MCP, SSO tools API, ClickHouse, push ingest, object archive, Insights chat, git context columns, and Tier 2+ collectors (Kiro, Warp, Copilot, etc.) are disabled by the `tier-core` Spring profile and omitted from this UI build.

See [`docs/OVERVIEW.md`](docs/OVERVIEW.md) for the verified feature-flag matrix.

### Configuration

| File | Purpose |
|------|---------|
| [`.env.example`](.env.example) | Environment template |
| [`config/agent/config.yaml`](config/agent/config.yaml) | Tier-1 collector tools only |
| [`docs/OVERVIEW.md`](docs/OVERVIEW.md) | Capabilities and limits |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production checklist |
| [`docs/RELEASE.md`](docs/RELEASE.md) | CI, Helm, GHCR, native agent installers |

### Tier model

See [`docs/FUNCTIONAL_SPECIFICATION.md`](docs/FUNCTIONAL_SPECIFICATION.md) §10 for the full tier model.

## Repository layout

| Path | Purpose |
|------|---------|
| `manager/manager-app` | Spring Boot manager (GraphQL + ingest REST) |
| `agent/agent-app` | Collector agent |
| `ui/manager-dashboard` | React dashboard (tier-core nav only) |
| `shared/agent-contract` | Shared ingest DTOs |
| `helm/retrysight/` | Kubernetes Helm chart (postgres, manager, frontend) |
| `.github/workflows/release.yml` | CI: Docker + Helm + native agent builds |
| `infra/` | Dockerfiles (manager, agent, frontend) |
| `docker/` | PostgreSQL image + init scripts |
| `docker-compose.yml` | Full stack (postgres, manager, frontend, optional agent) |
| `config/agent/` | Collector + fleet config examples |
| `scripts/` | Build, run, packaging, and validation helpers |
| `docs/` | Tier documentation |

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License, Version 2.0](LICENSE). Copyright © 2026 Arka Prava Ghosh.
