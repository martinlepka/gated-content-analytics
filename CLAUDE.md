# CLAUDE.md

This file provides guidance to Claude Code when working with the Gated Content Analytics application.

## Project Overview

**Gated Content Analytics** is a standalone Next.js dashboard for agencies to view gated content performance, lead quality, and persona distribution. It uses the same Supabase GTM project and ICP scoring framework as the main GTM app.

## Current Status (2026-02-07)

| Component | Status | Notes |
|-----------|--------|-------|
| **Edge Function** | Deployed | `gated-content-api` on Supabase |
| **Frontend** | Deployed | https://gated-content-analytics.vercel.app/ |
| **GitHub** | Active | https://github.com/martinlepka/gated-content-analytics |
| **Data** | 23 downloads | From `inbox_leads` table |
| **AI Research Trigger** | Active | Added to `webflow-webhook` |

---

## How It Works - Complete Data Flow

### 1. Data Source (Webflow Forms)

```
User downloads gated content on keboola.com
         ↓
Webflow Form submission
         ↓
POST to webflow-webhook edge function
         ↓
Creates record in inbox_leads table
         ↓
Auto-triggers ai-research for enrichment
```

**Webflow Webhook Location:** `/GTM/supabase/functions/webflow-webhook/index.ts`

When `trigger_signal_type = 'webflow_content_download'`:
- Creates lead in `inbox_leads` table
- Stores content info in `context_for_outreach` JSONB
- Auto-triggers AI research (Apollo + Lusha + Gemini)

### 2. Database Table (inbox_leads)

This app queries the **existing** GTM table - no new tables created.

**Filter:** `WHERE trigger_signal_type = 'webflow_content_download'`

**Key Columns Used:**

| Column | Description |
|--------|-------------|
| `email` | Person's email address |
| `first_name`, `last_name` | Contact name |
| `title` | Job title (for persona detection) |
| `company_name`, `company_domain` | Company info (from enrichment) |
| `industry`, `employee_count` | Company firmographics |
| `signal_tier` | P0/P1/P2/P3 (ICP quality tier) |
| `total_score` | Combined score 0-220 |
| `icp_fit_score` | ICP fit 0-100 |
| `intent_score` | Intent signals 0-40 |
| `lead_grade` | A/B/C/D grade |
| `action_status` | new/working/done/rejected |
| `inbox_entered_at` | Download timestamp |
| `context_for_outreach` | JSONB with content_downloaded, UTMs |
| `ai_research` | JSONB with Gemini research results |
| `sf_lead_id` | Salesforce ID (if pushed) |

### 3. API Layer (Edge Function)

**Location:** `/GTM/supabase/functions/gated-content-api/index.ts`

**Base URL:** `https://jhglcgljsporzelhsvvz.supabase.co/functions/v1/gated-content-api`

| Action | Params | Returns |
|--------|--------|---------|
| `?action=overview` | - | Totals, tier distribution, persona breakdown, top content |
| `?action=leads` | `tier`, `status`, `limit`, `offset` | Lead list with filters |
| `?action=content-summary` | - | Content performance by asset |
| `?action=persona-summary` | - | Persona distribution |
| `?action=trend&days=30` | `days` | Daily download trend |
| `?action=campaigns` | - | UTM campaign performance |

**Persona Detection Logic:**

```typescript
function detectPersona(title: string): string {
  if (!title) return 'Unknown';
  const t = title.toLowerCase();
  if (/\bcfo\b|chief financial officer/i.test(t)) return 'CFO';
  if (/\bcontroller\b/i.test(t)) return 'Controller';
  if (/fp&a|financial planning/i.test(t)) return 'FP&A';
  if (/vp.*finance|head.*finance/i.test(t)) return 'VP Finance';
  if (/\bcto\b|chief technology/i.test(t)) return 'CTO';
  if (/\bcio\b|chief information/i.test(t)) return 'CIO';
  if (/finance|financial/i.test(t)) return 'Finance (Other)';
  return 'Other';
}
```

