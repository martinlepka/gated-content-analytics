'use client'

import { Lead, SIGNAL_TYPE_LABELS } from '@/lib/supabase'
import { X, Building2, User, Mail, Briefcase, ExternalLink, Brain, Globe, Sparkles, Target, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
}

const PERSONAL_EMAIL_DOMAINS = /gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me\.com|mac\.com|aol|protonmail/i

function getTierClass(tier: string): string {
  switch (tier) {
    case 'P0': return 'tier-p0'
    case 'P1': return 'tier-p1'
    case 'P2': return 'tier-p2'
    default: return 'tier-p3'
  }
}

export function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const research = lead.ai_research
  const context = lead.context_for_outreach
  const isPersonalEmail = PERSONAL_EMAIL_DOMAINS.test(lead.email || '')

  const getScoreColor = (score: number, max: number) => {
    const pct = score / max
    if (pct >= 0.7) return 'text-neon-green'
    if (pct >= 0.4) return 'text-neon-cyan'
    return 'text-gray-400'
  }

  const getStatusDisplay = () => {
    if (lead.action_status === 'done') {
      // Check rejection_reason for accepted leads
      if (lead.rejection_reason?.includes('auto_linked_to_discovery') ||
          lead.rejection_reason?.includes('auto_linked_to_tal')) {
        return { label: 'ACCEPTED', color: 'text-neon-green' }
      }
      if (lead.rejection_reason?.includes('auto_linked_existing')) {
        return { label: 'MERGED', color: 'text-neon-green' }
      }
      return { label: 'DONE', color: 'text-neon-green' }
    }
    if (lead.action_status === 'rejected') {
      return { label: 'REJECTED', color: 'text-red-500' }
    }
    if (lead.action_status === 'working') {
      return { label: 'WORKING', color: 'text-neon-orange' }
    }
    if (lead.action_status === 'researching') {
      return { label: 'RESEARCHING', color: 'text-neon-purple' }
    }
    return { label: 'NEW', color: 'text-neon-cyan' }
  }

  const status = getStatusDisplay()
  const signalLabel = lead.trigger_signal_type ? SIGNAL_TYPE_LABELS[lead.trigger_signal_type] || lead.trigger_signal_type : 'Unknown'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-12">
        <div className="cyber-modal relative w-full max-w-2xl max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 text-[10px] font-cyber font-bold tracking-wider rounded ${getTierClass(lead.signal_tier)}`}>
                  {lead.signal_tier}
                </span>
                <div>
                  <div className="font-cyber text-base text-gray-800 tracking-wide">
                    {lead.first_name || lead.last_name
                      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                      : lead.email?.split('@')[0]}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {lead.title || lead.detected_persona || 'Unknown'}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-5 space-y-4">
            {/* Score Bar - synced with GTM Inbox */}
            <div className="grid grid-cols-6 gap-2">
              <div className="cyber-stat p-3 text-center">
                <div className={`font-cyber text-xl font-bold ${getScoreColor(lead.total_score, 220)}`}>
                  {lead.total_score}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">TOTAL</div>
              </div>
              <div className="cyber-stat p-3 text-center">
                <div className={`font-cyber text-xl font-bold ${getScoreColor(lead.icp_fit_score, 100)}`}>
                  {lead.icp_fit_score}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">ICP FIT</div>
              </div>
              <div className="cyber-stat p-3 text-center">
                <div className={`font-cyber text-xl font-bold ${getScoreColor(lead.persona_score || 0, 50)}`}>
                  {lead.persona_score || 0}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">PERSONA</div>
              </div>
              <div className="cyber-stat p-3 text-center">
                <div className={`font-cyber text-xl font-bold ${getScoreColor(lead.intent_score, 40)}`}>
                  {lead.intent_score}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">INTENT</div>
              </div>
              <div className="cyber-stat p-3 text-center">
                <div className={`font-cyber text-xl font-bold ${status.color}`}>
                  {lead.lead_grade}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">GRADE</div>
              </div>
              <div className="cyber-stat p-3 text-center">
                <div className={`text-[11px] font-bold ${status.color}`}>
                  {status.label}
                </div>
                <div className="text-[9px] text-gray-500 tracking-wider">STATUS</div>
              </div>
            </div>

            {/* Rejection Reason */}
            {lead.action_status === 'rejected' && lead.rejection_reason && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-[10px] font-cyber text-red-600 tracking-wider">REJECTION REASON</span>
                </div>
                <div className="text-[12px] text-red-700 mt-1">{lead.rejection_reason.replace(/_/g, ' ')}</div>
              </div>
            )}

            {/* MQL Qualification Status */}
            {(() => {
              // ============================================================
              // PRE-MQL CRITERIA (Must match LeadMQLFunnel.tsx)
              // ============================================================
              // Pre-MQL requires ALL of:
              // 1. Known company
              // 2. Finance persona (>=18) OR P0/P1 tier
              // 3. ICP fit (>=30)
              // 4. Signal diversity (multi-touchpoint OR company signals)
              // ============================================================

              const transformationSignals = lead.ai_research?.company?.transformation_signals || {}
              const whyNowSignals = lead.ai_research?.company?.why_now_signals || {}
              const hasTransformationSignal = Object.values(transformationSignals).some(v => v === true)
              const hasWhyNowSignal = Object.values(whyNowSignals).some(v => v === true)

              // Check exclusions
              const isRejected = lead.action_status === 'rejected'
              const isDoneNotMql = lead.action_status === 'done' && !lead.rejection_reason?.includes('auto_linked')

              // Check each Pre-MQL criterion (ALL must be met)
              const signalHistory = lead.context_for_outreach?.signal_history || []
              const touchpointCount = Array.isArray(signalHistory) ? signalHistory.length : 0

              const criteria = {
                knownCompany: !!(lead.company_name && lead.company_name.trim() !== ''),
                financePersona: (lead.persona_score || 0) >= 18 || lead.signal_tier === 'P0' || lead.signal_tier === 'P1',
                icpFit: (lead.icp_fit_score || 0) >= 30,
                signalDiversity: touchpointCount >= 2 || hasTransformationSignal || hasWhyNowSignal || (lead.intent_score || 0) >= 20,
              }

              const allCriteriaMet = Object.values(criteria).every(v => v)
              const criteriaMetCount = Object.values(criteria).filter(v => v).length
              const isMql = allCriteriaMet && lead.action_status === 'done' && lead.rejection_reason?.includes('auto_linked')
              const isPreMql = allCriteriaMet && !isRejected && !isDoneNotMql && !isMql

              // Determine status label and styling
              let statusLabel = 'LEAD'
              let statusClass = 'bg-gray-200 text-gray-600'
              let borderClass = 'border-gray-200 bg-gray-50'

              if (isMql) {
                statusLabel = '✓ MQL'
                statusClass = 'bg-emerald-200 text-emerald-800'
                borderClass = 'border-emerald-300 bg-emerald-50'
              } else if (isRejected) {
                statusLabel = 'REJECTED'
                statusClass = 'bg-red-200 text-red-800'
                borderClass = 'border-red-200 bg-red-50'
              } else if (isDoneNotMql) {
                statusLabel = 'PROCESSED'
                statusClass = 'bg-gray-300 text-gray-700'
                borderClass = 'border-gray-300 bg-gray-100'
              } else if (isPreMql) {
                statusLabel = 'PRE-MQL'
                statusClass = 'bg-amber-200 text-amber-800'
                borderClass = 'border-amber-300 bg-amber-50'
              }

              return (
                <div className={`border rounded-lg p-3 ${borderClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-cyber tracking-wider text-gray-600">MQL QUALIFICATION</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Pre-MQL Criteria Checklist - ALL must be met */}
                  <div className="space-y-1 text-[10px]">
                    <div className={`flex items-center gap-2 ${criteria.knownCompany ? 'text-emerald-700' : 'text-red-500'}`}>
                      <span>{criteria.knownCompany ? '✓' : '✗'}</span>
                      <span>Known Company</span>
                      {criteria.knownCompany && <span className="text-emerald-600 font-medium truncate max-w-[120px]">({lead.company_name})</span>}
                      {!criteria.knownCompany && <span className="text-red-500 font-medium">(missing)</span>}
                    </div>
                    <div className={`flex items-center gap-2 ${criteria.financePersona ? 'text-emerald-700' : 'text-red-500'}`}>
                      <span>{criteria.financePersona ? '✓' : '✗'}</span>
                      <span>Finance Persona / P0-P1</span>
                      {criteria.financePersona && (
                        <span className="text-emerald-600 font-medium">
                          {(lead.persona_score || 0) >= 18 ? `(persona: ${lead.persona_score})` : `(${lead.signal_tier})`}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 ${criteria.icpFit ? 'text-emerald-700' : 'text-red-500'}`}>
                      <span>{criteria.icpFit ? '✓' : '✗'}</span>
                      <span>ICP Fit (>=30)</span>
                      <span className={criteria.icpFit ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                        (ICP: {lead.icp_fit_score || 0})
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${criteria.signalDiversity ? 'text-emerald-700' : 'text-red-500'}`}>
                      <span>{criteria.signalDiversity ? '✓' : '✗'}</span>
                      <span>Signal Diversity</span>
                      {criteria.signalDiversity && (
                        <span className="text-emerald-600 font-medium">
                          {touchpointCount >= 2 && `(${touchpointCount} touchpoints)`}
                          {hasTransformationSignal && '(transformation)'}
                          {hasWhyNowSignal && '(why now)'}
                          {(lead.intent_score || 0) >= 20 && `(intent: ${lead.intent_score})`}
                        </span>
                      )}
                      {!criteria.signalDiversity && <span className="text-red-500 font-medium">(needs 2+ signals)</span>}
                    </div>
                  </div>

                  {/* Status message */}
                  {isPreMql && (
                    <div className="mt-2 text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-1">
                      → All criteria met - Review in GTM app to convert to MQL
                    </div>
                  )}
                  {isMql && (
                    <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-100 rounded px-2 py-1">
                      ✓ Accepted to Discovery/TAL
                    </div>
                  )}
                  {isRejected && (
                    <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">
                      ✗ Disqualified - not counted in Pre-MQL funnel
                    </div>
                  )}
                  {isDoneNotMql && (
                    <div className="mt-2 text-[10px] text-gray-600 bg-gray-200 rounded px-2 py-1">
                      Processed manually - not linked to Discovery/TAL
                    </div>
                  )}
                  {!allCriteriaMet && !isRejected && !isDoneNotMql && (
                    <div className="mt-2 text-[10px] text-gray-500 bg-gray-100 rounded px-2 py-1">
                      Missing {4 - criteriaMetCount} criteria for Pre-MQL qualification
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Contact & Company */}
            <div className="grid grid-cols-2 gap-3">
              {/* Contact */}
              <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-neon-cyan" />
                  <span className="text-[10px] font-cyber text-gray-500 tracking-wider">CONTACT</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-700 truncate">{lead.email}</span>
                  </div>
                  {lead.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-600 truncate">{lead.title}</span>
                    </div>
                  )}
                  {lead.detected_persona && (
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-neon-purple text-[11px] font-medium">{lead.detected_persona}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="border border-gray-200 bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-neon-purple" />
                  <span className="text-[10px] font-cyber text-gray-500 tracking-wider">COMPANY</span>
                </div>
                {isPersonalEmail ? (
                  <div className="flex items-center gap-2 text-[12px] text-gray-400 italic">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Personal email</span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[12px]">
                    <div className="text-gray-800 font-medium truncate">
                      {lead.company_name || lead.company_domain || '-'}
                    </div>
                    {lead.industry && <div className="text-gray-600">{lead.industry}</div>}
                    {lead.employee_count && <div className="text-gray-500">{lead.employee_count} employees</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="border border-gray-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-neon-orange" />
                <span className="text-[10px] font-cyber text-gray-500 tracking-wider">ATTRIBUTION</span>
              </div>
              {/* Campaign - prominent if exists */}
              {lead.utm_campaign && (
                <div className="mb-3 p-2 bg-orange-100 rounded border border-orange-200">
                  <div className="text-gray-500 text-[9px] uppercase tracking-wide">Campaign</div>
                  <div className="text-orange-800 font-semibold text-[13px]">{lead.utm_campaign}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <div className="text-gray-500 text-[10px]">Type</div>
                  <div className="text-gray-700 truncate font-medium">{signalLabel}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Content</div>
                  <div className="text-gray-700 truncate" title={lead.content_name || ''}>{lead.content_name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Date</div>
                  <div className="text-gray-700 font-mono">{format(parseISO(lead.inbox_entered_at), 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">Source</div>
                  <div className="text-gray-700 font-medium">{lead.utm_source || 'direct'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px]">SF Status</div>
                  <div className={lead.in_salesforce ? 'text-neon-green font-medium' : 'text-gray-400'}>
                    {lead.in_salesforce ? 'In Salesforce' : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Research Section */}
            {research ? (
              <div className="space-y-2">
                {/* Research Header */}
                <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-2">
                  <Brain className="h-4 w-4 text-neon-purple" />
                  <span className="text-[10px] font-cyber text-neon-purple tracking-wider">AI.RESEARCH</span>
                  <span className="signal-badge ml-auto">ENRICHED</span>
                </div>

                {/* Company Overview */}
                {research.company?.overview && (
                  <div className="border border-purple-500/20 bg-purple-500/5 p-2">
                    <p className="text-[10px] text-cyan-500/70 leading-relaxed line-clamp-3">
                      {research.company.overview}
                    </p>
                  </div>
                )}

                {/* Signals Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Transformation */}
                  {research.company?.transformation_signals && (
                    <div className="border border-cyan-500/10 p-2">
                      <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">TRANSFORMATION</div>
                      <div className="flex flex-wrap gap-1">
                        {research.company.transformation_signals.ai_initiative && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">AI</span>
                        )}
                        {research.company.transformation_signals.erp_modernization && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">ERP</span>
                        )}
                        {research.company.transformation_signals.data_transformation && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">DATA</span>
                        )}
                        {research.company.transformation_signals.digital_transformation && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">DIGITAL</span>
                        )}
                        {!Object.values(research.company.transformation_signals).some(Boolean) && (
                          <span className="text-[9px] text-cyan-500/30">None</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Why Now */}
                  {research.company?.why_now_signals && (
                    <div className="border border-cyan-500/10 p-2">
                      <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">WHY NOW</div>
                      <div className="flex flex-wrap gap-1">
                        {research.company.why_now_signals.new_cfo_hire && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-green-500/10 text-neon-green border border-green-500/20">CFO</span>
                        )}
                        {research.company.why_now_signals.new_cio_hire && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-green-500/10 text-neon-green border border-green-500/20">CIO</span>
                        )}
                        {research.company.why_now_signals.layoffs_announced && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-pink-500/10 text-neon-magenta border border-pink-500/20">LAYOFFS</span>
                        )}
                        {research.company.why_now_signals.cost_cutting && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-pink-500/10 text-neon-magenta border border-pink-500/20">CUTS</span>
                        )}
                        {research.company.why_now_signals.mna_activity && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-orange-500/10 text-neon-orange border border-orange-500/20">M&A</span>
                        )}
                        {research.company.why_now_signals.expansion && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-orange-500/10 text-neon-orange border border-orange-500/20">GROWTH</span>
                        )}
                        {!Object.values(research.company.why_now_signals).some(Boolean) && (
                          <span className="text-[9px] text-cyan-500/30">None</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tech Stack - Compact */}
                {research.company?.tech_stack_categorized && Object.keys(research.company.tech_stack_categorized).length > 0 && (
                  <div className="border border-cyan-500/10 p-2">
                    <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">TECH STACK</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(research.company.tech_stack_categorized).slice(0, 2).flatMap(([_, tools]) =>
                        (tools as string[]).slice(0, 4).map((tool: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 text-[8px] bg-cyan-500/5 text-cyan-500/60 border border-cyan-500/10">
                            {tool}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Finance Leaders - Compact */}
                {research.finance_leaders_found && research.finance_leaders_found.length > 0 && (
                  <div className="border border-cyan-500/10 p-2">
                    <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">FINANCE LEADERS</div>
                    <div className="space-y-1">
                      {research.finance_leaders_found.slice(0, 2).map((leader, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <div className="truncate">
                            <span className="text-cyan-300">{leader.name}</span>
                            <span className="text-cyan-500/40 ml-2">{leader.title}</span>
                          </div>
                          {leader.linkedin_url && (
                            <a
                              href={leader.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neon-cyan hover:text-neon-cyan/80 ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent News - Compact */}
                {research.company?.recent_news && research.company.recent_news.length > 0 && (
                  <div className="border border-cyan-500/10 p-2">
                    <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">RECENT NEWS</div>
                    <div className="space-y-1">
                      {research.company.recent_news.slice(0, 2).map((news, idx) => (
                        <div key={idx} className="text-[10px]">
                          <p className="text-cyan-300 line-clamp-1">{news.headline}</p>
                          <p className="text-[8px] text-cyan-500/40">{news.source} • {news.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Driver */}
                {research.recommended_value_driver && (
                  <div className="border border-green-500/20 bg-green-500/5 p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles className="h-3 w-3 text-neon-green" />
                      <span className="text-[8px] text-neon-green tracking-wider">RECOMMENDED APPROACH</span>
                    </div>
                    <p className="text-[10px] text-cyan-300 capitalize">
                      {research.recommended_value_driver.driver?.replace(/_/g, ' ')}
                    </p>
                    {research.recommended_value_driver.reasoning && (
                      <p className="text-[9px] text-cyan-500/50 mt-1 line-clamp-2">{research.recommended_value_driver.reasoning}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-cyan-500/10 p-6 text-center">
                <Brain className="h-6 w-6 text-cyan-500/20 mx-auto mb-2" />
                <p className="text-[10px] text-cyan-500/40 font-cyber tracking-wider">AI.RESEARCH.PENDING</p>
              </div>
            )}

            {/* Talking Points */}
            {context?.talking_points && context.talking_points.length > 0 && (
              <div className="border border-cyan-500/10 p-2">
                <div className="text-[8px] text-cyan-500/40 tracking-wider mb-1">TALKING POINTS</div>
                <ul className="space-y-1">
                  {context.talking_points.slice(0, 3).map((point, idx) => (
                    <li key={idx} className="text-[10px] text-cyan-500/70 flex items-start gap-2">
                      <span className="text-neon-cyan">▸</span>
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
