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
 * demo_request is Tier-1: a finance leader requesting a demo is high-intent.
 */
export const TIER_1_WEBFLOW_TYPES = new Set<string>([
  'webflow_content_download',
  'webflow_webinar_reg',
  'webflow_event_reg',
  'webflow_demo_request',
])

/**
 * Qualifying Tier-1 FI Assessment signal types (1 touchpoint each).
 * The FI Assessment quiz is gated content — completing it is a real
 * touchpoint, same weight as an ebook download.
 */
export const TIER_1_FI_ASSESSMENT_TYPES = new Set<string>([
  'fi_assessment_completed',
  'fi_assessment_shared_report',
])

/**
 * RB2B signal types — qualify as Tier-1 ONLY when the visitor was
 * identified as a specific person (direct_person). Account-level rows
 * (email starts with 'unknown@') do NOT count as a touchpoint.
 * Checked via isRb2bDirectPerson() below.
 */
export const TIER_1_RB2B_TYPES = new Set<string>([
  'rb2b_page_visit',
  'rb2b_pricing_page',
  'rb2b_assessment_page',
  'rb2b_case_study',
  'rb2b_integration_page',
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
 * True if this RB2B row represents a real identified person, not just the
 * company. Mirrors the classifyRB2BSignal() logic in team-outreach/src/lib/
 * inbound-scoring.ts — an email of `unknown@<domain>` is RB2B's sentinel for
 * "we saw someone from this company but couldn't identify who".
 */
export function isRb2bDirectPerson(lead: Lead): boolean {
  const email = (lead.email || '').toLowerCase().trim()
  if (!email) return false
  if (email.startsWith('unknown@')) return false
  return true
}

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
 * Covers Webflow Tier-1 types, FI Assessment completions, and RB2B direct-person visits.
 */
export function isQualifyingTouchpoint(lead: Lead): boolean {
  const sigType = lead.trigger_signal_type || ''
  if (TIER_1_WEBFLOW_TYPES.has(sigType)) return true
  if (TIER_1_FI_ASSESSMENT_TYPES.has(sigType)) return true
  if (TIER_1_RB2B_TYPES.has(sigType)) return isRb2bDirectPerson(lead)
  return false
}

/**
 * Build a per-email touchpoint counter from the full lead list.
 * Dedupes by (signal_type, content, day) so two downloads of the same ebook
 * on the same day count once. ALSO adds email-link-click touchpoints pulled
 * from outreach_queue by the edge function (lead.email_click_touchpoints) —
 * each distinct click-day counts as 1, matching Team Outreach's 2.0-weighted
 * inbound-lead threshold so the two apps agree on who's an MQL.
 *
 * Returns a function `(email) => count` so callers can look up each row.
 */
export function buildTouchpointCounter(allLeads: Lead[]): (email: string | null | undefined) => number {
  const inboxByEmail = new Map<string, Set<string>>()
  const emailClicksByEmail = new Map<string, number>()

  for (const lead of allLeads) {
    const email = (lead.email || '').toLowerCase().trim()
    if (!email) continue

    // Record email-click touchpoints (same number repeated on every row for
    // this email — take the max to avoid overwriting a higher value).
    const clicks = lead.email_click_touchpoints ?? 0
    if (clicks > (emailClicksByEmail.get(email) ?? 0)) {
      emailClicksByEmail.set(email, clicks)
    }

    // Record inbox_leads qualifying touchpoints.
    if (!isQualifyingTouchpoint(lead)) continue
    const day = (lead.inbox_entered_at || '').slice(0, 10)
    const content = lead.content_name || lead.trigger_signal_type || ''
    const key = `${lead.trigger_signal_type}:${content}:${day}`
    const existing = inboxByEmail.get(email)
    if (existing) existing.add(key)
    else inboxByEmail.set(email, new Set([key]))
  }

  return (email: string | null | undefined) => {
    if (!email) return 0
    const e = email.toLowerCase().trim()
    const inboxCount = inboxByEmail.get(e)?.size ?? 0
    const clickCount = emailClicksByEmail.get(e) ?? 0
    return inboxCount + clickCount
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