### 4. Enrichment Flow (AI Research)

When a gated content download occurs, AI research is triggered:

```
Lead Created → ai-research edge function
                    ↓
              1. Apollo Org Enrichment (company firmographics)
              2. Apollo People Search (finance leaders)
              3. Lusha Intent (buying signals)
              4. Gemini Analysis (news, transformation signals)
                    ↓
              Saved to inbox_leads.ai_research JSONB
```

**AI Research Data Structure:**

```typescript
{
  company?: {
    overview?: string,                    // Company description
    entity_structure?: { type, entity_count },
    financials?: { annual_revenue, market_cap, yoy_growth },
    tech_stack_categorized?: Record<string, string[]>,
    transformation_signals?: {
      ai_initiative?, erp_modernization?,
      data_transformation?, digital_transformation?
    },
    why_now_signals?: {
      new_cfo_hire?, new_cio_hire?, layoffs_announced?,
      cost_cutting?, mna_activity?, expansion?
    },
    data_team?: { has_data_engineers?, data_team_size? },
    recent_news?: Array<{ headline, date, source, url }>
  },
  finance_leaders_found?: Array<{ name, title, linkedin_url }>,
  recommended_value_driver?: { driver, reasoning }
}
```

### 5. ICP Scoring Model (MEDDPICC-style)

Leads are scored automatically when created:

**Score Components:**
| Category | Max Points | What It Measures |
|----------|------------|------------------|
| **ICP Fit** | 0-100 | Multi-entity, company age, legacy tech, industry |
| **Why Now** | 0-80 | Exec changes, layoffs, expansion, transformation |
| **Intent** | 0-40 | Website visits, 3rd party intent signals |
| **TOTAL** | **0-220** | Sum of all three |

**Tier Assignment:**
| Tier | Criteria | Meaning |
|------|----------|---------|
| **P0** | Total >= 150 AND ICP >= 60 AND WhyNow >= 30 | Immediate action |
| **P1** | Total >= 100 OR (ICP >= 70 AND WhyNow >= 20) | High priority |
| **P2** | Total >= 60 | Standard follow-up |
| **P3** | Total < 60 | Nurture only |

### 6. Lead Lifecycle

Records are **never deleted** - status changes tracked:

```
new → working → done (converted)
               ↘ rejected (disqualified)
```

| Status | Display | Meaning |
|--------|---------|---------|
| `new` | **New** (blue) | Fresh lead, unprocessed |
| `working` | **In Progress** (yellow) | Sales reviewing |
| `done` | **Converted** (green) | Moved to pipeline |
| `rejected` | **Disqualified** (gray) | Not ICP fit |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Light theme with cyberpunk accents)
- **Charts:** Recharts
- **Auth:** Simple password protection (session-based)
- **Backend:** Supabase Edge Functions (read-only API)
- **Database:** GTM Supabase project (jhglcgljsporzelhsvvz)
- **Deployment:** Vercel (auto-deploy from GitHub)

## Project Structure

```
Gated Content Analytics/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with AuthGate wrapper
│   │   ├── page.tsx              # Main dashboard (sortable table)
│   │   ├── content/page.tsx      # Content breakdown
│   │   └── leads/page.tsx        # Lead list with filters
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthGate.tsx      # Password protection (password stored here)
│   │   ├── charts/
│   │   │   ├── TrendChart.tsx
│   │   │   └── PersonaBarChart.tsx
│   │   └── dashboard/
│   │       ├── MetricCard.tsx
│   │       └── LeadDetailModal.tsx
│   └── lib/
│       └── supabase.ts           # API client + types
├── package.json
├── tailwind.config.ts
└── CLAUDE.md
```

---

## Authentication

Simple password-based access control for agency users.

### How It Works

