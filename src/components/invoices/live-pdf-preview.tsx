'use client'

import React, { useState, useEffect } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { InvoicePdfDocument, InvoicePdfProps } from './invoice-pdf-document'

export function LivePdfPreview(props: InvoicePdfProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Loading PDF engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-800">
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} className="w-full h-full">
        <InvoicePdfDocument {...props} />
      </PDFViewer>
    </div>
  )
}
