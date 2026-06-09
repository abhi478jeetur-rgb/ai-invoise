'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  saveProfileSettingsAction,
  deleteAccountAction,
  saveBusinessProfileAction,
  uploadBusinessLogoAction,
  uploadKnowledgeBaseDocumentAction,
  deleteKnowledgeBaseDocumentAction,
} from '@/lib/settings/actions'
import { updateReminderSettingsAction } from '@/lib/profile/actions'
import { updatePassword } from '@/lib/auth/actions'

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
  } | null
  knowledgeBaseDocuments: {
    id: string
    file_name: string
    file_size: number
    file_type: string
    created_at: string
  }[]
}

interface SettingsPageClientProps {
  initialData: SettingsData
}

export function SettingsPageClient({ initialData }: SettingsPageClientProps) {
  const router = useRouter()

  // Knowledge Base state
  const [kbDocs, setKbDocs] = useState<any[]>(initialData.knowledgeBaseDocuments || [])
  const [docUploading, setDocUploading] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [p] = useState(initialData.profile)
  const [profileSaving, setProfileSaving] = useState(false)

  // Reminder state
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(initialData.profile.reminder_enabled)

  // Business Profile state
  const [bizSaving, setBizSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialData.profile.logo_url || '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.profile.logo_url || null)
  const logoInputRef = useRef<HTMLInputElement>(null)



  // Account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [accountDeleting, setAccountDeleting] = useState(false)

  // Security / Password state
  const [securitySaving, setSecuritySaving] = useState(false)

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await saveProfileSettingsAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile settings saved successfully!')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to save profile settings. Please check your internet connection and try again.'
      })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSecuritySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // M29: Client-side password match validation
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please ensure both password fields are identical.'
      })
      return
    }

    setSecuritySaving(true)
    try {
      const result = await updatePassword(formData)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Password successfully updated!')
        e.currentTarget.reset()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to update password. Please check your internet connection.'
      })
    } finally {
      setSecuritySaving(false)
    }
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setDocUploading(true)
    try {
      const fd = new FormData()
      fd.append('document', file)
      const result = await uploadKnowledgeBaseDocumentAction(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Document uploaded successfully!')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to upload document. Please check your internet connection.'
      })
    } finally {
      setDocUploading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  async function handleDeleteDocument(id: string) {
    try {
      const result = await deleteKnowledgeBaseDocumentAction(id)
      if (!result.error) {
        setKbDocs(docs => docs.filter(d => d.id !== id))
        toast.success('Document deleted successfully!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete document')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to delete document. Please check your internet connection.'
      })
    }
  }

  async function handleReminderSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setReminderSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('reminder_enabled', reminderEnabled ? 'true' : 'false')
      const result = await updateReminderSettingsAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Reminder schedule saved successfully!')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to save reminder schedule. Please check your internet connection.'
      })
    } finally {
      setReminderSaving(false)
    }
  }

  async function handleBizSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBizSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await saveBusinessProfileAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Business profile saved successfully!')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to save business profile. Please check your internet connection.'
      })
    } finally {
      setBizSaving(false)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const result = await uploadBusinessLogoAction(fd)
      if (result.error) {
        toast.error(result.error)
        setLogoPreview(initialData.profile.logo_url || null)
      } else if (result.url) {
        setLogoUrl(result.url)
        toast.success('Logo uploaded successfully!')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Network Error', {
        description: 'Failed to upload logo. Please check your internet connection.'
      })
      setLogoPreview(initialData.profile.logo_url || null)
    } finally {
      setLogoUploading(false)
    }
  }



  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (deleteConfirmation !== 'delete my account') {
      toast.error('Please type the exact confirmation sentence.')
      return
    }
    setAccountDeleting(true)
    try {
      const result = await deleteAccountAction(deleteConfirmation)
      if (result.error) {
        toast.error(result.error)
        setAccountDeleting(false)
      } else {
        toast.success('Account deleted successfully.')
        router.push('/sign-in')
      }
    } catch {
      toast.error('An unexpected error occurred.')
      setAccountDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-secondary/60 border border-border p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground hover:bg-accent/50 hover:text-foreground/80 text-xs cursor-pointer transition-colors">
            Profile & Preferences
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground hover:bg-accent/50 hover:text-foreground/80 text-xs cursor-pointer transition-colors">
            Business & Invoicing
          </TabsTrigger>

          <TabsTrigger value="account" className="data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400 text-muted-foreground hover:bg-red-950/30 hover:text-red-300 text-xs cursor-pointer transition-colors">
            Account
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Profile & Preferences ─── */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">Profile & Preferences</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Your personal name, email, and default currency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" defaultValue={p.full_name}
                    className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="email">Email</Label>
                  <Input id="email" value={p.email} disabled
                    className="h-9 border-border bg-secondary text-foreground cursor-not-allowed disabled:opacity-100" />
                  <p className="text-[11px] text-muted-foreground/60">Email is managed by your auth provider.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="defaultCurrency">Default Currency</Label>
                  <select id="defaultCurrency" name="defaultCurrency" defaultValue={p.default_currency}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <Button type="submit" disabled={profileSaving}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm cursor-pointer disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">Security & Password</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Update your login credentials securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" name="password" type="password" required placeholder="••••••••"
                    className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Must be at least 8 characters, contain one uppercase letter, one lowercase letter, one number, and one special character.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required placeholder="••••••••"
                    className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                </div>

                <Button type="submit" disabled={securitySaving}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm cursor-pointer disabled:opacity-50">
                  {securitySaving ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">Invoice Reminders</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Schedule a weekly reminder to log your unbilled work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground" htmlFor="reminderEnabled">Enable Weekly Reminders</Label>
                  <input type="checkbox" id="reminderEnabled" checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-foreground focus:ring-ring/50" />
                </div>

                <div className={`grid grid-cols-2 gap-4 mt-4 transition-opacity duration-200 ${reminderEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="reminderDay">Day of Week</Label>
                    <select id="reminderDay" name="reminder_day" defaultValue={p.reminder_day || 'Monday'}
                      disabled={!reminderEnabled}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border disabled:cursor-not-allowed">
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="reminderTime">Time of Day</Label>
                    <select id="reminderTime" name="reminder_time" defaultValue={p.reminder_time || 'Morning'}
                      disabled={!reminderEnabled}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border disabled:cursor-not-allowed">
                      <option value="Morning">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="Evening">Evening (5 PM - 9 PM)</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={reminderSaving}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm cursor-pointer disabled:opacity-50 mt-2">
                  {reminderSaving ? 'Saving...' : 'Save Reminder Schedule'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">Recycle Bin</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Manage deleted invoices and clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/trash" className="inline-block">
                <Button variant="outline" className="bg-secondary border-border text-foreground/80 hover:text-foreground hover:bg-accent cursor-pointer">
                  Open Recycle Bin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 2: Business & Invoicing ─── */}
        <TabsContent value="business" className="mt-4 space-y-6">
          <div className="p-3 text-xs bg-primary/10 border border-primary/20 text-primary rounded-lg max-w-2xl">
            💡 <strong>Tip:</strong> Fill in your business details once here and they will auto-fill every new invoice you create — saving you time every time.
          </div>

          <form onSubmit={handleBizSubmit} className="space-y-6 max-w-2xl">
            {/* ── Business Identity ── */}
            <Card className="border-border bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-foreground">Business Identity</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your business name, logo, and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Business Logo</Label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border bg-background flex items-center justify-center cursor-pointer hover:border-border transition-colors overflow-hidden">
                      {logoPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={logoPreview} alt="Business logo" className="w-full h-full object-contain p-1" onError={() => setLogoPreview(null)} />
                      ) : (
                        <div className="text-center">
                          <div className="text-2xl mb-1">🏢</div>
                          <p className="text-[10px] text-muted-foreground/60">Click to upload</p>
                        </div>
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-card/80 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · Max 2MB</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">This logo will appear on your PDF invoices.</p>
                      {logoPreview && (
                        <button type="button" onClick={() => { setLogoPreview(null); setLogoUrl('') }}
                          className="text-xs text-red-400 hover:text-red-300 mt-2 transition-colors">
                          Remove logo
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleLogoChange} />
                  <input type="hidden" name="logo_url" value={logoUrl} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="companyName">Company / Business Name</Label>
                    <Input id="companyName" name="companyName" defaultValue={p.company_name}
                      placeholder="Acme Design Studio"
                      className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="taxId">GST / VAT / Tax ID</Label>
                    <Input id="taxId" name="taxId" defaultValue={p.tax_id}
                      placeholder="GSTIN or VAT number"
                      className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="companyAddress">Business Address</Label>
                  <textarea id="companyAddress" name="companyAddress" defaultValue={p.company_address} rows={3}
                    placeholder={"123 Main Street\nMumbai, MH 400001\nIndia"}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="companyWebsite">Website</Label>
                  <Input id="companyWebsite" name="companyWebsite" type="url" defaultValue={p.company_website}
                    placeholder="https://yourwebsite.com"
                    className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                </div>
              </CardContent>
            </Card>

            {/* ── Invoice Defaults ── */}
            <Card className="border-border bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-foreground">Invoice Defaults & Formatting</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Configure default options and pattern numbering logic for your invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-muted-foreground" htmlFor="invoicePrefix">Invoice Prefix</Label>
                      <div className="group relative inline-block">
                        <span className="w-3.5 h-3.5 rounded-full bg-accent hover:bg-accent flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground cursor-help select-none font-semibold font-sans">?</span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-background border border-border text-[11px] leading-relaxed text-foreground/80 rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-normal font-sans">
                          The starting letters for your invoice numbers (e.g., &quot;INV-&quot; or &quot;CF-&quot;).
                        </span>
                      </div>
                    </div>
                    <Input id="invoicePrefix" name="invoicePrefix" defaultValue={p.global_rules?.invoice_prefix ?? 'INV-'}
                      placeholder="INV-"
                      className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-muted-foreground" htmlFor="invoiceFormat">Invoice Format</Label>
                      <div className="group relative inline-block">
                        <span className="w-3.5 h-3.5 rounded-full bg-accent hover:bg-accent flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground cursor-help select-none font-semibold font-sans">?</span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-background border border-border text-[11px] leading-relaxed text-foreground/80 rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-normal font-sans">
                          Sequential pattern structure. Either simple sequence (INV-001) or including the current calendar year (INV-2026-001).
                        </span>
                      </div>
                    </div>
                    <select id="invoiceFormat" name="invoiceFormat" defaultValue={p.global_rules?.invoice_format ?? 'PREFIX-[SEQUENCE]'}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                      <option value="PREFIX-[SEQUENCE]">PREFIX-[SEQUENCE] (e.g. INV-001)</option>
                      <option value="PREFIX-[YEAR]-[SEQUENCE]">PREFIX-[YEAR]-[SEQUENCE] (e.g. INV-2026-001)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="biz_defaultCurrency">Default Currency</Label>
                    <select id="biz_defaultCurrency" name="defaultCurrency" defaultValue={p.default_currency}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                      {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                    <select id="defaultPaymentTerms" name="defaultPaymentTerms" defaultValue={p.default_payment_terms || 'net_30'}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                      {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="defaultTaxLabel">Tax Label</Label>
                    <Input id="defaultTaxLabel" name="defaultTaxLabel" defaultValue={p.default_tax_label}
                      placeholder="GST, VAT, HST..."
                      className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground" htmlFor="defaultTaxRate">Tax Rate (%)</Label>
                    <Input id="defaultTaxRate" name="defaultTaxRate" type="number" step="0.01" min="0" max="100"
                      defaultValue={p.default_tax_rate ?? ''}
                      placeholder="18"
                      className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="paymentLinkDefault">Default Payment Link</Label>
                  <Input id="paymentLinkDefault" name="paymentLinkDefault" type="url" defaultValue={p.payment_link_default}
                    placeholder="https://razorpay.com/payment-link/..."
                    className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50" />
                  <p className="text-[11px] text-muted-foreground/60">Auto-added to every new invoice. You can override it per-invoice.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="bankDetails">Bank / Payment Details</Label>
                  <textarea id="bankDetails" name="bankDetails" defaultValue={p.bank_details} rows={4}
                    placeholder={"Bank: HDFC Bank\nAccount Name: Acme Studio\nAccount No: 1234567890\nIFSC: HDFC0001234"}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                  <p className="text-[11px] text-muted-foreground/60">Shown at the bottom of your PDF invoices.</p>
                </div>
              </CardContent>
            </Card>

            {/* ── AI Knowledge Base / Business Rules ── */}
            <Card className="border-border bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium text-foreground">AI Knowledge Base</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  These rules are used by the AI when writing reminder emails and are optionally shown on PDF invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="rule_late_payment">Late Payment Policy</Label>
                  <textarea id="rule_late_payment" name="rule_late_payment"
                    defaultValue={p.global_rules?.late_payment_policy ?? ''} rows={2}
                    placeholder="e.g., A late fee of 5% will be applied after 30 days."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="rule_refund">Refund / Cancellation Policy</Label>
                  <textarea id="rule_refund" name="rule_refund"
                    defaultValue={p.global_rules?.refund_policy ?? ''} rows={2}
                    placeholder="e.g., No refunds after project kick-off."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="rule_tnc">Terms & Conditions</Label>
                  <textarea id="rule_tnc" name="rule_tnc"
                    defaultValue={p.global_rules?.terms_and_conditions ?? ''} rows={4}
                    placeholder="e.g., All work remains property of the client upon full payment. Disputes governed by the laws of India..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Knowledge Base Documents</Label>
                  <div className="space-y-2">
                    {kbDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-border bg-background">
                        <span className="text-sm text-foreground/80 truncate max-w-[200px]">{doc.file_name}</span>
                        <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    ))}
                    <div className="pt-2">
                      <input ref={docInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={handleUploadDocument} />
                      <Button type="button" size="sm" onClick={() => docInputRef.current?.click()} disabled={docUploading}
                        className="h-8 text-xs bg-accent text-foreground hover:bg-accent border border-border cursor-pointer">
                        {docUploading ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground" htmlFor="rule_comm_style">AI Communication Style</Label>
                  <textarea id="rule_comm_style" name="rule_comm_style"
                    defaultValue={p.global_rules?.communication_style ?? ''} rows={2}
                    placeholder="e.g., Always be polite, professional, and avoid emojis."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border" />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={bizSaving || logoUploading}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-sm cursor-pointer disabled:opacity-50">
              {bizSaving ? 'Saving...' : 'Save Business Profile'}
            </Button>
          </form>
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
                <div className="space-y-2 p-4 bg-red-950/20 border border-red-900/30 rounded-md">
                  <p className="text-sm text-foreground/80">
                    To verify, type <strong className="text-red-400 select-all">delete my account</strong> below:
                  </p>
                  <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="delete my account"
                    className="h-9 border-red-900/50 bg-background text-foreground focus-visible:border-red-500 focus-visible:ring-red-500/20"
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
