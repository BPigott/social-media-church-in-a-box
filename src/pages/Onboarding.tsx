import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChurchInfoForm } from "@/components/onboarding/ChurchInfoForm";
import { SermonUpload } from "@/components/onboarding/SermonUpload";
import { StyleGuideGeneration } from "@/components/onboarding/StyleGuideGeneration";
import { StyleGuideReview } from "@/components/onboarding/StyleGuideReview";
import { WebsiteScraping } from "@/components/onboarding/WebsiteScraping";
import type { Church } from "@/types/database";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const { hasChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [churchData, setChurchData] = useState<Partial<Church>>({});
  const [sermonFiles, setSermonFiles] = useState<File[]>([]);
  const [websiteContent, setWebsiteContent] = useState<any>(null);
  const [styleGuide, setStyleGuide] = useState("");
  const [generating, setGenerating] = useState(false);
  const [scrapingWebsite, setScrapingWebsite] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Safety guard: If user already has a church, redirect to dashboard
  useEffect(() => {
    if (!loading && !churchLoading && hasChurch) {
      console.log('🔄 Onboarding: User already has a church, redirecting to dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [loading, churchLoading, hasChurch, navigate]);

  const handleChurchInfoSubmit = async (data: Partial<Church>) => {
    setChurchData(data);
    
    // If website URL provided, scrape it
    if (data.website_url) {
      setScrapingWebsite(true);
      try {
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
          'scrape-church-website',
          { body: { websiteUrl: data.website_url } }
        );

        if (scrapeError) {
          console.error('Website scraping error:', scrapeError);
          toast({
            title: "Website scraping failed",
            description: "Your website may be large or complex. We'll continue with sermon-based analysis to create your style guide.",
            variant: "destructive",
          });
        } else if (scrapeData?.success) {
          setWebsiteContent(scrapeData.data);
          toast({
            title: "Website scraped successfully",
            description: `Analyzed ${scrapeData.data.pagesScraped} pages from your website.`,
          });
        }
      } catch (error) {
        console.error('Error scraping website:', error);
        toast({
          title: "Website scraping failed",
          description: "Your website may be large or complex. We'll continue with sermon-based analysis to create your style guide.",
          variant: "destructive",
        });
      } finally {
        setScrapingWebsite(false);
      }
    }
    
    setStep(2);
  };

  const handleSermonUploadContinue = async () => {
    setStep(3);
    setGenerating(true);

    try {
      // Read file contents with proper error handling
      const sermonTexts = await Promise.all(
        sermonFiles.map(async (file) => {
          try {
            // Try the modern file.text() method first
            if (typeof file.text === 'function') {
              return await file.text();
            }
            
            // Fallback to FileReader for older browsers
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
              reader.readAsText(file);
            });
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            throw new Error(`Failed to read file: ${file.name}`);
          }
        })
      );

      console.log('Sermon texts loaded:', sermonTexts.length, 'files');
      console.log('Church data:', churchData);
      console.log('Website content:', websiteContent);

      const { data, error } = await supabase.functions.invoke('generate-style-guide', {
        body: { 
          churchData, 
          sermonTexts,
          websiteContent 
        }
      });

      if (error) {
        console.error('Style guide generation error:', error);
        throw error;
      }

      if (!data || !data.styleGuide) {
        throw new Error('No style guide generated');
      }

      setStyleGuide(data.styleGuide);
      setStep(4);
    } catch (error) {
      console.error('Generation error:', error);
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
      // Check if user already has a church with this email
      const { data: existingChurch } = await supabase
        .from('churches')
        .select('id')
        .eq('owner_id', user!.id)
        .eq('email', churchData.email!)
        .maybeSingle();

      let churchId: string;

      if (existingChurch) {
        // Update existing church
        toast({
          title: "Updating church information...",
          description: "We found an existing profile and are updating it.",
        });

        const { error: updateError } = await supabase
          .from('churches')
          .update({
            name: churchData.name!,
            location: churchData.location!,
            vision_statement: churchData.vision_statement!,
            contact_email: churchData.contact_email!,
            website_url: churchData.website_url || null,
            service_times: (churchData.service_times || []) as any,
            social_handles: (churchData.social_handles || {}) as any,
          })
          .eq('id', existingChurch.id);

        if (updateError) throw updateError;

        churchId = existingChurch.id;

        // Ensure user role exists
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user!.id,
            church_id: churchId,
            role: 'owner',
          }, {
            onConflict: 'user_id,church_id'
          });

        if (roleError) throw roleError;

        // Update or create style guide
        const { data: existingGuide } = await supabase
          .from('style_guides')
          .select('id')
          .eq('church_id', churchId)
          .maybeSingle();

        if (existingGuide) {
          const { error: styleError } = await supabase
            .from('style_guides')
            .update({
              guide_content: finalGuide,
              sermon_documents: sermonFiles.map(f => ({ file_name: f.name })) as any,
            })
            .eq('id', existingGuide.id);

          if (styleError) throw styleError;
        } else {
          const { error: styleError } = await supabase
            .from('style_guides')
            .insert({
              church_id: churchId,
              guide_content: finalGuide,
              sermon_documents: sermonFiles.map(f => ({ file_name: f.name })) as any,
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
          .from('churches')
          .insert([{
            name: churchData.name!,
            email: churchData.email!,
            location: churchData.location!,
            vision_statement: churchData.vision_statement!,
            contact_email: churchData.contact_email!,
            owner_id: user!.id,
            website_url: churchData.website_url || null,
            service_times: (churchData.service_times || []) as any,
            social_handles: (churchData.social_handles || {}) as any,
          }])
          .select()
          .single();

        if (churchError) throw churchError;

        churchId = church.id;

        // Create user role
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: user!.id,
          church_id: churchId,
          role: 'owner',
        });

        if (roleError) throw roleError;

        // Create style guide
        const { error: styleError } = await supabase.from('style_guides').insert({
          church_id: churchId,
          guide_content: finalGuide,
          sermon_documents: sermonFiles.map(f => ({ file_name: f.name })) as any,
        });

        if (styleError) throw styleError;
      }

      toast({
        title: "Setup complete!",
        description: "Your church has been set up successfully.",
      });

      // Verify church creation by checking if user now has churches
      console.log('Verifying church creation...');
      let verified = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!verified && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: churchesData, error: verifyError } = await supabase
          .rpc('get_user_churches', { _user_id: user!.id });

        if (verifyError) {
          console.error('Verification error:', verifyError);
        }

        if (churchesData && churchesData.length > 0) {
          console.log('✅ Church verified! Found', churchesData.length, 'church(es)');
          verified = true;
          break;
        }

        console.log(`⏳ Verification attempt ${attempts}/${maxAttempts}...`);
      }

      if (!verified) {
        console.warn('⚠️ Church creation could not be verified after', maxAttempts, 'attempts');
        toast({
          title: "Warning",
          description: "Church creation is taking longer than expected. If you're redirected back, please try again.",
          variant: "destructive",
        });
      }

      // Navigate to dashboard with replace to prevent back navigation to onboarding
      console.log('🚀 Navigating to dashboard...');
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error('Setup error:', error);
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

  if (scrapingWebsite) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent>
              <WebsiteScraping />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressValue = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto relative">
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
