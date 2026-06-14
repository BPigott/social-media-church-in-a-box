import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch, clearChurchCache } from "@/hooks/useChurch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { SectionMarker } from "@/components/ui/section-marker";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { ChurchInfoForm } from "@/components/onboarding/ChurchInfoForm";
import { WebsiteScraping, type WebsiteContent } from "@/components/onboarding/WebsiteScraping";
import { SermonUpload } from "@/components/onboarding/SermonUpload";
import { StyleGuideGeneration } from "@/components/onboarding/StyleGuideGeneration";
import { StyleGuideReview } from "@/components/onboarding/StyleGuideReview";
import { extractTextFromFile, TextExtractionError } from "@/lib/extractText";
import type { Church } from "@/types/database";

const STEPS = ["Your Church", "Website", "Sermons", "Your Voice"];

const STEP_META: Record<number, { numeral: string; title: string }> = {
  1: { numeral: "01", title: "Your Church" },
  2: { numeral: "02", title: "Your Voice Online" },
  3: { numeral: "03", title: "Your Sermons" },
  4: { numeral: "04", title: "Your Voice Profile" },
};

const Onboarding = () => {
  const { user, loading } = useAuth();
  const { hasChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [churchData, setChurchData] = useState<Partial<Church>>({});
  const [sermonFiles, setSermonFiles] = useState<File[]>([]);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(null);
  const [styleGuide, setStyleGuide] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Safety guard: if the user already has a church, skip onboarding
  useEffect(() => {
    if (!loading && !churchLoading && hasChurch) {
      console.log("🔄 Onboarding: User already has a church, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [loading, churchLoading, hasChurch, navigate]);

  // Step 1 → 2: store church details, move to website import
  const handleChurchInfoSubmit = (data: Partial<Church>) => {
    setChurchData(data);
    setStep(2);
  };

  // Step 2 → 3: website content captured (scraped or pasted)
  const handleWebsiteComplete = (content: WebsiteContent) => {
    setWebsiteContent(content);
    setStep(3);
  };

  // Step 2 → 3: website import skipped
  const handleWebsiteSkip = () => {
    setStep(3);
  };

  // Step 3 → 4: sermons uploaded, generate the style guide
  const handleSermonUploadContinue = async () => {
    setStep(4);
    setGenerating(true);

    try {
      const sermonTexts = await Promise.all(
        sermonFiles.map((file) => extractTextFromFile(file)),
      );

      const { data, error } = await supabase.functions.invoke("generate-style-guide", {
        body: { churchData, sermonTexts, websiteContent },
      });

      if (error) throw error;
      if (!data || !data.styleGuide) {
        throw new Error("No style guide generated");
      }

      setStyleGuide(data.styleGuide);
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title:
          error instanceof TextExtractionError ? "Couldn't read a sermon file" : "Generation failed",
        description:
          error instanceof Error ? error.message : "Failed to generate style guide",
      });
      setStep(3);
    } finally {
      setGenerating(false);
    }
  };

  const handleStyleGuideAccept = async (finalGuide: string) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("⚠️ Submission already in progress, ignoring duplicate request");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already has ANY church (orphaned record detection)
      const { data: userChurches, error: userChurchError } = await supabase
        .from("churches")
        .select("id, name, email")
        .eq("owner_id", user!.id);

      if (userChurchError) {
        console.error("Error checking for existing churches:", userChurchError);
        throw new Error("Failed to verify church records");
      }

      let churchId: string;

      // If user already has a church, update it instead of creating a new one
      if (userChurches && userChurches.length > 0) {
        const existingChurch = userChurches[0];
        console.log("📍 Found existing church for user, updating:", existingChurch);

        toast({
          title: "Updating church information...",
          description: "We found an existing profile and are updating it.",
        });

        const { error: updateError } = await supabase
          .from("churches")
          .update({
            name: churchData.name!,
            email: churchData.email!,
            location: churchData.location!,
            denomination: churchData.denomination || null,
            vision_statement: churchData.vision_statement!,
            contact_email: churchData.contact_email!,
            website_url: churchData.website_url || null,
            service_times: (churchData.service_times || []) as any,
            social_handles: (churchData.social_handles || {}) as any,
          })
          .eq("id", existingChurch.id);

        if (updateError) {
          console.error("Error updating church:", updateError);
          throw updateError;
        }

        churchId = existingChurch.id;

        // Ensure user role exists
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: user!.id,
              church_id: churchId,
              role: "owner",
            },
            {
              onConflict: "user_id,church_id",
            },
          );

        if (roleError) throw roleError;

        // Update or create style guide
        const { data: existingGuide } = await supabase
          .from("style_guides")
          .select("id")
          .eq("church_id", churchId)
          .maybeSingle();

        if (existingGuide) {
          const { error: styleError } = await supabase
            .from("style_guides")
            .update({
              guide_content: finalGuide,
              sermon_documents: sermonFiles.map((f) => ({ file_name: f.name })) as any,
            })
            .eq("id", existingGuide.id);

          if (styleError) throw styleError;
        } else {
          const { error: styleError } = await supabase
            .from("style_guides")
            .insert({
              church_id: churchId,
              guide_content: finalGuide,
              sermon_documents: sermonFiles.map((f) => ({ file_name: f.name })) as any,
            });

          if (styleError) throw styleError;
        }
      } else {
        // Create new church
        toast({
          title: "Creating church profile...",
          description: "Setting up your church on the platform.",
        });

        const { data: church, error: churchError } = await supabase
          .from("churches")
          .insert([
            {
              name: churchData.name!,
              email: churchData.email!,
              location: churchData.location!,
              denomination: churchData.denomination || null,
              vision_statement: churchData.vision_statement!,
              contact_email: churchData.contact_email!,
              owner_id: user!.id,
              website_url: churchData.website_url || null,
              service_times: (churchData.service_times || []) as any,
              social_handles: (churchData.social_handles || {}) as any,
            },
          ])
          .select()
          .single();

        if (churchError) {
          console.error("Church creation error:", churchError);
          throw churchError;
        }

        churchId = church.id;

        // Create user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: user!.id,
          church_id: churchId,
          role: "owner",
        });

        if (roleError) throw roleError;

        // Create style guide
        const { error: styleError } = await supabase.from("style_guides").insert({
          church_id: churchId,
          guide_content: finalGuide,
          sermon_documents: sermonFiles.map((f) => ({ file_name: f.name })) as any,
        });

        if (styleError) throw styleError;
      }

      toast({
        title: "Setup complete!",
        description: "Your church has been set up successfully.",
      });

      // Clear the church cache to force a fresh fetch
      console.log("🗑️ Clearing church cache to ensure fresh data...");
      clearChurchCache(user!.id);

      // Verify church creation by checking if user now has churches
      console.log("Verifying church creation...");
      let verified = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!verified && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data: churchesData, error: verifyError } = await supabase.rpc(
          "get_user_churches",
          { _user_id: user!.id },
        );

        if (verifyError) {
          console.error("Verification error:", verifyError);
        }

        if (churchesData && churchesData.length > 0) {
          console.log("✅ Church verified! Found", churchesData.length, "church(es)");
          verified = true;
          break;
        }

        console.log(`⏳ Verification attempt ${attempts}/${maxAttempts}...`);
      }

      if (!verified) {
        console.warn("⚠️ Church creation could not be verified after", maxAttempts, "attempts");
        toast({
          title: "Warning",
          description:
            "Church creation is taking longer than expected. If you're redirected back, please try again.",
          variant: "destructive",
        });
      }

      // Navigate to dashboard with replace to prevent back navigation to onboarding
      console.log("🚀 Navigating to dashboard...");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Setup error:", error);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Failed to complete setup",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  const meta = STEP_META[step];

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Brand header */}
        <div className="space-y-2 text-center">
          <h1 className="font-playfair text-4xl font-bold">Welcome to Ivangel</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Generic AI writes generic content. Your voice is what makes this yours.
          </p>
        </div>

        <OnboardingProgress currentStep={step} steps={STEPS} />

        <Card className="border-border/40 shadow-tactile">
          <CardContent className="space-y-6 pt-6">
            <SectionMarker numeral={meta.numeral} title={meta.title} />

            {step === 1 && <ChurchInfoForm onSubmit={handleChurchInfoSubmit} initialData={churchData} />}

            {step === 2 && (
              <WebsiteScraping
                websiteUrl={churchData.website_url}
                onComplete={handleWebsiteComplete}
                onSkip={handleWebsiteSkip}
              />
            )}

            {step === 3 && (
              <SermonUpload
                initialFiles={sermonFiles}
                onFilesSelected={setSermonFiles}
                onContinue={handleSermonUploadContinue}
              />
            )}

            {step === 4 && generating && (
              <StyleGuideGeneration onComplete={setStyleGuide} onRetry={() => setStep(3)} />
            )}

            {step === 4 && !generating && (
              <StyleGuideReview
                styleGuide={styleGuide}
                onAccept={handleStyleGuideAccept}
                onRegenerate={() => setStep(3)}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
