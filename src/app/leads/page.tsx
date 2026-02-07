'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchGatedContentAPI, Lead, SIGNAL_TYPE_LABELS, ALL_SIGNAL_TYPES } from '@/lib/supabase'
import { Loader2, Search, Brain, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'

const TIME_FILTERS = [
  { value: '7', label: '7D' },
  { value: '14', label: '14D' },
  { value: '30', label: '30D' },
  { value: 'all', label: 'ALL' },
]

const TIER_FILTERS = ['P0', 'P1', 'P2', 'P3']

function getTierClass(tier: string): string {
  switch (tier) {
    case 'P0': return 'tier-p0'
    case 'P1': return 'tier-p1'
    case 'P2': return 'tier-p2'
    default: return 'tier-p3'
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'new': return 'text-neon-cyan'
    case 'working': return 'text-neon-orange'
    case 'done': return 'text-neon-green'
    case 'rejected': return 'text-cyan-500/40'
    default: return 'text-cyan-500/50'
  }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [timeFilter, setTimeFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchGatedContentAPI('leads', { limit: '500' })
        setLeads(data.leads || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Time filter
      if (timeFilter !== 'all') {
        const days = parseInt(timeFilter)
        const cutoff = subDays(new Date(), days)
        if (!isAfter(parseISO(lead.inbox_entered_at), cutoff)) return false
      }

      // Tier filter
      if (tierFilter && lead.signal_tier !== tierFilter) return false

      // Status filter
      if (statusFilter && lead.action_status !== statusFilter) return false

      // Signal type filter
      if (signalTypeFilter && lead.trigger_signal_type !== signalTypeFilter) return false

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          lead.email?.toLowerCase().includes(q) ||
          lead.company_name?.toLowerCase().includes(q) ||
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.content_name?.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [leads, timeFilter, tierFilter, statusFilter, signalTypeFilter, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="cyber-loader" />
          <span className="text-[10px] text-cyan-500/50 font-cyber tracking-wider">LOADING.LEADS</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="cyber-card p-6 max-w-md text-center">
          <div className="text-neon-magenta font-cyber text-sm mb-2">SYSTEM.ERROR</div>
          <p className="text-[11px] text-cyan-500/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="cyber-header sticky top-0 z-40 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-cyber text-sm text-neon-cyan text-glow-sm tracking-wider hover:text-neon-cyan/80">
              SIGNAL.ANALYTICS
            </Link>
            <span className="text-cyan-500/30">|</span>
            <span className="text-[10px] text-cyan-500/60 tracking-wider">LEAD.DATABASE</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/" className="nav-link text-cyan-500/50">OVERVIEW</Link>
            <Link href="/content" className="nav-link text-cyan-500/50">CONTENT</Link>
            <Link href="/leads" className="nav-link active">LEADS</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Filters Bar */}
        <div className="cyber-card p-3 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[180px] max-w-xs relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-cyan-500/40" />
              <input
                type="text"
                placeholder="SEARCH..."
                className="cyber-input w-full pl-7 text-[10px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Time Filter */}
            <div className="flex border border-cyan-500/20">
              {TIME_FILTERS.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeFilter(tf.value)}
                  className={`cyber-toggle ${timeFilter === tf.value ? 'active' : ''}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex border border-cyan-500/20">
              <button
                onClick={() => setTierFilter('')}
                className={`cyber-toggle ${tierFilter === '' ? 'active' : ''}`}
              >
                ALL
              </button>
              {TIER_FILTERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`cyber-toggle ${tierFilter === tier ? 'active' : ''}`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Signal Type Filter */}
            <div className="relative">
              <select
                className="cyber-select pr-6"
                value={signalTypeFilter}
                onChange={(e) => setSignalTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {ALL_SIGNAL_TYPES.map(type => (
                  <option key={type} value={type}>{SIGNAL_TYPE_LABELS[type] || type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-cyan-500/40 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className="cyber-select pr-6"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="working">Working</option>
                <option value="done">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-cyan-500/40 pointer-events-none" />
            </div>

            <span className="text-[9px] text-cyan-500/40 font-mono ml-auto tracking-wider">
              {filteredLeads.length} RECORDS
            </span>
          </div>
        </div>

        {/* Leads Table */}
        <div className="cyber-table overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-[50px]">TIER</th>
                <th className="w-[60px]">SCORE</th>
                <th className="w-[60px]">DATE</th>
                <th>CONTACT</th>
                <th>COMPANY</th>
                <th>TYPE</th>
                <th>CONTENT</th>
                <th className="w-[70px]">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-cyan-500/30 font-cyber text-[10px] tracking-wider">
                    NO.RECORDS.FOUND
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isPersonalEmail = /gmail|yahoo|hotmail|outlook|icloud|aol|proton/i.test(lead.email || '')
                  const signalLabel = lead.trigger_signal_type ? SIGNAL_TYPE_LABELS[lead.trigger_signal_type] : '-'

                  return (
                    <tr
                      key={lead.id}
                      className="cyber-row cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-cyber font-bold ${getTierClass(lead.signal_tier)}`}>
                          {lead.signal_tier}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-cyber text-sm text-neon-cyan">{lead.total_score}</span>
                      </td>
                      <td className="text-cyan-500/60 font-mono text-[10px]">
                        {format(parseISO(lead.inbox_entered_at), 'MM/dd')}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] text-cyan-300 truncate max-w-[140px]">
                              {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : lead.email?.split('@')[0]}
                            </div>
                            <div className="text-[9px] text-cyan-500/40 truncate max-w-[140px]">
                              {lead.email}
                            </div>
                          </div>
                          {lead.has_research && (
                            <span title="AI Researched">
                              <Brain className="h-3 w-3 text-neon-purple shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {isPersonalEmail ? (
                          <span className="text-[10px] text-cyan-500/30 italic">personal</span>
                        ) : (
                          <div className="min-w-0">
                            <div className="text-[11px] text-cyan-300 truncate max-w-[120px]">
                              {lead.company_name || lead.company_domain || '-'}
                            </div>
                            {lead.detected_persona && (
                              <div className="text-[9px] text-neon-purple truncate max-w-[120px]">
                                {lead.detected_persona}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="signal-badge">{signalLabel}</span>
                      </td>
                      <td>
                        <div className="text-[10px] text-cyan-500/60 truncate max-w-[150px]" title={lead.content_name || ''}>
                          {lead.content_name || '-'}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`text-[9px] font-bold ${getStatusClass(lead.action_status)}`}>
                          {lead.action_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
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
