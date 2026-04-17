# MQL Success Definition — Paid Social Campaigns

**For:** Paid social manager optimizing campaign spend.
**Status:** Draft — requires Martin's sign-off before being used as the campaign success metric.
**Source of truth:** `GTM/team-outreach/src/lib/inbound-scoring.ts` (weighted touchpoint scoring, shared helper). This document describes the same model applied to paid social leads.
**App implementation:** `GTM/Gated Content Analytics/src/lib/mql-classification.ts` (derived from the same spec, same excluded-types list, same dedup rule).
**Last updated:** 2026-04-17 (v3 — Gated Content Analytics app now implements this definition directly; the "known gap" from v2 is closed).

---

## The One-Paragraph Definition

> A paid social lead counts as a **campaign success (MQL) only when all three conditions hold**: (1) the lead came from the campaign (identifiable via UTM), (2) the company and the person both fit ICP — firmographics (company size, industry) **and** a finance-leader persona (CFO, Controller, VP Finance, FP&A, Finance Director, Head of Finance) — and (3) the lead has **two or more qualifying touchpoints** with Keboola, following the exact weighted-scoring model used in Team Outreach (≥ 2.0 weighted points across Tier 1 first-party signals). A lead that satisfies (1) and (2) but has **only one real touchpoint** (typically a single gated-content download or a webinar registration) is **Pre-MQL** — same ICP + persona fit, but the engagement intensity is not yet MQL-strength.

---

## The model — identical to Team Outreach inbound scoring

Exactly the same signal weights and qualification logic as `GTM/team-outreach/src/lib/inbound-scoring.ts`:

### Tier 1 — First-party signals (1.0 point each)
| Touchpoint | Data source |
|------------|-------------|
| Content download (ebook, guide, whitepaper) | `inbox_leads` → `trigger_signal_type = webflow_content_download` |
| Webinar registration | `inbox_leads` → `webflow_webinar_reg` |
| FI Assessment completion | `inbox_leads` → `trigger_signal_source = fi_assessment` |
| Email link click from sequence | `outreach_queue` → `link_clicked_at IS NOT NULL` |
| RB2B website visit (DIRECT_PERSON) | `inbox_leads` → `rb2b` with real email + DIRECT_PERSON attribution |
| Content page deep read (>30 % scroll or >30 s) | `content_tracking_tokens` / `content_page_events` |

### Tier 2 — Third-party / account-level signals (0.25 points each)
| Touchpoint | Data source |
|------------|-------------|
| G2 intent | `inbox_leads` → `g2` (account-level) |
| Lusha intent | `inbox_leads` → `lusha_intent_discovery` |
| RB2B visit (ACCOUNT_LEVEL) | `inbox_leads` → `rb2b` with `unknown@` email |

### Excluded (never counted)
- Email opens without clicks (too weak).
- Newsletter signup alone (captures list-builders, not buyers).
- `calcom` bookings (these are the outcome, not a qualifying touchpoint).
- Legacy Instantly signals.

### Deduplication rule
Same content, same day = **one** touchpoint. Downloading the same ebook twice from two ad clicks = 1 point, not 2.

