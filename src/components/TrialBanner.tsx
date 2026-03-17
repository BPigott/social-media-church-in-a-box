import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const TRIAL_TOTAL_DAYS = 14;

const checkoutUrl = import.meta.env.VITE_LS_SINGLE_CHECKOUT_URL || "#";

export const TrialBanner = () => {
  const { isTrial, daysLeftInTrial, isExempt, isLoading } = useSubscription();

  if (isLoading || isExempt || !isTrial || daysLeftInTrial <= 0) {
    return null;
  }

  const progressPercent = ((TRIAL_TOTAL_DAYS - daysLeftInTrial) / TRIAL_TOTAL_DAYS) * 100;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm text-amber-800 whitespace-nowrap">
            {daysLeftInTrial === 1
              ? "Your trial ends tomorrow"
              : `Your trial ends in ${daysLeftInTrial} days`}
          </span>
          <Progress value={progressPercent} className="h-2 max-w-[200px] flex-shrink-0" />
        </div>
        <Button size="sm" asChild>
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            Upgrade Now
          </a>
        </Button>
      </div>
    </div>
  );
};
