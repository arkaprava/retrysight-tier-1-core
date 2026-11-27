/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useEffect, useState } from 'react'
import SkipLink from '../a11y/SkipLink'
import { useAuth } from '../auth/AuthContext'
import { fetchSsoStatus, type SsoStatus } from '../ssoApi'

const LOGIN_FEATURES = [
  { label: 'Retry analytics', detail: 'Track waste and recovery across agents' },
  { label: 'Token visibility', detail: 'Live usage metrics by tool and session' },
  { label: 'Live agent feed', detail: 'Watch tasks and heartbeats in real time' },
] as const

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoStatus, setSsoStatus] = useState<SsoStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadStatus() {
      try {
        const status = await fetchSsoStatus()
        if (!cancelled) {
          setSsoStatus(status)
        }
      } catch {
        if (!cancelled) {
          setSsoStatus(null)
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false)
        }
      }
    }
    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body.error === 'string' ? body.error : 'Invalid email or password'
        throw new Error(message)
      }
      const data = await response.json()
      login(data.token, data.email, data.displayName, data.roles ?? ['UI'])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const showLocalForm = ssoStatus?.localLoginAvailable ?? true
  const showSsoButton = ssoStatus?.ssoEnabled && ssoStatus.ssoLoginUrl
  const showDivider = showSsoButton && showLocalForm && !statusLoading

  return (
    <div className="login-page">
      <SkipLink targetId="login-main" label="Skip to sign in form" />
      <div className="login-shell">
        <aside className="login-hero" aria-label="Product overview">
          <div className="login-hero-glow" aria-hidden="true" />
          <div className="login-hero-inner">
            <div className="login-brand login-brand--hero">
              <img
                className="login-logo"
                src="/retrysight-logo.svg"
                alt=""
                width={52}
                height={52}
                aria-hidden="true"
              />
              <div className="login-brand-text">
                <span className="login-eyebrow">Monitor cockpit</span>
                <h1>RetrySight</h1>
                <p className="login-brand-tagline">Agent retry observability</p>
              </div>
            </div>

            <p className="login-hero-lead">
              See where agents stall, how much retry costs you, and what to fix next.
            </p>

            <ul className="login-feature-list">
              {LOGIN_FEATURES.map((item) => (
                <li key={item.label} className="login-feature-item">
                  <span className="login-feature-dot" aria-hidden="true" />
                  <span>
                    <strong>{item.label}</strong>
                    <span className="login-feature-detail">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="login-hero-stats" aria-hidden="true">
              <div className="login-stat-tile">
                <span className="login-stat-label">Retry waste</span>
                <span className="login-stat-value">↓ 12%</span>
              </div>
              <div className="login-stat-tile">
                <span className="login-stat-label">Live agents</span>
                <span className="login-stat-value login-stat-value--live">● 24</span>
              </div>
              <div className="login-stat-tile">
                <span className="login-stat-label">Est. cost</span>
                <span className="login-stat-value">$1.2k</span>
              </div>
            </div>
          </div>
        </aside>

        <main id="login-main" className="login-panel" tabIndex={-1}>
          <div className="login-card">
            <header className="login-card-header">
              <h2>Sign in</h2>
              <p className="login-card-subtitle">
                Access your agent retry dashboard and live telemetry.
              </p>
            </header>

            {statusLoading ? (
              <div className="login-status" role="status" aria-live="polite" aria-busy="true">
                <div className="loading-spinner login-status-spinner" aria-hidden="true" />
                <p className="login-hint login-hint--left">Checking sign-in options…</p>
              </div>
            ) : (
              <>
                {showSsoButton && (
                  <a className="sso-login-btn" href={ssoStatus!.ssoLoginUrl!}>
                    Sign in with SSO
                  </a>
                )}

                {showDivider && (
                  <div className="login-divider" role="presentation">
                    <span>or continue with email</span>
                  </div>
                )}

                {showLocalForm ? (
                  <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <label htmlFor="login-email">
                      Email
                      <input
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        autoComplete="username"
                        spellCheck={false}
                        placeholder="secadmin@local"
                        required
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                    </label>
                    <label htmlFor="login-password">
                      Password
                      <input
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                        required
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                    </label>
                    {error && (
                      <p id="login-error" className="login-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button type="submit" disabled={loading} aria-busy={loading}>
                      {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                    {ssoStatus?.disasterRecovery && (
                      <p className="login-hint login-hint--left">
                        Disaster recovery mode: use config-file secadmin credentials.
                      </p>
                    )}
                  </form>
                ) : (
                  !showSsoButton && (
                    <p className="login-hint login-hint--left">
                      Local sign-in is disabled. Use SSO to continue.
                    </p>
                  )
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
