'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  saveProfileSettingsAction,
  saveAiSettingsAction,
  testAiConnectionAction,
} from '@/lib/settings/actions'

interface SettingsData {
  profile: {
    full_name: string
    email: string
    default_currency: string
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

  // AI state
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSuccess, setAiSuccess] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Test connection state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
                    className="h-9 border-neutral-800 bg-neutral-950/50 text-neutral-500 cursor-not-allowed"
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
      </Tabs>
    </div>
  )
}
