"use client"

import Link from "next/link"
import { UserPlus, FileText, Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export function QuickStartBanner() {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Welcome to ChaseFree AI! Let&apos;s get you paid.
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Add Client */}
          <div className="flex flex-col items-center text-center p-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Step 1: Add your first client
            </p>
            <p className="text-xs text-neutral-400 mb-4">
              Keep track of who you&apos;re billing.
            </p>
            <Link
              href="/clients"
              className={buttonVariants({ size: "sm" }) + " bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-auto"}
            >
              Add Client
            </Link>
          </div>

          {/* Step 2: Create Invoice */}
          <div className="flex flex-col items-center text-center p-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Step 2: Create a professional invoice
            </p>
            <p className="text-xs text-neutral-400 mb-4">
              Send polished invoices in seconds.
            </p>
            <Link
              href="/invoices?new=true"
              className={buttonVariants({ size: "sm" }) + " bg-blue-600 hover:bg-blue-700 text-white text-xs mt-auto"}
            >
              Create Invoice
            </Link>
          </div>

          {/* Step 3: Chase Payments */}
          <div className="flex flex-col items-center text-center p-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Step 3: Let AI chase your payments
            </p>
            <p className="text-xs text-neutral-400 mb-4">
              Generates polite follow-ups automatically.
            </p>
            <Link
              href="/reminders"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " border-white/10 text-neutral-300 hover:bg-white/10 text-xs mt-auto"}
            >
              See How It Works
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
