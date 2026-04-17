# MQL Success Definition — Paid Social Campaigns

**For:** Paid social manager optimizing campaign spend.
**Status:** Draft — requires Martin's sign-off before being used as the campaign success metric.
**Source of truth:** `GTM/team-outreach/src/lib/inbound-scoring.ts` (weighted touchpoint scoring). This document describes the same model applied to paid social leads.
**Last updated:** 2026-04-17 (v2 — switched from "4 signal categories" framing to the weighted touchpoint model used in Team Outreach).

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

## How to read this in the app today — and the known gap

The existing Gated Content Analytics dashboard has `PRE-MQL` and `MQL` badges, **but they are computed from a different (older) model** (4 "signal categories" + sales acceptance for MQL). As of 2026-04-17:

| Label in the app | How the app currently computes it | How this document defines it |
|------------------|-----------------------------------|------------------------------|
| **Pre-MQL** badge | `isPreMql()` in `src/app/page.tsx` — requires 2+ signal categories + ICP fit ≥ 30 + persona_score ≥ 18 | 1 touchpoint + ICP + persona |
| **MQL** badge | `isMql()` = Pre-MQL criteria + sales-accepted status | 2+ touchpoints + ICP + persona (sales acceptance not required) |

**Implication for the ads manager *right now*:**
- The **MQL** badge in today's app is a *conservative* MQL (it also requires sales acceptance). If you count only those, you will *undercount* the true MQL population — but everything you count is definitely real.
- The **Pre-MQL** badge in today's app is a *stricter* Pre-MQL (2+ signal categories, not just 1 touchpoint). So today's "Pre-MQL" column mostly matches the new "MQL" definition minus sales acceptance.

**Recommended interim rule:**
Until the app is updated, use the CSV export and compute MQL yourself by counting unique Tier-1 touchpoints per email address across all `inbox_leads` rows (same email + different `content_name` or different signal type = 2 touchpoints). That matches the Team Outreach scoring exactly.

**Action item:** Replace `isPreMql()` / `isMql()` in `Gated Content Analytics/src/app/page.tsx` with calls to the same weighted-scoring model used in Team Outreach (`inbound-scoring.ts`), so that the app's badges and the Team Outreach inbound-leads page agree. Tracked as a follow-up item under MKT-253 (or new issue).

---

## Ads manager's operating rules

1. **Report campaign performance in three numbers**: `Leads` (all form fills), `Pre-MQLs` (one Tier-1 touchpoint, ICP + persona), `MQLs` (≥ 2 weighted points, ICP + persona). Budget decisions follow **cost-per-MQL** — not cost-per-lead.
2. **Expect a multi-touch lag**: most MQLs are built across *several* ad interactions over days/weeks (ebook → webinar; ebook → FI Assessment). Don't judge a campaign on day-1 data; the second touchpoint usually comes later.
3. **Watch Pre-MQL → MQL conversion**: the share of Pre-MQLs that come back for a second touchpoint is the real campaign-quality signal. A campaign producing 100 Pre-MQLs and 5 MQLs (5 %) is weaker than one producing 30 Pre-MQLs and 10 MQLs (33 %).
4. **Newsletter signups don't count**: a newsletter-only submission is not a qualifying touchpoint by itself. It's a list-build, not buying intent.
5. **Don't confuse ICP score with MQL**: a lead can have ICP fit score 90 and *still* be Pre-MQL if it only has one touchpoint. Engagement is the MQL driver, not the algorithm.

---

## Sign-off

- [ ] **Martin:** Confirm this weighted-touchpoint definition is the campaign success metric.
- [ ] **Martin:** Confirm the **2.0 weighted-points** threshold (same as Team Outreach) is correct for paid social too, or whether paid social should have a different threshold.
- [ ] **Martin:** Decide whether the Gated Content Analytics app should be updated to use the weighted-scoring model (replacing the current `isPreMql()` / `isMql()` logic) so that the UI badges match this definition.

Once signed off, this becomes the single source of truth for campaign-quality reporting.
