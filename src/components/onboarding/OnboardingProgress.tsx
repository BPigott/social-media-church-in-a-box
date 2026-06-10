import { Check } from "phosphor-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  /** 1-indexed current step */
  currentStep: number;
  steps: string[];
}

export function OnboardingProgress({ currentStep, steps }: OnboardingProgressProps) {
  const totalSteps = steps.length;
  const fillPct = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <ol className="flex items-start justify-between gap-1">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2">
              <div
                data-testid={
                  isCompleted ? "step-completed" : isActive ? "step-active" : "step-pending"
                }
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "border-2 border-primary bg-primary/10 text-primary",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check size={16} weight="bold" /> : stepNum}
              </div>
              <span
                className={cn(
                  "hidden text-center text-[11px] font-medium leading-tight sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </nav>
  );
}
