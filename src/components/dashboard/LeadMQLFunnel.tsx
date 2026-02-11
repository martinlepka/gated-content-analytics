'use client'

/**
 * Script: LeadMQLFunnel.tsx
 * Description: Compact funnel visualization showing Lead -> MQL progression
 * Project: Gated Content Analytics
 * Author: MartinL
 * Created: 2026-02-11
 */

import { useMemo, useState } from 'react'
import { Lead } from '@/lib/supabase'
import { TrendingUp, X, ChevronRight } from 'lucide-react'

interface LeadMQLFunnelProps {
  leads: Lead[]
  contentFilter?: string
}

export function LeadMQLFunnel({ leads, contentFilter }: LeadMQLFunnelProps) {
  const [showModal, setShowModal] = useState(false)

  const stats = useMemo(() => {
    const filteredLeads = contentFilter
      ? leads.filter(l => l.content_name === contentFilter)
      : leads

    const total = filteredLeads.length

    // Status breakdown
    const newLeads = filteredLeads.filter(l => l.action_status === 'new')
    const working = filteredLeads.filter(l => l.action_status === 'working' || l.action_status === 'researching')
    const rejected = filteredLeads.filter(l => l.action_status === 'rejected')

    // Pre-MQL = 2+ combined signals (person + company) - shows buying intent
    // MQL = Pre-MQL + accepted to Discovery/TAL in GTM app
    const preMqls = filteredLeads.filter(l => {
      // Count person-level signals
      const signalHistory = l.context_for_outreach?.signal_history || []
      const personSignalCount = Array.isArray(signalHistory) ? signalHistory.length : 0

      // Count company-level buying signals
      const transformationSignals = l.ai_research?.company?.transformation_signals || {}
      const whyNowSignals = l.ai_research?.company?.why_now_signals || {}
      const hasTransformationSignal = Object.values(transformationSignals).some(v => v === true)
      const hasWhyNowSignal = Object.values(whyNowSignals).some(v => v === true)
      const companySignalCount = (hasTransformationSignal ? 1 : 0) + (hasWhyNowSignal ? 1 : 0)

      // Total signals = person + company (1 download counts as 1)
      const totalSignals = Math.max(personSignalCount, 1) + companySignalCount
      return totalSignals >= 2
    })

    // MQL = Pre-MQL that has been accepted to Discovery/TAL
    const mqls = preMqls.filter(l =>
      l.action_status === 'done' &&
      l.rejection_reason?.includes('auto_linked')
    )

    // Quality breakdown
    const p0 = filteredLeads.filter(l => l.signal_tier === 'P0')
    const p1 = filteredLeads.filter(l => l.signal_tier === 'P1')

    return {
      total,
      newLeads,
      working,
      rejected,
      preMqls,
      mqls,
      p0,
      p1,
      preMqlRate: total > 0 ? ((preMqls.length / total) * 100).toFixed(1) : '0',
      mqlRate: preMqls.length > 0 ? ((mqls.length / preMqls.length) * 100).toFixed(0) : '0',
      qualityRate: total > 0 ? (((p0.length + p1.length) / total) * 100).toFixed(0) : '0',
    }
  }, [leads, contentFilter])

  return (
    <>
      <div
        className="cyber-card p-4 cursor-pointer hover:border-neon-cyan/50 transition-colors h-full"
        onClick={() => setShowModal(true)}
      >
        <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">LEAD → PRE-MQL → MQL</div>

        {/* Compact Funnel */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {/* Leads */}
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-[8px] text-gray-500 uppercase">Leads</div>
          </div>

          <ChevronRight className="w-3 h-3 text-gray-300" />

          {/* Pre-MQLs */}
          <div className="text-center">
            <div className="text-xl font-bold text-amber-600">{stats.preMqls.length}</div>
            <div className="text-[8px] text-gray-500 uppercase">Pre-MQL</div>
          </div>

          <ChevronRight className="w-3 h-3 text-gray-300" />

          {/* MQLs */}
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-600">{stats.mqls.length}</div>
            <div className="text-[8px] text-gray-500 uppercase">MQL</div>
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="flex justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full">
            <span className="text-[9px] text-amber-700">{stats.preMqlRate}% Pre-MQL</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
            <span className="text-[9px] text-emerald-700">{stats.mqlRate}% MQL</span>
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className="h-2 rounded-full overflow-hidden bg-gray-100 mb-2">
          <div className="h-full flex">
            <div
              style={{ width: `${((stats.total - stats.preMqls.length) / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-gray-300"
              title="Leads (not Pre-MQL)"
            />
            <div
              style={{ width: `${((stats.preMqls.length - stats.mqls.length) / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-amber-400"
              title="Pre-MQL (not yet MQL)"
            />
            <div
              style={{ width: `${(stats.mqls.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-emerald-500"
              title="MQL"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-gray-300" />
            <span className="text-gray-500">Lead {stats.total - stats.preMqls.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-gray-500">Pre-MQL {stats.preMqls.length - stats.mqls.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="text-gray-500">MQL {stats.mqls.length}</span>
          </div>
        </div>

        <div className="text-[8px] text-gray-400 text-center mt-2">Click for details</div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-cyber text-lg text-neon-cyan tracking-wider">LEAD → MQL BREAKDOWN</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary - Funnel */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                  <div className="text-xs text-indigo-700">Leads</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.preMqls.length}</div>
                  <div className="text-xs text-amber-700">Pre-MQL</div>
                  <div className="text-[10px] text-amber-600">{stats.preMqlRate}%</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.mqls.length}</div>
                  <div className="text-xs text-emerald-700">MQL</div>
                  <div className="text-[10px] text-emerald-600">{stats.mqlRate}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.preMqls.length - stats.mqls.length}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                  <div className="text-[10px] text-gray-500">in GTM Inbox</div>
                </div>
              </div>

              {/* Funnel Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Funnel Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-gray-300" />
                      <span className="font-medium text-gray-700">Leads (single signal, no buying intent)</span>
                    </div>
                    <span className="font-bold text-gray-600">{stats.total - stats.preMqls.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-400" />
                      <span className="font-medium text-gray-700">Pre-MQL (2+ signals, pending review)</span>
                    </div>
                    <span className="font-bold text-amber-700">{stats.preMqls.length - stats.mqls.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="font-medium text-gray-700">MQL (accepted to Discovery/TAL)</span>
                    </div>
                    <span className="font-bold text-emerald-700">{stats.mqls.length}</span>
                  </div>
                </div>
              </div>

              {/* Quality Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Quality Breakdown (ICP Fit)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">P0 (Hot)</span>
                      <span className="font-bold text-pink-700">{stats.p0.length}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Score ≥150, ICP ≥60, WhyNow ≥30</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">P1 (Warm)</span>
                      <span className="font-bold text-purple-700">{stats.p1.length}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Score ≥100 or ICP ≥70</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  High Quality (P0+P1): <strong>{stats.p0.length + stats.p1.length}</strong> ({stats.qualityRate}%)
                </div>
              </div>

              {/* Definition */}
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 space-y-3">
                <div>
                  <strong className="text-amber-700">Pre-MQL</strong> = 2+ combined signals:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                    <li><strong>Person signals</strong> - downloads, webinar signups, form submissions</li>
                    <li><strong>Company signals</strong> - AI-detected transformation (data/digital/AI initiatives)</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-emerald-700">MQL</strong> = Pre-MQL <strong>+ accepted to Discovery/TAL</strong> in GTM app
                </div>
                <div className="text-xs text-blue-600 border-t border-blue-200 pt-2">
                  Example: 1 download + company "data transformation" = Pre-MQL → move to Discovery = MQL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
