import { createClient } from '@supabase/supabase-js'

// Supabase GTM project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jhglcgljsporzelhsvvz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Types for API responses
export interface OverviewData {
  total_downloads: number
  high_quality_count: number
  high_quality_pct: number
  converted_count: number
  converted_pct: number
  avg_score: number
  by_tier: { P0: number; P1: number; P2: number; P3: number }
  by_status: { new: number; working: number; done: number; rejected: number }
  by_content: ContentSummary[]
  by_persona: PersonaSummary[]
}

export interface ContentSummary {
  content_name: string
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
  intent_score: number
  action_status: string
  rejection_reason: string | null
  created_at: string
  detected_persona: string
  content_name: string
  utm_source: string | null
  utm_campaign: string | null
  has_research: boolean
  in_salesforce: boolean
  in_discovery: boolean
}

export interface TrendData {
  date: string
  downloads: number
  high_quality: number
  converted: number
}
