# SSO setup for RetrySight Core customers

Guide for configuring OIDC or SAML with a customer-managed identity provider.

## Architecture

RetrySight manager runs in Docker and must reach the IdP for metadata, token exchange (OIDC), and SAML metadata fetch. **Browsers** reach the IdP separately for login redirects.

When manager and browser use different hostnames for the same IdP (common with Docker Desktop), configure split URLs:

| Variable | Audience | Example |
|----------|----------|---------|
| `SSO_IDP_BROWSER_BASE_URL` | Browser login redirects | `https://login.customer.com` |
| `SSO_IDP_INTERNAL_BASE_URL` | Manager container/server-side calls | `http://host.docker.internal:8082` or internal service URL |

For Linux Docker without `host.docker.internal`, use an internal DNS name or `extra_hosts` in compose.

## OIDC

### Required IdP settings

| Setting | Value |
|---------|-------|
| Redirect URI | `https://<manager-host>/login/oauth2/code/manager` |
| Scopes | `openid profile email` (minimum) |
| Groups claim | Map IdP group membership to a claim named `groups` (or configure attribute name in Security wizard) |

### Manager environment

```bash
SSO_CALLBACK_BASE_URL=https://<ui-host>          # UI origin for post-login redirect
SSO_MANAGER_BASE_URL=https://<manager-host>      # Public manager URL (redirect URI base)
SSO_IDP_BROWSER_BASE_URL=https://<idp-host>      # Browser-facing IdP origin
SSO_IDP_INTERNAL_BASE_URL=https://<idp-internal> # Reachable from manager container
CORS_ALLOWED_ORIGINS=https://<ui-host>
```

### Stored issuer URI

In the Security wizard, set **Issuer URI** to the URL the **manager container** uses to fetch OIDC discovery — often the internal hostname:

```
https://idp-internal.customer.com/realms/myrealm
```

The manager rewrites the authorization endpoint for browsers using `SSO_IDP_BROWSER_BASE_URL` while keeping token/JWKS on the internal URL.

### Superuser mapping

Set **Superuser group** to an IdP group name (e.g. `platform-admins`). Members receive the `SECADMIN` role.

## SAML

### Required IdP settings

| Setting | Value |
|---------|-------|
| SP Entity ID | Shown in Security wizard after save (e.g. `https://<manager-host>/saml2/service-provider-metadata/manager`) |
| ACS URL | `https://<manager-host>/login/saml2/sso/manager` |
| Name ID format | Email recommended |
| Signature | IdP signs assertions; SP signature on AuthnRequest optional |

Provide either **Metadata URL** (reachable from manager container) or paste **Metadata XML**.

Attribute mapping (defaults):

| RetrySight field | SAML attribute |
|------------------|----------------|
| Email | `email` |
| Display name | `name` |
| Groups | `groups` |

### Manager environment

Same split-URL variables as OIDC. SAML SSO redirects use `SSO_IDP_BROWSER_BASE_URL` to rewrite the IdP SingleSignOnService location from metadata.

### Login URL

After enable, SSO login starts at:

```
https://<manager-host>/saml2/authenticate/manager
```

## Post-login flow

Both OIDC and SAML redirect the browser to:

```
https://<ui-host>/auth/callback?code=<one-time-code>
```

The UI exchanges the code for a JWT via `POST /api/v1/auth/sso/exchange`.

## Break-glass access

Keep local secadmin credentials (`SECADMIN_EMAIL` / `SECADMIN_PASSWORD`) in a secrets manager. Local login remains available until SSO is enabled and validated.

See [SSO_DR.md](./SSO_DR.md) for disaster recovery.

## Validation

Internal QA uses `retrysight-sso-integration-testing` (Keycloak on port 8082). Customers should validate in staging before enabling SSO in production:

1. Save config → **Test connection** → **Enable SSO**
2. Sign in via **Sign in with SSO** on the login page
3. Confirm admin group mapping for a privileged test user

## Common issues

| Symptom | Fix |
|---------|-----|
| `host.docker.internal` DNS error in browser | IdP hostname must be browser-resolvable; set IdP front-door URL to public hostname |
| OIDC 500 on callback | Check manager logs; often duplicate email or token exchange to wrong IdP host |
| SAML "metadata missing EntityDescriptor" | Ensure metadata URL returns SAML 2.0 XML; manager requires namespace-aware parsing |
| CORS errors on API | Add UI origin to `CORS_ALLOWED_ORIGINS` |
