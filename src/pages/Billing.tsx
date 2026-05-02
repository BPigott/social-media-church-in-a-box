import { useSubscription } from "@/hooks/useSubscription";
import { Navigation } from "@/components/Navigation";
import { TrialBanner } from "@/components/TrialBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const singleCheckoutUrl = import.meta.env.VITE_PADDLE_SINGLE_CHECKOUT_URL || "#";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trialing: { label: "Free Trial", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  expired: { label: "Expired", variant: "destructive" },
  past_due: { label: "Past Due", variant: "destructive" },
};

const Billing = () => {
  const {
    subscription,
    isLoading,
    isExempt,
    daysLeftInTrial,
    isTrial,
  } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const status = subscription?.status ?? "unknown";
  const statusInfo = STATUS_LABELS[status] ?? { label: status, variant: "outline" as const };

  const nextBillingDate = subscription?.current_period_ends_at
    ? new Date(subscription.current_period_ends_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const trialEndDate = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TrialBanner />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Billing</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Subscription</span>
              {isExempt ? (
                <Badge variant="default">Exempt</Badge>
              ) : (
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isExempt && (
              <p className="text-sm text-muted-foreground">
                Your account has been exempted from billing. You have full access to all features.
              </p>
            )}

            {!isExempt && isTrial && (
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Trial ends:</span>{" "}
                  {trialEndDate} ({daysLeftInTrial} days remaining)
                </p>
                <Button asChild>
                  <a href={singleCheckoutUrl} target="_blank" rel="noopener noreferrer">
                    Upgrade Now
                  </a>
                </Button>
              </div>
            )}

            {!isExempt && status === "active" && (
              <div className="space-y-1">
                {nextBillingDate && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next billing date:</span>{" "}
                    {nextBillingDate}
                  </p>
                )}
                {subscription?.paddle_subscription_id && (
                  <p className="text-xs text-muted-foreground">
                    Subscription ID: {subscription.paddle_subscription_id}
                  </p>
                )}
              </div>
            )}

            {!isExempt && (status === "cancelled" || status === "expired") && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your subscription is no longer active. Resubscribe to continue generating content.
                </p>
                <Button asChild>
                  <a href={singleCheckoutUrl} target="_blank" rel="noopener noreferrer">
                    Resubscribe
                  </a>
                </Button>
              </div>
            )}

            {!isExempt && status === "past_due" && (
              <p className="text-sm text-destructive">
                Your last payment failed. Please update your payment method to avoid losing access.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
