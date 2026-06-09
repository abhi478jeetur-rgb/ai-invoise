'use client'

import React, { useState, useEffect } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { InvoicePdfDocument, InvoicePdfProps } from './invoice-pdf-document'

// Simple debounce hook to prevent excessive PDF re-renders while typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function LivePdfPreview(props: InvoicePdfProps) {
  const [mounted, setMounted] = useState(false)
  const debouncedProps = useDebounce(props, 600) // 600ms delay

  useEffect(() => {
    setMounted(true)
  }, [])

  const [instance] = usePDF({ document: mounted ? <InvoicePdfDocument {...debouncedProps} /> : <InvoicePdfDocument {...props} /> })

  if (!mounted) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-secondary border border-border rounded-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading PDF engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-border relative">
      {instance.loading && (
        <div className="absolute top-4 right-4 z-10 flex items-center justify-center bg-black/60 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
           <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
           <span className="text-xs font-medium">Updating...</span>
        </div>
      )}
      {instance.url ? (
        <iframe src={`${instance.url}#toolbar=0&navpanes=0`} className="w-full h-full border-none bg-zinc-100" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
          <p className="text-sm text-muted-foreground">Preparing preview...</p>
        </div>
      )}
    </div>
  )
}

