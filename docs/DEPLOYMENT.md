# RetrySight Core — deployment

## Prerequisites

- Docker 24+
- Java 21 + Maven 3.9 (for `./scripts/build.sh` — builds manager/agent JARs)
- Node 20+ (bundled in frontend Docker build; only needed for local UI dev)

## Local Docker stack

From the **repository root**:

```bash
cp .env.example .env
./scripts/validate-env.sh          # dev: warnings only; use --strict before production
./scripts/build.sh
./scripts/up.sh
```

Start with the collector agent (required for task ingest):

```bash
./scripts/up-with-agent.sh
```

## Environment

Key variables in `.env.example`:

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Must include `docker,tier-core` for manager and agent |
| `POSTGRES_DB` | `agent_retry_core` — isolated from other tiers |
| `MANAGER_PORT` / `FRONTEND_PORT` | Default 28471 / 8080 |
| `JWT_SECRET`, `SECADMIN_PASSWORD`, `AGENT_API_KEY` | Change before production |
| `RETENTION_TASK_EVENTS_DAYS` | Task-event retention (default 90) |
| `RETRYSIGHT_VERSION` | Docker image tag (see `VERSION` and `release/manifest.yaml`) |
| `SSO_IDP_BROWSER_BASE_URL` | Browser-facing IdP origin for SSO redirects |
| `SSO_IDP_INTERNAL_BASE_URL` | Container-reachable IdP origin for metadata/token exchange |
| `CHAT_ENABLED` | Default `false` — Insights chat not used in tier-core UI |
| `CLICKHOUSE_ENABLED` | Default `false` |
| `OTEL_INGEST_ENABLED` | Default `false` |

## Production checklist

1. Set `SECURITY_ALLOW_DEFAULT_SECRETS=false` and rotate all secrets.
2. Activate `prod` Spring profile on manager: `SPRING_PROFILES_ACTIVE=docker,tier-core,prod`.
3. Use managed PostgreSQL or set `SPRING_DATASOURCE_*` (see [BYO_RDBMS.md](./BYO_RDBMS.md)).
4. Run collectors on developer machines or as the Docker agent profile with [`config/agent/config.yaml`](../config/agent/config.yaml) (Tier-1 tools only).
5. Terminate TLS at your load balancer; nginx frontend proxies `/graphql` and `/api` to manager.
6. Configure SSO per [SSO_CUSTOMER.md](./SSO_CUSTOMER.md); validate with `./scripts/run-sso-smoke.sh --include-saml`.

## Host agent (without Docker collector)

```bash
# From repo root after ./scripts/build.sh
SPRING_PROFILES_ACTIVE=tier-core \
  AGENT_MANAGER_URL=https://manager.example.com \
  AGENT_MANAGER_API_KEY=<key> \
  java -jar agent/agent-app/target/agent-app-0.1.0-SNAPSHOT.jar \
  --spring.config.additional-location=file:config/agent/config.yaml
```

## Stop / logs

```bash
./scripts/down.sh
docker compose --env-file .env -f docker-compose.yml logs -f manager
```

## Release builds (CI / Helm / native agents)

GitHub Actions workflow **Release** (`.github/workflows/release.yml`) builds on every PR and on `v*` tags:

- Manager Docker images (postgres, manager, frontend)
- Helm chart (`helm/retrysight/`)
- Native agent installers: Linux `.deb`, Windows `.msi`, macOS `.pkg`

See [RELEASE.md](./RELEASE.md) for artifact layout, GHCR tags, and local `./scripts/ci/*` helpers.

## Fleet agent (recommended for developer machines)

Install the jar and tier-specific fleet config, then run discovery:

```bash
./scripts/build.sh
./scripts/retrysight-agent install      # copies jar + config/agent/fleet-config.example.yaml
./scripts/retrysight-agent discover     # probe IDE log paths (JSON)
./scripts/retrysight-agent run          # foreground collector
```

Native installers (bundled JRE): `./scripts/package-agent.sh` → `release/agent-installers/`.

| Package | Auto-start after reboot / login |
|---------|----------------------------------|
| macOS `.pkg` | LaunchAgent `com.retrysight.agent` (`RunAtLoad` + `KeepAlive`) |
| Linux `.deb` | User systemd unit `retrysight-agent.service` (`systemctl --global enable`) |
| Windows `.msi` | Ships `register-autostart.ps1` (run once, or use install-agent-service.ps1) → Scheduled task `RetrySightAgent` (`AtLogOn`) |

Manual / jar installs: `./infra/scripts/install-agent-service.sh` (macOS/Linux) or `infra/windows/install-agent-service.ps1`.

Validate agent hardening: `./scripts/validation/agent-edge-cases.sh`.
