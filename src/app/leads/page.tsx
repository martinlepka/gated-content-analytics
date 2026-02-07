'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchGatedContentAPI, Lead } from '@/lib/supabase'
import { ArrowLeft, Loader2, Search, ChevronDown, Brain, Zap, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30', icon: AlertCircle },
  working: { label: 'Working', color: 'text-neon-orange bg-neon-orange/10 border-neon-orange/30', icon: Clock },
  done: { label: 'Converted', color: 'text-neon-green bg-neon-green/10 border-neon-green/30', icon: CheckCircle },
  rejected: { label: 'Disqualified', color: 'text-muted-foreground bg-muted border-border', icon: XCircle },
}

const TIER_CONFIG = {
  P0: { label: 'P0', color: 'bg-p0-light text-neon-magenta border border-p0/30', glow: 'shadow-[0_0_10px_rgba(255,0,128,0.3)]' },
  P1: { label: 'P1', color: 'bg-p1-light text-neon-orange border border-p1/30', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
  P2: { label: 'P2', color: 'bg-p2-light text-neon-cyan border border-p2/30', glow: 'shadow-[0_0_10px_rgba(0,212,255,0.3)]' },
  P3: { label: 'P3', color: 'bg-muted text-muted-foreground border border-border', glow: '' },
}

const TIME_FILTERS = [
  { value: '7', label: '7D' },
  { value: '14', label: '14D' },
  { value: '30', label: '30D' },
  { value: 'all', label: 'All' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [timeFilter, setTimeFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchGatedContentAPI('leads', { limit: '200' })
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
  }, [leads, timeFilter, tierFilter, statusFilter, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            <div className="absolute inset-0 blur-xl bg-neon-cyan/30 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-mono text-sm">LOADING LEADS...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-p0/50 rounded-lg p-6 max-w-md glow-magenta">
          <h2 className="text-lg font-semibold text-neon-magenta mb-2">System Error</h2>
          <p className="text-muted-foreground font-mono text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-8 w-8 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Lead List</h1>
                <p className="text-xs text-muted-foreground font-mono">ALL GATED CONTENT DOWNLOADS</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Overview
              </Link>
              <Link href="/content" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Content
              </Link>
              <Link href="/leads" className="px-3 py-1.5 text-sm font-medium text-neon-cyan border-b-2 border-neon-cyan">
                Leads
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex items-center bg-muted rounded border border-border">
              {TIME_FILTERS.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeFilter(tf.value)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    timeFilter === tf.value
                      ? 'bg-neon-cyan text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-muted border border-border rounded px-3 py-1.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:border-neon-cyan cursor-pointer"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-muted border border-border rounded px-3 py-1.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:border-neon-cyan cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="working">Working</option>
                <option value="done">Converted</option>
                <option value="rejected">Disqualified</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {filteredLeads.length} leads
            </span>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Content</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Persona</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-muted-foreground font-mono text-sm">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const statusConfig = STATUS_CONFIG[lead.action_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
                    const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
                    const StatusIcon = statusConfig.icon
                    const isPersonalEmail = /gmail|yahoo|hotmail|outlook|icloud|aol|proton/i.test(lead.email || '')

                    return (
                      <tr
                        key={lead.id}
                        className="cyber-row cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {format(parseISO(lead.inbox_entered_at), 'MM/dd')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                                {lead.first_name || lead.last_name
                                  ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                  : '-'}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {lead.email}
                              </div>
                            </div>
                            {lead.has_research && (
                              <Brain className="h-3 w-3 text-neon-purple shrink-0" title="AI Researched" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-foreground truncate max-w-[100px]">
                            {isPersonalEmail ? (
                              <span className="text-muted-foreground italic text-xs">Personal</span>
                            ) : (
                              lead.company_name || '-'
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {lead.title || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-foreground truncate max-w-[120px]" title={lead.content_name || ''}>
                            {lead.content_name || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-neon-purple">{lead.detected_persona || '-'}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`tier-badge inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tierConfig.color} ${tierConfig.glow}`}>
                            {tierConfig.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-sm font-bold text-foreground font-mono">{lead.total_score}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusConfig.label}
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
