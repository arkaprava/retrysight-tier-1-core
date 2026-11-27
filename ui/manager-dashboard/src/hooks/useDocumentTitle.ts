/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react'

const APP_NAME = 'RetrySight'

export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    const previous = document.title
    document.title = pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME
    return () => {
      document.title = previous
    }
  }, [pageTitle])
}
