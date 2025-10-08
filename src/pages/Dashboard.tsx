import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Download, Upload, CheckCircle2 } from "lucide-react";
import type { Platform } from "@/types/database";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { primaryChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [customCTA, setCustomCTA] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscriptFile(file);
    const text = await file.text();
    setTranscriptText(text);
  };

  const handlePlatformToggle = (platform: Platform) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!primaryChurch) {
      toast({
        variant: "destructive",
        title: "No church profile",
        description: "Please complete your church onboarding first.",
      });
      navigate("/onboarding");
      return;
    }

    if (!transcriptText.trim()) {
      toast({
        variant: "destructive",
        title: "No transcript",
        description: "Please upload a sermon transcript first.",
      });
      return;
    }

    if (platforms.length === 0) {
      toast({
        variant: "destructive",
        title: "No platforms selected",
        description: "Please select at least one platform.",
      });
      return;
    }

    setGenerating(true);

    try {
      // Step 1: Upload transcript file to storage (if file exists)
      let filePath = '';
      if (transcriptFile) {
        const fileExt = transcriptFile.name.split('.').pop();
        const fileName = `${primaryChurch.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('transcripts')
          .upload(fileName, transcriptFile);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error('Failed to upload transcript file');
        }
        filePath = fileName;
      }

      // Step 2: Save transcript to database
      // Remove null bytes that PostgreSQL can't handle
      const cleanedTranscript = transcriptText.replace(/\0/g, '');

      const { data: transcriptData, error: transcriptError } = await supabase
        .from('sermon_transcripts')
        .insert({
          church_id: primaryChurch.id,
          uploaded_by: user?.id,
          file_name: transcriptFile?.name || 'transcript.txt',
          file_path: filePath,
          transcript_text: cleanedTranscript,
        })
        .select()
        .single();

      if (transcriptError) {
        console.error('Transcript save error:', transcriptError);
        throw new Error('Failed to save transcript');
      }

      // Step 3: Fetch style guide
      const { data: styleGuideData, error: styleGuideError } = await supabase
        .from('style_guides')
        .select('guide_content')
        .eq('church_id', primaryChurch.id)
        .single();

      if (styleGuideError) {
        console.error('Style guide fetch error:', styleGuideError);
        throw new Error('Failed to fetch style guide');
      }

      // Step 4: Generate social posts
      const { data, error } = await supabase.functions.invoke('generate-social-posts', {
        body: {
          transcript: transcriptText,
          styleGuide: styleGuideData.guide_content,
          platforms,
          customCTA,
          churchId: primaryChurch.id,
        }
      });

      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      // Step 5: Save generated content to database with transcript reference
      const { error: insertError } = await supabase.from('generated_content').insert({
        church_id: primaryChurch.id,
        sermon_transcript_id: transcriptData.id,
        platforms,
        custom_cta: customCTA || null,
        facebook_post: data.facebook || null,
        instagram_post: data.instagram || null,
        tiktok_post: data.tiktok || null,
        twitter_post: data.twitter || null,
        executive_summary: data.executiveSummary,
      });

      if (insertError) {
        console.error('Content save error:', insertError);
        throw new Error('Failed to save generated content');
      }

      setGeneratedContent(data);

      toast({
        title: "Content generated!",
        description: "Your social media posts are ready.",
      });
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate content",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const downloadAll = () => {
    const content = [];
    
    if (generatedContent.facebook) {
      content.push(`=== FACEBOOK ===\n${generatedContent.facebook}\n\nCharacters: ${generatedContent.facebook.length}\n`);
    }
    if (generatedContent.instagram) {
      content.push(`=== INSTAGRAM ===\n${generatedContent.instagram}\n\nCharacters: ${generatedContent.instagram.length}\n`);
    }
    if (generatedContent.tiktok) {
      content.push(`=== TIKTOK ===\n${generatedContent.tiktok}\n\nCharacters: ${generatedContent.tiktok.length}\n`);
    }
    if (generatedContent.twitter) {
      content.push(`=== TWITTER/X ===\n${generatedContent.twitter}\n\nCharacters: ${generatedContent.twitter.length}\n`);
    }
    if (generatedContent.executiveSummary) {
      content.push(`=== EXECUTIVE SUMMARY ===\n${generatedContent.executiveSummary}\n`);
    }

    const blob = new Blob([content.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${primaryChurch?.name || 'church'}-social-posts-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div>
          <h1 className="text-4xl font-playfair font-bold mb-2">
            Welcome back, {primaryChurch?.name}!
          </h1>
          <p className="text-muted-foreground">Generate social media content from your sermon transcripts</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-playfair">Upload Sermon Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="transcript-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {transcriptFile ? transcriptFile.name : "Click to upload transcript"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX</p>
                  </div>
                  <input
                    id="transcript-upload"
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
              </div>

              <div className="space-y-3">
                <Label>Select Platforms</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['facebook', 'instagram', 'tiktok', 'twitter'] as Platform[]).map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={platforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label htmlFor={platform} className="capitalize cursor-pointer">
                        {platform === 'twitter' ? 'Twitter/X' : platform}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-cta">Custom CTA/Themes (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add specific themes, announcements, or calls-to-action to include in your posts. Examples:
                  <span className="block mt-1 italic">• Birthday celebrations, baptisms, or special events</span>
                  <span className="block italic">• New Alpha course or small group starting</span>
                  <span className="block italic">• Visit our website, register for an event, or volunteer</span>
                  <span className="block italic">• Christmas services, Easter celebrations, prayer nights</span>
                </p>
                <Textarea
                  id="custom-cta"
                  placeholder="E.g., 'Join us for our new Alpha course starting next Sunday' or 'Celebrating 50 years of ministry this month!'"
                  value={customCTA}
                  onChange={(e) => setCustomCTA(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!transcriptFile || platforms.length === 0 || generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Social Media Posts"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-playfair">Generated Content</CardTitle>
                {generatedContent && (
                  <Button onClick={downloadAll} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Your generated content will appear here</p>
                </div>
              ) : (
                <Tabs defaultValue={platforms[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {generatedContent.facebook && <TabsTrigger value="facebook">Facebook</TabsTrigger>}
                    {generatedContent.instagram && <TabsTrigger value="instagram">Instagram</TabsTrigger>}
                    {generatedContent.tiktok && <TabsTrigger value="tiktok">TikTok</TabsTrigger>}
                    {generatedContent.twitter && <TabsTrigger value="twitter">X</TabsTrigger>}
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  {generatedContent.facebook && (
                    <TabsContent value="facebook" className="space-y-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{generatedContent.facebook}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {generatedContent.facebook.length} characters
                        </p>
                        <Button
                          onClick={() => copyToClipboard(generatedContent.facebook, "Facebook post")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedItem === "Facebook post" ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {generatedContent.instagram && (
                    <TabsContent value="instagram" className="space-y-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{generatedContent.instagram}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {generatedContent.instagram.length} characters
                        </p>
                        <Button
                          onClick={() => copyToClipboard(generatedContent.instagram, "Instagram post")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedItem === "Instagram post" ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {generatedContent.tiktok && (
                    <TabsContent value="tiktok" className="space-y-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{generatedContent.tiktok}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {generatedContent.tiktok.length} characters
                        </p>
                        <Button
                          onClick={() => copyToClipboard(generatedContent.tiktok, "TikTok post")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedItem === "TikTok post" ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {generatedContent.twitter && (
                    <TabsContent value="twitter" className="space-y-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{generatedContent.twitter}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {generatedContent.twitter.length} characters
                        </p>
                        <Button
                          onClick={() => copyToClipboard(generatedContent.twitter, "Twitter post")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedItem === "Twitter post" ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="summary" className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{generatedContent.executiveSummary}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.executiveSummary, "Executive summary")}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {copiedItem === "Executive summary" ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy Summary
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
