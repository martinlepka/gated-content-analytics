'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { fetchGatedContentAPI, OverviewData, TrendData, Lead, SIGNAL_TYPE_LABELS } from '@/lib/supabase'
import { buildTouchpointCounter, isPreMql as isPreMqlClass, isMql as isMqlClass } from '@/lib/mql-classification'
import { TrendChart } from '@/components/charts/TrendChart'
import { PersonaBarChart } from '@/components/charts/PersonaBarChart'
import { LeadDetailModal } from '@/components/dashboard/LeadDetailModal'
import { LeadMQLFunnel } from '@/components/dashboard/LeadMQLFunnel'
import { Search, ChevronDown, ChevronUp, Zap, Activity, Target, Brain, Users, TrendingUp, HelpCircle, X, FileText, Building2, Info, Calendar, Download } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, subDays, isAfter } from 'date-fns'

// US state code → IANA timezone (best-effort for cold-calling).
// Multi-zone states (TX, FL, KY, TN, etc.) map to their majority zone.
const US_STATE_TZ: Record<string, string> = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix',
  AR: 'America/Chicago', CA: 'America/Los_Angeles', CO: 'America/Denver',
  CT: 'America/New_York', DE: 'America/New_York', DC: 'America/New_York',
  FL: 'America/New_York', GA: 'America/New_York', HI: 'Pacific/Honolulu',
  ID: 'America/Boise', IL: 'America/Chicago', IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago', KS: 'America/Chicago', KY: 'America/New_York',
  LA: 'America/Chicago', ME: 'America/New_York', MD: 'America/New_York',
  MA: 'America/New_York', MI: 'America/Detroit', MN: 'America/Chicago',
  MS: 'America/Chicago', MO: 'America/Chicago', MT: 'America/Denver',
  NE: 'America/Chicago', NV: 'America/Los_Angeles', NH: 'America/New_York',
  NJ: 'America/New_York', NM: 'America/Denver', NY: 'America/New_York',
  NC: 'America/New_York', ND: 'America/Chicago', OH: 'America/New_York',
  OK: 'America/Chicago', OR: 'America/Los_Angeles', PA: 'America/New_York',
  RI: 'America/New_York', SC: 'America/New_York', SD: 'America/Chicago',
  TN: 'America/Chicago', TX: 'America/Chicago', UT: 'America/Denver',
  VT: 'America/New_York', VA: 'America/New_York', WA: 'America/Los_Angeles',
  WV: 'America/New_York', WI: 'America/Chicago', WY: 'America/Denver',
  PR: 'America/Puerto_Rico',
}

