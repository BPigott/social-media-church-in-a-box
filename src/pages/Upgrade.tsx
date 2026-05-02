import { useSubscription } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const checkoutUrl = import.meta.env.VITE_PADDLE_SINGLE_CHECKOUT_URL || "#";

const Upgrade = () => {
  const { isActive, isLoading, subscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (isActive) {
    return <Navigate to="/dashboard" replace />;
  }

  const status = subscription?.status;
  const headline =
    status === "past_due"
      ? "Your payment failed"
      : status === "cancelled"
        ? "Your subscription was cancelled"
        : "Your free trial has ended";

  const subtitle =
    status === "past_due"
      ? "Please update your payment method to continue using ivangel."
      : status === "cancelled"
        ? "Resubscribe to continue generating content for your church."
        : "Subscribe to keep generating social media content for your church.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{headline}</CardTitle>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full" asChild>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              Church Plan — £25/month
            </a>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact us at support@ivangel.co
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upgrade;
