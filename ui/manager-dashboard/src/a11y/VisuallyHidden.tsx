/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react'

type VisuallyHiddenProps = {
  children: ReactNode
  as?: 'span' | 'div' | 'p' | 'h2'
}

export default function VisuallyHidden({ children, as: Tag = 'span' }: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>
}
