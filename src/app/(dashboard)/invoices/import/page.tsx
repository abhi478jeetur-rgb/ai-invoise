'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyzeCSVHeadersAction, importCSVInvoicesAction } from '@/lib/invoices/csv-actions'
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface MappingState {
  client_name: string
  invoice_number: string
  amount: string
  due_date: string
}

export default function CSVImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload states
  const [isDragActive, setIsDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')

  // Parsing & AI mapping states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<MappingState>({
    client_name: '',
    invoice_number: '',
    amount: '',
    due_date: ''
  })

  // Import execution states
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)
  const [generalError, setGeneralError] = useState('')

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setGeneralError('Please upload a valid CSV file.')
      return
    }

    setFileName(file.name)
    setGeneralError('')
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      setCsvText(text)

      // Start AI analysis on headers (using first 1000 characters as a sample)
      setIsAnalyzing(true)
      const res = await analyzeCSVHeadersAction(text.slice(0, 10000))
      setIsAnalyzing(false)

      if (res.error) {
        setGeneralError(res.error)
      } else if (res.success && res.headers && res.mapping) {
        setHeaders(res.headers)
        setSampleRows(res.sampleRows || [])
        setMapping({
          client_name: (res.mapping.client_name as string) || '',
          invoice_number: (res.mapping.invoice_number as string) || '',
          amount: (res.mapping.amount as string) || '',
          due_date: (res.mapping.due_date as string) || ''
        })
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleMappingChange = (field: keyof MappingState, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper to preview mapped fields dynamically
  const getMappedPreviewRow = (row: string[]) => {
    const clientIdx = headers.indexOf(mapping.client_name)
    const invIdx = headers.indexOf(mapping.invoice_number)
    const amtIdx = headers.indexOf(mapping.amount)
    const dateIdx = headers.indexOf(mapping.due_date)

    return {
      client: clientIdx !== -1 ? row[clientIdx] : '—',
      invoice: invIdx !== -1 ? row[invIdx] : '—',
      amount: amtIdx !== -1 ? row[amtIdx] : '—',
      dueDate: dateIdx !== -1 ? row[dateIdx] : '—',
    }
  }

  const handleImportSubmit = async () => {
    if (!mapping.client_name || !mapping.invoice_number || !mapping.amount || !mapping.due_date) {
      setGeneralError('Please configure mappings for all required fields.')
      return
    }

    setIsImporting(true)
    setGeneralError('')

    const res = await importCSVInvoicesAction(csvText, mapping as unknown as Record<string, string>)
    setIsImporting(false)

    if (res.error) {
      setImportResult({ success: false, error: res.error })
    } else if (res.success) {
      setImportResult({ success: true, count: res.count })
      // Clear uploaded file data after successful execution
      setFileName('')
      setCsvText('')
      setHeaders([])
      setSampleRows([])
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 select-none">
      {/* Top Navigation Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', color: 'var(--user-text)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
        <h2 className="text-xl font-bold tracking-tight text-white">Import Invoices via CSV</h2>
      </div>

      {generalError && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Success/Result State */}
      {importResult && (
        <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {importResult.success ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-white mb-2">Import Completed Successfully!</CardTitle>
                <CardDescription className="text-sm text-white/60 mb-6 max-w-sm">
                  We have imported <strong>{importResult.count}</strong> invoices and generated client accounts dynamically.
                </CardDescription>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/invoices')}
                    className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:opacity-90 bg-emerald-500 text-black"
                  >
                    View Invoices
                  </button>
                  <button
                    onClick={() => setImportResult(null)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all hover:opacity-80 border-white/10 text-white/80"
                  >
                    Import Another File
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-white mb-2">Import Failed</CardTitle>
                <CardDescription className="text-sm text-white/60 mb-6 max-w-sm">
                  {importResult.error || 'An unexpected error occurred during database bulk insertion.'}
                </CardDescription>
                <button
                  onClick={() => setImportResult(null)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all hover:opacity-80 border-white/10 text-white/80"
                >
                  Try Again
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Upload and Preview Area */}
      {!importResult && (
        <div className="space-y-6">
          {/* Step 1: Upload Drag Zone */}
          <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl relative overflow-hidden">
            <CardContent className="p-0">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`py-12 px-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
                  isDragActive
                    ? 'border-emerald-500 bg-emerald-500/[0.03]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/60">
                  {fileName ? <FileText className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5" />}
                </div>
                {fileName ? (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-1">{fileName}</h3>
                    <p className="text-xs text-white/40">Click or drag another file to replace</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white mb-1">Upload CSV Invoice Log</h3>
                    <p className="text-xs text-white/40">Drag and drop your .csv file here, or click to browse</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: AI Loading State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
              <p className="text-sm text-white/80 font-medium">Analyzing CSV Columns...</p>
              <p className="text-xs text-white/40 mt-1">Mimo AI is matching headers to system fields</p>
            </div>
          )}

          {/* Step 3: Column Mapping and Preview Panel */}
          {headers.length > 0 && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl relative overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    AI-Assisted Column Mapping
                  </CardTitle>
                  <CardDescription className="text-xs text-white/40">
                    Verify that headers are mapped to the correct data fields. Adjust dropdowns if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 p-6">
                  {/* Client Name mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase">Client Name Column</label>
                    <select
                      value={mapping.client_name}
                      onChange={(e) => handleMappingChange('client_name', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/10 bg-black/40 text-white text-xs outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="" disabled className="bg-neutral-900">Select column...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice Number mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase">Invoice Number Column</label>
                    <select
                      value={mapping.invoice_number}
                      onChange={(e) => handleMappingChange('invoice_number', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/10 bg-black/40 text-white text-xs outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="" disabled className="bg-neutral-900">Select column...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase">Amount Column</label>
                    <select
                      value={mapping.amount}
                      onChange={(e) => handleMappingChange('amount', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/10 bg-black/40 text-white text-xs outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="" disabled className="bg-neutral-900">Select column...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase">Due Date Column</label>
                    <select
                      value={mapping.due_date}
                      onChange={(e) => handleMappingChange('due_date', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/10 bg-black/40 text-white text-xs outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="" disabled className="bg-neutral-900">Select column...</option>
                      {headers.map(h => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4: Live Preview Table */}
              <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Data Preview
                  </CardTitle>
                  <CardDescription className="text-xs text-white/40">
                    A preview of the first few rows after applying the column mappings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider text-white/40">Client Name</th>
                        <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider text-white/40">Invoice #</th>
                        <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider text-white/40 text-right">Amount</th>
                        <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider text-white/40">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {sampleRows.map((row, idx) => {
                        const mapped = getMappedPreviewRow(row)
                        return (
                          <tr key={idx} className="transition-colors hover:bg-white/[0.01]">
                            <td className="py-2.5 pr-4 text-xs font-semibold">{mapped.client}</td>
                            <td className="py-2.5 pr-4 text-xs font-mono">{mapped.invoice}</td>
                            <td className="py-2.5 pr-4 text-xs font-mono text-right font-bold text-white">{mapped.amount}</td>
                            <td className="py-2.5 pr-4 text-xs font-mono">{mapped.dueDate}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Import Action Button Row */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setHeaders([])
                    setFileName('')
                    setCsvText('')
                  }}
                  className="px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all hover:opacity-80 border-white/10 text-white/80"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:opacity-90 flex items-center gap-1.5 bg-emerald-500 text-black"
                  disabled={isImporting}
                >
                  {isImporting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing Invoices...' : 'Looks Good, Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