// Country (name or ISO code) → primary IANA timezone.
const COUNTRY_TZ: Record<string, string> = {
  // North America
  US: 'America/New_York', USA: 'America/New_York', 'UNITED STATES': 'America/New_York',
  CA: 'America/Toronto', CAN: 'America/Toronto', CANADA: 'America/Toronto',
  MX: 'America/Mexico_City', MEX: 'America/Mexico_City', MEXICO: 'America/Mexico_City',
  // Europe
  GB: 'Europe/London', UK: 'Europe/London', 'UNITED KINGDOM': 'Europe/London', ENGLAND: 'Europe/London',
  IE: 'Europe/Dublin', IRELAND: 'Europe/Dublin',
  DE: 'Europe/Berlin', GERMANY: 'Europe/Berlin',
  FR: 'Europe/Paris', FRANCE: 'Europe/Paris',
  ES: 'Europe/Madrid', SPAIN: 'Europe/Madrid',
  IT: 'Europe/Rome', ITALY: 'Europe/Rome',
  NL: 'Europe/Amsterdam', NETHERLANDS: 'Europe/Amsterdam',
  BE: 'Europe/Brussels', BELGIUM: 'Europe/Brussels',
  CH: 'Europe/Zurich', SWITZERLAND: 'Europe/Zurich',
  AT: 'Europe/Vienna', AUSTRIA: 'Europe/Vienna',
  PL: 'Europe/Warsaw', POLAND: 'Europe/Warsaw',
  CZ: 'Europe/Prague', CZECHIA: 'Europe/Prague', 'CZECH REPUBLIC': 'Europe/Prague',
  SK: 'Europe/Bratislava', SLOVAKIA: 'Europe/Bratislava',
  HU: 'Europe/Budapest', HUNGARY: 'Europe/Budapest',
  RO: 'Europe/Bucharest', ROMANIA: 'Europe/Bucharest',
  BG: 'Europe/Sofia', BULGARIA: 'Europe/Sofia',
  GR: 'Europe/Athens', GREECE: 'Europe/Athens',
  PT: 'Europe/Lisbon', PORTUGAL: 'Europe/Lisbon',
  SE: 'Europe/Stockholm', SWEDEN: 'Europe/Stockholm',
  NO: 'Europe/Oslo', NORWAY: 'Europe/Oslo',
  DK: 'Europe/Copenhagen', DENMARK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki', FINLAND: 'Europe/Helsinki',
  IS: 'Atlantic/Reykjavik', ICELAND: 'Atlantic/Reykjavik',
  EE: 'Europe/Tallinn', ESTONIA: 'Europe/Tallinn',
  LV: 'Europe/Riga', LATVIA: 'Europe/Riga',
  LT: 'Europe/Vilnius', LITHUANIA: 'Europe/Vilnius',
  UA: 'Europe/Kyiv', UKRAINE: 'Europe/Kyiv',
  RU: 'Europe/Moscow', RUSSIA: 'Europe/Moscow',
  TR: 'Europe/Istanbul', TURKEY: 'Europe/Istanbul',
  HR: 'Europe/Zagreb', CROATIA: 'Europe/Zagreb',
  SI: 'Europe/Ljubljana', SLOVENIA: 'Europe/Ljubljana',
  RS: 'Europe/Belgrade', SERBIA: 'Europe/Belgrade',
  // APAC
  JP: 'Asia/Tokyo', JAPAN: 'Asia/Tokyo',
  CN: 'Asia/Shanghai', CHINA: 'Asia/Shanghai',
  HK: 'Asia/Hong_Kong', 'HONG KONG': 'Asia/Hong_Kong',
  TW: 'Asia/Taipei', TAIWAN: 'Asia/Taipei',
  KR: 'Asia/Seoul', 'SOUTH KOREA': 'Asia/Seoul',
  SG: 'Asia/Singapore', SINGAPORE: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur', MALAYSIA: 'Asia/Kuala_Lumpur',
  TH: 'Asia/Bangkok', THAILAND: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh', VIETNAM: 'Asia/Ho_Chi_Minh',
  PH: 'Asia/Manila', PHILIPPINES: 'Asia/Manila',
  ID: 'Asia/Jakarta', INDONESIA: 'Asia/Jakarta',
  IN: 'Asia/Kolkata', INDIA: 'Asia/Kolkata',
  PK: 'Asia/Karachi', PAKISTAN: 'Asia/Karachi',
  AU: 'Australia/Sydney', AUSTRALIA: 'Australia/Sydney',
  NZ: 'Pacific/Auckland', 'NEW ZEALAND': 'Pacific/Auckland',
  // Middle East
  IL: 'Asia/Jerusalem', ISRAEL: 'Asia/Jerusalem',
  AE: 'Asia/Dubai', UAE: 'Asia/Dubai', 'UNITED ARAB EMIRATES': 'Asia/Dubai',
  SA: 'Asia/Riyadh', 'SAUDI ARABIA': 'Asia/Riyadh',
  QA: 'Asia/Qatar', QATAR: 'Asia/Qatar',
  // South America
  BR: 'America/Sao_Paulo', BRAZIL: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires', ARGENTINA: 'America/Argentina/Buenos_Aires',
  CL: 'America/Santiago', CHILE: 'America/Santiago',
  CO: 'America/Bogota', COLOMBIA: 'America/Bogota',
  PE: 'America/Lima', PERU: 'America/Lima',
  // Africa
  ZA: 'Africa/Johannesburg', 'SOUTH AFRICA': 'Africa/Johannesburg',
  EG: 'Africa/Cairo', EGYPT: 'Africa/Cairo',
  NG: 'Africa/Lagos', NIGERIA: 'Africa/Lagos',
  KE: 'Africa/Nairobi', KENYA: 'Africa/Nairobi',
}

