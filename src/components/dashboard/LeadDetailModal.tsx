'use client'

import { Lead } from '@/lib/supabase'
import { X, Building2, User, Mail, Phone, Globe, Briefcase, TrendingUp, Users, Zap, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
}

const TIER_CONFIG = {
  P0: { label: 'P0 - Immediate', color: 'bg-red-100 text-red-800' },
  P1: { label: 'P1 - High', color: 'bg-orange-100 text-orange-800' },
  P2: { label: 'P2 - Standard', color: 'bg-yellow-100 text-yellow-800' },
  P3: { label: 'P3 - Nurture', color: 'bg-gray-100 text-gray-800' },
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  working: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  done: { label: 'Converted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Disqualified', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

export function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const tierConfig = TIER_CONFIG[lead.signal_tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.P3
  const statusConfig = STATUS_CONFIG[lead.action_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
  const StatusIcon = statusConfig.icon
  const research = lead.ai_research
  const context = lead.context_for_outreach

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-20">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {lead.first_name || ''} {lead.last_name || lead.email}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {lead.title && `${lead.title} at `}{lead.company_name || lead.company_domain}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${tierConfig.color}`}>
                {tierConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </span>
              {lead.has_research && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  AI Researched
                </span>
              )}
              {lead.in_salesforce && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  In Salesforce
                </span>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Contact & Scores */}
              <div className="space-y-6">
                {/* Contact Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Details
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <dd className="text-gray-900">{lead.email}</dd>
                    </div>
                    {lead.title && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <dd className="text-gray-900">{lead.title}</dd>
                      </div>
                    )}
                    {lead.detected_persona && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <dd className="text-gray-900">Persona: {lead.detected_persona}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Company Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Company</dt>
                      <dd className="text-gray-900 font-medium">{lead.company_name || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Domain</dt>
                      <dd className="text-gray-900">{lead.company_domain || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Industry</dt>
                      <dd className="text-gray-900">{lead.industry || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Employees</dt>
                      <dd className="text-gray-900">{lead.employee_count || '-'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Scores */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Scoring
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Total Score</dt>
                      <dd className="text-gray-900 font-bold text-lg">{lead.total_score}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">ICP Fit</dt>
                      <dd className="text-gray-900">{lead.icp_fit_score} / 100</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Intent</dt>
                      <dd className="text-gray-900">{lead.intent_score} / 40</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Grade</dt>
                      <dd className="text-gray-900 font-medium">{lead.lead_grade}</dd>
                    </div>
                  </dl>
                </div>

                {/* Attribution */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Attribution
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Content</dt>
                      <dd className="text-gray-900 text-right max-w-[200px] truncate">{lead.content_name || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Source</dt>
                      <dd className="text-gray-900">{lead.utm_source || 'direct'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Campaign</dt>
                      <dd className="text-gray-900">{lead.utm_campaign || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Downloaded</dt>
                      <dd className="text-gray-900">{format(parseISO(lead.inbox_entered_at), 'MMM d, yyyy h:mm a')}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Right Column - AI Research */}
              <div className="space-y-6">
                {research ? (
                  <>
                    {/* Company Overview */}
                    {research.company?.overview && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          AI Company Research
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {research.company.overview}
                        </p>
                      </div>
                    )}

                    {/* Entity Structure */}
                    {research.company?.entity_structure && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Entity Structure</h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Type</dt>
                            <dd className="text-gray-900 capitalize">{research.company.entity_structure.type?.replace('_', ' ') || '-'}</dd>
                          </div>
                          {research.company.entity_structure.entity_count && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Entities</dt>
                              <dd className="text-gray-900">{research.company.entity_structure.entity_count}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}

                    {/* Transformation Signals */}
                    {research.company?.transformation_signals && (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Transformation Signals</h3>
                        <div className="flex flex-wrap gap-2">
                          {research.company.transformation_signals.ai_initiative && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900">AI Initiative</span>
                          )}
                          {research.company.transformation_signals.erp_modernization && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900">ERP Modernization</span>
                          )}
                          {research.company.transformation_signals.data_transformation && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900">Data Transformation</span>
                          )}
                          {research.company.transformation_signals.digital_transformation && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900">Digital Transformation</span>
                          )}
                          {research.company.transformation_signals.automation_initiative && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-200 text-amber-900">Automation</span>
                          )}
                          {!Object.values(research.company.transformation_signals).some(Boolean) && (
                            <span className="text-sm text-gray-500">No signals detected</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Why Now Signals */}
                    {research.company?.why_now_signals && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Why Now Signals</h3>
                        <div className="flex flex-wrap gap-2">
                          {research.company.why_now_signals.new_cfo_hire && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-200 text-green-900">New CFO</span>
                          )}
                          {research.company.why_now_signals.new_cio_hire && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-200 text-green-900">New CIO</span>
                          )}
                          {research.company.why_now_signals.new_cto_hire && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-200 text-green-900">New CTO</span>
                          )}
                          {research.company.why_now_signals.layoffs_announced && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900">Layoffs</span>
                          )}
                          {research.company.why_now_signals.cost_cutting && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900">Cost Cutting</span>
                          )}
                          {research.company.why_now_signals.mna_activity && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-200 text-blue-900">M&A Activity</span>
                          )}
                          {research.company.why_now_signals.expansion && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-200 text-blue-900">Expansion</span>
                          )}
                          {research.company.why_now_signals.first_data_hire && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-200 text-purple-900">First Data Hire</span>
                          )}
                          {!Object.values(research.company.why_now_signals).some(Boolean) && (
                            <span className="text-sm text-gray-500">No signals detected</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tech Stack */}
                    {research.company?.tech_stack_categorized && Object.keys(research.company.tech_stack_categorized).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Tech Stack</h3>
                        <div className="space-y-2">
                          {Object.entries(research.company.tech_stack_categorized).map(([category, tools]) => (
                            tools && tools.length > 0 && (
                              <div key={category} className="text-sm">
                                <span className="text-gray-500 capitalize">{category.replace(/_/g, ' ')}:</span>{' '}
                                <span className="text-gray-900">{tools.join(', ')}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Finance Leaders */}
                    {research.finance_leaders_found && research.finance_leaders_found.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Finance Leaders Found</h3>
                        <div className="space-y-2">
                          {research.finance_leaders_found.map((leader, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-gray-900">{leader.name}</span>
                                <span className="text-gray-500 ml-2">{leader.title}</span>
                              </div>
                              {leader.linkedin_url && (
                                <a
                                  href={leader.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent News */}
                    {research.company?.recent_news && research.company.recent_news.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Recent News</h3>
                        <div className="space-y-3">
                          {research.company.recent_news.slice(0, 3).map((news, idx) => (
                            <div key={idx} className="text-sm">
                              <p className="text-gray-900">{news.headline}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {news.source} - {news.date}
                                {news.url && (
                                  <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 hover:underline">
                                    Read more
                                  </a>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value Driver Recommendation */}
                    {research.recommended_value_driver && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Recommended Approach</h3>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium capitalize">{research.recommended_value_driver.driver?.replace(/_/g, ' ')}</span>
                          {research.recommended_value_driver.reasoning && (
                            <span className="text-gray-500 ml-1">- {research.recommended_value_driver.reasoning}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">No AI Research Available</h3>
                    <p className="text-sm text-gray-500">
                      AI research will be automatically triggered for new gated content downloads.
                    </p>
                  </div>
                )}

                {/* Talking Points */}
                {context?.talking_points && context.talking_points.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Talking Points</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {context.talking_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">-</span>
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
      </div>
    </div>
  )
}
