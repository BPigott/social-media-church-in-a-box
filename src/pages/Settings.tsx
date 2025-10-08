import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChurchInfoForm } from "@/components/onboarding/ChurchInfoForm";
import { Textarea } from "@/components/ui/textarea";
import { Download, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import type { Church } from "@/types/database";

const Settings = () => {
  const { user, loading } = useAuth();
  const { primaryChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [styleGuide, setStyleGuide] = useState("");
  const [isLoadingGuide, setIsLoadingGuide] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (primaryChurch?.id) {
      loadStyleGuide();
    }
  }, [primaryChurch]);

  const loadStyleGuide = async () => {
    try {
      const { data, error } = await supabase
        .from('style_guides')
        .select('guide_content')
        .eq('church_id', primaryChurch?.id)
        .single();

      if (error) throw error;
      setStyleGuide(data.guide_content);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading style guide",
        description: error instanceof Error ? error.message : "Failed to load style guide",
      });
    } finally {
      setIsLoadingGuide(false);
    }
  };

  const handleChurchUpdate = async (data: Partial<Church>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('churches')
        .update({
          name: data.name!,
          email: data.email!,
          location: data.location!,
          vision_statement: data.vision_statement!,
          contact_email: data.contact_email!,
          website_url: data.website_url || null,
          denomination: data.denomination || null,
          service_times: (data.service_times || []) as any,
          social_handles: (data.social_handles || {}) as any,
          key_ministries: (data.key_ministries || []) as any,
        })
        .eq('id', primaryChurch?.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your church information has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStyleGuideUpdate = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('style_guides')
        .update({ guide_content: styleGuide })
        .eq('church_id', primaryChurch?.id);

      if (error) throw error;

      toast({
        title: "Style guide saved",
        description: "Your style guide has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving style guide",
        description: error instanceof Error ? error.message : "Failed to save style guide",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadStyleGuide = () => {
    const blob = new Blob([styleGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${primaryChurch?.name || 'church'}-style-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading || churchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-playfair font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your church information and preferences</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="church" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="church">Church Information</TabsTrigger>
            <TabsTrigger value="style">Style Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="church" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Church Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ChurchInfoForm
                  onSubmit={handleChurchUpdate}
                  initialData={primaryChurch || undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-playfair">Style Guide</CardTitle>
                  <Button onClick={downloadStyleGuide} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingGuide ? (
                  <p className="text-muted-foreground">Loading style guide...</p>
                ) : (
                  <>
                    <Textarea
                      value={styleGuide}
                      onChange={(e) => setStyleGuide(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleStyleGuideUpdate} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Style Guide"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </>
  );
};

export default Settings;