// Match common ", XX" or ", XX 12345" US-state suffixes inside hq_location strings.
const US_STATE_RE = /,\s*([A-Z]{2})(?:\s+\d{5}|\s*$|,)/

function deriveTimezone(country?: string | null, hqLocation?: string | null): string {
  // 1) US: prefer state-level zone if hq_location contains a state code.
  const c = (country || '').trim().toUpperCase()
  if (c === 'US' || c === 'USA' || c === 'UNITED STATES') {
    const m = hqLocation && hqLocation.toUpperCase().match(US_STATE_RE)
    if (m && US_STATE_TZ[m[1]]) return US_STATE_TZ[m[1]]
    return 'America/New_York' // fallback to ET
  }
  // 2) Country lookup by code or name (case-insensitive).
  if (c && COUNTRY_TZ[c]) return COUNTRY_TZ[c]
  // 3) Last resort: try to find any US state code in hq_location even when
  //    country is missing (Webflow form skipped country).
  if (hqLocation) {
    const m = hqLocation.toUpperCase().match(US_STATE_RE)
    if (m && US_STATE_TZ[m[1]]) return US_STATE_TZ[m[1]]
  }
  return ''
}

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
  // MQL / PRE-MQL CLASSIFICATION (Updated 2026-04-17)
  // ============================================================
  // Mirrors team-outreach/src/lib/inbound-scoring.ts weighted touchpoint
  // model. See /docs/MQL-SUCCESS-DEFINITION.md for full specification.
  //
  //   Lead    — ICP fit or finance persona missing (or rejected).
  //   Pre-MQL — ICP + finance persona + exactly 1 qualifying touchpoint.
  //   MQL     — ICP + finance persona + 2+ qualifying touchpoints.
  //
  // Touchpoints counted per email across the full lead set, deduped by
  // (signal_type, content, day). Sales acceptance is NOT part of the
  // definition — that's a downstream funnel metric, not campaign quality.
  // ============================================================
  const getTouchpointCount = useMemo(() => buildTouchpointCounter(leads), [leads])

  const isPreMql = (lead: Lead): boolean => isPreMqlClass(lead, getTouchpointCount(lead.email))
  const isMql = (lead: Lead): boolean => isMqlClass(lead, getTouchpointCount(lead.email))

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
      // Funnel filter — Pre-MQL and MQL are now mutually exclusive (1 vs 2+ touchpoints)
      if (preMqlFilter === 'preMql' && !isPreMql(lead)) return false
      if (preMqlFilter === 'mql' && !isMql(lead)) return false
      if (preMqlFilter === 'lead' && (isPreMql(lead) || isMql(lead))) return false
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

  const exportToCSV = () => {
    // Helper to safely escape a value for CSV
    const esc = (val: unknown): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      // Wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    // Map boolean signal object to comma-separated active signal names
    const activeSignals = (obj: Record<string, boolean | undefined> | undefined): string => {
      if (!obj) return ''
      return Object.entries(obj)
        .filter(([, v]) => v === true)
        .map(([k]) => k.replace(/_/g, ' '))
        .join('; ')
    }

    const headers = [
      'Lead ID',
      'Date',
      'Download Date',
      'Signal Type',
      'First Name',
      'Last Name',
      'Email',
      'Title',
      'Company',
      'Company Domain',
      'Industry',
      'Employee Count',
      'Total Score',
      'ICP Fit Score',
      'Why Now Score',
      'Intent Score',
      'Grade',
      'Tier',
      'Pre-MQL',
      'MQL',
      'Status',
      'Last Status Change Date',
      'Rejection Reason',
      'Content Downloaded',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Country',
      'Phone',
      'HQ Location',
      'Timezone',
      'In Salesforce',
      'Has AI Research',
      'Company Overview',
      'Transformation Signals',
      'Why Now Signals',
      'Tech Stack',
      'Finance Leaders',
      'Value Driver',
    ]

    const rows = filteredLeads.map(lead => {
      const context = lead.context_for_outreach
      const research = lead.ai_research
      const company = research?.company

      // Finance leaders: "Name (Title)" separated by semicolons
      const financeLeaders = research?.finance_leaders_found
        ?.map(l => `${l.name} (${l.title})`)
        .join('; ') || ''

      // Tech stack: flatten all categories
      const techStack = company?.tech_stack_categorized
        ? Object.values(company.tech_stack_categorized).flat().join('; ')
        : ''

      // Display status — CSV export matches UI terminology: all auto_linked
      // variants map to "accepted" (dedup-into-existing is still an acceptance).
      let displayStatus = lead.action_status
      if (lead.action_status === 'done') {
        if (lead.rejection_reason?.includes('auto_linked')) {
          displayStatus = 'accepted'
        }
      }

      const lastStatusChangeAt = lead.last_action_at || lead.rejected_at || lead.inbox_entered_at
      const isGatedContent = lead.trigger_signal_type === 'webflow_content_download'

      return [
        esc(lead.id),
        esc(format(parseISO(lead.inbox_entered_at), 'yyyy-MM-dd HH:mm')),
        esc(isGatedContent ? format(parseISO(lead.inbox_entered_at), 'yyyy-MM-dd HH:mm') : ''),
        esc(lead.signal_type_label || SIGNAL_TYPE_LABELS[lead.trigger_signal_type || ''] || lead.trigger_signal_type || ''),
        esc(lead.first_name),
        esc(lead.last_name),
        esc(lead.email),
        esc(lead.title),
        esc(lead.company_name),
        esc(lead.company_domain),
        esc(lead.industry),
        esc(lead.employee_count),
        esc(lead.total_score),
        esc(lead.icp_fit_score),
        esc(lead.persona_score),
        esc(lead.intent_score),
        esc(lead.lead_grade),
        esc(lead.signal_tier),
        esc(isPreMql(lead) ? 'Yes' : 'No'),
        esc(isMql(lead) ? 'Yes' : 'No'),
        esc(displayStatus),
        esc(format(parseISO(lastStatusChangeAt), 'yyyy-MM-dd HH:mm')),
        esc(lead.rejection_reason),
        esc(lead.content_name),
        esc(lead.utm_source || context?.utm_source),
        esc(context?.utm_medium),
        esc(lead.utm_campaign || context?.utm_campaign),
        esc(context?.country),
        esc(lead.phone),
        esc(lead.hq_location),
        esc(deriveTimezone(context?.country, lead.hq_location)),
        esc(lead.in_salesforce ? 'Yes' : 'No'),
        esc(lead.has_research ? 'Yes' : 'No'),
        esc(company?.overview),
        esc(activeSignals(company?.transformation_signals as Record<string, boolean | undefined>)),
        esc(activeSignals(company?.why_now_signals as Record<string, boolean | undefined>)),
        esc(techStack),
        esc(financeLeaders),
        esc(research?.recommended_value_driver?.driver),
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
            <span
              className="text-[9px] text-gray-500 mr-1"
              title="Funnel stage filter. Lead = ICP or finance persona missing. Pre-MQL = ICP + persona OK + 1 touchpoint. MQL = ICP + persona OK + 2+ touchpoints (campaign success metric). Matches Team Outreach inbound scoring."
            >
              Funnel:
            </span>
            <div className="flex">
              <button
                onClick={() => setPreMqlFilter('all')}
                className={`cyber-toggle ${preMqlFilter === 'all' ? 'active' : ''}`}
                title="Show every lead regardless of funnel stage."
              >
                All
              </button>
              <button
                onClick={() => setPreMqlFilter('preMql')}
                className={`cyber-toggle ${preMqlFilter === 'preMql' ? 'active bg-amber-100' : ''}`}
                title="Show only Pre-MQLs — ICP + finance persona fit but only 1 qualifying touchpoint."
              >
                Pre-MQL
              </button>
              <button
                onClick={() => setPreMqlFilter('mql')}
                className={`cyber-toggle ${preMqlFilter === 'mql' ? 'active bg-emerald-100' : ''}`}
                title="Show only MQLs — ICP + finance persona + 2 or more qualifying touchpoints. Paid-campaign success metric."
              >
                MQL
              </button>
              <button
                onClick={() => setPreMqlFilter('lead')}
                className={`cyber-toggle ${preMqlFilter === 'lead' ? 'active' : ''}`}
                title="Show only plain Leads — ICP or finance persona missing (or rejected). Excludes Pre-MQL and MQL."
              >
                Lead
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono">{filteredLeads.length} records</span>
            <button
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded hover:bg-neon-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={`Export ${filteredLeads.length} leads to CSV`}
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
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
                  <th
                    className="text-left w-[80px]"
                    title="Form type that created this lead (Gated Content, Demo Request, Newsletter, Webinar, Event, Contact, Popup). Assigned by the backend from Webflow form metadata. NOT the same as SOURCE — this is the pipeline label, SOURCE is the UTM from the URL."
                  >
                    TYPE
                  </th>
                  <th className="text-left cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('contact')}>
                    <span className="flex items-center gap-1">CONTACT <SortIcon column="contact" /></span>
                  </th>
                  <th className="text-left cursor-pointer hover:text-neon-cyan" onClick={() => handleSort('company')}>
                    <span className="flex items-center gap-1">COMPANY <SortIcon column="company" /></span>
                  </th>
                  <th className="text-left w-[200px] max-w-[200px]">CONTENT</th>
                  <th
                    className="text-left w-[70px] cursor-pointer hover:text-neon-cyan"
                    onClick={() => handleSort('source')}
                    title="UTM source from the landing-page URL (?utm_source=...). Shows which paid channel or campaign drove the click (e.g. 'facebook' = Facebook ad, 'customer.io' = email nurture, 'linkedin' = LinkedIn). NOT the form type — that is TYPE. Blank = direct/organic or UTM stripped."
                  >
                    <span className="flex items-center gap-1">SOURCE <SortIcon column="source" /></span>
                  </th>
                  <th
                    className="text-center w-[95px]"
                    title="Unified combined_score (0-320) from discovery_contacts — the single number used across GTM Inbox, Team Outreach, and this dashboard. Account total (ICP+WhyNow+Intent, 0-220) + contact_score (Persona+Engagement+FI, 0-100). Number is coloured by priority tier (P0>=220, P1>=140, P2>=80, P3<80). Legacy-fallback rows show a tiny ~ prefix. Click info for the full formula."
                  >
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
                  <th
                    className="text-center w-[65px] cursor-pointer hover:text-neon-cyan"
                    onClick={() => handleSort('status')}
                    title="Workflow state. NEW = fresh, unreviewed. RESEARCH = AI enrichment running. WORKING = sales reviewing. ACCEPTED = moved to Discovery/TAL (covers both new records and dedup-merge into existing accounts). REJECTED = disqualified (reason shown below). DONE = manually processed."
                  >
                    <span className="flex items-center justify-center gap-1">STATUS <SortIcon column="status" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 font-cyber text-xs">
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

                    // Determine display status based on action_status + rejection_reason.
                    // Note: auto_linked_existing (dedup) used to render as MERGED but is
                    // semantically an acceptance — the lead was processed, just linked
                    // to a pre-existing discovery account instead of creating a new one.
                    // Collapsing to ACCEPTED removes a confusing label from the UI while
                    // the underlying rejection_reason is preserved for analytics.
                    const getDisplayStatus = () => {
                      if (lead.action_status === 'done') {
                        if (lead.rejection_reason?.includes('auto_linked')) {
                          return { label: 'ACCEPTED', class: 'text-neon-green', bgClass: 'bg-green-100' }
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
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-flex items-baseline px-2 py-0.5 rounded font-cyber font-bold ${tierClass}`}
                              title={`combined_score ${lead.total_score} (priority ${lead.signal_tier})${lead.score_source === 'legacy' ? ' — legacy fallback, not yet linked to universe' : ''}`}
                            >
                              {lead.score_source === 'legacy' && (
                                <span className="text-[8px] opacity-70 mr-0.5">~</span>
                              )}
                              <span className="text-[12px] tabular-nums">{lead.total_score}</span>
                            </span>
                            {isPreMql(lead) && (
                              <span
                                className="text-[7px] text-amber-600 font-semibold"
                                title="Pre-MQL: company fits ICP firmographics (size + industry) AND person is a finance leader, but only 1 qualifying touchpoint so far. One more touchpoint (another download, webinar reg, demo request) and this becomes an MQL. Nurture-worthy, not yet a campaign success."
                              >
                                PRE-MQL
                              </span>
                            )}
                            {isMql(lead) && (
                              <span
                                className="text-[7px] text-emerald-600 font-semibold"
                                title="MQL: company fits ICP firmographics + person is a finance leader + 2 or more qualifying touchpoints with Keboola (same model as Team Outreach inbound scoring). THIS is the paid-campaign success metric."
                              >
                                MQL
                              </span>
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
        <LeadDetailModal lead={selectedLead} allLeads={leads} onClose={() => setSelectedLead(null)} />
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
                  <Brain className="w-4 h-4 text-neon-purple" /> Unified Scoring (0-320)
                </h3>
                <p className="text-gray-600 mb-2">
                  <strong>Same score as GTM Inbox &amp; Team Outreach</strong> (MKT-256). Sourced from{' '}
                  <code className="px-1 bg-gray-100 rounded text-[11px]">discovery_contacts.combined_score</code>{' '}
                  — the single universe-wide number:
                </p>
                <ul className="list-disc list-inside text-gray-500 space-y-1 ml-2">
                  <li><strong>Account total (0-220):</strong> ICP Fit (0-100) + Why Now (0-80) + Intent (0-40)</li>
                  <li><strong>Contact score (0-100):</strong> Persona (0-40) + Engagement (0-40, 90-day decay) + FI assessment (0-20)</li>
                  <li><strong>Combined = account + contact</strong> — persists on every contact, recalculated by signal-ingest</li>
                </ul>
                <p className="text-gray-500 mt-2 text-xs">
                  Older leads without a discovery link still show legacy 0-220 score with a <strong>legacy</strong> badge. Those get backfilled on their next signal.
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
                    <span className="text-gray-600">Call today. combined_score ≥ 220. Great ICP fit + clear &quot;why now&quot; + real engagement.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p1">P1</span>
                    <span className="text-gray-600">Contact this week. combined_score ≥ 140. Strong fit + signals.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p2">P2</span>
                    <span className="text-gray-600">Nurture. combined_score ≥ 80. Good fit, needs more signals.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded tier-p3">P3</span>
                    <span className="text-gray-600">Low priority. combined_score &lt; 80. Missing key criteria — most gated-content-only leads start here.</span>
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
                    <span className="text-gray-600">Moved to Discovery account or TAL in GTM app. This is a <strong>qualified lead</strong> — covers both brand-new records and dedup-merges into an existing account.</span>
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
              <h2 className="font-cyber text-lg text-neon-cyan tracking-wider">UNIFIED SCORING MODEL</h2>
              <button onClick={() => setShowScoringInfo(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Total Score */}
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg">
                <div className="text-lg font-bold text-gray-800 mb-2">combined_score: 0 - 320 points</div>
                <p className="text-gray-600">
                  One canonical number per contact (MKT-256 Unified Scoring). Stored on{' '}
                  <code className="px-1 bg-white/60 rounded text-[11px]">discovery_contacts</code> and read by{' '}
                  <strong>every app</strong>: GTM Inbox, Team Outreach, Genesis, FI Analytics, and this dashboard. No more divergent numbers.
                </p>
              </div>

              {/* Formula */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700">
                combined_score = account_total_score (0-220) + contact_score (0-100)
              </div>

              {/* Account Total */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Account Total (0-220)</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-800">ICP Fit Score</span>
                      <span className="text-blue-600 font-mono">0 - 100 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Multi-entity structure</strong> (+25) - 5+ entities / portfolio companies</li>
                      <li>• <strong>Company age</strong> (+20) - 20+ years (legacy systems likely)</li>
                      <li>• <strong>Target industry</strong> (+20) - Manufacturing, Logistics, Retail, Hospitality, Finance</li>
                      <li>• <strong>Employee count</strong> (+15) - 500-3,000 sweet spot</li>
                      <li>• <strong>Legacy tech stack</strong> (+20) - Multiple ERPs, Oracle/SAP/AS400</li>
                      <li>• <strong>High data maturity</strong> (-30) - Already has Snowflake/dbt (anti-ICP)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-amber-800">Why Now Score</span>
                      <span className="text-amber-600 font-mono">0 - 80 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>New CFO/CIO/CTO/CDO hire</strong> - Exec change in last 90 days</li>
                      <li>• <strong>Business pressure</strong> - Layoffs, cost cutting announced</li>
                      <li>• <strong>Growth signals</strong> - International expansion, new markets</li>
                      <li>• <strong>Transformation</strong> - ERP modernization, AI/data initiative</li>
                      <li>• <strong>First data hire</strong> - Hiring data engineers for first time</li>
                      <li>• <strong>M&amp;A activity</strong> - Merger, acquisition announced</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-800">Intent Score</span>
                      <span className="text-green-600 font-mono">0 - 40 pts</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Demo request</strong> (+25), <strong>pricing page visit</strong> (+20)</li>
                      <li>• <strong>Content download</strong> (+12), multiple page views (+8, +5 repeat)</li>
                      <li>• <strong>3rd party intent</strong> (+4-15) - G2, Lusha, Apollo</li>
                      <li>• <strong>Email click</strong> (+5)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact Score */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Contact Score (0-100)</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-purple-800">Persona</span>
                      <span className="text-purple-600 font-mono">0 - 40 pts</span>
                    </div>
                    <div className="text-xs text-gray-600 ml-4">
                      Title (0-25) + Seniority (0-10) + Department (0-5). CFO/Chief Financial = 25, VP/Head Finance = 22, Controller/FP&amp;A = 20, Finance Analyst = 18.
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-rose-800">Engagement</span>
                      <span className="text-rose-600 font-mono">0 - 40 pts</span>
                    </div>
                    <div className="text-xs text-gray-600 ml-4">
                      Touchpoint weights with <strong>90-day linear decay</strong>. Tier 1 (direct): 8.0/signal. Tier 2 (3rd party): 2.0/signal. Events &gt; 90 days are dropped.
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-teal-800">FI Assessment</span>
                      <span className="text-teal-600 font-mono">0 - 20 pts</span>
                    </div>
                    <div className="text-xs text-gray-600 ml-4">
                      leader=20 · established=16 · developing=12 · foundational=8 · starting=4. NULL if quiz not completed.
                    </div>
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
                      <div className="font-medium text-gray-700">Call today</div>
                      <div className="text-xs text-gray-500">combined_score ≥ 220</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p1">P1</span>
                    <div>
                      <div className="font-medium text-gray-700">Contact this week</div>
                      <div className="text-xs text-gray-500">combined_score ≥ 140</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p2">P2</span>
                    <div>
                      <div className="font-medium text-gray-700">Nurture</div>
                      <div className="text-xs text-gray-500">combined_score ≥ 80</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded tier-p3">P3</span>
                    <div>
                      <div className="font-medium text-gray-700">Low priority</div>
                      <div className="text-xs text-gray-500">combined_score &lt; 80 — missing key criteria</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legacy row note */}
              <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-xs">
                <strong>Legacy rows:</strong> ~17% of historical leads haven&apos;t been linked to the discovery universe yet. Those show the old 0-220 score with a <strong>legacy</strong> badge. They&apos;ll backfill to unified automatically on their next signal (form submission, RB2B visit, email click) once webflow-webhook routes through <code className="px-1 bg-white/60 rounded text-[11px]">signal-ingest</code>.
              </div>

              {/* Note */}
              <div className="p-4 bg-slate-50 rounded-lg text-slate-700 text-xs">
                <strong>Why most gated-content leads are P3:</strong> a single download contributes only a few engagement points. Score rises with repeat visits, pricing page hits, demo requests, or once AI research fills ICP-fit signals (industry, tech stack, why-now).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
