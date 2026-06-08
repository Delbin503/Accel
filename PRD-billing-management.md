# PRD: Billing Management — UX & Product Improvements

**Product:** Accel TRMS Dashboard  
**Feature area:** Billing Management (`/billing`)  
**Access:** Owner role only  
**Date:** 2026-06-07  
**Status:** Draft

---

## Overview

The current billing page covers plan selection, seat management, and invoice history. This PRD defines the UX gaps and improvements identified through design review, covering the full billing lifecycle: onboarding payment, subscription management, seat usage, invoicing, and cancellation.

---

## 1. Cancellation Grace Period

**Problem:** When an owner cancels a subscription, the billing page shows no indication of remaining access. The `cancelled` status is applied immediately with no visual distinction between "cancelled but still active" and "cancelled and expired."

**Solution:** Introduce a `cancelling` status distinct from `cancelled`. When a subscription is in the `cancelling` state, display a countdown banner on the billing page showing days remaining until access ends, with an "Undo cancellation" CTA that reverts to `active`.

**Behaviour:**
- Cancellation schedules the end date at the close of the current billing cycle
- Banner shows: *"Your [Plan] subscription for [Site] ends in X days — Undo cancellation"*
- After the end date passes, status transitions to `cancelled` and access becomes read-only
- Banner is shown only on the billing page (not globally)

---

## 2. Multi-Card Payment Method Wallet

**Problem:** There is no payment method management on the billing page. Owners cannot see what card is on file, update an expiring card, or add a backup.

**Solution:** Add a "Payment Methods" section to the billing page.

**Behaviour:**
- Display all saved cards showing: card brand, last 4 digits, expiry month/year, and default badge
- One card is designated as the default — used for all automatic renewals and overages
- Owners can: add a new card (via modal), remove a card, and set any card as default
- A card cannot be removed if it is the only one on file
- "Update card" modal reuses the same card input form as onboarding

---

## 3. Failed Payment Handling

**Problem:** If a renewal charge fails, there is no UI to surface the failure, no retry path, and no clear indication of how long access will continue.

**Solution:** Surface failed payment state on invoices and enforce a 7-day grace window.

**Behaviour:**
- Failed invoices display a `destructive` status badge and an inline "Retry payment" button
- Clicking "Retry payment" prompts the owner to select a card from their wallet and re-attempt
- On failure, the subscription enters a `payment_failed` status — access continues for 7 days
- A warning banner on the billing page counts down the grace window: *"Payment failed — you have X days to update your card before access is restricted"*
- After 7 days with no successful payment, the subscription moves to read-only

---

## 4. Invoice Filtering

**Problem:** The invoice list is a flat, unfiltered list. Owners managing multiple sites will see invoices from all sites mixed together with no way to isolate or search.

**Solution:** Add a filter bar above the invoice table.

**Filters:**
- Site (multi-select dropdown)
- Status: All / Paid / Failed / Pending / Refunded
- Date range picker (from / to)

**Behaviour:**
- Filters are applied client-side
- Active filters show as dismissible chips above the table
- "Clear all filters" resets to default view

---

## 5. Seat & Camera Usage Summary

**Problem:** There is no usage indicator per subscription. Owners cannot see how many seats or cameras they are consuming relative to their plan limits, and receive no warning before hitting a cap.

**Solution:** Add a "Usage" section per site subscription card.

**Display:**
- Seats used / seats included in plan (e.g. "7 / 10 seats")
- Cameras connected / camera limit (e.g. "4 / 5 cameras")
- Progress bar for each metric:
  - 0–79%: default colour
  - 80–99%: warning (`warning-500`)
  - 100%+: destructive with overage label

**Overage behaviour:**
- Owners can exceed plan limits — no hard block
- Overage seats and cameras are charged at per-unit rates shown inline
- Overage charges appear as a line item on the next invoice

---

## 6. Plan Change Proration

**Problem:** When an owner changes plan tiers, there is no breakdown of what they will be charged or credited. The financial impact is opaque.

**Solution:** Show a proration confirmation modal before applying any plan change.

**Upgrade (immediate):**
- Modal shows: credit for unused days on current plan, charge for remaining days on new plan, net amount due today
- Example: *"Credit for 14 remaining days on Starter: −$23 · Professional charge for 14 days: $47 · Total due now: $24"*
- Confirmed upgrade takes effect immediately

**Downgrade (end of cycle):**
- Modal shows the effective date (end of current billing cycle)
- Current plan remains active until that date
- No proration refund — downgrade is scheduled, not immediate
- A "Scheduled downgrade" badge appears on the subscription card until the change applies

---

## 7. Billing Details

**Problem:** Downloaded invoices contain no company or tax information. B2B customers require VAT numbers, company names, and billing addresses on invoices for finance/procurement.

**Solution:** Add a "Billing Details" section to the billing page.

**Fields:**
- Billing email (defaults to account email, editable)
- Company / organisation name
- Tax ID / VAT number
- Billing address (street, city, state/province, postcode, country)

**Behaviour:**
- Details apply to all invoices across all sites under this owner account
- All fields are optional except billing email
- Saved details populate on all future invoice PDFs and are shown on the invoice detail view

---

## 8. Renewal Reminders

**Problem:** Owners on annual plans may be unaware of an upcoming large charge. There is no proactive reminder UX.

**Solution:** Surface renewal reminders in two places when a renewal is within 14 days.

**Billing page banner:**
- Dismissible banner per subscription approaching renewal
- *"[Plan] for [Site] renews on [Date] for $[Amount] — Update payment method"*
- Links to the Payment Methods section

**In-app notification (bell icon):**
- Notification appears in the notification centre 14 days before renewal
- Notification text: *"[Site] subscription renews in X days ($[Amount])"*
- Clicking the notification navigates to the billing page
- Notification is dismissed once the renewal processes successfully

---

## 9. Multi-Site Spend Summary

**Problem:** Owners with multiple sites must mentally sum costs across subscription cards. There is no consolidated financial view.

**Solution:** Add a summary bar at the top of the billing page, above the site subscription list.

**Displays:**
- Total active sites
- Total monthly spend (sum of all active subscription monthly costs)
- Total seats across all sites
- Total cameras across all sites

**Notes:**
- Invoices remain per-site — no consolidated invoice
- Summary bar updates in real time as subscriptions are added, cancelled, or changed

---

## 10. Post-Payment Success Screen

**Problem:** After completing onboarding payment, the user receives only a toast notification before being redirected to the dashboard. For payments of $500–$1,200+, this is insufficient feedback.

**Solution:** Replace the post-payment toast with a dedicated full-screen success page.

**Content:**
- Success icon and headline: *"You're all set"*
- Receipt summary:
  - Plan name and tier
  - Site name
  - Billing cycle (monthly / annual)
  - Amount charged
  - Next renewal date
- "Download receipt" button
- "Go to dashboard" CTA button

**Behaviour:**
- Page is shown immediately after payment confirmation
- Owner must actively click "Go to dashboard" — no auto-redirect
- Receipt is also available on the billing page invoice list

---

## Access Control

All billing features are restricted to the **Owner** role only. Admins and standard users have no access to the billing page, payment methods, plan management, or invoice downloads.

---

## Out of Scope

- Consolidated multi-site invoicing (per-site invoicing is fixed)
- Automatic dunning email sequences (handled outside the UI)
- Real payment processor integration (Stripe etc.) — this document covers UI/UX only
