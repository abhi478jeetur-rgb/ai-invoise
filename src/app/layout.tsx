import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PHProvider } from '@/providers/posthog-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import SuspendedPostHogPageview from '@/components/posthog-pageview'

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ChaseFree AI - Focus on Late Invoices",
  description: "A specialized invoicing and automated late payment follow-up dashboard for freelancers and small agencies.",
  openGraph: {
    title: "ChaseFree AI - Focus on Late Invoices",
    description: "A specialized invoicing and automated late payment follow-up dashboard for freelancers and small agencies.",
    images: [
      {
        url: "/images/og%20image.png",
        width: 1200,
        height: 630,
        alt: "ChaseFree AI",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChaseFree AI - Focus on Late Invoices",
    description: "A specialized invoicing and automated late payment follow-up dashboard for freelancers and small agencies.",
    images: ["/images/og%20image.png"],
  },
};

import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Toaster } from "@/components/ui/sonner"
import ConnectivityMonitor from "@/components/shared/ConnectivityMonitor"
import dynamic from 'next/dynamic'

const AgentationDevTool = dynamic(() => import('@/components/dev/AgentationWrapper'))

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PHProvider>
            <SuspendedPostHogPageview />
            <ConnectivityMonitor />
            {children}
          </PHProvider>
          <AgentationDevTool />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
