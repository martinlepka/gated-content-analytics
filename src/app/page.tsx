'use client'

import { useEffect, useState, useMemo } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData, Lead, SIGNAL_TYPE_LABELS } from '@/lib/supabase'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'
import { LeadMQLFunnel } from '@/components/dashboard/LeadMQLFunnel'
import { Search, ChevronDown, ChevronUp, Zap, Activity, Target, Brain, Users, TrendingUp, HelpCircle, X, FileText, Building2 } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'

const TIME_FILTERS = [
  { value: '7', label: '7D' },
  { value: '14', label: '14D' },
  { value: '30', label: '30D' },
  { value: 'all', label: 'ALL' },
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
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [contentFilter, setContentFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Help panel
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const params: Record<string, string> = {}
        if (signalTypeFilter) params.signal_type = signalTypeFilter

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

  const { sources, contentNames } = useMemo(() => {
    const sourceSet = new Set<string>()
    const contentSet = new Set<string>()
    leads.forEach(lead => {
      if (lead.utm_source) sourceSet.add(lead.utm_source)
      if (lead.content_name) contentSet.add(lead.content_name)
    })
    return {
      sources: Array.from(sourceSet).sort(),
      contentNames: Array.from(contentSet).sort()
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      if (timeFilter !== 'all') {
        const days = parseInt(timeFilter)
        const cutoff = subDays(new Date(), days)
        if (!isAfter(parseISO(lead.inbox_entered_at), cutoff)) return false
      }
      if (tierFilter && lead.signal_tier !== tierFilter) return false
      if (sourceFilter && lead.utm_source !== sourceFilter) return false
      if (statusFilter && lead.action_status !== statusFilter) return false
      if (contentFilter && lead.content_name !== contentFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          lead.email?.toLowerCase().includes(q) ||
          lead.company_name?.toLowerCase().includes(q) ||
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.content_name?.toLowerCase().includes(q) ||
          lead.industry?.toLowerCase().includes(q) ||
          lead.title?.toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortColumn) {
        case 'date':
          aVal = a.inbox_entered_at
          bVal = b.inbox_entered_at
          break
        case 'score':
          aVal = a.total_score || 0
          bVal = b.total_score || 0
          break
        case 'tier':
          const tierOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
          aVal = tierOrder[a.signal_tier as keyof typeof tierOrder] ?? 4
          bVal = tierOrder[b.signal_tier as keyof typeof tierOrder] ?? 4
          break
        case 'contact':
          aVal = (a.first_name || a.last_name || a.email || '').toLowerCase()
          bVal = (b.first_name || b.last_name || b.email || '').toLowerCase()
          break
        case 'company':
          aVal = (a.company_name || '').toLowerCase()
          bVal = (b.company_name || '').toLowerCase()
          break
        case 'source':
          aVal = (a.utm_source || '').toLowerCase()
          bVal = (b.utm_source || '').toLowerCase()
          break
        case 'status':
          const statusOrder = { new: 0, working: 1, done: 2, rejected: 3 }
          aVal = statusOrder[a.action_status as keyof typeof statusOrder] ?? 4
          bVal = statusOrder[b.action_status as keyof typeof statusOrder] ?? 4
          break
        default:
          aVal = a.inbox_entered_at
          bVal = b.inbox_entered_at
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [leads, timeFilter, tierFilter, sourceFilter, statusFilter, contentFilter, searchQuery, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ChevronDown className="w-3 h-3 text-gray-300" />
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-neon-cyan" />
      : <ChevronDown className="w-3 h-3 text-neon-cyan" />
  }

  const stats = useMemo(() => {
    const total = filteredLeads.length
    const p0 = filteredLeads.filter(l => l.signal_tier === 'P0').length
    const p1 = filteredLeads.filter(l => l.signal_tier === 'P1').length
    const highQuality = p0 + p1
    // Count accepted leads (done + auto_linked to discovery/TAL)
    const accepted = filteredLeads.filter(l =>
      l.action_status === 'done' &&
      (l.rejection_reason?.includes('auto_linked_to_discovery') ||
       l.rejection_reason?.includes('auto_linked_to_tal') ||
       l.rejection_reason?.includes('auto_linked_existing') ||
       !l.rejection_reason)
    ).length
    const rejected = filteredLeads.filter(l => l.action_status === 'rejected').length
    const avgScore = total > 0 ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.total_score || 0), 0) / total) : 0
    return { total, p0, p1, highQuality, accepted, rejected, avgScore }
  }, [filteredLeads])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="cyber-loader mx-auto mb-4" />
          <div className="font-cyber text-neon-cyan text-xs tracking-widest text-glow">INITIALIZING...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="cyber-card p-6 max-w-md border-red-500/50">
          <div className="font-cyber text-red-500 text-sm mb-2">SYSTEM ERROR</div>
          <div className="text-xs text-red-400/70">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="cyber-header sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-cyan-100 to-purple-100 border border-cyan-200 rounded">
              <Zap className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <div className="font-cyber text-sm text-neon-cyan text-glow-sm tracking-wider">SIGNAL.ANALYTICS</div>
              <div className="text-[9px] text-gray-500 tracking-widest">LEAD INTELLIGENCE SYSTEM</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/" className="nav-link active">Overview</Link>
            <Link href="/content" className="nav-link">Content</Link>
            <Link href="/leads" className="nav-link">Leads</Link>
            <button
              onClick={() => setShowHelp(true)}
              className="ml-2 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-neon-cyan transition-colors"
              title="Help & Definitions"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="cyber-stat p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="text-[9px] text-gray-500 font-cyber tracking-wider">SIGNALS</span>
            </div>
            <div className="font-cyber text-2xl text-neon-cyan text-glow score-display">{stats.total}</div>
          </div>
          <div className="cyber-stat p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-neon-magenta" />
              <span className="text-[9px] text-gray-500 font-cyber tracking-wider">P0/P1</span>
            </div>
            <div className="font-cyber text-2xl text-neon-magenta text-glow score-display">{stats.highQuality}</div>
            <div className="text-[10px] text-gray-400">{stats.total > 0 ? Math.round((stats.highQuality / stats.total) * 100) : 0}%</div>
          </div>
          <div className="cyber-stat p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-[9px] text-gray-500 font-cyber tracking-wider">ACCEPTED</span>
            </div>
            <div className="font-cyber text-2xl text-neon-green text-glow score-display">{stats.accepted}</div>
            <div className="text-[10px] text-gray-400">{stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%</div>
          </div>
          <div className="cyber-stat p-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-3.5 h-3.5 text-neon-purple" />
              <span className="text-[9px] text-gray-500 font-cyber tracking-wider">AVG SCORE</span>
            </div>
            <div className="font-cyber text-2xl text-neon-purple text-glow score-display">{stats.avgScore}</div>
            <div className="text-[10px] text-gray-400">/ 220</div>
          </div>
          <div className="cyber-stat p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-neon-orange" />
              <span className="text-[9px] text-gray-500 font-cyber tracking-wider">TOP PERSONA</span>
            </div>
            <div className="font-cyber text-base text-neon-orange text-glow-sm">{overview?.by_persona?.[0]?.persona || 'N/A'}</div>
            <div className="text-[10px] text-gray-400">{overview?.by_persona?.[0]?.pct || 0}%</div>
          </div>
        </div>

        {/* Lead → MQL Funnel */}
        <LeadMQLFunnel leads={filteredLeads} contentFilter={contentFilter || undefined} />

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="cyber-card p-4">
            <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">SIGNAL TREND [30D]</div>
            <TrendChart data={trend} />
          </div>
          <div className="cyber-card p-4">
            <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">PERSONA DISTRIBUTION</div>
            <PersonaBarChart data={overview?.by_persona || []} />
          </div>
        </div>

        {/* Filters */}
        <div className="cyber-card p-3 mb-3 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[150px] max-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="cyber-input w-full pl-9 pr-3 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="flex">
            {TIME_FILTERS.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeFilter(tf.value)}
                className={`cyber-toggle ${timeFilter === tf.value ? 'active' : ''}`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Signal Type */}
          <div className="relative">
            <select
              className="cyber-select pr-7"
              value={signalTypeFilter}
              onChange={(e) => setSignalTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="webflow_content_download">Gated</option>
              <option value="webflow_demo_request">Demo</option>
              <option value="webflow_contact">Contact</option>
              <option value="webflow_newsletter">Newsletter</option>
              <option value="webflow_popup">Popup</option>
              <option value="webflow_webinar_reg">Webinar</option>
              <option value="webflow_event_reg">Event</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Tier */}
          <div className="relative">
            <select
              className="cyber-select pr-7"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Content Asset */}
          {contentNames.length > 0 && (
            <div className="relative">
              <select
                className="cyber-select pr-7"
                value={contentFilter}
                onChange={(e) => setContentFilter(e.target.value)}
              >
                <option value="">All Content</option>
                {contentNames.map(c => (
                  <option key={c} value={c}>{c.length > 25 ? c.slice(0, 25) + '...' : c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Source */}
          {sources.length > 0 && (
            <div className="relative">
              <select
                className="cyber-select pr-7"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="">All Sources</option>
                {sources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Status */}
          <div className="relative">
            <select
              className="cyber-select pr-7"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="new">New (Unreviewed)</option>
              <option value="working">Working</option>
              <option value="researching">Researching</option>
              <option value="done">Accepted/Done</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="ml-auto text-[10px] text-gray-500 font-mono">{filteredLeads.length} records</div>
        </div>

        {/* Table */}
        <div className="cyber-table overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left w-[75px] cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">DATE <SortIcon column="date" /></span>
                  </th>
                  <th className="text-left w-[80px]">TYPE</th>
                  <th className="text-left cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('contact')}>
                    <span className="flex items-center gap-1">CONTACT <SortIcon column="contact" /></span>
                  </th>
                  <th className="text-left cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('company')}>
                    <span className="flex items-center gap-1">COMPANY <SortIcon column="company" /></span>
                  </th>
                  <th className="text-left w-[200px] max-w-[200px]">CONTENT</th>
                  <th className="text-left w-[70px] cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('source')}>
                    <span className="flex items-center gap-1">SOURCE <SortIcon column="source" /></span>
                  </th>
                  <th className="text-center w-[55px] cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('score')}>
                    <span className="flex items-center justify-center gap-1">SCORE <SortIcon column="score" /></span>
                  </th>
                  <th className="text-center w-[45px] cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('tier')}>
                    <span className="flex items-center justify-center gap-1">TIER <SortIcon column="tier" /></span>
                  </th>
                  <th className="text-center w-[65px] cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('status')}>
                    <span className="flex items-center justify-center gap-1">STATUS <SortIcon column="status" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400 font-cyber text-xs">
                      No data found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const isPersonal = /gmail|yahoo|hotmail|outlook|icloud|aol|proton/i.test(lead.email || '')
                    const signalLabel = lead.signal_type_label || SIGNAL_TYPE_LABELS[lead.trigger_signal_type || ''] || '-'
                    const tierClass = lead.signal_tier === 'P0' ? 'tier-p0' :
                                     lead.signal_tier === 'P1' ? 'tier-p1' :
                                     lead.signal_tier === 'P2' ? 'tier-p2' : 'tier-p3'

                    // Signal type colors
                    const signalType = lead.trigger_signal_type || ''
                    const typeColorClass =
                      signalType === 'webflow_demo_request' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                      signalType === 'webflow_content_download' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                      signalType === 'webflow_contact' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      signalType === 'webflow_newsletter' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      signalType === 'webflow_popup' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      signalType === 'webflow_webinar_reg' ? 'bg-green-100 text-green-700 border-green-200' :
                      signalType === 'webflow_event_reg' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'

                    // Determine display status based on action_status + rejection_reason
                    const getDisplayStatus = () => {
                      if (lead.action_status === 'done') {
                        // Check rejection_reason for accepted leads
                        if (lead.rejection_reason?.includes('auto_linked_to_discovery') ||
                            lead.rejection_reason?.includes('auto_linked_to_tal')) {
                          return { label: 'ACCEPTED', class: 'text-neon-green', bgClass: 'bg-green-100' }
                        }
                        if (lead.rejection_reason?.includes('auto_linked_existing')) {
                          return { label: 'MERGED', class: 'text-neon-green', bgClass: 'bg-green-100' }
                        }
                        return { label: 'DONE', class: 'text-neon-green', bgClass: 'bg-green-100' }
                      }
                      if (lead.action_status === 'rejected') {
                        return { label: 'REJECTED', class: 'text-red-500', bgClass: 'bg-red-50' }
                      }
                      if (lead.action_status === 'working') {
                        return { label: 'WORKING', class: 'text-neon-orange', bgClass: 'bg-orange-100' }
                      }
                      if (lead.action_status === 'researching') {
                        return { label: 'RESEARCH', class: 'text-neon-purple', bgClass: 'bg-purple-100' }
                      }
                      return { label: 'NEW', class: 'text-neon-cyan', bgClass: 'bg-cyan-100' }
                    }
                    const displayStatus = getDisplayStatus()

                    // Format rejection reason for display
                    const getShortRejectionReason = () => {
                      if (!lead.rejection_reason) return null
                      const reason = lead.rejection_reason
                      if (reason.includes('not_icp')) return 'Not ICP'
                      if (reason.includes('current_customer')) return 'Customer'
                      if (reason.includes('competitor')) return 'Competitor'
                      if (reason.includes('keboola_partner')) return 'Partner'
                      if (reason.includes('spam_invalid')) return 'Invalid'
                      if (reason.includes('duplicate')) return 'Duplicate'
                      if (reason.includes('gmail') || reason.includes('yahoo') || reason.includes('hotmail')) return 'Personal Email'
                      if (reason.includes('Excluded domain')) return 'Excluded'
                      if (reason.includes('SF Account Type')) return 'SF Customer'
                      if (reason.includes('auto_linked')) return null // Not a real rejection
                      return reason.length > 15 ? reason.substring(0, 15) + '...' : reason
                    }
                    const shortReason = getShortRejectionReason()

                    return (
                      <tr
                        key={lead.id}
                        className="cyber-row cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="text-gray-500 text-[10px] font-mono">
                          {format(parseISO(lead.inbox_entered_at), 'MM/dd HH:mm')}
                        </td>
                        <td>
                          <span className={`inline-block px-1.5 py-0.5 text-[8px] font-medium border rounded ${typeColorClass}`}>
                            {signalLabel}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div>
                              <div className="text-gray-800 text-[11px] truncate max-w-[140px] leading-tight">
                                {lead.first_name || lead.last_name
                                  ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                  : lead.email?.split('@')[0]}
                              </div>
                              {lead.title && (
                                <div className="text-neon-purple text-[9px] truncate max-w-[140px] leading-tight font-medium">
                                  {lead.title}
                                </div>
                              )}
                              <div className="text-gray-400 text-[9px] truncate max-w-[140px] leading-tight">
                                {lead.email}
                              </div>
                            </div>
                            {lead.has_research && (
                              <span title="AI Researched">
                                <Brain className="w-3 h-3 text-neon-purple shrink-0" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {isPersonal ? (
                            <span className="text-gray-400 italic text-[10px]">personal email</span>
                          ) : (
                            <div>
                              <div className="text-gray-700 text-[11px] truncate max-w-[110px] leading-tight font-medium">
                                {lead.company_name || lead.company_domain || '-'}
                              </div>
                              {(lead.industry || lead.employee_count) && (
                                <div className="text-gray-400 text-[9px] truncate max-w-[110px] leading-tight">
                                  {[lead.industry, lead.employee_count].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="max-w-[200px]">
                          <div className="text-gray-600 text-[11px] truncate" title={lead.content_name}>
                            {lead.content_name || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="text-gray-500 text-[10px]">
                            {lead.utm_source || '-'}
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="font-cyber text-[12px] text-gray-800">{lead.total_score}</span>
                        </td>
                        <td className="text-center">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-cyber font-bold rounded ${tierClass}`}>
                            {lead.signal_tier}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-[9px] font-semibold uppercase ${displayStatus.class}`}>
                              {displayStatus.label}
                            </span>
                            {lead.action_status === 'rejected' && shortReason && (
                              <span className="text-[8px] text-gray-400 truncate max-w-[60px]" title={lead.rejection_reason || ''}>
                                {shortReason}
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

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-cyber text-lg text-neon-cyan tracking-wider">METRICS & DEFINITIONS</h2>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              {/* Scoring */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-neon-purple" /> Scoring (0-220)
                </h3>
                <p className="text-gray-600 mb-2">
                  <strong>Not Salesforce scoring.</strong> This is ICP Fit scoring based on:
                </p>
                <ul className="list-disc list-inside text-gray-500 space-y-1 ml-2">
                  <li><strong>ICP Fit (0-100):</strong> Company size, age, industry, tech stack, multi-entity structure</li>
                  <li><strong>Why Now (0-80):</strong> Executive changes, M&A, layoffs, transformation signals</li>
                  <li><strong>Intent (0-40):</strong> Website engagement, 3rd party intent data (G2, Lusha)</li>
                </ul>
                <p className="text-gray-500 mt-2 text-xs">
                  Higher score = better fit for Keboola Financial Intelligence. Gated content alone gives ~10-20 intent points.
                </p>
              </div>

              {/* Tiers */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-neon-magenta" /> Priority Tiers (P0-P3)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p0">P0</span>
                    <span className="text-gray-600">Immediate action - Total ≥150 AND ICP ≥60 AND WhyNow ≥30. Typically requires multiple strong signals.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p1">P1</span>
                    <span className="text-gray-600">High priority - Total ≥100 OR (ICP ≥70 AND WhyNow ≥20). Good ICP fit with some buying signals.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p2">P2</span>
                    <span className="text-gray-600">Standard follow-up - Total ≥60. Moderate fit, worth nurturing.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p3">P3</span>
                    <span className="text-gray-600">Nurture only - Total &lt;60. Low fit or insufficient data. Most gated content downloads start here.</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neon-cyan" /> Lead Status (Synced with GTM App)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-neon-cyan font-semibold text-xs w-20">NEW</span>
                    <span className="text-gray-600">Fresh lead in Inbox, not yet reviewed. <strong>No action needed</strong> - GTM team will triage.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-orange font-semibold text-xs w-20">WORKING</span>
                    <span className="text-gray-600">Sales is actively researching/qualifying this lead in GTM app.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-purple font-semibold text-xs w-20">RESEARCH</span>
                    <span className="text-gray-600">AI research in progress (Apollo + Lusha + Gemini enrichment).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-green font-semibold text-xs w-20">ACCEPTED</span>
                    <span className="text-gray-600">Moved to Discovery account or TAL in GTM app. This is a <strong>qualified lead</strong>!</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-green font-semibold text-xs w-20">MERGED</span>
                    <span className="text-gray-600">Auto-linked to existing account (same company already in pipeline).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 font-semibold text-xs w-20">REJECTED</span>
                    <span className="text-gray-600">Disqualified with reason shown. Common reasons: Not ICP, Customer, Competitor, Personal Email, Partner.</span>
                  </div>
                </div>
              </div>

              {/* Content Types */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-cyan" /> Signal Types
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-200">Demo</span>
                    <span className="text-gray-500">Demo request - highest intent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 border border-cyan-200">Gated</span>
                    <span className="text-gray-500">Content download (ebook, etc)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">Webinar</span>
                    <span className="text-gray-500">Webinar registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">Event</span>
                    <span className="text-gray-500">Event registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Contact</span>
                    <span className="text-gray-500">Contact form</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">Newsletter</span>
                    <span className="text-gray-500">Newsletter signup</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                Questions? Contact <a href="mailto:martin.lepka@keboola.com" className="text-neon-cyan hover:underline">martin.lepka@keboola.com</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
