// Supabase GTM project - using edge functions only (no direct client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jhglcgljsporzelhsvvz.supabase.co'

// Edge function base URL
export const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1`

// Fetch from gated-content-api edge function
export async function fetchGatedContentAPI(action: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({ action, ...params })
  const url = `${EDGE_FUNCTION_URL}/gated-content-api?${searchParams.toString()}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

// Signal type labels for display
export const SIGNAL_TYPE_LABELS: Record<string, string> = {
  'webflow_content_download': 'Gated Content',
  'webflow_newsletter': 'Newsletter',
  'webflow_popup': 'Popup',
  'webflow_demo_request': 'Demo Request',
  'webflow_contact': 'Contact Form',
  'webflow_webinar_reg': 'Webinar',
  'webflow_event_reg': 'Event',
  'webflow_form': 'Other Form',
  'fi_assessment_completed': 'FI Assessment',
  'fi_assessment_shared_report': 'FI Report Shared',
  'rb2b_page_visit': 'RB2B Visit',
  'rb2b_pricing_page': 'RB2B Pricing',
  'rb2b_assessment_page': 'RB2B Assessment',
  'rb2b_case_study': 'RB2B Case Study',
  'rb2b_integration_page': 'RB2B Integration',
}

// All available signal types
export const ALL_SIGNAL_TYPES = [
  'webflow_content_download',
  'webflow_newsletter',
  'webflow_popup',
  'webflow_demo_request',
  'webflow_contact',
  'webflow_webinar_reg',
  'webflow_event_reg',
  'webflow_form',
  'fi_assessment_completed',
  'fi_assessment_shared_report',
  'rb2b_page_visit',
  'rb2b_pricing_page',
  'rb2b_assessment_page',
  'rb2b_case_study',
  'rb2b_integration_page',
]

// Types for API responses
export interface SignalTypeSummary {
  signal_type: string
  label: string
  count: number
  pct: number
}

export interface OverviewData {
  total_downloads: number
  high_quality_count: number
  high_quality_pct: number
  converted_count: number
  converted_pct: number
  avg_score: number
  by_tier: { P0: number; P1: number; P2: number; P3: number }
  by_status: { new: number; working: number; done: number; rejected: number }
  by_signal_type: SignalTypeSummary[]
  by_content: ContentSummary[]
  by_persona: PersonaSummary[]
  available_signal_types: Array<{ value: string; label: string }>
}

export interface ContentSummary {
  content_name: string
  signal_type?: string
  signal_type_label?: string
  downloads: number
  high_quality: number
  quality_pct: number
  converted: number
  converted_pct: number
}

export interface PersonaSummary {
  persona: string
  downloads: number
  pct: number
  high_quality?: number
  quality_pct?: number
  avg_score?: number
}

export interface Lead {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  title: string | null
  company_name: string | null
  company_domain: string | null
  industry: string | null
  employee_count: string | null
  // Cold-calling fields (added for CSV export)
  phone: string | null            // inbox_leads.phone_direct → discovery_contacts.phone fallback
  hq_location: string | null      // discovery_accounts.hq_location (city/state for TZ)
  // Unified Scoring (MKT-256) — API now returns canonical priority_tier +
  // combined_score from discovery_contacts when the lead has been linked.
  // legacy_* fields preserve the pre-unification values for transparency.
  signal_tier: string           // effective tier (unified with legacy fallback)
  lead_grade: string | null     // effective grade
  total_score: number           // effective score, range depends on score_source
  score_source?: 'unified' | 'legacy'  // where signal_tier/total_score came from
  score_max?: number            // 320 for unified, 220 for legacy
  legacy_signal_tier?: string | null   // raw inbox_leads.signal_tier
  legacy_total_score?: number | null   // raw inbox_leads.total_score
  legacy_icp_fit_score?: number | null
  legacy_persona_score?: number | null
  legacy_intent_score?: number | null
  /** Full unified breakdown from discovery_accounts + discovery_contacts.
   *  account_total (0-220) + contact_score (0-100) = combined_score (0-320).
   *  Null when row isn't linked to the universe yet. */
  unified?: {
    combined_score: number | null
    priority_tier: string | null
    lead_grade: string | null
    account_total: number | null      // 0-220
    icp_fit_score: number | null      // 0-100
    why_now_score: number | null      // 0-80
    intent_score: number | null       // 0-40 (account-level)
    contact_score: number | null      // 0-100
    persona_score: number | null      // 0-40
    engagement_score: number | null   // 0-40
    fi_score: number | null           // 0-20
  } | null
  icp_fit_score: number
  persona_score: number  // "Why Now" score (0-80) - synced with GTM Inbox
  intent_score: number
  action_status: string
  rejection_reason: string | null
  inbox_entered_at: string
  last_action_at: string | null
  rejected_at: string | null
  detected_persona: string
  content_name: string
  trigger_signal_type?: string
  signal_type_label?: string
  utm_source: string | null
  utm_campaign: string | null
  has_research: boolean
  in_salesforce: boolean
  /** Number of distinct days this contact clicked a link in an outreach email.
   *  Pulled from outreach_queue so the MQL classifier matches Team Outreach's
   *  2.0-weighted inbound threshold (email_link_click is Tier-1 there). */
  email_click_touchpoints?: number
  // AI Research data
  ai_research?: {
    company?: {
      overview?: string
      financials?: {
        annual_revenue?: string
        market_cap?: string
        yoy_growth?: string
      }
      entity_structure?: {
        type?: string
        entity_count?: number
      }
      recent_news?: Array<{
        headline: string
        date: string
        source: string
        url?: string
      }>
      tech_stack_categorized?: Record<string, string[]>
      transformation_signals?: {
        ai_initiative?: boolean
        erp_modernization?: boolean
        data_transformation?: boolean
        digital_transformation?: boolean
        automation_initiative?: boolean
      }
      why_now_signals?: {
        new_cfo_hire?: boolean
        new_cio_hire?: boolean
        new_cto_hire?: boolean
        layoffs_announced?: boolean
        cost_cutting?: boolean
        mna_activity?: boolean
        expansion?: boolean
        first_data_hire?: boolean
      }
      data_team?: {
        has_data_engineers?: boolean
        data_team_size?: number
      }
    }
    finance_leaders_found?: Array<{
      name: string
      title: string
      linkedin_url?: string
    }>
    recommended_value_driver?: {
      driver?: string
      reasoning?: string
    }
  }
  context_for_outreach?: {
    talking_points?: string[]
    form_name?: string
    content_downloaded?: string[]
    content_id?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    country?: string
    // Signal history for multi-signal tracking (MQL qualification)
    signal_history?: Array<{
      type: string
      content?: string
      timestamp?: string
      form?: string
    }>
    engagement_count?: number
  }
}

export interface TrendData {
  date: string
  downloads: number
  high_quality: number
  converted: number
}
