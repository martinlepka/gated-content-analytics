# MQL Success Definition — Paid Social Campaigns

**For:** Paid social manager optimizing campaign spend.
**Status:** Draft — requires Martin's sign-off before being used as the campaign success metric.
**Last updated:** 2026-04-17

---

## The One-Paragraph Definition

> A paid social lead counts as a **campaign success only when it reaches MQL stage**. MQL is an automatic classification applied in the Gated Content Analytics app: the lead must meet all four Pre-MQL criteria (known company, finance persona, ICP fit score ≥ 30, and signals from 2+ different categories) **and** have been accepted into Discovery or TAL by the sales team. Pre-MQL alone is not success — it only means the lead is eligible for sales review. Lead volume, tier (P0–P3), or total score are diagnostic metrics, not success metrics; they are useful for debugging a campaign, but optimization decisions (budget, audience, creative) should be made against MQL count and MQL cost, not against raw downloads.

---

## Why this definition

**Lead volume can be faked by broad targeting — MQL cannot.**
A campaign that generates 100 downloads but 0 MQLs is burning money on personal-email newsletter subscribers, out-of-ICP companies, or anyone who filled the form to get the PDF. A campaign that generates 20 downloads but 5 MQLs is 5× more valuable to sales — even though the "leads" number looks smaller.

**Pre-MQL is a milestone, not a success metric.**
Pre-MQL means "the algorithm thinks this lead is worth a human look." MQL means "a human looked and agreed this belongs in the pipeline." Using Pre-MQL as the target would reward the algorithm, not the pipeline. Using MQL as the target rewards leads that actually become sales opportunities.

**Score and tier are inputs to MQL classification — not substitutes for it.**
A lead with total score 180 and tier P0 is likely to become an MQL, but may still be rejected for reasons the algorithm cannot see (competitor, current customer, spam). Optimizing on score would optimize on algorithm output; optimizing on MQL optimizes on sales-verified output.

---

## How to read this in the app

| In the CSV export column | What it means | Is this the success metric? |
|--------------------------|---------------|-----------------------------|
| `MQL` = **Yes** | Pre-MQL criteria met **and** accepted to Discovery/TAL | ✅ **Yes — this is the success metric** |
| `Pre-MQL` = Yes, `MQL` = No | Algorithm says "worth reviewing," sales hasn't decided yet | No — leading indicator only |
| `Tier` = P0 or P1 | Strong ICP + intent signals | No — input to MQL, not MQL |
| `Status` = Accepted | Sales accepted the lead | Necessary but not sufficient — must also meet Pre-MQL |
| `Total Score` ≥ 150 | Strong algorithmic score | No — predictor, not outcome |

---

## Ads manager's operating rules

1. **Report campaign performance in two numbers**: `Downloads` (volume) and `MQLs` (success). Both matter, but **budget decisions should follow MQL count and cost-per-MQL**.
2. **Expect a lag**: MQL classification requires sales review in the GTM app. A download today may become an MQL 1–5 business days later. Don't kill a campaign on day-1 data.
3. **Watch the conversion rate**: `MQLs ÷ Downloads` = campaign quality. Below ~5% means the campaign is bringing volume but not fit. Above ~15% means the campaign is reaching the ICP.
4. **Don't confuse `Accepted` status with MQL**: A lead can be `Accepted` by sales but still not meet Pre-MQL criteria (e.g., accepted as a relationship-build). Only the `MQL = Yes` column confirms MQL.

---

## Sign-off

- [ ] **Martin:** Confirm this definition is the one the ads manager should optimize against.
- [ ] **Martin:** Confirm the 5% / 15% thresholds in "Operating rules" (these are placeholders — adjust based on real campaign history).

Once signed off, this becomes the single source of truth for campaign-quality reporting.
