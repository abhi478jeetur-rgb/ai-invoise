import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PHProvider } from '@/providers/posthog-provider'
import SuspendedPostHogPageview from '@/components/posthog-pageview'

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChaseFree AI - Focus on Late Invoices",
  description: "A specialized invoicing and automated late payment follow-up dashboard for freelancers and small agencies.",
};

import { Toaster } from "@/components/ui/sonner"
import ConnectivityMonitor from "@/components/shared/ConnectivityMonitor"
import dynamic from 'next/dynamic'

const AgentationDevTool = dynamic(() => import('@/components/dev/AgentationWrapper'), { ssr: false })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans antialiased bg-[#000000] text-white min-h-full flex flex-col">
        <PHProvider>
          <SuspendedPostHogPageview />
          <ConnectivityMonitor />
          {children}
        </PHProvider>
        <AgentationDevTool />
        <Toaster 
          toastOptions={{
            className: "bg-zinc-950 border border-white/[0.08] text-zinc-100 font-sans",
          }}
        />
      </body>
    </html>
  );
}
