/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import SkipLink from './a11y/SkipLink'
import SettingsMenu from './components/SettingsMenu'
import DashboardPage from './views/DashboardPage'
import TasksPage from './views/TasksPage'
import AgentsPage from './views/AgentsPage'
import TaskDetailPage from './views/TaskDetailPage'
import LivePage from './views/LivePage'
import LoginPage from './views/LoginPage'
import AuthCallbackPage from './views/AuthCallbackPage'
import SecuritySettingsPage from './views/SecuritySettingsPage'
import ApiKeysPage from './views/ApiKeysPage'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { OWNERSHIP } from './ownership'

function pageTitleForPath(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/live') return 'Live'
  if (pathname === '/tasks') return 'Tasks'
  if (pathname.startsWith('/tasks/')) return 'Task detail'
  if (pathname === '/agents' || pathname === '/collectors') return 'Collectors'
  if (pathname === '/admin/security') return 'Security settings'
  if (pathname === '/admin/api-keys') return 'API keys'
  return 'RetrySight'
}

function ProtectedShell() {
  const { token, displayName, logout, isSecadmin } = useAuth()
  const location = useLocation()
  useDocumentTitle(pageTitleForPath(location.pathname))

  const initials = (displayName ?? 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <SkipLink />
      <aside className="sidebar" aria-label="Application navigation">
        <div className="sidebar-brand">
          <img
            className="sidebar-logo"
            src="/retrysight-logo.svg"
            alt="RetrySight"
            width={36}
            height={36}
          />
          <h1>RetrySight</h1>
        </div>
        <p className="sidebar-tagline">Performance Monitoring</p>
        <div className="sidebar-user">
          <span className="sidebar-user-avatar" aria-hidden="true">{initials}</span>
          <span className="sidebar-user-name">{displayName ?? 'User'}</span>
          <SettingsMenu />
        </div>
        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon" aria-hidden="true">◈</span>
            Dashboard
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon" aria-hidden="true">◎</span>
            Live
            <span className="nav-live-dot" aria-hidden="true" />
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon" aria-hidden="true">▤</span>
            Tasks
          </NavLink>
          <NavLink
            to="/agents"
            className={({ isActive }) =>
              isActive || location.pathname === '/collectors' ? 'active' : ''
            }
          >
            <span className="nav-icon" aria-hidden="true">⬡</span>
            Collectors
          </NavLink>
          {isSecadmin && (
            <NavLink to="/admin/security" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">⚿</span>
              Security
            </NavLink>
          )}
          {isSecadmin && (
            <NavLink to="/admin/api-keys" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">🔑</span>
              API Keys
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={logout}>Sign out</button>
          <p className="sidebar-copyright" title={OWNERSHIP.notice}>
            © {OWNERSHIP.year}{' '}
            <a href={OWNERSHIP.siteUrl} target="_blank" rel="noopener noreferrer">
              {OWNERSHIP.site}
            </a>
            <span className="sidebar-copyright-links">
              <a href={OWNERSHIP.buyMeACoffeeUrl} target="_blank" rel="noopener noreferrer">
                Buy me a coffee
              </a>
            </span>
          </p>
        </div>
      </aside>
      <main id="main-content" className="content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          {/* Alias for manual/old URLs — same page as /agents */}
          <Route path="/collectors" element={<AgentsPage />} />
          <Route path="/admin/security" element={<SecuritySettingsPage />} />
          <Route path="/admin/api-keys" element={<ApiKeysPage />} />
        </Routes>
      </main>
    </div>
  )
}

function LoginShell() {
  useDocumentTitle('Sign in')
  return <LoginPage />
}

export default function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginShell />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/*" element={<ProtectedShell />} />
    </Routes>
  )
}
