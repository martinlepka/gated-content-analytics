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
  signal_tier: string
  lead_grade: string
  total_score: number
  icp_fit_score: number
  persona_score: number  // "Why Now" score (0-80) - synced with GTM Inbox
  intent_score: number
  action_status: string
  rejection_reason: string | null
  inbox_entered_at: string
  detected_persona: string
  content_name: string
  trigger_signal_type?: string
  signal_type_label?: string
  utm_source: string | null
  utm_campaign: string | null
  has_research: boolean
  in_salesforce: boolean
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
