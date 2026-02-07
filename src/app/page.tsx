'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData, Lead, SIGNAL_TYPE_LABELS } from '@/lib/supabase'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'
import { FileText, TrendingUp, Users, Target, Loader2, Search, Filter, ChevronDown, Sparkles, Zap, Brain } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'

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

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [trend, setTrend] = useState<TrendData[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [timeFilter, setTimeFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Build params with signal type filter
        const params: Record<string, string> = {}
        if (signalTypeFilter) {
          params.signal_type = signalTypeFilter
        }

        const [overviewData, trendData, leadsData] = await Promise.all([
          fetchGatedContentAPI('overview', params),
          fetchGatedContentAPI('trend', { days: '30', ...params }),
          fetchGatedContentAPI('leads', { limit: '500', ...params }),
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
  }, [signalTypeFilter])

  // Get unique sources and campaigns for filters
  const { sources, campaigns } = useMemo(() => {
    const sourceSet = new Set<string>()
    const campaignSet = new Set<string>()
    leads.forEach(lead => {
      if (lead.utm_source) sourceSet.add(lead.utm_source)
      if (lead.utm_campaign) campaignSet.add(lead.utm_campaign)
    })
    return {
      sources: Array.from(sourceSet).sort(),
      campaigns: Array.from(campaignSet).sort(),
    }
  }, [leads])

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

      // Source filter
      if (sourceFilter && lead.utm_source !== sourceFilter) return false

      // Campaign filter
      if (campaignFilter && lead.utm_campaign !== campaignFilter) return false

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          lead.email?.toLowerCase().includes(q) ||
          lead.company_name?.toLowerCase().includes(q) ||
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.content_name?.toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [leads, timeFilter, tierFilter, sourceFilter, campaignFilter, searchQuery])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const total = filteredLeads.length
    const highQuality = filteredLeads.filter(l => l.signal_tier === 'P0' || l.signal_tier === 'P1').length
    const converted = filteredLeads.filter(l => l.action_status === 'done').length
    const avgScore = total > 0
      ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.total_score || 0), 0) / total)
      : 0

    return { total, highQuality, converted, avgScore }
  }, [filteredLeads])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            <div className="absolute inset-0 blur-xl bg-neon-cyan/30 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-mono text-sm">LOADING ANALYTICS...</span>
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
              <div className="h-8 w-8 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Gated Content Analytics</h1>
                <p className="text-xs text-muted-foreground font-mono">SIGNAL INTELLIGENCE</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm font-medium text-neon-cyan border-b-2 border-neon-cyan">
                Overview
              </Link>
              <Link href="/content" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Content
              </Link>
              <Link href="/leads" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Leads
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-cyan/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-neon-cyan" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Downloads</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{filteredStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {overview?.total_downloads || 0} total
            </div>
          </div>

          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-green/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-neon-green" />
              <span className="text-xs text-muted-foreground font-mono uppercase">High Quality</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {filteredStats.total > 0 ? Math.round((filteredStats.highQuality / filteredStats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredStats.highQuality} P0/P1 leads
            </div>
          </div>

          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-purple/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-neon-purple" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Converted</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {filteredStats.total > 0 ? Math.round((filteredStats.converted / filteredStats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredStats.converted} to pipeline
            </div>
          </div>

          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-magenta/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-neon-magenta" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{filteredStats.avgScore}</div>
            <div className="text-xs text-muted-foreground">
              / 220 max
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neon-cyan" />
              Download Trend
            </h3>
            <TrendChart data={trend} />
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-purple" />
              Persona Breakdown
            </h3>
            <PersonaBarChart data={overview?.by_persona || []} />
          </div>
        </div>

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

            {/* Signal Type Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-muted border border-border rounded px-3 py-1.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:border-neon-cyan cursor-pointer"
                value={signalTypeFilter}
                onChange={(e) => setSignalTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="webflow_content_download">Gated Content</option>
                <option value="webflow_demo_request">Demo Request</option>
                <option value="webflow_contact">Contact Form</option>
                <option value="webflow_newsletter">Newsletter</option>
                <option value="webflow_popup">Popup</option>
                <option value="webflow_webinar_reg">Webinar</option>
                <option value="webflow_event_reg">Event</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
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

            {/* Source Filter */}
            {sources.length > 0 && (
              <div className="relative">
                <select
                  className="appearance-none bg-muted border border-border rounded px-3 py-1.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:border-neon-cyan cursor-pointer"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="">All Sources</option>
                  {sources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            )}

            {/* Campaign Filter */}
            {campaigns.length > 0 && (
              <div className="relative">
                <select
                  className="appearance-none bg-muted border border-border rounded px-3 py-1.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:border-neon-cyan cursor-pointer max-w-[150px]"
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            )}

            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {filteredLeads.length} results
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
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Content</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-muted-foreground font-mono text-sm">
                      No leads match your filters
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
                    const isPersonalEmail = /gmail|yahoo|hotmail|outlook|icloud|aol|proton/i.test(lead.email || '')
                    const signalLabel = lead.signal_type_label || SIGNAL_TYPE_LABELS[lead.trigger_signal_type || ''] || 'Unknown'

                    return (
                      <tr
                        key={lead.id}
                        className="cyber-row cursor-pointer group"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {format(parseISO(lead.inbox_entered_at), 'MM/dd')}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {signalLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                                {lead.first_name || lead.last_name
                                  ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                  : lead.email?.split('@')[0]}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {lead.title || lead.detected_persona || '-'}
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
                              <span className="text-muted-foreground italic">Personal</span>
                            ) : (
                              lead.company_name || lead.company_domain || '-'
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-foreground truncate max-w-[120px]" title={lead.content_name || ''}>
                            {lead.content_name || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            {lead.utm_source || 'direct'}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-sm font-bold text-foreground font-mono">{lead.total_score}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`tier-badge inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tierConfig.color} ${tierConfig.glow}`}>
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
