# Gated Content Analytics

Analytics dashboard for gated content downloads and lead quality. Built for agencies to view performance insights.

## Features

- **Overview Dashboard** - Total downloads, quality distribution, trends
- **Content Performance** - Breakdown by content piece with P0/P1/P2/P3 distribution
- **Lead List** - Full lead details with filters, status tracking, enrichment badges
- **Persona Detection** - Automatic classification (CFO, Controller, FP&A, etc.)

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts
- Supabase (read-only access to GTM project)

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your Supabase anon key

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy

## API Endpoints

The app uses the `gated-content-api` Supabase Edge Function:

| Endpoint | Description |
|----------|-------------|
| `?action=overview` | Dashboard summary metrics |
| `?action=leads` | Lead list with filters |
| `?action=content-summary` | Content performance |
| `?action=persona-summary` | Persona distribution |
| `?action=trend` | Daily download trend |
| `?action=campaigns` | UTM campaign performance |

## Data Source

Reads from `inbox_leads` table filtered by:
```sql
WHERE trigger_signal_type = 'webflow_content_download'
```

No write operations - completely read-only.
