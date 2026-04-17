# Gated Content Analytics — Status, Score, Tier, and Source Guide

**Audience:** Paid social manager, marketing ops, sales, anyone reading the dashboard.
**Goal:** Read a lead row and know exactly what each field means, what triggered it, and how to act on it.
**Last updated:** 2026-04-17 (based on production data from 307 Webflow leads).
**Items marked ⚠️ NEEDS VERIFICATION** require Martin or a data engineer to confirm — the framework is correct but the specific numbers or labels may have drifted.

---

## 1. Lead Statuses

There are **two orthogonal classifications** on every lead. Don't confuse them:

- **Status (`action_status`)**: The *workflow state* — where the lead is in the human review process. Comes from the `inbox_leads.action_status` database column.
- **Pre-MQL / MQL flags**: Quality classifications computed on top of status. A lead can be `New` and Pre-MQL at the same time.

### 1.1 Status values (workflow state)

| Status label (UI) | DB value | Color | What it means | Triggered by | Typical time in status |
|-------------------|----------|-------|---------------|--------------|------------------------|
| **New** | `new` | cyan | Fresh lead, nobody has reviewed it yet. It sits in the Inbox waiting for sales review. | Webflow form submission → webhook creates the row with `action_status = 'new'`. | 0–48 hours (target: reviewed same business day). |
| **Research** | `researching` | purple | AI enrichment in progress — Apollo, Lusha, Gemini are actively running. The lead is locked from sales review until enrichment completes. | Auto-triggered the moment a `new` lead is created (see `webflow-webhook` → `ai-research` edge function). | 2–10 minutes (LLM + API latency). |
| **Working** | `working` | orange | A sales rep opened the lead in the GTM Inbox app and is actively qualifying it — reviewing research, deciding whether to accept or reject. | Sales rep clicks "Start working" in the GTM Inbox app. | Minutes to 1 business day. |
| **Accepted** | `done` + `rejection_reason` contains `auto_linked_to_discovery` or `auto_linked_to_tal` | green | Sales accepted the lead and it was auto-linked to a Discovery account or TAL list. **This is the status that matters for MQL.** | Sales rep clicks "Accept" in GTM Inbox → the accept handler sets `action_status='done'` and records why in `rejection_reason`. | Terminal — lead stays here. |
| **Merged** | `done` + `rejection_reason = auto_linked_existing` | green | Sales accepted the lead but it was auto-linked to an existing account (not a new Discovery/TAL entry). | Same as Accepted, but the lead matched an existing company record. | Terminal. |
| **Done** | `done` + no `rejection_reason` | green | Sales processed the lead manually (not through the auto-link flow). Rare. | Manual handling in the GTM Inbox. | Terminal. |
| **Rejected** | `rejected` | red | Sales disqualified the lead. A reason is attached in `rejection_reason` (e.g. `not_icp`, `current_customer`, `competitor`, `keboola_partner`, `spam_invalid`, personal-email domain). | Sales rep clicks "Reject" and picks a reason. | Terminal. |
| **Converted** ⚠️ NEEDS VERIFICATION | `converted` | (no UI label) | Legacy or undocumented status — 5 leads in production have this value. Not filtered in the dashboard and not explained in `CLAUDE.md`. Could be a historical enum before the schema was refactored. | Unknown — needs data-engineering confirmation. | Terminal. |

> **Production distribution (307 Webflow leads, 2026-04-17):**
> Rejected 40% · Accepted/Done 24% · New 20% · Working 14% · Converted 2% (legacy)

### 1.2 Pre-MQL and MQL (quality classifications, not statuses)

Pre-MQL and MQL are **derived flags** computed in the frontend (see `isPreMql()` and `isMql()` helpers in `src/app/page.tsx`). They are not stored in the DB — the app computes them on the fly based on score + status + signal history.

