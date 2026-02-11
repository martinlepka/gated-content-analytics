'use client'

/**
 * Script: LeadMQLFunnel.tsx
 * Description: Funnel visualization showing Lead -> MQL progression with status breakdown
 * Project: Gated Content Analytics
 * Author: MartinL
 * Created: 2026-02-11
 */

import { useMemo } from 'react'
import { Lead } from '@/lib/supabase'
import { Users, Target, TrendingUp, XCircle, ArrowRight } from 'lucide-react'

interface LeadMQLFunnelProps {
  leads: Lead[]
  contentFilter?: string
}

export function LeadMQLFunnel({ leads, contentFilter }: LeadMQLFunnelProps) {
  const stats = useMemo(() => {
    // Filter by content if specified
    const filteredLeads = contentFilter
      ? leads.filter(l => l.content_name === contentFilter)
      : leads

    const total = filteredLeads.length

    // Status breakdown
    const newLeads = filteredLeads.filter(l => l.action_status === 'new').length
    const working = filteredLeads.filter(l => l.action_status === 'working' || l.action_status === 'researching').length
    const rejected = filteredLeads.filter(l => l.action_status === 'rejected').length

    // MQL = accepted leads (done with auto_linked or no rejection reason)
    const mqls = filteredLeads.filter(l =>
      l.action_status === 'done' &&
      (l.rejection_reason?.includes('auto_linked') || !l.rejection_reason)
    ).length

    // Quality breakdown
    const p0p1 = filteredLeads.filter(l => l.signal_tier === 'P0' || l.signal_tier === 'P1').length

    return {
      total,
      newLeads,
      working,
      rejected,
      mqls,
      p0p1,
      conversionRate: total > 0 ? ((mqls / total) * 100).toFixed(1) : '0',
      qualityRate: total > 0 ? ((p0p1 / total) * 100).toFixed(0) : '0',
    }
  }, [leads, contentFilter])

  return (
    <div className="cyber-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-neon-cyan" />
        <span className="font-cyber text-[10px] text-gray-500 tracking-wider">LEAD → MQL FUNNEL</span>
        {contentFilter && (
          <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] rounded-full">
            {contentFilter}
          </span>
        )}
      </div>

      {/* Funnel Visualization */}
      <div className="flex items-stretch gap-3">
        {/* LEADS Card */}
        <div
          className="flex-1 rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-[10px] font-semibold text-white/70 tracking-wider mb-1">TOTAL LEADS</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-white/60 mb-0.5">P0/P1</div>
              <div className="text-sm font-bold text-white/90">{stats.p0p1} ({stats.qualityRate}%)</div>
            </div>
          </div>

          {/* Status Progress Bar */}
          {stats.total > 0 && (
            <>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-black/20 mb-2">
                <div
                  style={{ width: `${(stats.newLeads / stats.total) * 100}%` }}
                  className="bg-white/40"
                  title={`New: ${stats.newLeads}`}
                />
                <div
                  style={{ width: `${(stats.working / stats.total) * 100}%` }}
                  className="bg-amber-400"
                  title={`Working: ${stats.working}`}
                />
                <div
                  style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
                  className="bg-red-400"
                  title={`Rejected: ${stats.rejected}`}
                />
                <div
                  style={{ width: `${(stats.mqls / stats.total) * 100}%` }}
                  className="bg-emerald-400"
                  title={`MQL: ${stats.mqls}`}
                />
              </div>

              {/* Legend */}
              <div className="flex justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-white/40" />
                  <span className="text-white/80">New <b>{stats.newLeads}</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-amber-400" />
                  <span className="text-white/80">Working <b>{stats.working}</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-red-400" />
                  <span className="text-white/80">Rejected <b>{stats.rejected}</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-emerald-400" />
                  <span className="text-white/80">MQL <b>{stats.mqls}</b></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <div className="flex flex-col items-center px-2">
            <ArrowRight className="w-5 h-5 text-gray-300" />
            <div className="text-[9px] text-gray-400 mt-1">{stats.conversionRate}%</div>
          </div>
        </div>

        {/* MQL Card */}
        <div
          className="w-40 rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div className="text-[10px] font-semibold text-white/70 tracking-wider mb-1">MQLs</div>
          <div className="text-3xl font-bold text-white mb-2">{stats.mqls}</div>
          <div className="text-[9px] text-white/70">
            Accepted to<br/>Discovery/TAL
          </div>
        </div>
      </div>
    </div>
  )
}
