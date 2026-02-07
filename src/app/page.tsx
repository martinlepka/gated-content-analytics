'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData } from '@/lib/supabase'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { QualityPieChart } from '@/components/charts/QualityPieChart'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { ContentTable } from '@/components/dashboard/ContentTable'
import { FileText, TrendingUp, Users, Target, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trend, setTrend] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewData, trendData] = await Promise.all([
          fetchGatedContentAPI('overview'),
          fetchGatedContentAPI('trend', { days: '30' }),
        ])
        setOverview(overviewData)
        setTrend(trendData.trend || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gated Content Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Lead quality and performance insights</p>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-blue-600">Overview</Link>
              <Link href="/content" className="text-sm font-medium text-gray-600 hover:text-gray-900">Content</Link>
              <Link href="/leads" className="text-sm font-medium text-gray-600 hover:text-gray-900">Leads</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Downloads"
            value={overview?.total_downloads || 0}
            icon={<FileText className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="High Quality"
            value={`${overview?.high_quality_pct || 0}%`}
            subtitle={`${overview?.high_quality_count || 0} P0/P1 leads`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
          />
          <MetricCard
            title="Converted"
            value={`${overview?.converted_pct || 0}%`}
            subtitle={`${overview?.converted_count || 0} moved to pipeline`}
            icon={<Target className="h-5 w-5" />}
            color="purple"
          />
          <MetricCard
            title="Top Persona"
            value={overview?.by_persona?.[0]?.persona || 'N/A'}
            subtitle={`${overview?.by_persona?.[0]?.pct || 0}% of downloads`}
            icon={<Users className="h-5 w-5" />}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Trend (30 days)</h3>
            <TrendChart data={trend} />
          </div>

          {/* Quality Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Distribution</h3>
            <QualityPieChart data={overview?.by_tier || { P0: 0, P1: 0, P2: 0, P3: 0 }} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
              <Link href="/content" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <ContentTable content={overview?.by_content?.slice(0, 5) || []} />
          </div>

          {/* Persona Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Breakdown</h3>
            <PersonaBarChart data={overview?.by_persona || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
