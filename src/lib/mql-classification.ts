/**
 * Script: lib/mql-classification.ts
 * Description: Unified MQL / Pre-MQL / Lead classification for Gated Content Analytics.
 *              Mirrors the weighted touchpoint model used in GTM/team-outreach/src/lib/inbound-scoring.ts
 *              so the two apps agree on who counts as an MQL.
 * Project: Gated Content Analytics
 * Author: MartinL
 * Created: 2026-04-17
 *
 * Classification (per Martin, 2026-04-17):
 *   Lead    — ICP fit OR finance persona missing (or rejected).
 *   Pre-MQL — ICP + finance persona met AND exactly 1 qualifying touchpoint.
 *   MQL     — ICP + finance persona met AND >=2 qualifying touchpoints.
 *
 * Touchpoints are counted per email across all rows in `inbox_leads`.
 * Dedup: same content + same day = 1 touchpoint.
 * Sales acceptance (Discovery/TAL) is intentionally NOT part of the definition.
 */

import type { Lead } from './supabase'

/**
 * Qualifying Tier-1 Webflow signal types (1 touchpoint each).
 * Mirrors inbound-scoring.ts SIGNAL_WEIGHTS Tier-1 group, filtered to what
 * Gated Content Analytics actually sees (trigger_signal_type LIKE 'webflow_%').
 *
 * demo_request is included as Tier-1: a finance leader requesting a demo is
 * high-intent engagement, not a list-build.
 */
export const TIER_1_WEBFLOW_TYPES = new Set<string>([
  'webflow_content_download',
  'webflow_webinar_reg',
  'webflow_event_reg',
  'webflow_demo_request',
])

/**
 * Webflow signal types explicitly excluded from touchpoint counting.
 * Newsletter / popup / contact / generic form are list-builders or low-intent —
 * they do not signal buying interest by themselves.
 */
export const EXCLUDED_WEBFLOW_TYPES = new Set<string>([
  'webflow_newsletter',
  'webflow_popup',
  'webflow_contact',
  'webflow_form',
])

/**
 * Firmographic ICP fit check.
 * Uses the existing icp_fit_score (0-100) which already encodes company size
 * and industry match per the GTM scoring model.
 */
export function hasIcpFit(lead: Lead): boolean {
  if (!lead.company_name || lead.company_name.trim() === '') return false
  if ((lead.icp_fit_score || 0) < 30) return false
  return true
}

/**
 * Finance-leader persona check.
 * Primary signal: persona_score >= 18 (CFO/VP Finance/Controller/FP&A per scoring.ts).
 * Fallback: title regex, so we don't miss a finance leader with an unscored title.
 */
export function hasFinancePersona(lead: Lead): boolean {
  if ((lead.persona_score || 0) >= 18) return true
  const title = (lead.title || '').toLowerCase()
  if (!title) return false
  return /\bcfo\b|chief financial|vp.*finance|vice president.*finance|head.*finance|head of financial|\bcontroller\b|fp&a|financial planning|finance director|director.*finance|director.*financial/i.test(title)
}

/**
 * Is this row a qualifying Tier-1 touchpoint on its own?
 */
export function isQualifyingTouchpoint(lead: Lead): boolean {
  return TIER_1_WEBFLOW_TYPES.has(lead.trigger_signal_type || '')
}

/**
 * Build a per-email touchpoint counter from the full lead list.
 * Dedupes by (signal_type, content, day) so two downloads of the same ebook
 * on the same day count once.
 *
 * Returns a function `(email) => count` so callers can look up each row.
 */
export function buildTouchpointCounter(allLeads: Lead[]): (email: string | null | undefined) => number {
  const byEmail = new Map<string, Set<string>>()
  for (const lead of allLeads) {
    if (!isQualifyingTouchpoint(lead)) continue
    const email = (lead.email || '').toLowerCase().trim()
    if (!email) continue
    const day = (lead.inbox_entered_at || '').slice(0, 10)
    const content = lead.content_name || lead.trigger_signal_type || ''
    const key = `${lead.trigger_signal_type}:${content}:${day}`
    const existing = byEmail.get(email)
    if (existing) {
      existing.add(key)
    } else {
      byEmail.set(email, new Set([key]))
    }
  }
  return (email: string | null | undefined) => {
    if (!email) return 0
    const set = byEmail.get(email.toLowerCase().trim())
    return set ? set.size : 0
  }
}

export type LeadClass = 'lead' | 'pre_mql' | 'mql' | 'rejected'

/**
 * Classify a single lead given its touchpoint count for this email.
 *
 * Rejected leads stay as 'rejected' — they are disqualified and should not
 * be counted in Pre-MQL / MQL funnels regardless of touchpoint count.
 */
export function classifyLead(lead: Lead, touchpointCount: number): LeadClass {
  if (lead.action_status === 'rejected') return 'rejected'
  if (!hasIcpFit(lead)) return 'lead'
  if (!hasFinancePersona(lead)) return 'lead'
  if (touchpointCount >= 2) return 'mql'
  if (touchpointCount >= 1) return 'pre_mql'
  // ICP + persona fit but no qualifying touchpoint (e.g. only newsletter) — still a Lead.
  return 'lead'
}

export function isPreMql(lead: Lead, touchpointCount: number): boolean {
  return classifyLead(lead, touchpointCount) === 'pre_mql'
}

export function isMql(lead: Lead, touchpointCount: number): boolean {
  return classifyLead(lead, touchpointCount) === 'mql'
}

/**
 * Which of the three classification criteria does this lead meet?
 * Exposed for the detail modal so it can show the checklist.
 */
export interface MqlCriteria {
  icpFit: boolean
  financePersona: boolean
  touchpointCount: number
}

export function evaluateCriteria(lead: Lead, touchpointCount: number): MqlCriteria {
  return {
    icpFit: hasIcpFit(lead),
    financePersona: hasFinancePersona(lead),
    touchpointCount,
  }
}
