'use client'

import { Lead } from '@/lib/supabase'
import { X, Building2, User, Mail, Briefcase, TrendingUp, Zap, ExternalLink, Brain, Globe, Calendar, Sparkles, Target, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
}

const TIER_CONFIG = {
  P0: { label: 'P0', color: 'bg-p0-light text-neon-magenta border border-p0/30', glow: 'shadow-[0_0_15px_rgba(255,0,128,0.4)]' },
  P1: { label: 'P1', color: 'bg-p1-light text-neon-orange border border-p1/30', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]' },
  P2: { label: 'P2', color: 'bg-p2-light text-neon-cyan border border-p2/30', glow: 'shadow-[0_0_15px_rgba(0,212,255,0.4)]' },
  P3: { label: 'P3', color: 'bg-muted text-muted-foreground border border-border', glow: '' },
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-neon-cyan' },
  working: { label: 'Working', color: 'text-neon-orange' },
  done: { label: 'Converted', color: 'text-neon-green' },
  rejected: { label: 'Disqualified', color: 'text-muted-foreground' },
}

const PERSONAL_EMAIL_DOMAINS = /gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me\.com|mac\.com|aol|protonmail/i

export function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
  const statusConfig = STATUS_CONFIG[lead.action_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
  const research = lead.ai_research
  const context = lead.context_for_outreach
  const isPersonalEmail = PERSONAL_EMAIL_DOMAINS.test(lead.email || '')

  // Score color based on value
  const getScoreColor = (score: number, max: number) => {
    const pct = score / max
    if (pct >= 0.7) return 'text-neon-green'
    if (pct >= 0.4) return 'text-neon-cyan'
    return 'text-muted-foreground'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-12">
        <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-10 w-10 rounded-lg ${tierConfig.color} ${tierConfig.glow} flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold">{tierConfig.label}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {lead.first_name || lead.last_name
                    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                    : lead.email?.split('@')[0]}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {lead.title || lead.detected_persona || 'Unknown Role'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-4 space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className={`text-lg font-bold font-mono ${getScoreColor(lead.total_score, 220)}`}>
                  {lead.total_score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Total</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className={`text-lg font-bold font-mono ${getScoreColor(lead.icp_fit_score, 100)}`}>
                  {lead.icp_fit_score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">ICP Fit</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className={`text-lg font-bold font-mono ${getScoreColor(lead.intent_score, 40)}`}>
                  {lead.intent_score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Intent</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className={`text-lg font-bold ${statusConfig.color}`}>
                  {lead.lead_grade}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Grade</div>
              </div>
            </div>

            {/* Contact & Company Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Contact */}
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-neon-cyan" />
                  <span className="text-xs font-medium text-foreground">Contact</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{lead.email}</span>
                  </div>
                  {lead.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">{lead.title}</span>
                    </div>
                  )}
                  {lead.detected_persona && (
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-neon-purple text-[10px] font-medium">{lead.detected_persona}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-3.5 w-3.5 text-neon-purple" />
                  <span className="text-xs font-medium text-foreground">Company</span>
                </div>
                {isPersonalEmail ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Personal email - no company data</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="text-foreground font-medium truncate">
                      {lead.company_name || lead.company_domain || '-'}
                    </div>
                    {lead.industry && (
                      <div className="text-muted-foreground">{lead.industry}</div>
                    )}
                    {lead.employee_count && (
                      <div className="text-muted-foreground">{lead.employee_count} employees</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-neon-orange" />
                <span className="text-xs font-medium text-foreground">Attribution</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content</span>
                  <span className="text-foreground truncate max-w-[120px]" title={lead.content_name || ''}>{lead.content_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground font-mono">{format(parseISO(lead.inbox_entered_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-foreground">{lead.utm_source || 'direct'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span className="text-foreground truncate max-w-[100px]">{lead.utm_campaign || '-'}</span>
                </div>
              </div>
            </div>

            {/* AI Research Section */}
            {research ? (
              <div className="space-y-3">
                {/* Research Header */}
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-neon-purple" />
                  <span className="text-sm font-medium text-foreground">AI Research</span>
                  <span className="text-[10px] text-neon-purple px-1.5 py-0.5 bg-neon-purple/10 rounded">ENRICHED</span>
                </div>

                {/* Company Overview */}
                {research.company?.overview && (
                  <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {research.company.overview}
                    </p>
                  </div>
                )}

                {/* Signals Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Transformation Signals */}
                  {research.company?.transformation_signals && (
                    <div className="bg-muted/30 border border-border rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground uppercase mb-2">Transformation</div>
                      <div className="flex flex-wrap gap-1">
                        {research.company.transformation_signals.ai_initiative && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">AI</span>
                        )}
                        {research.company.transformation_signals.erp_modernization && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">ERP</span>
                        )}
                        {research.company.transformation_signals.data_transformation && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">Data</span>
                        )}
                        {research.company.transformation_signals.digital_transformation && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">Digital</span>
                        )}
                        {research.company.transformation_signals.automation_initiative && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">Auto</span>
                        )}
                        {!Object.values(research.company.transformation_signals).some(Boolean) && (
                          <span className="text-[10px] text-muted-foreground">None detected</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Why Now Signals */}
                  {research.company?.why_now_signals && (
                    <div className="bg-muted/30 border border-border rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground uppercase mb-2">Why Now</div>
                      <div className="flex flex-wrap gap-1">
                        {research.company.why_now_signals.new_cfo_hire && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded">CFO</span>
                        )}
                        {research.company.why_now_signals.new_cio_hire && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded">CIO</span>
                        )}
                        {research.company.why_now_signals.new_cto_hire && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded">CTO</span>
                        )}
                        {research.company.why_now_signals.layoffs_announced && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-magenta/10 text-neon-magenta rounded">Layoffs</span>
                        )}
                        {research.company.why_now_signals.cost_cutting && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-magenta/10 text-neon-magenta rounded">Cuts</span>
                        )}
                        {research.company.why_now_signals.mna_activity && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-orange/10 text-neon-orange rounded">M&A</span>
                        )}
                        {research.company.why_now_signals.expansion && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-orange/10 text-neon-orange rounded">Growth</span>
                        )}
                        {!Object.values(research.company.why_now_signals).some(Boolean) && (
                          <span className="text-[10px] text-muted-foreground">None detected</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tech Stack */}
                {research.company?.tech_stack_categorized && Object.keys(research.company.tech_stack_categorized).length > 0 && (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase mb-2">Tech Stack</div>
                    <div className="space-y-1">
                      {Object.entries(research.company.tech_stack_categorized).slice(0, 3).map(([category, tools]) => (
                        tools && tools.length > 0 && (
                          <div key={category} className="text-xs">
                            <span className="text-muted-foreground capitalize">{category.replace(/_/g, ' ')}:</span>{' '}
                            <span className="text-foreground">{(tools as string[]).slice(0, 3).join(', ')}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Finance Leaders */}
                {research.finance_leaders_found && research.finance_leaders_found.length > 0 && (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase mb-2">Finance Leaders</div>
                    <div className="space-y-1.5">
                      {research.finance_leaders_found.slice(0, 3).map((leader, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <span className="text-foreground font-medium">{leader.name}</span>
                            <span className="text-muted-foreground ml-2 truncate">{leader.title}</span>
                          </div>
                          {leader.linkedin_url && (
                            <a
                              href={leader.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neon-cyan hover:text-neon-cyan/80 shrink-0 ml-2"
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

                {/* Recent News */}
                {research.company?.recent_news && research.company.recent_news.length > 0 && (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase mb-2">Recent News</div>
                    <div className="space-y-2">
                      {research.company.recent_news.slice(0, 2).map((news, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="text-foreground line-clamp-1">{news.headline}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {news.source} - {news.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Driver */}
                {research.recommended_value_driver && (
                  <div className="bg-neon-green/5 border border-neon-green/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-3 w-3 text-neon-green" />
                      <span className="text-[10px] text-neon-green uppercase font-medium">Recommended Approach</span>
                    </div>
                    <p className="text-xs text-foreground capitalize">
                      {research.recommended_value_driver.driver?.replace(/_/g, ' ')}
                    </p>
                    {research.recommended_value_driver.reasoning && (
                      <p className="text-[10px] text-muted-foreground mt-1">{research.recommended_value_driver.reasoning}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
                <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">AI research pending</p>
              </div>
            )}

            {/* Talking Points */}
            {context?.talking_points && context.talking_points.length > 0 && (
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase mb-2">Talking Points</div>
                <ul className="space-y-1">
                  {context.talking_points.map((point, idx) => (
                    <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-neon-cyan shrink-0">-</span>
                      {point}
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
