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

    // MQL = Marketing Qualified Lead requires 2+ combined signals:
    // - Person signals: signal_history entries (downloads, webinars, forms)
    // - Company signals: transformation_signals, why_now_signals from AI research
    // OR High quality (P0/P1) accepted to Discovery/TAL
    const mqls = filteredLeads.filter(l => {
      // Count person-level signals
      const signalHistory = l.context_for_outreach?.signal_history || []
      const personSignalCount = Array.isArray(signalHistory) ? signalHistory.length : 0

      // Count company-level buying signals
      const transformationSignals = l.ai_research?.company?.transformation_signals || {}
      const whyNowSignals = l.ai_research?.company?.why_now_signals || {}
      const hasTransformationSignal = Object.values(transformationSignals).some(v => v === true)
      const hasWhyNowSignal = Object.values(whyNowSignals).some(v => v === true)
      const companySignalCount = (hasTransformationSignal ? 1 : 0) + (hasWhyNowSignal ? 1 : 0)

      // Total signals = person + company
      const totalSignals = personSignalCount + companySignalCount
      const hasMultipleSignals = totalSignals >= 2

      // Alternative: High quality accepted
      const isHighQualityAccepted = ['P0', 'P1'].includes(l.signal_tier) &&
        l.action_status === 'done' &&
        l.rejection_reason?.includes('auto_linked')

      return hasMultipleSignals || isHighQualityAccepted
    })

    // Quality breakdown
    const p0 = filteredLeads.filter(l => l.signal_tier === 'P0')
    const p1 = filteredLeads.filter(l => l.signal_tier === 'P1')

    return {
      total,
      newLeads,
      working,
      rejected,
      mqls,
      p0,
      p1,
      conversionRate: total > 0 ? ((mqls.length / total) * 100).toFixed(1) : '0',
      qualityRate: total > 0 ? (((p0.length + p1.length) / total) * 100).toFixed(0) : '0',
    }
  }, [leads, contentFilter])

  return (
    <>
      <div
        className="cyber-card p-4 cursor-pointer hover:border-neon-cyan/50 transition-colors h-full"
        onClick={() => setShowModal(true)}
      >
        <div className="font-cyber text-[10px] text-gray-500 tracking-wider mb-3">LEAD → MQL FUNNEL</div>

        {/* Compact Funnel */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Leads */}
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-[9px] text-gray-500 uppercase">Leads</div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300" />

          {/* MQLs */}
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.mqls.length}</div>
            <div className="text-[9px] text-gray-500 uppercase">MQLs</div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="text-center mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">{stats.conversionRate}%</span>
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className="h-2 rounded-full overflow-hidden bg-gray-100 mb-2">
          <div className="h-full flex">
            <div
              style={{ width: `${(stats.newLeads.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-cyan-400"
            />
            <div
              style={{ width: `${(stats.working.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-amber-400"
            />
            <div
              style={{ width: `${(stats.rejected.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-red-400"
            />
            <div
              style={{ width: `${(stats.mqls.length / Math.max(stats.total, 1)) * 100}%` }}
              className="bg-emerald-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-cyan-400" />
            <span className="text-gray-500">New {stats.newLeads.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-gray-500">Working {stats.working.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-red-400" />
            <span className="text-gray-500">Rejected {stats.rejected.length}</span>
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
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
                  <div className="text-sm text-indigo-700">Total Leads</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-emerald-600">{stats.mqls.length}</div>
                  <div className="text-sm text-emerald-700">MQLs (Accepted)</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-700">{stats.conversionRate}%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Status Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-cyan-400" />
                      <span className="font-medium text-gray-700">New (Unreviewed)</span>
                    </div>
                    <span className="font-bold text-cyan-700">{stats.newLeads.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-amber-400" />
                      <span className="font-medium text-gray-700">Working / Researching</span>
                    </div>
                    <span className="font-bold text-amber-700">{stats.working.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-400" />
                      <span className="font-medium text-gray-700">Rejected</span>
                    </div>
                    <span className="font-bold text-red-700">{stats.rejected.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="font-medium text-gray-700">MQL (Accepted to Discovery/TAL)</span>
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
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>What is an MQL?</strong> A Marketing Qualified Lead requires 2+ combined signals:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Person signals</strong> - downloads, webinar signups, form submissions</li>
                  <li><strong>Company signals</strong> - AI-detected transformation or buying signals (new CFO, M&A, digital transformation)</li>
                </ul>
                <div className="mt-2 text-xs text-blue-600">
                  Example: 1 download + company has "data transformation" signal = MQL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
