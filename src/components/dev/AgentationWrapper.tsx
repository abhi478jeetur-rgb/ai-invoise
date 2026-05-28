'use client'
import { Agentation } from 'agentation'
import React, { useEffect, useState } from 'react'

export default function AgentationWrapper() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Force reset agentation settings in case it was hidden
      localStorage.removeItem('feedback-toolbar-settings');
      localStorage.removeItem('feedback-toolbar-theme');
      localStorage.removeItem('feedback-toolbar-position');
    }
    setMounted(true);
  }, [])
  if (!mounted) return null;
  return <Agentation />
}