| Label | Triggered when | What it signals |
|-------|----------------|-----------------|
| **Pre-MQL** | All four criteria met: (1) known company, (2) persona_score ≥ 18 OR tier P0/P1, (3) icp_fit_score ≥ 30, (4) signals from 2+ different categories. AND the lead is not rejected and not `done` without auto-link. | "The algorithm thinks this lead is worth a sales look." Leading indicator — not yet confirmed by a human. |
| **MQL** | Pre-MQL criteria met **AND** `action_status = done` with auto-link (= Accepted). | "A human accepted this lead into the pipeline." This is the **paid-campaign success metric** (see `MQL-SUCCESS-DEFINITION.md`). |

**Signal categories** (need 2+ for Pre-MQL):
1. Webflow Form (eBook, demo, contact, newsletter)
2. RB2B website visit (identified visitor)
3. 3rd party intent (G2, Lusha, Apollo buying signals)
4. Company signals (transformation / why-now signals from AI research)

---

## 2. Lead Score

The score is the **algorithmic ICP + intent estimate** — how well does this person/company match our Ideal Customer Profile, and how strong are the buying signals right now.

### 2.1 How it's computed

`total_score = icp_fit_score + persona_score + intent_score`

| Component | Stored as | Theoretical max | Real-world max (production) | What it measures |
|-----------|-----------|-----------------|-----------------------------|------------------|
| **ICP Fit** | `icp_fit_score` | 100 | 78 | Multi-entity structure, company age, legacy tech (Oracle/SAP/AS400), target industry, employee band (200–5000). |
| **Persona / Why-Now** ⚠️ NEEDS VERIFICATION | `persona_score` | 80 (per `CLAUDE.md`) | 35 | The app's Lead type comments say this field is "Why Now score (0–80)", but the label reads "Persona". Likely they were merged or renamed — **needs data-engineering confirmation** whether this is persona seniority (CFO=25, VP Finance=22, Controller=20, FP&A=20) or transformation signals (new CFO hire, layoffs, M&A). |
| **Intent** | `intent_score` | 40 (per `CLAUDE.md`) | 55 | 3rd party intent signals (G2, Lusha, Apollo). Real data shows max 55, so the documented cap is outdated. |
| **Total** | `total_score` | 220 | **140** (one lead) | Sum of the three. |

### 2.2 Score ranges — what's strong vs weak (based on production)

| Total score range | # leads in prod (n=307) | Interpretation |
|-------------------|-------------------------|----------------|
| 0–19 | ~55% | Weak — typically out-of-ICP, personal email, or no company enrichment. |
| 20–49 | ~25% | Below average — partial fit. |
| 50–99 | ~15% | Decent — worth sales attention, usually P2. |
| 100–149 | ~5% | Strong — P1 territory, likely Pre-MQL if signals diverse. |
| 150+ | 0 leads today | The documented "P0 threshold" — no production lead has hit this yet. |

**Average across all Webflow leads: 26.** Anything above ~50 is already above average; above ~100 is top 5%.

> **"Is 50+ the quality threshold?"** — Not directly. The app uses **tier + Pre-MQL criteria**, not a raw score threshold. A score of 80 in tier P3 is a weaker signal than score 45 in tier P1 (because tier also weighs signal diversity and ICP fit separately).

---

## 3. Lead Tier

Tier is the **prioritization bucket** assigned after scoring. It combines score with signal quality (not just total_score).

### 3.1 How tiers are assigned

Per `GTM/Gated Content Analytics/CLAUDE.md`:

| Tier | Assignment rule | Meaning |
|------|-----------------|---------|
| **P0** | Total ≥ 150 AND ICP ≥ 60 AND Why-Now ≥ 30 | Immediate action — sales should contact same hour. |
| **P1** | Total ≥ 100 OR (ICP ≥ 70 AND Why-Now ≥ 20) | High priority — reach out within 24 hours. |
| **P2** | Total ≥ 60 | Standard follow-up — reach out within the week. |
| **P3** | Total < 60 | Nurture — automated touch only, not worth sales time. |

