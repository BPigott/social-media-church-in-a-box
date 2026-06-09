import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompCodeRedeemProps {
  /** Called after a code is successfully redeemed, so the parent can refresh subscription state. */
  onRedeemed: () => void;
}

/**
 * Lets a signed-in user redeem a comp code to gain billing exemption.
 * Validation/redemption happens server-side in the `redeem-comp-code` edge function;
 * this component only collects the code and surfaces the outcome.
 */
export function CompCodeRedeem({ onRedeemed }: CompCodeRedeemProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const { data, error: invokeError } = await supabase.functions.invoke(
      "redeem-comp-code",
      { body: { code: trimmed } },
    );

    // On a non-2xx status, supabase-js sets `invokeError` and tucks the JSON body in `context`.
    if (invokeError) {
      let message = "Something went wrong. Please try again.";
      try {
        const body = await (invokeError as { context?: Response }).context?.json();
        message = body?.message ?? body?.error ?? message;
      } catch {
        // keep the generic fallback
      }
      setError(message);
      setIsSubmitting(false);
      return;
    }

    if (data?.success) {
      setSuccess(data.message ?? "Code redeemed — you now have full access.");
      onRedeemed();
    } else {
      setError(data?.message ?? "That code isn't valid.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="comp-code">Have a comp code?</Label>
      <div className="flex gap-2">
        <Input
          id="comp-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          placeholder="Enter code"
          autoCapitalize="characters"
          disabled={isSubmitting || !!success}
        />
        <Button
          variant="outline"
          onClick={handleRedeem}
          disabled={isSubmitting || !code.trim() || !!success}
        >
          {isSubmitting ? "Redeeming…" : "Redeem"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
