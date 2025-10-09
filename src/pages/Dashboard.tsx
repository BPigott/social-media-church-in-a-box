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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Download, Upload, CheckCircle2 } from "lucide-react";
import type { Platform } from "@/types/database";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { primaryChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to count words
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to get length indicator
  const getLengthIndicator = (text: string, platform: string) => {
    const charCount = text.length;
    const wordCount = countWords(text);
    
    switch(platform) {
      case 'facebook':
        if (wordCount >= 40 && wordCount <= 80) {
          return { status: '✅', color: 'text-green-600', message: `${wordCount} words (Ideal: 40-80)` };
        } else if (wordCount > 80 && wordCount <= 100) {
          return { status: '⚠️', color: 'text-yellow-600', message: `${wordCount} words (Recommended: 40-80)` };
        } else {
          return { status: '❌', color: 'text-red-600', message: `${wordCount} words (Target: 40-80)` };
        }
      
      case 'instagram':
        const firstLine = text.split('\n')[0];
        const firstLineLength = firstLine.length;
        if (firstLineLength <= 125 && charCount <= 200) {
          return { status: '✅', color: 'text-green-600', message: `First line: ${firstLineLength} chars (Ideal)` };
        } else if (firstLineLength <= 125) {
          return { status: '⚠️', color: 'text-yellow-600', message: `First line: ${firstLineLength} chars (caption longer than ideal)` };
        } else {
          return { status: '❌', color: 'text-red-600', message: `First line: ${firstLineLength} chars (Target: <125)` };
        }
      
      case 'tiktok':
        if (charCount <= 150) {
          return { status: '✅', color: 'text-green-600', message: `${charCount} chars (Perfect)` };
        } else if (charCount <= 180) {
          return { status: '⚠️', color: 'text-yellow-600', message: `${charCount} chars (Target: <150)` };
        } else {
          return { status: '❌', color: 'text-red-600', message: `${charCount} chars (Too long)` };
        }
      
      case 'twitter':
        if (charCount <= 260) {
          return { status: '✅', color: 'text-green-600', message: `${charCount} chars (Good for retweets)` };
        } else if (charCount <= 280) {
          return { status: '⚠️', color: 'text-yellow-600', message: `${charCount} chars (At limit)` };
        } else {
          return { status: '❌', color: 'text-red-600', message: `${charCount} chars (Over 280 limit!)` };
        }
      
      default:
        return { status: '', color: '', message: `${charCount} characters` };
    }
  };

  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [customCTA, setCustomCTA] = useState("");
  const [postsPerPlatform, setPostsPerPlatform] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeVariations, setActiveVariations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscriptFile(file);
    
    // Detect file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    try {
      if (fileExtension === 'txt' || fileExtension === 'md') {
        // Plain text files - read directly
        const text = await file.text();
        setTranscriptText(text);
        toast({
          title: "File uploaded",
          description: "Transcript loaded successfully.",
        });
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        // Word documents - use mammoth to extract text
        toast({
          title: "Processing document...",
          description: "Extracting text from Word document.",
        });
        
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTranscriptText(result.value);
        
        toast({
          title: "Document processed",
          description: "Text extracted successfully from Word document.",
        });
      } else if (fileExtension === 'pdf') {
        // PDF files - extract text using PDF.js
        toast({
          title: "Processing PDF...",
          description: "Extracting text from PDF document.",
        });
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + "\n\n";
        }
        
        setTranscriptText(fullText.trim());
        
        toast({
          title: "PDF processed",
          description: `Text extracted successfully from ${pdf.numPages} page(s).`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: "Please upload a .txt, .pdf, .docx, or .doc file.",
        });
        setTranscriptFile(null);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to read file content.",
      });
      setTranscriptFile(null);
      setTranscriptText("");
    }
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
          speaker_name: speakerName.trim() || null,
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
          postsPerPlatform,
          speakerName: speakerName.trim() || null,
        }
      });

      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      // Step 5: Save generated content to database with transcript reference
      // Convert single posts to arrays for consistency
      const normalizeToArray = (post: string | string[] | null) => {
        if (!post) return null;
        return Array.isArray(post) ? post : [post];
      };

      const { error: insertError } = await supabase.from('generated_content').insert({
        church_id: primaryChurch.id,
        sermon_transcript_id: transcriptData.id,
        platforms,
        custom_cta: customCTA || null,
        posts_per_platform: postsPerPlatform,
        facebook_post: normalizeToArray(data.facebook),
        instagram_post: normalizeToArray(data.instagram),
        tiktok_post: normalizeToArray(data.tiktok),
        twitter_post: normalizeToArray(data.twitter),
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
    
    const formatPosts = (posts: string | string[], platformName: string) => {
      const postsArray = Array.isArray(posts) ? posts : [posts];
      if (postsArray.length === 1) {
        return `=== ${platformName} ===\n${postsArray[0]}\n\nCharacters: ${postsArray[0].length}\n`;
      } else {
        return postsArray.map((post, idx) => 
          `=== ${platformName} (Variation ${idx + 1}) ===\n${post}\n\nCharacters: ${post.length}\n`
        ).join('\n\n');
      }
    };
    
    if (generatedContent.facebook) {
      content.push(formatPosts(generatedContent.facebook, 'FACEBOOK'));
    }
    if (generatedContent.instagram) {
      content.push(formatPosts(generatedContent.instagram, 'INSTAGRAM'));
    }
    if (generatedContent.tiktok) {
      content.push(formatPosts(generatedContent.tiktok, 'TIKTOK'));
    }
    if (generatedContent.twitter) {
      content.push(formatPosts(generatedContent.twitter, 'TWITTER/X'));
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
                    <p className="text-xs text-muted-foreground">TXT, PDF, DOCX, or DOC</p>
                  </div>
                  <input
                    id="transcript-upload"
                    type="file"
                    accept=".txt,.pdf,.docx,.doc,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker-name">Who was preaching? (Optional)</Label>
                <Input
                  id="speaker-name"
                  placeholder="e.g., Pastor John, Rob Smith, Sarah Johnson"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Adding the speaker's name helps personalize the content
                </p>
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
                <Label htmlFor="posts-per-platform">Posts per Platform</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Generate multiple variations to choose from or schedule throughout the week
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={postsPerPlatform === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPostsPerPlatform(num)}
                      className="flex-1"
                    >
                      {num}
                    </Button>
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

                  {generatedContent.facebook && (() => {
                    const posts = Array.isArray(generatedContent.facebook) ? generatedContent.facebook : [generatedContent.facebook];
                    const activeIdx = activeVariations['facebook'] || 0;
                    const currentPost = posts[activeIdx];
                    const lengthInfo = getLengthIndicator(currentPost, 'facebook');
                    
                    return (
                      <TabsContent value="facebook" className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-2">
                          📘 Facebook works best with 40-80 words and clear paragraph breaks
                        </div>
                        {posts.length > 1 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Variation {activeIdx + 1} of {posts.length}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  facebook: Math.max(0, activeIdx - 1)
                                }))}
                                disabled={activeIdx === 0}
                              >
                                ← Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  facebook: Math.min(posts.length - 1, activeIdx + 1)
                                }))}
                                disabled={activeIdx === posts.length - 1}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{currentPost}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${lengthInfo.color}`}>
                            {lengthInfo.status} {lengthInfo.message} • {currentPost.length} chars
                          </p>
                          <Button
                            onClick={() => copyToClipboard(currentPost, "Facebook post")}
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
                    );
                  })()}

                  {generatedContent.instagram && (() => {
                    const posts = Array.isArray(generatedContent.instagram) ? generatedContent.instagram : [generatedContent.instagram];
                    const activeIdx = activeVariations['instagram'] || 0;
                    const currentPost = posts[activeIdx];
                    const lengthInfo = getLengthIndicator(currentPost, 'instagram');
                    
                    return (
                      <TabsContent value="instagram" className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-2">
                          📸 Instagram: Keep first line under 125 characters (what shows before "...more")
                        </div>
                        {posts.length > 1 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Variation {activeIdx + 1} of {posts.length}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  instagram: Math.max(0, activeIdx - 1)
                                }))}
                                disabled={activeIdx === 0}
                              >
                                ← Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  instagram: Math.min(posts.length - 1, activeIdx + 1)
                                }))}
                                disabled={activeIdx === posts.length - 1}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{currentPost}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${lengthInfo.color}`}>
                            {lengthInfo.status} {lengthInfo.message} • Total: {currentPost.length} chars
                          </p>
                          <Button
                            onClick={() => copyToClipboard(currentPost, "Instagram post")}
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
                    );
                  })()}

                  {generatedContent.tiktok && (() => {
                    const posts = Array.isArray(generatedContent.tiktok) ? generatedContent.tiktok : [generatedContent.tiktok];
                    const activeIdx = activeVariations['tiktok'] || 0;
                    const currentPost = posts[activeIdx];
                    const lengthInfo = getLengthIndicator(currentPost, 'tiktok');
                    
                    return (
                      <TabsContent value="tiktok" className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-2">
                          🎵 TikTok: Keep it short and punchy - under 150 characters
                        </div>
                        {posts.length > 1 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Variation {activeIdx + 1} of {posts.length}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  tiktok: Math.max(0, activeIdx - 1)
                                }))}
                                disabled={activeIdx === 0}
                              >
                                ← Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  tiktok: Math.min(posts.length - 1, activeIdx + 1)
                                }))}
                                disabled={activeIdx === posts.length - 1}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{currentPost}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${lengthInfo.color}`}>
                            {lengthInfo.status} {lengthInfo.message}
                          </p>
                          <Button
                            onClick={() => copyToClipboard(currentPost, "TikTok post")}
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
                    );
                  })()}

                  {generatedContent.twitter && (() => {
                    const posts = Array.isArray(generatedContent.twitter) ? generatedContent.twitter : [generatedContent.twitter];
                    const activeIdx = activeVariations['twitter'] || 0;
                    const currentPost = posts[activeIdx];
                    const lengthInfo = getLengthIndicator(currentPost, 'twitter');
                    
                    return (
                      <TabsContent value="twitter" className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-2">
                          🐦 Twitter/X: Aim for 240-260 characters (leaves room for retweets with comments)
                        </div>
                        {posts.length > 1 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Variation {activeIdx + 1} of {posts.length}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  twitter: Math.max(0, activeIdx - 1)
                                }))}
                                disabled={activeIdx === 0}
                              >
                                ← Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveVariations(prev => ({
                                  ...prev,
                                  twitter: Math.min(posts.length - 1, activeIdx + 1)
                                }))}
                                disabled={activeIdx === posts.length - 1}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{currentPost}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${lengthInfo.color}`}>
                            {lengthInfo.status} {lengthInfo.message}
                          </p>
                          <Button
                            onClick={() => copyToClipboard(currentPost, "Twitter post")}
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
                    );
                  })()}

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
