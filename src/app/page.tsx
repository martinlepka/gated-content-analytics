'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData, Lead } from '@/lib/supabase'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'
import { FileText, TrendingUp, Users, Target, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

const TIER_CONFIG = {
  P0: { label: 'P0', color: 'bg-red-100 text-red-800' },
  P1: { label: 'P1', color: 'bg-orange-100 text-orange-800' },
  P2: { label: 'P2', color: 'bg-yellow-100 text-yellow-800' },
  P3: { label: 'P3', color: 'bg-gray-100 text-gray-800' },
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trend, setTrend] = useState<TrendData[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewData, trendData, leadsData] = await Promise.all([
          fetchGatedContentAPI('overview'),
          fetchGatedContentAPI('trend', { days: '30' }),
          fetchGatedContentAPI('leads', { limit: '200' }),
        ])
        setOverview(overviewData)
        setTrend(trendData.trend || [])
        setLeads(leadsData.leads || [])
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

          {/* Persona Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Breakdown</h3>
            <PersonaBarChart data={overview?.by_persona || []} />
          </div>
        </div>

        {/* All Downloads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Downloads</h3>
            <p className="text-sm text-gray-500 mt-1">Click on a row to view full details and AI research</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Content / Referral</th>
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3 text-center">ICP Score</th>
                  <th className="px-6 py-3 text-center">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No downloads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {format(parseISO(lead.inbox_entered_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name || ''} {lead.last_name || ''}
                            {!lead.first_name && !lead.last_name && <span className="text-gray-400">-</span>}
                          </div>
                          <div className="text-xs text-gray-500">{lead.title || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {lead.company_name || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[200px] truncate" title={lead.content_name}>
                            {lead.content_name || <span className="text-gray-400">-</span>}
                          </div>
                          {lead.utm_source && (
                            <div className="text-xs text-gray-500">
                              via {lead.utm_source}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {lead.utm_campaign || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-900">{lead.icp_fit_score}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  )
}
