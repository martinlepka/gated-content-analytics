'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI, Lead } from '@/lib/supabase'
import { ArrowLeft, Loader2, Search, Filter, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  working: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  done: { label: 'Converted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Disqualified', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

const TIER_CONFIG = {
  P0: { label: 'P0', color: 'bg-red-100 text-red-800' },
  P1: { label: 'P1', color: 'bg-orange-100 text-orange-800' },
  P2: { label: 'P2', color: 'bg-yellow-100 text-yellow-800' },
  P3: { label: 'P3', color: 'bg-gray-100 text-gray-800' },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [tierFilter, setTierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const params: Record<string, string> = { limit: '200' }
        if (tierFilter) params.tier = tierFilter
        if (statusFilter) params.status = statusFilter

        const data = await fetchGatedContentAPI('leads', params)
        setLeads(data.leads || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tierFilter, statusFilter])

  // Client-side search filter
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.email?.toLowerCase().includes(query) ||
      lead.company_name?.toLowerCase().includes(query) ||
      lead.content_name?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading leads...</span>
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
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead List</h1>
                <p className="text-sm text-gray-500 mt-1">All gated content downloads</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Overview</Link>
              <Link href="/content" className="text-sm font-medium text-gray-600 hover:text-gray-900">Content</Link>
              <Link href="/leads" className="text-sm font-medium text-blue-600">Leads</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search email, company, or content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="P0">P0 - Immediate</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Standard</option>
                <option value="P3">P3 - Nurture</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="working">In Progress</option>
              <option value="done">Converted</option>
              <option value="rejected">Disqualified</option>
            </select>

            <span className="text-sm text-gray-500">
              {filteredLeads.length} leads
            </span>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Content</th>
                  <th className="px-6 py-3">Persona</th>
                  <th className="px-6 py-3 text-center">Tier</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Enriched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const statusConfig = STATUS_CONFIG[lead.action_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
                    const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
                    const StatusIcon = statusConfig.icon

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(parseISO(lead.inbox_entered_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name || ''} {lead.last_name || ''}
                            {!lead.first_name && !lead.last_name && '-'}
                          </div>
                          <div className="text-xs text-gray-500">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{lead.company_name || '-'}</div>
                          <div className="text-xs text-gray-500">{lead.title || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 truncate max-w-[150px] block">
                            {lead.content_name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{lead.detected_persona}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{lead.total_score}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {lead.has_research && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800" title="AI Researched">
                                AI
                              </span>
                            )}
                            {lead.in_salesforce && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800" title="In Salesforce">
                                SF
                              </span>
                            )}
                          </div>
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
