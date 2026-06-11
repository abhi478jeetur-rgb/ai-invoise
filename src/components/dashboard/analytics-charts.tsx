'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { DashboardStats, MonthlyTrendPoint } from '@/types/dashboard'
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'

interface AgingData {
  current: number
  bucket30: number
  bucket60: number
  bucket90: number
  bucket90Plus: number
}

interface AnalyticsChartsProps {
  agingReport: Record<string, AgingData>
  stats: DashboardStats
  monthlyTrend?: MonthlyTrendPoint[]
}

// Helper to format currency values cleanly
const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

export function AnalyticsCharts({ agingReport, stats, monthlyTrend = [] }: AnalyticsChartsProps) {
  const activeCurrency = Object.keys(agingReport)[0] || 'USD'
  
  // Calculate Totals for Donut
  const grandTotal = stats.totalPaid + stats.totalOutstanding
  const paidPercent = grandTotal > 0 ? Math.round((stats.totalPaid / grandTotal) * 100) : 0
  const pendingAmt = Math.max(0, stats.totalOutstanding - stats.totalOverdue)
  const pendingPercent = grandTotal > 0 ? Math.round((pendingAmt / grandTotal) * 100) : 0
  const overduePercent = grandTotal > 0 ? Math.round((stats.totalOverdue / grandTotal) * 100) : 0

  // Donut slices: Received, Pending, Overdue
  const donutData = [
    { name: 'Received', value: stats.totalPaid, color: 'var(--color-donut-received, #ec4899)' },
    { name: 'Pending', value: pendingAmt, color: 'var(--color-donut-pending, #3b82f6)' },
    { name: 'Overdue', value: stats.totalOverdue, color: 'var(--color-donut-overdue, #eab308)' }
  ].filter(d => d.value > 0)

  const hasDonutData = donutData.length > 0
  const displayDonutData = hasDonutData ? donutData : [{ name: 'No Data', value: 1, color: 'rgba(255, 255, 255, 0.05)' }]

  // format shorthand for inner circle
  const formatShorthandValue = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    return num.toString()
  }

  // Format historical trend data
  const trendData = monthlyTrend.length > 0 ? monthlyTrend : [
    { month: 'Jan', invoiced: 0, collected: 0 },
    { month: 'Feb', invoiced: 0, collected: 0 },
    { month: 'Mar', invoiced: 0, collected: 0 },
    { month: 'Apr', invoiced: 0, collected: 0 },
    { month: 'May', invoiced: 0, collected: 0 },
    { month: 'Jun', invoiced: 0, collected: 0 }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {/* Widget 1: Donut Breakdown (2 Columns) */}
      <Card className="md:col-span-2 flex flex-col border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl relative overflow-hidden">
        <CardHeader className="pb-0.5 pt-3 px-4">
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Billing Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-3">
          {/* Donut Chart Container */}
          <div className="relative h-[110px] w-[110px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={52}
                  paddingAngle={hasDonutData ? 3 : 0}
                  dataKey="value"
                  cornerRadius={4}
                >
                  {displayDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                {formatShorthandValue(grandTotal)}
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-widest mt-0.5">
                Total
              </span>
            </div>
          </div>

          {/* Premium Legend Cards Grid (Compact 3 Columns) */}
          <div className="w-full mt-3 grid grid-cols-3 gap-1.5">
            {/* Payments Received (Pink) */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-pink-500/10 bg-pink-500/[0.03] text-center">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span className="text-[9px] font-semibold text-pink-200">Received</span>
              </div>
              <span className="text-xs font-bold text-pink-100 mt-1">
                {stats.totalPaidFormatted || formatCurrency(stats.totalPaid, activeCurrency)}
              </span>
              <span className="text-[8px] font-medium text-pink-400 flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-2 h-2" />
                {paidPercent}%
              </span>
            </div>

            {/* Payments Requested (Blue) */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] text-center">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-semibold text-blue-200">Pending</span>
              </div>
              <span className="text-xs font-bold text-blue-100 mt-1">
                {formatCurrency(pendingAmt, activeCurrency)}
              </span>
              <span className="text-[8px] font-medium text-blue-400 flex items-center gap-0.5 mt-0.5">
                <Clock className="w-2 h-2" />
                {pendingPercent}%
              </span>
            </div>

            {/* Overdue (Yellow) */}
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-yellow-500/10 bg-yellow-500/[0.03] text-center">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="text-[9px] font-semibold text-yellow-200">Overdue</span>
              </div>
              <span className="text-xs font-bold text-yellow-100 mt-1">
                {stats.totalOverdueFormatted || formatCurrency(stats.totalOverdue, activeCurrency)}
              </span>
              <span className="text-[8px] font-medium text-yellow-400 flex items-center gap-0.5 mt-0.5">
                <ArrowDownRight className="w-2 h-2" />
                {overduePercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget 2: Billing & Collection Trend (3 Columns) */}
      <Card className="md:col-span-3 flex flex-col border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
        <CardHeader className="pb-0.5 pt-3 px-4 flex flex-row items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Cash Volume Trends
            </CardTitle>
          </div>
          {/* Clean Top Legend */}
          <div className="flex items-center gap-3 text-[9px] uppercase font-semibold tracking-widest text-white/50">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
              <span>Invoiced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
              <span>Collected</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 sm:p-3 min-h-[125px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="rgba(255, 255, 255, 0.2)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={5}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.2)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatShorthandValue(value)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0b0f19]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                          {payload[0].payload.month} Summary
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 justify-between text-xs">
                            <span className="text-white/60 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" /> Invoiced:
                            </span>
                            <span className="font-bold text-[#a78bfa]">
                              {formatCurrency(Number(payload[0].value) || 0, activeCurrency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 justify-between text-xs">
                            <span className="text-white/60 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" /> Collected:
                            </span>
                            <span className="font-bold text-[#f472b6]">
                              {formatCurrency(Number(payload[1]?.value) || 0, activeCurrency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="invoiced"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#invoicedGradient)"
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#ec4899"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#collectedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

interface AgingChartProps {
  agingReport: Record<string, AgingData>
}

export function AgingReceivablesChart({ agingReport }: AgingChartProps) {
  const activeCurrency = Object.keys(agingReport)[0] || 'USD'
  const report = agingReport[activeCurrency] || {
    current: 0,
    bucket30: 0,
    bucket60: 0,
    bucket90: 0,
    bucket90Plus: 0
  }

  const agingChartData = [
    { name: 'Current', value: report.current, fill: '#10b981' },
    { name: '1-30 Days', value: report.bucket30, fill: '#3b82f6' },
    { name: '31-60 Days', value: report.bucket60, fill: '#eab308' },
    { name: '61-90 Days', value: report.bucket90, fill: '#f97316' },
    { name: '90+ Days', value: report.bucket90Plus, fill: '#ef4444' }
  ]

  const hasAgingData = agingChartData.some(d => d.value > 0)

  const formatVal = (value: number) => {
    return formatCurrency(value, activeCurrency)
  }

  return (
    <Card className="border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Receivables Aging ({activeCurrency})
        </CardTitle>
        <CardDescription className="text-xs text-white/40">
          Distribution of outstanding invoices by age
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[200px] p-2 sm:p-4">
        {hasAgingData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agingChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={formatVal}
                stroke="rgba(255, 255, 255, 0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="rgba(255, 255, 255, 0.4)"
                fontSize={11}
                width={80}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: any) => [formatVal(Number(value) || 0), 'Outstanding']}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {agingChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">
            No outstanding overdue invoices.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
