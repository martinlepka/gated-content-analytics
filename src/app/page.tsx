'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData, Lead, SIGNAL_TYPE_LABELS } from '@/lib/supabase'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'
import { LeadMQLFunnel } from '@/components/dashboard/LeadMQLFunnel'
import { Search, ChevronDown, ChevronUp, Zap, Activity, Target, Brain, Users, TrendingUp, HelpCircle, X, FileText, Building2, Info, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'

const TIME_FILTERS = [
  { value: '7', label: '7D' },
  { value: '14', label: '14D' },
  { value: '30', label: '30D' },
  { value: 'all', label: 'ALL' },
  { value: 'custom', label: 'Custom' },
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
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [preMqlFilter, setPreMqlFilter] = useState<'all' | 'preMql' | 'mql' | 'lead'>('all')

  // Dropdown open states for multiselect
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setTierDropdownOpen(false)
        setStatusDropdownOpen(false)
        setSourceDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  const [contentFilter, setContentFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Help panel
  const [showHelp, setShowHelp] = useState(false)
  const [showScoringInfo, setShowScoringInfo] = useState(false)

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

  // ============================================================
  // PRE-MQL DETECTION HELPER
  // ============================================================
  // Must match criteria in LeadMQLFunnel.tsx and LeadDetailModal.tsx
  // Pre-MQL = actionable lead with MQL potential (excludes rejected/spam)
  const isPreMql = (lead: Lead): boolean => {
    // EXCLUDE rejected leads
    if (lead.action_status === 'rejected') return false
    // EXCLUDE done leads that are NOT MQL
    if (lead.action_status === 'done' && !lead.rejection_reason?.includes('auto_linked')) return false

    // 1. High tier
    if (lead.signal_tier === 'P0' || lead.signal_tier === 'P1') return true
    // 2. High persona score
    if ((lead.persona_score || 0) >= 18) return true
    // 3. High intent score
    if ((lead.intent_score || 0) >= 20) return true
    // 4. Company signals
    const transformationSignals = lead.ai_research?.company?.transformation_signals || {}
    const whyNowSignals = lead.ai_research?.company?.why_now_signals || {}
    const hasTransformationSignal = Object.values(transformationSignals).some(v => v === true)
    const hasWhyNowSignal = Object.values(whyNowSignals).some(v => v === true)
    if (hasTransformationSignal || hasWhyNowSignal) return true
    // 5. Good ICP + intent
    if ((lead.icp_fit_score || 0) >= 40 && (lead.intent_score || 0) >= 12) return true
    return false
  }

  const isMql = (lead: Lead): boolean => {
    // MQL = accepted to Discovery/TAL (must pass Pre-MQL criteria check without exclusions)
    if (lead.action_status !== 'done' || !lead.rejection_reason?.includes('auto_linked')) return false
    // Check if meets any Pre-MQL criteria (without status exclusions since MQL is done+auto_linked)
    if (lead.signal_tier === 'P0' || lead.signal_tier === 'P1') return true
    if ((lead.persona_score || 0) >= 18) return true
    if ((lead.intent_score || 0) >= 20) return true
    const transformationSignals = lead.ai_research?.company?.transformation_signals || {}
    const whyNowSignals = lead.ai_research?.company?.why_now_signals || {}
    if (Object.values(transformationSignals).some(v => v === true)) return true
    if (Object.values(whyNowSignals).some(v => v === true)) return true
    if ((lead.icp_fit_score || 0) >= 40 && (lead.intent_score || 0) >= 12) return true
    return false
  }

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      // Date filtering
      if (timeFilter === 'custom') {
        // Custom date range
        const leadDate = parseISO(lead.inbox_entered_at)
        if (dateFrom) {
          const fromDate = parseISO(dateFrom)
          if (!isAfter(leadDate, fromDate) && leadDate.toDateString() !== fromDate.toDateString()) return false
        }
        if (dateTo) {
          const toDate = parseISO(dateTo + 'T23:59:59')
          if (isAfter(leadDate, toDate)) return false
        }
      } else if (timeFilter !== 'all') {
        // Preset filters (7, 14, 30 days)
        const days = parseInt(timeFilter)
        const cutoff = subDays(new Date(), days)
        if (!isAfter(parseISO(lead.inbox_entered_at), cutoff)) return false
      }
      if (tierFilter.length > 0 && !tierFilter.includes(lead.signal_tier)) return false
      if (sourceFilter.length > 0 && !sourceFilter.includes(lead.utm_source || '')) return false
      if (statusFilter.length > 0 && !statusFilter.includes(lead.action_status)) return false
      if (contentFilter && lead.content_name !== contentFilter) return false
      // Pre-MQL filter
      if (preMqlFilter === 'preMql' && !isPreMql(lead)) return false
      if (preMqlFilter === 'mql' && !isMql(lead)) return false
      if (preMqlFilter === 'lead' && isPreMql(lead)) return false
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
  }, [leads, timeFilter, dateFrom, dateTo, tierFilter, sourceFilter, statusFilter, contentFilter, searchQuery, sortColumn, sortDirection, preMqlFilter])

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
        {/* Charts Row with Funnel */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="cyber-card p-4">
            <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">SIGNAL TREND [30D]</div>
            <TrendChart data={trend} />
          </div>
          <LeadMQLFunnel leads={filteredLeads} contentFilter={contentFilter || undefined} onLeadClick={setSelectedLead} />
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
          <div className="flex items-center gap-2">
            <div className="flex">
              {TIME_FILTERS.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => {
                    setTimeFilter(tf.value)
                    if (tf.value !== 'custom') {
                      setDateFrom('')
                      setDateTo('')
                    }
                  }}
                  className={`cyber-toggle ${timeFilter === tf.value ? 'active' : ''}`}
                >
                  {tf.value === 'custom' ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {tf.label}
                    </span>
                  ) : tf.label}
                </button>
              ))}
            </div>

            {/* Date Range Inputs */}
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="cyber-input px-2 py-1 text-[10px] w-[110px]"
                  placeholder="From"
                />
                <span className="text-gray-400 text-xs">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="cyber-input px-2 py-1 text-[10px] w-[110px]"
                  placeholder="To"
                />
              </div>
            )}
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

          {/* Tier - Multiselect */}
          <div className="relative" data-dropdown>
            <button
              className="cyber-select pr-7 text-left flex items-center gap-1"
              onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
            >
              {tierFilter.length === 0 ? 'All Tiers' : tierFilter.join(', ')}
            </button>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            {tierDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                {['P0', 'P1', 'P2', 'P3'].map(tier => (
                  <label key={tier} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={tierFilter.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTierFilter([...tierFilter, tier])
                        } else {
                          setTierFilter(tierFilter.filter(t => t !== tier))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className={`font-bold ${tier === 'P0' ? 'text-red-600' : tier === 'P1' ? 'text-orange-600' : tier === 'P2' ? 'text-yellow-600' : 'text-gray-500'}`}>{tier}</span>
                  </label>
                ))}
                {tierFilter.length > 0 && (
                  <button
                    onClick={() => setTierFilter([])}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-t"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
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

          {/* Source - Multiselect */}
          {sources.length > 0 && (
            <div className="relative" data-dropdown>
              <button
                className="cyber-select pr-7 text-left"
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
              >
                {sourceFilter.length === 0 ? 'All Sources' : `${sourceFilter.length} selected`}
              </button>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              {sourceDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] max-h-[200px] overflow-y-auto">
                  {sources.map(source => (
                    <label key={source} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={sourceFilter.includes(source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSourceFilter([...sourceFilter, source])
                          } else {
                            setSourceFilter(sourceFilter.filter(s => s !== source))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">{source}</span>
                    </label>
                  ))}
                  {sourceFilter.length > 0 && (
                    <button
                      onClick={() => setSourceFilter([])}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-t"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status - Multiselect */}
          <div className="relative" data-dropdown>
            <button
              className="cyber-select pr-7 text-left"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              {statusFilter.length === 0 ? 'All Status' : `${statusFilter.length} selected`}
            </button>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                {[
                  { value: 'new', label: 'New', color: 'text-cyan-600' },
                  { value: 'working', label: 'Working', color: 'text-orange-600' },
                  { value: 'researching', label: 'Researching', color: 'text-purple-600' },
                  { value: 'done', label: 'Accepted/Done', color: 'text-emerald-600' },
                  { value: 'rejected', label: 'Rejected', color: 'text-red-600' },
                ].map(status => (
                  <label key={status.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status.value])
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status.value))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className={status.color}>{status.label}</span>
                  </label>
                ))}
                {statusFilter.length > 0 && (
                  <button
                    onClick={() => setStatusFilter([])}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-t"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pre-MQL Filter */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[9px] text-gray-500 mr-1">Funnel:</span>
            <div className="flex">
              <button
                onClick={() => setPreMqlFilter('all')}
                className={`cyber-toggle ${preMqlFilter === 'all' ? 'active' : ''}`}
              >
                All
              </button>
              <button
                onClick={() => setPreMqlFilter('preMql')}
                className={`cyber-toggle ${preMqlFilter === 'preMql' ? 'active bg-amber-100' : ''}`}
              >
                Pre-MQL
              </button>
              <button
                onClick={() => setPreMqlFilter('mql')}
                className={`cyber-toggle ${preMqlFilter === 'mql' ? 'active bg-emerald-100' : ''}`}
              >
                MQL
              </button>
              <button
                onClick={() => setPreMqlFilter('lead')}
                className={`cyber-toggle ${preMqlFilter === 'lead' ? 'active' : ''}`}
              >
                Lead
              </button>
            </div>
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
                  <th className="text-center w-[70px]">
                    <span className="flex items-center justify-center gap-1">
                      <span className="cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('score')}>SCORE</span>
                      <SortIcon column="score" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowScoringInfo(true); }}
                        className="p-0.5 hover:bg-cyan-100 rounded text-gray-400 hover:text-neon-cyan"
                        title="How scoring works"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </span>
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
                        <td className="min-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <div className="min-w-0">
                              <div className="text-gray-800 text-[11px] leading-tight">
                                {lead.first_name || lead.last_name
                                  ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                  : lead.email?.split('@')[0]}
                              </div>
                              {lead.title && (
                                <div className="text-neon-purple text-[9px] leading-tight font-medium">
                                  {lead.title}
                                </div>
                              )}
                              <div className="text-gray-400 text-[9px] leading-tight break-all">
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
                        <td className="min-w-[140px]">
                          {isPersonal ? (
                            <span className="text-gray-400 italic text-[10px]">personal email</span>
                          ) : (
                            <div>
                              <div className="text-gray-700 text-[11px] leading-tight font-medium">
                                {lead.company_name || lead.company_domain || '-'}
                              </div>
                              {(lead.industry || lead.employee_count) && (
                                <div className="text-gray-400 text-[9px] leading-tight">
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
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-cyber font-bold rounded ${tierClass}`}>
                              {lead.signal_tier}
                            </span>
                            {isPreMql(lead) && !isMql(lead) && (
                              <span className="text-[7px] text-amber-600 font-semibold">PRE-MQL</span>
                            )}
                            {isMql(lead) && (
                              <span className="text-[7px] text-emerald-600 font-semibold">MQL</span>
                            )}
                          </div>
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
                  <li><strong>Persona (0-50):</strong> Job title fit (CFO=25, VP Finance=22, Controller=20, etc.) + tenure signals</li>
                  <li><strong>Intent (0-50):</strong> Website engagement, signal type, 3rd party intent (G2, Lusha)</li>
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

      {/* Scoring Info Modal */}
      {showScoringInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-cyber text-lg text-neon-cyan tracking-wider">ICP SCORING MODEL</h2>
              <button onClick={() => setShowScoringInfo(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Total Score */}
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg">
                <div className="text-lg font-bold text-gray-800 mb-2">Total Score: 0 - 220 points</div>
                <p className="text-gray-600">
                  This is <strong>NOT Salesforce scoring</strong>. It's our ICP (Ideal Customer Profile) fit score
                  that measures how well a lead matches our target customer profile.
                </p>
              </div>

              {/* Score Components */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Score Components</h3>
                <div className="space-y-3">
                  {/* ICP Fit */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-800">ICP Fit Score</span>
                      <span className="text-blue-600 font-mono">0 - 100 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Multi-entity structure</strong> (+25) - 5+ business entities</li>
                      <li>• <strong>Company age</strong> (+20) - 20+ years (legacy systems likely)</li>
                      <li>• <strong>Target industry</strong> (+20) - Manufacturing, Logistics, Retail, Hospitality</li>
                      <li>• <strong>Employee count</strong> (+15) - 200-5,000 employees (mid-market)</li>
                      <li>• <strong>Legacy tech stack</strong> (+20) - Oracle, SAP, AS400, QuickBooks</li>
                      <li>• <strong>High data maturity</strong> (-30) - Already has Snowflake, dbt (anti-ICP)</li>
                    </ul>
                  </div>

                  {/* Why Now */}
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-amber-800">Why Now Score</span>
                      <span className="text-amber-600 font-mono">0 - 80 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>New CFO/CIO hire</strong> (+25) - Executive change in last 90 days</li>
                      <li>• <strong>Business pressure</strong> (+15) - Layoffs, cost-cutting announced</li>
                      <li>• <strong>Growth signals</strong> (+10) - Expansion, new markets</li>
                      <li>• <strong>Transformation</strong> (+15) - Digital/data transformation initiative</li>
                      <li>• <strong>First data hire</strong> (+10) - Hiring data engineers for first time</li>
                      <li>• <strong>M&A activity</strong> (+10) - Merger, acquisition announced</li>
                    </ul>
                  </div>

                  {/* Intent */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-800">Intent Score</span>
                      <span className="text-green-600 font-mono">0 - 40 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Website engagement</strong> (+25) - Pricing page, multiple visits</li>
                      <li>• <strong>3rd party intent</strong> (+15) - G2, Lusha intent signals</li>
                      <li>• <strong>Email engagement</strong> (+5) - Opens, clicks on marketing emails</li>
                      <li>• <strong>Gated content</strong> (+10-20) - Downloaded ebook, whitepaper</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Priority Tiers */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Priority Tiers</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p0">P0</span>
                    <div>
                      <div className="font-medium text-gray-700">Immediate Action</div>
                      <div className="text-xs text-gray-500">Total ≥150 AND ICP ≥60 AND WhyNow ≥30</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p1">P1</span>
                    <div>
                      <div className="font-medium text-gray-700">High Priority</div>
                      <div className="text-xs text-gray-500">Total ≥100 OR (ICP ≥70 AND WhyNow ≥20)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p2">P2</span>
                    <div>
                      <div className="font-medium text-gray-700">Standard Follow-up</div>
                      <div className="text-xs text-gray-500">Total ≥60</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p3">P3</span>
                    <div>
                      <div className="font-medium text-gray-700">Nurture Only</div>
                      <div className="text-xs text-gray-500">Total &lt;60 - Low fit or insufficient data</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-xs">
                <strong>Note:</strong> Most gated content downloads start as P3 because we only have intent signal
                (they downloaded something) but limited ICP fit data until enrichment runs. Score improves after
                AI research adds company firmographics and transformation signals.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
