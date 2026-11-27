# Infrastructure (Docker)

Dockerfiles for manager, agent, frontend, and optional legacy helpers under `infra/scripts/`.

**Day-to-day deployment uses the repository root**, not `infra/docker-compose.yml`:

| Resource | Location |
|----------|----------|
| Compose stack | [`docker-compose.yml`](../docker-compose.yml) |
| Build / up | [`scripts/build.sh`](../scripts/build.sh), [`scripts/up.sh`](../scripts/up.sh) |
| Production | [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) |
| CI / Helm / installers | [`docs/RELEASE.md`](../docs/RELEASE.md) |

## Layout

```
infra/
├── manager/Dockerfile    # Spring Boot manager (port 28471 in tier-core)
├── agent/Dockerfile      # Collector agent image
├── frontend/Dockerfile   # Vite build + nginx
│   └── nginx.conf        # Proxies /graphql and /api to manager
├── installer/
│   ├── macos/            # PKG entitlements + postinstall (LaunchAgent)
│   ├── linux/            # DEB postinstall/prerm/postrm (user systemd)
│   └── windows/          # MSI overrides + AtLogOn task registrar
├── systemd/ / launchd/   # OS service unit templates (jar installs)
└── scripts/              # Legacy monorepo helpers (prefer root scripts/)
docker/postgres/          # PostgreSQL 16 image + init grants
```

## Images (tier-core)

| Service | Default tag |
|---------|-------------|
| postgres | `retrysight/tier-core-postgres:local` |
| manager | `retrysight/tier-core-manager:local` |
| frontend | `retrysight/tier-core-frontend:local` |
| agent | `retrysight/tier-core-agent:local` (compose profile `agent`) |

Set `RETRYSIGHT_VERSION` or `VERSION` when building release tags — see [`release/manifest.yaml`](../release/manifest.yaml).

## Agent on the host

- **Fleet CLI:** [`scripts/retrysight-agent`](../scripts/retrysight-agent) — install, discover, run
- **Native run:** [`scripts/run-agent-native.sh`](../scripts/run-agent-native.sh) (Linux/macOS)
- **OS service (jar):** [`infra/scripts/install-agent-service.sh`](scripts/install-agent-service.sh)
- **Installers:** [`scripts/package-agent.sh`](../scripts/package-agent.sh) → `release/agent-installers/`
  - `.pkg` / `.deb` / `.msi` register login auto-start via installer hooks

The Docker agent profile mounts host IDE log directories read-only (`~/.cursor`, `~/.claude`, `~/.codex`). On Windows, set `AGENT_CURSOR_DIR`, `AGENT_CLAUDE_DIR`, and `AGENT_CODEX_DIR` in `.env` if paths are not expanded correctly.

## Local UI development

For hot reload, run the Vite dev server from `ui/manager-dashboard` (port **5173**) against a running manager. The Docker stack serves production-built UI on port **8080** via nginx.