### 3.2 Score ≠ Tier — why

A lead can have a high `total_score` but still land in a lower tier if the score comes from a single signal category. Conversely, a low-score lead can be P1 if ICP and Why-Now are both excellent even without Intent signals.

**Production proof** (tier distribution across 307 Webflow leads):

| Tier | n | Avg score | Min | Max |
|------|---|-----------|-----|-----|
| P0 | 1 | 109 | 109 | 109 |
| P1 | 43 | 35 | 0 | 140 |
| P2 | 46 | 45 | 20 | 96 |
| P3 | 217 | 19 | 0 | 94 |

Notice P1 contains a lead with total_score = 0 — because it hit the OR-branch (ICP ≥ 70 AND Why-Now ≥ 20) despite zero intent. Notice P3 contains a lead with score 94 — tier assignment is not a pure monotonic function of score. **Always use tier for prioritization, not score.** ⚠️ NEEDS VERIFICATION — one P1 with score 0 is suspicious; data engineering should confirm the tier-assignment code matches the documented rules.

---

## 4. Lead Source

This is the **single most confusing field** in the dashboard. There are **two different "source" concepts** in the data model, and they are often conflated.

### 4.1 The two "sources"

| Concept | DB field | Where it comes from | Example values |
|---------|----------|---------------------|----------------|
| **UTM source** | `context_for_outreach.utm_source` (JSONB) | The `?utm_source=...` query parameter in the landing-page URL. Controlled by the marketer when building the ad/email link. | `facebook`, `linkedin`, `customer.io`, `linkedin.com`, `fb`, `fi-assessment` |
| **Pipeline (signal) source** | `trigger_signal_type` | The backend-assigned label for *which form type* created the lead. Set by the `webflow-webhook` edge function based on form metadata. | `webflow_content_download`, `webflow_newsletter`, `webflow_demo_request`, `webflow_contact`, `webflow_webinar_reg`, `webflow_event_reg`, `webflow_popup`, `webflow_form` |

**In the app UI:**
- The **SOURCE column** in the downloads table shows **UTM source** (where the user came from).
- The **TYPE column** (colored badge) shows the **pipeline source** (what kind of form they filled).

### 4.2 What a value like "facebook" means

Per the production data (2026-04-17):

- `facebook` (105 leads) = the user clicked a Facebook paid ad (the ad URL contained `?utm_source=facebook&utm_medium=cpc&utm_campaign=dis_mix_file_the-cfo-intelligence-transformation-blueprint_conv`). **The Facebook Ads platform itself is not integrated** — we only see `facebook` if the ad URL was tagged with `utm_source=facebook`.
- `customer.io` (57 leads) = the user clicked a link inside a Customer.io email (our marketing automation platform).
- `linkedin` / `linkedin.com` (8 leads) = LinkedIn paid or organic (the two variants indicate inconsistent tagging — should be unified).
- `fb` (1 lead) = Facebook, but the marketer used `fb` instead of `facebook`. **Tagging inconsistency — normalize during export/analysis.**
- `fi-assessment` (1 lead) = internal property (the FI Assessment quiz linked to a gated piece).

### 4.3 Common source values (from production)

| `utm_source` | Count | What it really is |
|-------------|-------|-------------------|
| `facebook` | 160+ | Facebook ads (paid) — always combined with `utm_medium=cpc` |
| `customer.io` | 57 | Email nurture links |
| NULL / empty | 54 | Direct traffic, organic, or UTM stripped somewhere in the redirect chain |
| `linkedin`, `linkedin.com` | 8 | LinkedIn (tagging inconsistent) |
| `Odds are even...`, `Was`, `Adelaide, Australija`, `45` | 20+ | **Garbage values** — users or a broken form accidentally wrote text into the UTM field. Should be filtered / cleaned. ⚠️ NEEDS VERIFICATION — likely a Webflow form wiring bug where a free-text field is being passed as utm_source. |

