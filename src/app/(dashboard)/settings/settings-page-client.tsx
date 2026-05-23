'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from '@/lib/settings/actions'
import { updateReminderSettingsAction } from '@/lib/profile/actions'

interface SettingsData {
  profile: {
    full_name: string
    email: string
    default_currency: string
    reminder_enabled: boolean
    reminder_day: string
    reminder_time: string
  }
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

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
]

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

  // AI state
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSuccess, setAiSuccess] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Test connection state
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

    if (result.error) {
      setProfileError(result.error)
    } else {
      setProfileSuccess(true)
      router.refresh()
    }
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

    if (result.error) {
      setReminderError(result.error)
    } else {
      setReminderSuccess(true)
      router.refresh()
    }
    setReminderSaving(false)
  }

  async function handleAiSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAiSaving(true)
    setAiSuccess(false)
    setAiError(null)

    const formData = new FormData(e.currentTarget)
    const result = await saveAiSettingsAction(formData)

    if (result.error) {
      setAiError(result.error)
    } else {
      setAiSuccess(true)
      router.refresh()
    }
    setAiSaving(false)
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)

    const form = document.getElementById('ai-settings-form') as HTMLFormElement
    const formData = new FormData(form)
    const result = await testAiConnectionAction(formData)

    if (result.error) {
      setTestResult({ type: 'error', message: result.error })
    } else {
      setTestResult({ type: 'success', message: result.message ?? 'Connection successful!' })
    }
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
      if (result.error) {
        setAccountError(result.error)
        setAccountDeleting(false)
      } else {
        router.push('/sign-in')
      }
    } catch (err) {
      setAccountError('An unexpected error occurred.')
      setAccountDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your profile, preferences, and AI provider configuration.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-neutral-900/60 border border-neutral-800 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer"
          >
            Profile & Preferences
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer"
          >
            AI Provider
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400 text-neutral-500 text-xs cursor-pointer"
          >
            Account (Danger Zone)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile & Preferences */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">
                Profile & Preferences
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Update your name and default currency for invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileSuccess && (
                  <div className="p-3 text-xs font-medium bg-green-950/30 border border-green-900/50 text-green-400 rounded-lg text-center">
                    Profile updated successfully.
                  </div>
                )}
                {profileError && (
                  <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
                    {profileError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="fullName">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={initialData.profile.full_name}
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={initialData.profile.email}
                    disabled
                    className="h-9 border-neutral-800 bg-neutral-900/50 text-neutral-300 cursor-not-allowed disabled:opacity-100"
                  />
                  <p className="text-[11px] text-neutral-600">Email is managed by your auth provider.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="defaultCurrency">
                    Default Currency
                  </Label>
                  <select
                    id="defaultCurrency"
                    name="defaultCurrency"
                    defaultValue={initialData.profile.default_currency}
                    className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg mt-6">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">
                Invoice Reminders
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Set a schedule to remind you to log your unbilled work into invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                {reminderSuccess && (
                  <div className="p-3 text-xs font-medium bg-green-950/30 border border-green-900/50 text-green-400 rounded-lg text-center">
                    Reminder settings updated successfully.
                  </div>
                )}
                {reminderError && (
                  <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
                    {reminderError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-neutral-400" htmlFor="reminderEnabled">
                    Enable Weekly Reminders
                  </Label>
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-neutral-200 focus:ring-neutral-700/50"
                  />
                </div>

                {reminderEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <Label className="text-neutral-400" htmlFor="reminderDay">
                        Day of Week
                      </Label>
                      <select
                        id="reminderDay"
                        name="reminder_day"
                        defaultValue={initialData.profile.reminder_day || 'Monday'}
                        className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-neutral-400" htmlFor="reminderTime">
                        Time of Day
                      </Label>
                      <select
                        id="reminderTime"
                        name="reminder_time"
                        defaultValue={initialData.profile.reminder_time || 'Morning'}
                        className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-700/50 focus:border-neutral-700"
                      >
                        <option value="Morning">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                        <option value="Evening">Evening (5 PM - 9 PM)</option>
                      </select>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={reminderSaving}
                  className="bg-neutral-800 text-white hover:bg-neutral-700 font-medium text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {reminderSaving ? 'Saving...' : 'Save Reminder Schedule'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg mt-6">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">
                Recycle Bin
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Manage your deleted invoices and clients. You can restore them or permanently delete them from here.
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

        {/* Tab 2: AI Provider Settings */}
        <TabsContent value="ai" className="mt-4">
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-neutral-200">
                AI Provider Configuration
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Configure your OpenAI-compatible provider for AI-powered reminder generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="ai-settings-form" onSubmit={handleAiSubmit} className="space-y-4">
                {aiSuccess && (
                  <div className="p-3 text-xs font-medium bg-green-950/30 border border-green-900/50 text-green-400 rounded-lg text-center">
                    AI settings saved successfully.
                  </div>
                )}
                {aiError && (
                  <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
                    {aiError}
                  </div>
                )}
                {testResult && (
                  <div className={`p-3 text-xs font-medium rounded-lg text-center ${
                    testResult.type === 'success'
                      ? 'bg-green-950/30 border border-green-900/50 text-green-400'
                      : 'bg-red-950/30 border border-red-900/50 text-red-400'
                  }`}>
                    {testResult.message}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="providerLabel">
                    Provider Label
                  </Label>
                  <Input
                    id="providerLabel"
                    name="providerLabel"
                    defaultValue={initialData.aiSettings?.provider_label ?? ''}
                    placeholder="Google AI Studio"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="baseUrl">
                    Base URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="baseUrl"
                    name="baseUrl"
                    required
                    defaultValue={initialData.aiSettings?.base_url ?? ''}
                    placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="modelName">
                    Model Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="modelName"
                    name="modelName"
                    required
                    defaultValue={initialData.aiSettings?.model_name ?? ''}
                    placeholder="gemini-1.5-flash"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-neutral-400" htmlFor="apiKey">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type="password"
                    defaultValue={initialData.aiSettings?.masked_api_key ?? ''}
                    placeholder="sk-..."
                    autoComplete="off"
                    className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 font-mono text-xs"
                  />
                  <input
                    type="hidden"
                    name="maskedApiKey"
                    value={initialData.aiSettings?.masked_api_key ?? ''}
                  />
                  {initialData.aiSettings?.masked_api_key && (
                    <p className="text-[11px] text-neutral-600">
                      Current: {initialData.aiSettings.masked_api_key} &mdash; leave unchanged to keep existing key.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={aiSaving}
                    className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50"
                  >
                    {aiSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 font-medium text-sm cursor-pointer disabled:opacity-50"
                  >
                    {testing ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                        Testing...
                      </span>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Account (Danger Zone) */}
        <TabsContent value="account" className="mt-4">
          <Card className="border-red-900/50 bg-red-950/10 backdrop-blur-xl max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-medium text-red-500">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm text-red-400/80">
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                {accountError && (
                  <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
                    {accountError}
                  </div>
                )}
                
                <div className="space-y-2 p-4 bg-red-950/20 border border-red-900/30 rounded-md">
                  <p className="text-sm text-neutral-300">
                    To verify, type <strong className="text-red-400 select-all">delete my account</strong> below:
                  </p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="delete my account"
                    className="h-9 border-red-900/50 bg-neutral-950 text-neutral-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    autoComplete="off"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={accountDeleting || deleteConfirmation !== 'delete my account'}
                  variant="destructive"
                  className="font-medium text-sm cursor-pointer disabled:opacity-50"
                >
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
