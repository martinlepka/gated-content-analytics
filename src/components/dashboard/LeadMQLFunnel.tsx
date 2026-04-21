'use client'

/**
 * Script: LeadMQLFunnel.tsx
 * Description: Compact funnel visualization showing Lead -> MQL progression with lead lists
 * Project: Gated Content Analytics
 * Author: MartinL
 * Created: 2026-02-11
 */

import { useMemo, useState } from 'react'
import { Lead } from '@/lib/supabase'
import { buildTouchpointCounter, isPreMql, isMql } from '@/lib/mql-classification'
import { TrendingUp, X, ChevronRight, User, Building2, Zap, ExternalLink } from 'lucide-react'

interface LeadMQLFunnelProps {
  leads: Lead[]
  contentFilter?: string
  onLeadClick?: (lead: Lead) => void
}

export function LeadMQLFunnel({ leads, contentFilter, onLeadClick }: LeadMQLFunnelProps) {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'preMql' | 'mql'>('preMql')

  const stats = useMemo(() => {
    const filteredLeads = contentFilter
      ? leads.filter(l => l.content_name === contentFilter)
      : leads

    const total = filteredLeads.length

    // Weighted touchpoint model (see lib/mql-classification.ts) — counts across
    // the FULL unfiltered lead set so an email with a download and a webinar
    // reg on different days is counted correctly even when contentFilter is on.
    const touchpointCount = buildTouchpointCounter(leads)

    // Pre-MQL and MQL are DISJOINT classes (classifyLead returns one of
    // lead/pre_mql/mql/rejected). A lead can't be both Pre-MQL and MQL.
    const preMqls = filteredLeads.filter(l => isPreMql(l, touchpointCount(l.email)))
    const mqls = filteredLeads.filter(l => isMql(l, touchpointCount(l.email)))
    const rejected = filteredLeads.filter(l => l.action_status === 'rejected')
    const qualified = preMqls.length + mqls.length
    // Remaining "Lead" bucket: total - qualified - rejected (ICP or persona miss)
    const leadsBucket = Math.max(0, total - qualified - rejected.length)

    return {
      total,
      preMqls,
      mqls,
      rejected,
      qualified,
      leadsBucket,
      // Conversion rates — all relative to TOTAL so the %s compose cleanly:
      //   qualifiedRate = (Pre-MQL + MQL) / Total     "% that fit ICP+persona with ≥1 touchpoint"
      //   mqlRate       = MQL / Total                 "paid-campaign success metric"
      //   preMqlToMqlRate = MQL / (Pre-MQL + MQL)     "of qualified, how many came back"
      qualifiedRate: total > 0 ? ((qualified / total) * 100).toFixed(1) : '0',
      mqlRate: total > 0 ? ((mqls.length / total) * 100).toFixed(1) : '0',
      preMqlToMqlRate: qualified > 0 ? ((mqls.length / qualified) * 100).toFixed(0) : '0',
    }
  }, [leads, contentFilter])

  return (
    <>
      <div
        className="cyber-card p-4 cursor-pointer hover:border-neon-cyan/50 transition-colors h-full"
        onClick={() => setShowModal(true)}
      >
        <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">FUNNEL · TOTAL → QUALIFIED → MQL</div>

        {/* Compact Funnel — each count is DISJOINT (lead can't be both Pre-MQL and MQL) */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-[8px] text-gray-500 uppercase">Total</div>
          </div>

          <ChevronRight className="w-3 h-3 text-gray-300" />

          <div className="text-center">
            <div className="text-xl font-bold text-amber-600">{stats.preMqls.length}</div>
            <div className="text-[8px] text-gray-500 uppercase">Pre-MQL</div>
          </div>

          <ChevronRight className="w-3 h-3 text-gray-300" />

          <div className="text-center">
            <div className="text-xl font-bold text-emerald-600">{stats.mqls.length}</div>
            <div className="text-[8px] text-gray-500 uppercase">MQL</div>
          </div>
        </div>

        {/* Conversion Rates — both relative to TOTAL for clean composition */}
        <div className="flex justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full">
            <span className="text-[9px] text-amber-700">{stats.qualifiedRate}% qualified</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
            <span className="text-[9px] text-emerald-700">{stats.mqlRate}% MQL</span>
          </span>
        </div>

        {/* Progress Bar — disjoint buckets */}
        <div className="h-2 rounded-full overflow-hidden bg-gray-100 mb-2">
          <div className="h-full flex">
            <div
              style={{ width: `${(stats.leadsBucket / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-gray-300"
              title="Unqualified — ICP fit or finance persona missing"
            />
            <div
              style={{ width: `${(stats.preMqls.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-amber-400"
              title="Pre-MQL — ICP + finance persona + 1 touchpoint"
            />
            <div
              style={{ width: `${(stats.mqls.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-emerald-500"
              title="MQL — ICP + finance persona + 2 or more touchpoints"
            />
            <div
              style={{ width: `${(stats.rejected.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-red-300"
              title="Rejected — disqualified (not ICP, customer, competitor, etc.)"
            />
          </div>
        </div>

        {/* Legend — all 4 disjoint buckets sum to Total */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-gray-300" />
            <span className="text-gray-500">Unqualified {stats.leadsBucket}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-gray-500">Pre-MQL {stats.preMqls.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="text-gray-500">MQL {stats.mqls.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-red-300" />
            <span className="text-gray-500">Rejected {stats.rejected.length}</span>
          </div>
        </div>

        <div className="text-[8px] text-gray-400 text-center mt-2">Click for details</div>
      </div>

      {/* Detail Modal with Lead Lists */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-cyber text-lg text-neon-cyan tracking-wider">LEAD → MQL BREAKDOWN</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Definitions — visible by default so users understand numbers they're about to see */}
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 space-y-1.5">
                <div className="font-semibold text-blue-800 mb-1.5">How the funnel works</div>
                <div>
                  <strong className="text-gray-700">Total</strong> — every Webflow / FI Assessment / RB2B download or submission recorded.
                </div>
                <div>
                  <strong className="text-gray-500">Unqualified</strong> — doesn&apos;t fit ICP (company size + industry) OR isn&apos;t a finance leader. Most gated-content traffic lands here and that&apos;s fine — nurture.
                </div>
                <div>
                  <strong className="text-amber-700">Pre-MQL</strong> — ICP ✓ + finance persona ✓ + exactly <strong>1</strong> qualifying touchpoint. Warm but not yet a campaign win.
                </div>
                <div>
                  <strong className="text-emerald-700">MQL</strong> — ICP ✓ + finance persona ✓ + <strong>2 or more</strong> qualifying touchpoints. Matches Team Outreach&apos;s 2.0-weighted inbound threshold so the two apps agree.
                </div>
                <div className="text-[10px] text-blue-700 pl-1">
                  <strong>Qualifying touchpoints:</strong> ebook / webinar / event reg / demo request, FI Assessment completion or shared report, RB2B direct-person visit, <strong>or a click on a link in any outreach email from us</strong>. Dedup: same signal + same day = 1 touchpoint. Newsletter / popup / contact form / account-level RB2B don&apos;t count.
                </div>
                <div>
                  <strong className="text-red-600">Rejected</strong> — disqualified (not ICP, existing customer, competitor, personal email, partner).
                </div>
              </div>

              {/* Summary — 4 disjoint buckets that sum to Total */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                  <div className="text-xs text-indigo-700">Total</div>
                  <div className="text-[10px] text-indigo-500">downloads</div>
                </div>
                <button
                  onClick={() => setActiveTab('preMql')}
                  className={`p-3 rounded-lg text-center transition-all ${
                    activeTab === 'preMql'
                      ? 'bg-amber-200 ring-2 ring-amber-400'
                      : 'bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <div className="text-2xl font-bold text-amber-600">{stats.preMqls.length}</div>
                  <div className="text-xs text-amber-700">Pre-MQL</div>
                  <div className="text-[10px] text-amber-600">{stats.qualifiedRate}% qualified</div>
                </button>
                <button
                  onClick={() => setActiveTab('mql')}
                  className={`p-3 rounded-lg text-center transition-all ${
                    activeTab === 'mql'
                      ? 'bg-emerald-200 ring-2 ring-emerald-400'
                      : 'bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <div className="text-2xl font-bold text-emerald-600">{stats.mqls.length}</div>
                  <div className="text-xs text-emerald-700">MQL</div>
                  <div className="text-[10px] text-emerald-600">{stats.mqlRate}% of total</div>
                </button>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-500">{stats.leadsBucket + stats.rejected.length}</div>
                  <div className="text-xs text-gray-600">Unqual. + Rej.</div>
                  <div className="text-[10px] text-gray-500">not working on these</div>
                </div>
              </div>

              {/* Secondary conversion stat */}
              <div className="text-[11px] text-gray-500 text-center">
                <strong>Pre-MQL → MQL conversion:</strong> {stats.preMqlToMqlRate}%
                <span className="ml-1">(of the {stats.qualified} qualified leads, {stats.mqls.length} returned for a 2nd touchpoint)</span>
              </div>

              {/* Lead Lists */}
              <div className="border rounded-lg overflow-hidden">
                <div className="flex border-b bg-gray-50">
                  <button
                    onClick={() => setActiveTab('preMql')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'preMql'
                        ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-500'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Pre-MQLs ({stats.preMqls.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('mql')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'mql'
                        ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    MQLs ({stats.mqls.length})
                  </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {activeTab === 'preMql' && (
                    <LeadList
                      leads={stats.preMqls}
                      emptyMessage="No Pre-MQLs yet — needs ICP fit + finance persona + 1 touchpoint."
                      onLeadClick={onLeadClick}
                      showSignals
                    />
                  )}
                  {activeTab === 'mql' && (
                    <LeadList
                      leads={stats.mqls}
                      emptyMessage="No MQLs yet — Pre-MQLs need a second touchpoint (ebook, webinar, demo) to convert."
                      onLeadClick={onLeadClick}
                      showSignals
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Helper component to display lead list
function LeadList({
  leads,
  emptyMessage,
  onLeadClick,
  showSignals
}: {
  leads: Lead[]
  emptyMessage: string
  onLeadClick?: (lead: Lead) => void
  showSignals?: boolean
}) {
  if (leads.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        {emptyMessage}
      </div>
    )
  }

  // Sort by total_score descending
  const sortedLeads = [...leads].sort((a, b) => (b.total_score || 0) - (a.total_score || 0))

  return (
    <div className="divide-y divide-gray-100">
      {sortedLeads.map((lead) => {
        // Calculate signal counts
        const signalHistory = lead.context_for_outreach?.signal_history || []
        const personSignalCount = Array.isArray(signalHistory) ? signalHistory.length : 0
        const transformationSignals = lead.ai_research?.company?.transformation_signals || {}
        const whyNowSignals = lead.ai_research?.company?.why_now_signals || {}
        const hasTransformationSignal = Object.values(transformationSignals).some(v => v === true)
        const hasWhyNowSignal = Object.values(whyNowSignals).some(v => v === true)
        const companySignalCount = (hasTransformationSignal ? 1 : 0) + (hasWhyNowSignal ? 1 : 0)
        const totalSignals = Math.max(personSignalCount, 1) + companySignalCount

        // Get specific signals for display
        const activeTransformationSignals = Object.entries(transformationSignals)
          .filter(([, v]) => v === true)
          .map(([k]) => k.replace(/_/g, ' '))
        const activeWhyNowSignals = Object.entries(whyNowSignals)
          .filter(([, v]) => v === true)
          .map(([k]) => k.replace(/_/g, ' '))

        return (
          <div
            key={lead.id}
            onClick={() => onLeadClick?.(lead)}
            className={`p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              onLeadClick ? 'cursor-pointer' : ''
            }`}
          >
            {/* Tier Badge */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              lead.signal_tier === 'P0' ? 'bg-pink-100 text-pink-700' :
              lead.signal_tier === 'P1' ? 'bg-purple-100 text-purple-700' :
              lead.signal_tier === 'P2' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {lead.signal_tier || 'P3'}
            </div>

            {/* Lead Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-800 truncate">
                  {lead.first_name} {lead.last_name}
                </span>
                {lead.title && (
                  <span className="text-xs text-gray-500 truncate">
                    {lead.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{lead.company_name || 'Unknown company'}</span>
                <span className="text-gray-300">•</span>
                <span>{lead.content_name}</span>
              </div>

              {/* Signal badges */}
              {showSignals && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {personSignalCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px]">
                      <Zap className="w-2 h-2" />
                      {personSignalCount} person
                    </span>
                  )}
                  {activeTransformationSignals.map((signal) => (
                    <span key={signal} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] capitalize">
                      {signal}
                    </span>
                  ))}
                  {activeWhyNowSignals.map((signal) => (
                    <span key={signal} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] capitalize">
                      {signal}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score & Action */}
            <div className="text-right flex items-center gap-2">
              <div>
                <div className="font-bold text-gray-800">{lead.total_score}</div>
                <div className="text-[10px] text-gray-500">{totalSignals} signals</div>
              </div>
              {onLeadClick && (
                <ExternalLink className="w-4 h-4 text-gray-300" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