### 4.4 Rule of thumb

- If you want to know **which paid channel** drove the lead, look at `utm_source` + `utm_medium`.
- If you want to know **what kind of content** the lead downloaded, look at `trigger_signal_type` (= TYPE column) and `content_name` (= CONTENT column).
- Never compare `facebook` (paid) vs `webflow_content_download` — they are two different axes.

---

## 5. Other Fields That May Confuse

| Field | Where it comes from | What to know |
|-------|---------------------|--------------|
| `lead_grade` (A/B/C/D) | Assigned by the scoring algorithm — broader bucket than tier. A ≈ P0, D ≈ P3. | Used in CSV export as "Grade". |
| `total_score` vs `Total Score` column | Same value — integer 0–220 (theoretical), 0–140 (real). | — |
| `Content Downloaded` vs `content_name` | Pulled from `context_for_outreach.content_downloaded` or `form_name`. | For gated content it's the eBook title; for newsletter it's the form name. |
| `Has AI Research` (Yes/No) | True if `ai_research` JSONB is non-empty. | No ≠ bad lead — just means enrichment hasn't completed yet. |
| `In Salesforce` (Yes/No) | True if `sf_lead_id` or `sf_contact_id` exists. | Means the lead is synced to Salesforce — usually follows Accept. |
| `inbox_entered_at` | Timestamp when the webhook fired and the row was inserted. | For gated content this equals the download timestamp (form submit = PDF delivery). |
| `last_action_at` | Timestamp of the last `action_status` change. | Used for the "Last status change date" column in CSV export. |
| `rejected_at` | Timestamp set only when `action_status = rejected`. | Redundant with `last_action_at` for rejected leads. |

---

## 6. What needs human verification before this document is final

The items marked ⚠️ NEEDS VERIFICATION above, consolidated:

1. **Status `converted`** — 5 production leads have this value but the frontend has no label for it. Is this legacy? A planned status? Should it map to Accepted? → **Ask:** data engineering.
2. **`persona_score` semantics** — The TS type comment says it represents "Why Now" (0–80), but the field name is `persona_score`. The `why_now_score` column also exists separately. Which field feeds which part of the algorithm? → **Ask:** whoever owns the scoring code (`scoring.ts`).
3. **Intent score cap** — Documented as 0–40, actual max in production is 55. Did the cap change and docs didn't? → **Ask:** data engineering.
4. **Tier P1 with score = 0** — One production lead. Either the ICP/Why-Now OR-branch fired on zero signals, or the tier-assignment code doesn't match the documented rules. → **Ask:** data engineering.
5. **Garbage `utm_source` values** (`"Adelaide, Australija"`, `"Was"`, `"45"`) — where are these coming from? Webflow form field mis-wiring? → **Ask:** whoever owns the Webflow forms / webhook.
6. **Operating thresholds** in `MQL-SUCCESS-DEFINITION.md` (5% / 15% conversion) — placeholder values. → **Ask:** Martin to confirm with real campaign history.

---

## 7. Source of truth (for future edits)

- Status workflow & rejection reasons: `GTM/Gated Content Analytics/CLAUDE.md` §6
- Score algorithm: `GTM/gtm-app/src/lib/scoring.ts`
- Pre-MQL / MQL logic: `GTM/Gated Content Analytics/src/app/page.tsx` (`isPreMql`, `isMql`, `countSignalCategories`)
- Tier thresholds: `GTM/CLAUDE.md` → "Pre-MQL / MQL Funnel" + `GTM/Gated Content Analytics/CLAUDE.md` §5
- Webhook & signal types: `GTM/supabase/functions/webflow-webhook/index.ts`
- UTM field mapping: `GTM/supabase/functions/webflow-webhook/index.ts` (search for `utm_source`)

Whenever one of the ⚠️ items gets verified, update this file and the Changelog below.

---

## Changelog

- **2026-04-17** — Initial version. Based on 307 Webflow leads in production.
