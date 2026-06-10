import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionStatus = "trialing" | "active" | "cancelled" | "expired" | "past_due";

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_ends_at: string | null;
  cancelled_at: string | null;
  exempt: boolean;
  stripe_subscription_id: string | null;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    // Auth hasn't resolved yet — stay in the loading state rather than
    // reporting "no subscription". Resolving to null here briefly reads as
    // inactive, which bounces an active user to /upgrade on remount (e.g.
    // navigating back to the dashboard once useChurch is cached).
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, trial_ends_at, current_period_ends_at, cancelled_at, exempt, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Failed to fetch subscription:", error);
      setSubscription(null);
    } else {
      setSubscription(data as Subscription);
    }
    setIsLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const now = new Date();
  const trialEndsAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;

  const daysLeftInTrial =
    subscription?.status === "trialing" && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const isActive =
    subscription?.exempt ||
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && daysLeftInTrial > 0);

  const isExpired =
    !subscription?.exempt &&
    (subscription?.status === "expired" ||
      (subscription?.status === "trialing" && daysLeftInTrial <= 0));

  return {
    subscription,
    isLoading,
    refetch: fetchSubscription,
    isActive,
    isExpired,
    daysLeftInTrial,
    isExempt: subscription?.exempt ?? false,
    isTrial: subscription?.status === "trialing",
    isCancelled: subscription?.status === "cancelled",
    isPastDue: subscription?.status === "past_due",
  };
}
