import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChurchInfoForm } from "@/components/onboarding/ChurchInfoForm";
import { SermonUpload } from "@/components/onboarding/SermonUpload";
import { StyleGuideGeneration } from "@/components/onboarding/StyleGuideGeneration";
import { StyleGuideReview } from "@/components/onboarding/StyleGuideReview";
import type { Church } from "@/types/database";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [churchData, setChurchData] = useState<Partial<Church>>({});
  const [sermonFiles, setSermonFiles] = useState<File[]>([]);
  const [styleGuide, setStyleGuide] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleChurchInfoSubmit = (data: Partial<Church>) => {
    setChurchData(data);
    setStep(2);
  };

  const handleSermonUploadContinue = async () => {
    setStep(3);
    setGenerating(true);

    try {
      // Read file contents
      const sermonTexts = await Promise.all(
        sermonFiles.map(file => file.text())
      );

      const { data, error } = await supabase.functions.invoke('generate-style-guide', {
        body: { churchData, sermonTexts }
      });

      if (error) throw error;

      setStyleGuide(data.styleGuide);
      setStep(4);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate style guide",
      });
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const handleStyleGuideAccept = async (finalGuide: string) => {
    try {
      // Create church record
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert([{
          ...churchData,
          owner_id: user?.id,
        }])
        .select()
        .single();

      if (churchError) throw churchError;

      // Create user role
      await supabase.from('user_roles').insert({
        user_id: user?.id,
        church_id: church.id,
        role: 'owner',
      });

      // Create style guide
      await supabase.from('style_guides').insert({
        church_id: church.id,
        guide_content: finalGuide,
        sermon_documents: sermonFiles.map(f => ({ file_name: f.name })),
      });

      toast({
        title: "Setup complete!",
        description: "Your church has been set up successfully.",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Failed to complete setup",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  const progressValue = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-center mb-2">
            Welcome to Church Social Media Generator
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Step {step} of 4
          </p>
          <Progress value={progressValue} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">
              {step === 1 && "Church Information"}
              {step === 2 && "Upload Sermons"}
              {step === 3 && "Generating Style Guide"}
              {step === 4 && "Review Style Guide"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && <ChurchInfoForm onSubmit={handleChurchInfoSubmit} />}
            {step === 2 && (
              <SermonUpload
                onFilesSelected={setSermonFiles}
                onContinue={handleSermonUploadContinue}
              />
            )}
            {step === 3 && (
              <StyleGuideGeneration
                onComplete={setStyleGuide}
                onRetry={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StyleGuideReview
                styleGuide={styleGuide}
                onAccept={handleStyleGuideAccept}
                onRegenerate={() => setStep(2)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
