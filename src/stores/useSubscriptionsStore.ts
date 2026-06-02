import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_SUBSCRIPTIONS, PLANS, SEAT_PRICING, type SiteSubscription, type PlanTier } from "@/mocks/licenses";

interface SubscriptionsState {
  subscriptions: SiteSubscription[];
  add: (sub: SiteSubscription) => void;
  changePlan: (id: string, planTier: PlanTier) => void;
  cancel: (id: string) => void;
  reactivate: (id: string) => void;
  changeBillingCycle: (id: string, cycle: "monthly" | "annual") => void;
  updateSeats: (id: string, seats: { owner: number; admin: number; user: number }) => void;
}

function computeMonthlyCost(planTier: PlanTier, seats: { owner: number; admin: number; user: number }): number {
  const plan = PLANS[planTier];
  const seatCost =
    seats.owner * SEAT_PRICING.owner.pricePerMonth +
    seats.admin * SEAT_PRICING.admin.pricePerMonth +
    seats.user * SEAT_PRICING.user.pricePerMonth;
  return plan.pricePerMonth + seatCost;
}

export const useSubscriptionsStore = create<SubscriptionsState>()(
  persist(
    (set) => ({
      subscriptions: MOCK_SUBSCRIPTIONS,
      add: (sub) => set((s) => ({ subscriptions: [...s.subscriptions, sub] })),
      changePlan: (id, planTier) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id
              ? { ...x, planTier, monthlyCost: computeMonthlyCost(planTier, x.seats) }
              : x
          ),
        })),
      cancel: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id ? { ...x, status: "cancelled" } : x
          ),
        })),
      reactivate: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id ? { ...x, status: "active" } : x
          ),
        })),
      changeBillingCycle: (id, cycle) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id ? { ...x, billingCycle: cycle } : x
          ),
        })),
      updateSeats: (id, seats) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((x) =>
            x.id === id
              ? { ...x, seats, monthlyCost: computeMonthlyCost(x.planTier, seats) }
              : x
          ),
        })),
    }),
    { name: "accel-subscriptions" }
  )
);
