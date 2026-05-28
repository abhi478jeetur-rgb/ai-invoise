'use client'
import { Agentation } from 'agentation'
import React, { useEffect, useState } from 'react'

export default function AgentationWrapper() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || process.env.NODE_ENV !== 'development') return null;
  return <Agentation />
}