1. **AuthGate Component** (`/src/components/auth/AuthGate.tsx`)
   - Wraps the entire app in `layout.tsx`
   - Shows login form if not authenticated
   - Password is stored as a constant in the component file

2. **Session Persistence**
   - Uses `sessionStorage` with key `gca_authenticated`
   - Auth persists until browser tab is closed
   - No server-side auth required

3. **Changing the Password**
   - Edit the `CORRECT_PASSWORD` constant in `AuthGate.tsx`
   - Redeploy to Vercel

### Login Flow
```
User visits app → AuthGate checks sessionStorage
                      ↓
              Not authenticated → Show login form
                      ↓
              Enter password → Validate against constant
                      ↓
              Correct → Set sessionStorage, show dashboard
              Wrong → Show error, clear input
```

---

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3001
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://jhglcgljsporzelhsvvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

### Vercel (Current)
- **URL:** https://gated-content-analytics.vercel.app/
- **GitHub:** https://github.com/martinlepka/gated-content-analytics
- **Auto-deploy:** On push to `main`

### Edge Function
```bash
cd /Users/lepka_martin/Documents/VSCode/GTM
npx supabase functions deploy gated-content-api --project-ref jhglcgljsporzelhsvvz --no-verify-jwt
```

## Related Files

| File | Purpose |
|------|---------|
| `/GTM/supabase/functions/gated-content-api/index.ts` | Analytics API |
| `/GTM/supabase/functions/webflow-webhook/index.ts` | Form webhook + AI research trigger |
| `/GTM/supabase/functions/ai-research/index.ts` | Enrichment (Apollo + Lusha + Gemini) |
| `/GTM/gtm-app/` | Main GTM application |

---

## Personal Email Handling

**Problem:** Personal emails (gmail, yahoo) cannot be enriched with company data.

**Solution:**
1. Detect personal email domains
2. Skip company research
3. Focus on person info from form (name, title)
4. Use regional/industry context if available

**Personal Email Domains:**
- gmail.com, googlemail.com
- yahoo.com, yahoo.*, ymail.com
- hotmail.com, outlook.com, live.com
- icloud.com, me.com, mac.com
- aol.com, protonmail.com

---

## Features Implemented

- Overview dashboard with metrics cards
- Download trend chart (30 days)
- Persona breakdown chart
- Full downloads table with sortable columns
- Column sorting (click header to toggle asc/desc)
- Status filter dropdown
- SOURCE column showing utm_source
- Color-coded TYPE badges (Demo=pink, Gated=cyan, Contact=orange, etc.)
- Clickable rows → Lead Detail Modal
- Modal with AI research display
- Rejection reason display in modal (when status=rejected)
- Prominent campaign name display in modal
- Content breakdown page (`/content`)
- Leads list page (`/leads`) with filters
- Password protection (session-based)
- Read-only access (no writes)

## Pending / Future

- [x] ~~Agency authentication~~ → Implemented as password protection
- [ ] Multi-agency data scoping (separate passwords per agency)
- [ ] Export to CSV
- [ ] Smart personal email handling

---

## Changelog

### 2026-02-07 (Update 3)
- Added password protection (AuthGate component)
- Session-based auth using sessionStorage
- Light theme with cyberpunk accents (replaced dark theme)
- Sortable table columns (click headers)
- Added SOURCE column showing utm_source
- Added STATUS column with color-coded badges
- Color-coded TYPE badges per signal type
- Slimmer table rows with tighter padding
- Rejection reason display in modal
- Prominent campaign name display in modal

### 2026-02-07 (Update 2)
- Comprehensive documentation update
- Added data flow diagrams
- Added personal email handling notes
- Added ICP scoring documentation

### 2026-02-07
- Initial release
- Overview dashboard with metrics and charts
- Full downloads table with lead details
- Lead Detail Modal with AI research display
- Content and Leads pages
- Deployed to Vercel
- AI research auto-trigger added to webflow-webhook
