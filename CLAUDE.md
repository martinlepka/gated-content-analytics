# CLAUDE.md

This file provides guidance to Claude Code when working with the Gated Content Analytics application.

## Project Overview

**Gated Content Analytics** is a standalone Next.js dashboard for agencies to view gated content performance, lead quality, and persona distribution. It uses the same Supabase GTM project and ICP scoring framework as the main GTM app.

## Architecture

```
Webflow Form → webflow-webhook → inbox_leads (existing GTM table)
                                       ↓
                              gated-content-api (Supabase Edge Function)
                                       ↓
                              This Dashboard (Next.js)
```

**Key Principle:** This app is READ-ONLY. It queries existing `inbox_leads` data filtered by `trigger_signal_type = 'webflow_content_download'`. No new tables or data modifications.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Backend:** Supabase Edge Functions (read-only API)
- **Database:** Same GTM Supabase project (jhglcgljsporzelhsvvz)

## Project Structure

```
Gated Content Analytics/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Overview dashboard
│   │   ├── content/page.tsx   # Content breakdown
│   │   └── leads/page.tsx     # Lead list
│   ├── components/
│   │   ├── charts/            # Recharts components
│   │   └── dashboard/         # UI components
│   └── lib/
│       └── supabase.ts        # API client
└── package.json
```

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3001
npm run build    # Production build
npm run lint     # ESLint
```

## API Endpoint

The app uses the `gated-content-api` Edge Function:

```
GET /gated-content-api?action=overview        # Dashboard metrics
GET /gated-content-api?action=leads           # Lead list with filters
GET /gated-content-api?action=content-summary # Content performance
GET /gated-content-api?action=persona-summary # Persona distribution
GET /gated-content-api?action=trend           # Daily trend (30 days)
GET /gated-content-api?action=campaigns       # UTM campaign performance
```

## Data Model (from inbox_leads)

| Field | Type | Description |
|-------|------|-------------|
| `signal_tier` | P0-P3 | Lead quality tier |
| `total_score` | 0-220 | Combined ICP + Why Now + Intent |
| `action_status` | new/working/done/rejected | Lead lifecycle |
| `context_for_outreach` | JSONB | content_downloaded, UTMs |
| `ai_research` | JSONB | AI research results (if available) |
| `sf_lead_id` | TEXT | Salesforce Lead ID (if pushed) |

## Persona Detection

Job titles are mapped to personas:
- CFO, Controller, FP&A, VP Finance, CTO, CIO, CDO
- Finance (Other), Data/Analytics, Other

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://jhglcgljsporzelhsvvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

This app should be deployed to Vercel separately from the main gtm-app:
1. Create new Vercel project
2. Connect to this directory
3. Set environment variables
4. Deploy

## Related Files

- Edge Function: `/GTM/supabase/functions/gated-content-api/index.ts`
- Main GTM App: `/GTM/gtm-app/`