### Qualification threshold
**2.0 weighted points** AND at least one non-email-click Tier-1 signal (so that inbox-scanner bots clicking email links don't fake qualification).

---

## MQL vs Pre-MQL — the only difference is touchpoint intensity

Both require ICP + persona. The split is entirely about signal strength.

| | **Pre-MQL** | **MQL** |
|---|-------------|---------|
| Came from campaign (UTM match) | ✅ required | ✅ required |
| Company ICP fit (firmographic: size 200–5,000 employees, target industry) | ✅ required | ✅ required |
| Person ICP fit (finance leader persona) | ✅ required | ✅ required |
| Weighted touchpoint score | **~1.0** (typically one content download or one webinar reg) | **≥ 2.0** (two or more Tier-1 touchpoints, or one Tier-1 + several Tier-2) |
| Meaning | "Self-identified as potentially interested. Worth nurturing." | "Sustained, multi-signal engagement. Ready for 1:1 sales outreach." |
| Action | Enroll in automated nurture sequence. | Ads manager counts as **campaign success**. Sales reviews for Discovery/TAL. |

### Concrete examples (using the real weights)
- Downloaded *one* ebook → 1.0 point → **Pre-MQL**.
- Downloaded ebook + newsletter signup → 1.0 point (newsletter not counted) → **Pre-MQL**.
- Downloaded ebook + registered for webinar → 2.0 points → **MQL**. ✅
- Downloaded ebook + completed FI Assessment → 2.0 points → **MQL**. ✅
- Downloaded ebook + G2 intent + Lusha intent → 1.0 + 0.25 + 0.25 = 1.5 → **Pre-MQL** (close, not yet MQL).
- Downloaded ebook + G2 intent + Lusha intent + RB2B account visit → 1.0 + 0.75 = 1.75 → **Pre-MQL** still.
- Two ebooks on the same day → 1.0 point (dedup) → **Pre-MQL**.
- Two ebooks on different days → 2.0 points → **MQL**. ✅

---

## Why this definition

**MQL is defined by engagement intensity, not by algorithm opinion or sales acceptance.**
A high-volume campaign can flood the system with one-touch downloads and still produce zero MQLs — because one touchpoint is a *signal*, not a *commitment*. Two or more touchpoints means the person came back, which is the behavioral proof that beats any algorithmic ICP score.

**Pre-MQL is a nurturable lead, not a failed MQL.**
Pre-MQL is a healthy, expected state. Most campaign leads start as Pre-MQL and should be moved through nurture to a second touchpoint. The goal is **Pre-MQL → MQL conversion**, not avoiding Pre-MQL altogether.

**Sales acceptance is not part of this definition.**
Whether a sales rep accepts the lead into Discovery/TAL is a downstream process metric (Accepted status). It belongs in the sales funnel report, not in the campaign-quality scorecard. A lead can be an MQL and still be rejected (duplicate, competitor, timing) — the campaign still did its job.

---

## How to read this in the app

As of **2026-04-17**, the Gated Content Analytics app implements this definition directly. The logic lives in `src/lib/mql-classification.ts` and is shared across the downloads table (`page.tsx`), the Lead → Pre-MQL → MQL funnel card (`LeadMQLFunnel.tsx`), and the Lead Detail Modal (`LeadDetailModal.tsx`).

| Label in the app | Meaning |
|------------------|---------|
| **Lead** (no badge) | ICP fit or finance persona missing — or the lead was rejected. Not a campaign-quality outcome. |
| **PRE-MQL** (amber badge) | ICP + finance persona + **1** qualifying touchpoint. Nurture to second touchpoint. |
| **MQL** (green badge) | ICP + finance persona + **2 or more** qualifying touchpoints. Campaign success. |

**Qualifying Tier-1 touchpoints** (each = 1 point):
- `webflow_content_download` (ebook, guide, whitepaper)
- `webflow_webinar_reg` (webinar registration)
- `webflow_event_reg` (in-person event registration)
- `webflow_demo_request` (demo request)

**Not qualifying** (explicitly excluded): `webflow_newsletter`, `webflow_popup`, `webflow_contact`, `webflow_form`. These are list-builders / low-intent signals.

**Dedup rule**: same signal type + same content + same day = 1 touchpoint.

**The CSV export** already includes per-lead `Pre-MQL` and `MQL` columns (`Yes` / `No`) computed from this logic. Bára can filter on `MQL = Yes` for campaign-success counts, and `Pre-MQL = Yes` for the "waiting for a second touchpoint" nurture queue. The Lead Detail Modal shows the three-criteria checklist (ICP / Finance Persona / Touchpoints) explicitly so anyone reviewing a lead can see why a given classification was assigned.

---

## Ads manager's operating rules

1. **Report campaign performance in three numbers**: `Leads` (all form fills), `Pre-MQLs` (one Tier-1 touchpoint, ICP + persona), `MQLs` (≥ 2 weighted points, ICP + persona). Budget decisions follow **cost-per-MQL** — not cost-per-lead.
2. **Expect a multi-touch lag**: most MQLs are built across *several* ad interactions over days/weeks (ebook → webinar; ebook → FI Assessment). Don't judge a campaign on day-1 data; the second touchpoint usually comes later.
3. **Watch Pre-MQL → MQL conversion**: the share of Pre-MQLs that come back for a second touchpoint is the real campaign-quality signal. A campaign producing 100 Pre-MQLs and 5 MQLs (5 %) is weaker than one producing 30 Pre-MQLs and 10 MQLs (33 %).
4. **Newsletter signups don't count**: a newsletter-only submission is not a qualifying touchpoint by itself. It's a list-build, not buying intent.
5. **Don't confuse ICP score with MQL**: a lead can have ICP fit score 90 and *still* be Pre-MQL if it only has one touchpoint. Engagement is the MQL driver, not the algorithm.

---

## Sign-off

- [x] Confirm weighted-touchpoint definition is the campaign success metric. *(Confirmed by Martin, 2026-04-17.)*
- [x] Update the Gated Content Analytics app to use this model. *(Shipped 2026-04-17 — see `src/lib/mql-classification.ts`.)*
- [ ] **Martin:** Confirm the touchpoint threshold for paid social — currently **2+ Tier-1 touchpoints** (same as Team Outreach). Raise or lower if paid social needs a different bar.
- [ ] **Martin:** Optionally extend the qualifying-touchpoint set. Currently only Webflow-surface Tier-1 signals are counted (content download, webinar reg, event reg, demo request). If RB2B visits or FI Assessment completions should also count toward MQL in this dashboard, we need to expose those signal types in the Gated Content Analytics data feed (today the app filters `trigger_signal_type LIKE 'webflow_%'`).

Once the remaining two items are confirmed, this is the single source of truth for campaign-quality reporting.
