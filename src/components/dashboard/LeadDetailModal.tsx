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
    if (pct >= 0.7) return 'text-neon-green text-glow-sm'
    if (pct >= 0.4) return 'text-neon-cyan'
    return 'text-cyan-500/50'
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'new': return { label: 'NEW', color: 'text-neon-cyan' }
      case 'working': return { label: 'WORKING', color: 'text-neon-orange' }
      case 'done': return { label: 'CONVERTED', color: 'text-neon-green' }
      case 'rejected': return { label: 'REJECTED', color: 'text-cyan-500/40' }
      default: return { label: status.toUpperCase(), color: 'text-cyan-500/50' }
    }
  }

  const status = getStatusDisplay(lead.action_status)
  const signalLabel = lead.trigger_signal_type ? SIGNAL_TYPE_LABELS[lead.trigger_signal_type] || lead.trigger_signal_type : 'Unknown'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with grid effect */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-8">
        <div className="cyber-modal relative w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-500/40" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-500/40" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-500/40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-500/40" />

          {/* Header */}
          <div className="border-b border-cyan-500/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-[10px] font-cyber font-bold tracking-wider ${getTierClass(lead.signal_tier)}`}>
                  {lead.signal_tier}
                </span>
                <div>
                  <div className="font-cyber text-sm text-neon-cyan tracking-wide">
                    {lead.first_name || lead.last_name
                      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim().toUpperCase()
                      : lead.email?.split('@')[0].toUpperCase()}
                  </div>
                  <div className="text-[10px] text-cyan-500/60">
                    {lead.title || lead.detected_persona || 'UNKNOWN'}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-cyan-500/50 hover:text-neon-cyan hover:bg-cyan-500/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-3">
            {/* Score Bar */}
            <div className="grid grid-cols-5 gap-2">
              <div className="cyber-stat p-2 text-center">
                <div className={`font-cyber text-lg font-bold ${getScoreColor(lead.total_score, 220)}`}>
                  {lead.total_score}
                </div>
                <div className="text-[8px] text-cyan-500/40 tracking-wider">TOTAL</div>
              </div>
              <div className="cyber-stat p-2 text-center">
                <div className={`font-cyber text-lg font-bold ${getScoreColor(lead.icp_fit_score, 100)}`}>
                  {lead.icp_fit_score}
                </div>
                <div className="text-[8px] text-cyan-500/40 tracking-wider">ICP FIT</div>
              </div>
              <div className="cyber-stat p-2 text-center">
                <div className={`font-cyber text-lg font-bold ${getScoreColor(lead.intent_score, 40)}`}>
                  {lead.intent_score}
                </div>
                <div className="text-[8px] text-cyan-500/40 tracking-wider">INTENT</div>
              </div>
              <div className="cyber-stat p-2 text-center">
                <div className={`font-cyber text-lg font-bold ${status.color}`}>
                  {lead.lead_grade}
                </div>
                <div className="text-[8px] text-cyan-500/40 tracking-wider">GRADE</div>
              </div>
              <div className="cyber-stat p-2 text-center">
                <div className={`text-[10px] font-bold ${status.color}`}>
                  {status.label}
                </div>
                <div className="text-[8px] text-cyan-500/40 tracking-wider">STATUS</div>
              </div>
            </div>

            {/* Contact & Company */}
            <div className="grid grid-cols-2 gap-2">
              {/* Contact */}
              <div className="border border-cyan-500/15 bg-cyan-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3 w-3 text-neon-cyan" />
                  <span className="text-[9px] font-cyber text-cyan-500/60 tracking-wider">CONTACT</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-cyan-500/40" />
                    <span className="text-cyan-300 truncate">{lead.email}</span>
                  </div>
                  {lead.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-cyan-500/40" />
                      <span className="text-cyan-500/60 truncate">{lead.title}</span>
                    </div>
                  )}
                  {lead.detected_persona && (
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-cyan-500/40" />
                      <span className="text-neon-purple text-[10px] font-mono">{lead.detected_persona}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="border border-purple-500/15 bg-purple-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-3 w-3 text-neon-purple" />
                  <span className="text-[9px] font-cyber text-cyan-500/60 tracking-wider">COMPANY</span>
                </div>
                {isPersonalEmail ? (
                  <div className="flex items-center gap-2 text-[11px] text-cyan-500/40 italic">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Personal email</span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    <div className="text-cyan-300 font-medium truncate">
                      {lead.company_name || lead.company_domain || '-'}
                    </div>
                    {lead.industry && <div className="text-cyan-500/50">{lead.industry}</div>}
                    {lead.employee_count && <div className="text-cyan-500/50">{lead.employee_count} emp</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="border border-orange-500/15 bg-orange-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3 text-neon-orange" />
                <span className="text-[9px] font-cyber text-cyan-500/60 tracking-wider">ATTRIBUTION</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <div className="text-cyan-500/40">Type</div>
                  <div className="text-cyan-300 truncate">{signalLabel}</div>
                </div>
                <div>
                  <div className="text-cyan-500/40">Content</div>
                  <div className="text-cyan-300 truncate" title={lead.content_name || ''}>{lead.content_name || '-'}</div>
                </div>
                <div>
                  <div className="text-cyan-500/40">Date</div>
                  <div className="text-cyan-300 font-mono">{format(parseISO(lead.inbox_entered_at), 'MMM d')}</div>
                </div>
                <div>
                  <div className="text-cyan-500/40">Source</div>
                  <div className="text-cyan-300">{lead.utm_source || 'direct'}</div>
                </div>
                <div>
                  <div className="text-cyan-500/40">Campaign</div>
                  <div className="text-cyan-300 truncate">{lead.utm_campaign || '-'}</div>
                </div>
                <div>
                  <div className="text-cyan-500/40">SF Status</div>
                  <div className={lead.in_salesforce ? 'text-neon-green' : 'text-cyan-500/40'}>
                    {lead.in_salesforce ? 'IN SF' : '-'}
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
