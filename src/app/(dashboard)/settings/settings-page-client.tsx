'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  saveProfileSettingsAction,
  saveAiSettingsAction,
  testAiConnectionAction,
  deleteAccountAction,
  saveBusinessProfileAction,
  uploadBusinessLogoAction,
} from '@/lib/settings/actions'
import { updateReminderSettingsAction } from '@/lib/profile/actions'

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'AED', label: 'AED - UAE Dirham' },
]

const PAYMENT_TERMS = [
  { value: 'receipt', label: 'Due on Receipt' },
  { value: 'net_15',  label: 'Net 15' },
  { value: 'net_30',  label: 'Net 30' },
  { value: 'net_60',  label: 'Net 60' },
  { value: 'net_90',  label: 'Net 90' },
]

interface ProfileData {
  full_name: string
  email: string
  default_currency: string
  reminder_enabled: boolean
  reminder_day: string
  reminder_time: string
  // Business profile fields
  company_name: string
  company_address: string
  company_website: string
  tax_id: string
  logo_url: string
  bank_details: string
  payment_link_default: string
  global_rules: Record<string, string>
  default_tax_label: string
  default_tax_rate: number | null
  default_payment_terms: string
}

interface SettingsData {
  profile: ProfileData
  aiSettings: {
    base_url: string
    provider_label: string
    model_name: string
    temperature: number
    masked_api_key: string
  } | null
}

interface SettingsPageClientProps {
  initialData: SettingsData
}

function StatusMessage({ success, error }: { success?: boolean; error?: string | null }) {
  if (success) return (
    <div className="p-3 text-xs font-medium bg-green-950/30 border border-green-900/50 text-green-400 rounded-lg text-center">
      Saved successfully.
    </div>
  )
  if (error) return (
    <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
      {error}
    </div>
  )
  return null
}

export function SettingsPageClient({ initialData }: SettingsPageClientProps) {
  const router = useRouter()

  // Profile state
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Reminder state
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderSuccess, setReminderSuccess] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [reminderEnabled, setReminderEnabled] = useState(initialData.profile.reminder_enabled)

  // Business Profile state
  const [bizSaving, setBizSaving] = useState(false)
  const [bizSuccess, setBizSuccess] = useState(false)
  const [bizError, setBizError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialData.profile.logo_url || '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.profile.logo_url || null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // AI state
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSuccess, setAiSuccess] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [accountDeleting, setAccountDeleting] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSuccess(false)
    setProfileError(null)
    const formData = new FormData(e.currentTarget)
    const result = await saveProfileSettingsAction(formData)
    if (result.error) { setProfileError(result.error) } else { setProfileSuccess(true); router.refresh() }
    setProfileSaving(false)
  }

  async function handleReminderSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setReminderSaving(true)
    setReminderSuccess(false)
    setReminderError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('reminder_enabled', reminderEnabled ? 'true' : 'false')
    const result = await updateReminderSettingsAction(formData)
    if (result.error) { setReminderError(result.error) } else { setReminderSuccess(true); router.refresh() }
    setReminderSaving(false)
  }

  async function handleBizSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBizSaving(true)
    setBizSuccess(false)
    setBizError(null)
    const formData = new FormData(e.currentTarget)
    const result = await saveBusinessProfileAction(formData)
    if (result.error) { setBizError(result.error) } else { setBizSuccess(true); router.refresh() }
    setBizSaving(false)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    setBizError(null)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadBusinessLogoAction(fd)
    if (result.error) {
      setBizError(result.error)
      setLogoPreview(initialData.profile.logo_url || null)
    } else if (result.url) {
      setLogoUrl(result.url)
    }
    setLogoUploading(false)
  }

  async function handleAiSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAiSaving(true)
    setAiSuccess(false)
    setAiError(null)
    const formData = new FormData(e.currentTarget)
    const result = await saveAiSettingsAction(formData)
    if (result.error) { setAiError(result.error) } else { setAiSuccess(true); router.refresh() }
    setAiSaving(false)
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    const form = document.getElementById('ai-settings-form') as HTMLFormElement
    const formData = new FormData(form)
    const result = await testAiConnectionAction(formData)
    if (result.error) { setTestResult({ type: 'error', message: result.error }) }
    else { setTestResult({ type: 'success', message: result.message ?? 'Connection successful!' }) }
    setTesting(false)
  }

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAccountError(null)
    if (deleteConfirmation !== 'delete my account') {
      setAccountError('Please type the exact confirmation sentence.')
      return
    }
    setAccountDeleting(true)
    try {
      const result = await deleteAccountAction(deleteConfirmation)
      if (result.error) { setAccountError(result.error); setAccountDeleting(false) }
      else { router.push('/sign-in') }
    } catch { setAccountError('An unexpected error occurred.'); setAccountDeleting(false) }
  }

  const p = initialData.profile

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your profile, business presence, and AI provider configuration.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-neutral-900/60 border border-neutral-800 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer">
            Profile & Preferences
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer">
            Business & Invoicing
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer">
            AI Provider
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400 text-neutral-500 text-xs cursor-pointer">
            Account
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Profile & Preferences ─── */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">Profile & Preferences</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Your personal name, email, and default currency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <StatusMessage success={profileSuccess} error={profileError} />

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" defaultValue={p.full_name}
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="email">Email</Label>
                  <Input id="email" value={p.email} disabled
                    className="h-9 border-neutral-800 bg-neutral-900/50 text-neutral-300 cursor-not-allowed disabled:opacity-100" />
                  <p className="text-[11px] text-neutral-600">Email is managed by your auth provider.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="defaultCurrency">Default Currency</Label>
                  <select id="defaultCurrency" name="defaultCurrency" defaultValue={p.default_currency}
                    className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700">
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <Button type="submit" disabled={profileSaving}
                  className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">Invoice Reminders</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Schedule a weekly reminder to log your unbilled work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <StatusMessage success={reminderSuccess} error={reminderError} />

                <div className="flex items-center justify-between">
                  <Label className="text-neutral-400" htmlFor="reminderEnabled">Enable Weekly Reminders</Label>
                  <input type="checkbox" id="reminderEnabled" checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-neutral-200 focus:ring-neutral-700/50" />
                </div>

                {reminderEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <Label className="text-neutral-400" htmlFor="reminderDay">Day of Week</Label>
                      <select id="reminderDay" name="reminder_day" defaultValue={p.reminder_day || 'Monday'}
                        className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700">
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-neutral-400" htmlFor="reminderTime">Time of Day</Label>
                      <select id="reminderTime" name="reminder_time" defaultValue={p.reminder_time || 'Morning'}
                        className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700">
                        <option value="Morning">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                        <option value="Evening">Evening (5 PM - 9 PM)</option>
                      </select>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={reminderSaving}
                  className="bg-neutral-800 text-white hover:bg-neutral-700 font-medium text-sm cursor-pointer disabled:opacity-50 mt-2">
                  {reminderSaving ? 'Saving...' : 'Save Reminder Schedule'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">Recycle Bin</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Manage deleted invoices and clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/trash" className="inline-block">
                <Button variant="outline" className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer">
                  Open Recycle Bin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 2: Business & Invoicing ─── */}
        <TabsContent value="business" className="mt-4 space-y-6">
          <div className="p-3 text-xs bg-blue-950/30 border border-blue-900/40 text-blue-300 rounded-lg max-w-2xl">
            💡 <strong>Tip:</strong> Fill in your business details once here and they will auto-fill every new invoice you create — saving you time every time.
          </div>

          <form onSubmit={handleBizSubmit} className="space-y-6 max-w-2xl">
            <StatusMessage success={bizSuccess} error={bizError} />

            {/* ── Business Identity ── */}
            <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-neutral-200">Business Identity</CardTitle>
                <CardDescription className="text-sm text-neutral-500">
                  Your business name, logo, and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="text-neutral-400">Business Logo</Label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950 flex items-center justify-center cursor-pointer hover:border-neutral-500 transition-colors overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Business logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="text-center">
                          <div className="text-2xl mb-1">🏢</div>
                          <p className="text-[10px] text-neutral-600">Click to upload</p>
                        </div>
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-400">JPG, PNG, WebP or SVG · Max 2MB</p>
                      <p className="text-xs text-neutral-600 mt-1">This logo will appear on your PDF invoices.</p>
                      {logoPreview && (
                        <button type="button" onClick={() => { setLogoPreview(null); setLogoUrl('') }}
                          className="text-xs text-red-400 hover:text-red-300 mt-2 transition-colors">
                          Remove logo
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden" onChange={handleLogoChange} />
                  <input type="hidden" name="logo_url" value={logoUrl} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="companyName">Company / Business Name</Label>
                    <Input id="companyName" name="companyName" defaultValue={p.company_name}
                      placeholder="Acme Design Studio"
                      className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="taxId">GST / VAT / Tax ID</Label>
                    <Input id="taxId" name="taxId" defaultValue={p.tax_id}
                      placeholder="GSTIN or VAT number"
                      className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="companyAddress">Business Address</Label>
                  <textarea id="companyAddress" name="companyAddress" defaultValue={p.company_address} rows={3}
                    placeholder={"123 Main Street\nMumbai, MH 400001\nIndia"}
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="companyWebsite">Website</Label>
                  <Input id="companyWebsite" name="companyWebsite" type="url" defaultValue={p.company_website}
                    placeholder="https://yourwebsite.com"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                </div>
              </CardContent>
            </Card>

            {/* ── Invoice Defaults ── */}
            <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-neutral-200">Invoice Defaults</CardTitle>
                <CardDescription className="text-sm text-neutral-500">
                  These values will auto-fill when you create a new invoice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="biz_defaultCurrency">Default Currency</Label>
                    <select id="biz_defaultCurrency" name="defaultCurrency" defaultValue={p.default_currency}
                      className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700">
                      {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                    <select id="defaultPaymentTerms" name="defaultPaymentTerms" defaultValue={p.default_payment_terms || 'net_30'}
                      className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700">
                      {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="defaultTaxLabel">Tax Label</Label>
                    <Input id="defaultTaxLabel" name="defaultTaxLabel" defaultValue={p.default_tax_label}
                      placeholder="GST, VAT, HST..."
                      className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-400" htmlFor="defaultTaxRate">Tax Rate (%)</Label>
                    <Input id="defaultTaxRate" name="defaultTaxRate" type="number" step="0.01" min="0" max="100"
                      defaultValue={p.default_tax_rate ?? ''}
                      placeholder="18"
                      className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="paymentLinkDefault">Default Payment Link</Label>
                  <Input id="paymentLinkDefault" name="paymentLinkDefault" type="url" defaultValue={p.payment_link_default}
                    placeholder="https://razorpay.com/payment-link/..."
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                  <p className="text-[11px] text-neutral-600">Auto-added to every new invoice. You can override it per-invoice.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="bankDetails">Bank / Payment Details</Label>
                  <textarea id="bankDetails" name="bankDetails" defaultValue={p.bank_details} rows={4}
                    placeholder={"Bank: HDFC Bank\nAccount Name: Acme Studio\nAccount No: 1234567890\nIFSC: HDFC0001234"}
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                  <p className="text-[11px] text-neutral-600">Shown at the bottom of your PDF invoices.</p>
                </div>
              </CardContent>
            </Card>

            {/* ── AI Knowledge Base / Business Rules ── */}
            <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-neutral-200">AI Knowledge Base</CardTitle>
                <CardDescription className="text-sm text-neutral-500">
                  These rules are used by the AI when writing reminder emails and are optionally shown on PDF invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="rule_late_payment">Late Payment Policy</Label>
                  <textarea id="rule_late_payment" name="rule_late_payment"
                    defaultValue={p.global_rules?.late_payment_policy ?? ''} rows={2}
                    placeholder="e.g., A late fee of 5% will be applied after 30 days."
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="rule_refund">Refund / Cancellation Policy</Label>
                  <textarea id="rule_refund" name="rule_refund"
                    defaultValue={p.global_rules?.refund_policy ?? ''} rows={2}
                    placeholder="e.g., No refunds after project kick-off."
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="rule_tnc">Terms & Conditions</Label>
                  <textarea id="rule_tnc" name="rule_tnc"
                    defaultValue={p.global_rules?.terms_and_conditions ?? ''} rows={4}
                    placeholder="e.g., All work remains property of the client upon full payment. Disputes governed by the laws of India..."
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="rule_comm_style">AI Communication Style</Label>
                  <textarea id="rule_comm_style" name="rule_comm_style"
                    defaultValue={p.global_rules?.communication_style ?? ''} rows={2}
                    placeholder="e.g., Always be polite, professional, and avoid emojis."
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700" />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={bizSaving || logoUploading}
              className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50">
              {bizSaving ? 'Saving...' : 'Save Business Profile'}
            </Button>
          </form>
        </TabsContent>

        {/* ─── Tab 3: AI Provider ─── */}
        <TabsContent value="ai" className="mt-4">
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">AI Provider Configuration</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Configure your OpenAI-compatible provider for AI-powered reminder generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="ai-settings-form" onSubmit={handleAiSubmit} className="space-y-4">
                {aiSuccess && <StatusMessage success />}
                {aiError && <StatusMessage error={aiError} />}
                {testResult && (
                  <div className={`p-3 text-xs font-medium rounded-lg text-center ${
                    testResult.type === 'success'
                      ? 'bg-green-950/30 border border-green-900/50 text-green-400'
                      : 'bg-red-950/30 border border-red-900/50 text-red-400'
                  }`}>{testResult.message}</div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="providerLabel">Provider Label</Label>
                  <Input id="providerLabel" name="providerLabel" defaultValue={initialData.aiSettings?.provider_label ?? ''}
                    placeholder="NVIDIA NIM / Google AI Studio"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="baseUrl">Base URL <span className="text-red-500">*</span></Label>
                  <Input id="baseUrl" name="baseUrl" required defaultValue={initialData.aiSettings?.base_url ?? ''}
                    placeholder="https://integrate.api.nvidia.com/v1"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="modelName">Model Name <span className="text-red-500">*</span></Label>
                  <Input id="modelName" name="modelName" required defaultValue={initialData.aiSettings?.model_name ?? ''}
                    placeholder="meta/llama-3.1-8b-instruct"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="apiKey">API Key <span className="text-red-500">*</span></Label>
                  <Input id="apiKey" name="apiKey" type="password" defaultValue={initialData.aiSettings?.masked_api_key ?? ''}
                    placeholder="nvapi-..." autoComplete="off"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs" />
                  <input type="hidden" name="maskedApiKey" value={initialData.aiSettings?.masked_api_key ?? ''} />
                  {initialData.aiSettings?.masked_api_key && (
                    <p className="text-[11px] text-neutral-600">
                      Current: {initialData.aiSettings.masked_api_key} &mdash; leave unchanged to keep existing key.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={aiSaving}
                    className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50">
                    {aiSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleTestConnection} disabled={testing}
                    className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 font-medium text-sm cursor-pointer disabled:opacity-50">
                    {testing ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                        Testing...
                      </span>
                    ) : 'Test Connection'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 4: Account (Danger Zone) ─── */}
        <TabsContent value="account" className="mt-4">
          <Card className="border-red-900/50 bg-red-950/10 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-red-500">Danger Zone</CardTitle>
              <CardDescription className="text-sm text-red-400/80">
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                {accountError && <StatusMessage error={accountError} />}
                <div className="space-y-2 p-4 bg-red-950/20 border border-red-900/30 rounded-md">
                  <p className="text-sm text-neutral-300">
                    To verify, type <strong className="text-red-400 select-all">delete my account</strong> below:
                  </p>
                  <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="delete my account"
                    className="h-9 border-red-900/50 bg-neutral-950 text-neutral-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    autoComplete="off" />
                </div>
                <Button type="submit" disabled={accountDeleting || deleteConfirmation !== 'delete my account'}
                  variant="destructive" className="font-medium text-sm cursor-pointer disabled:opacity-50">
                  {accountDeleting ? 'Deleting Account...' : 'Delete My Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
