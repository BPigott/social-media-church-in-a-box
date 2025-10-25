import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedContent } from "@/types/database";
import ReactMarkdown from "react-markdown";

// Language names mapping
const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'pt': 'Portuguese',
  'de': 'German',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ar': 'Arabic',
  'fa': 'Persian (Farsi)',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'it': 'Italian',
  'ru': 'Russian',
  'ja': 'Japanese'
};

const Library = () => {
  const { user, loading } = useAuth();
  const { primaryChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [currentVariations, setCurrentVariations] = useState<Record<string, number>>({});
  const [retranslating, setRetranslating] = useState(false);

  // Helper function to clean up Bible Study formatting
  const cleanBibleStudyFormatting = (content: string): string => {
    return content
      // Remove standalone hashtags (but keep markdown headers)
      .replace(/(?<!#)\s+#(?![#\s])/g, '')
      // Remove excessive asterisks used for emphasis
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      // Clean up any remaining social media formatting
      .replace(/#{2,}/g, '')
      // Ensure proper spacing between sections
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (primaryChurch?.id) {
      loadContent();
    }
  }, [primaryChurch]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select(`
          *,
          devotional_english,
          bible_study_guide_english,
          facebook_post_english,
          instagram_post_english,
          tiktok_post_english,
          twitter_post_english
        `)
        .eq('church_id', primaryChurch?.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setContent(data as unknown as GeneratedContent[] || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading content",
        description: error instanceof Error ? error.message : "Failed to load content",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Deleted",
        description: "Content has been deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting content",
        description: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const handleRetranslate = async (editedEnglish: string, contentType: string, contentId: string, primaryLanguage: string) => {
    if (!primaryChurch) return;

    setRetranslating(true);

    try {
      // For retranslation, use the current primary language as target
      const { data, error } = await supabase.functions.invoke(
        'retranslate-content',
        {
          body: {
            englishContent: editedEnglish,
            targetLanguage: primaryLanguage,
            contentType
          }
        }
      );

      if (error) throw error;

      // Prepare database update object
      let dbUpdateFields: any = {};
      const normalizeToArray = (post: string | string[] | null) => {
        if (!post) return null;
        return Array.isArray(post) ? post : [post];
      };

      // Update the appropriate content based on contentType
      const contentItem = content.find(c => c.id === contentId);
      if (!contentItem) return;

      if (contentType === 'bibleStudy') {
        dbUpdateFields = {
          bible_study_guide: data.translatedContent,
          bible_study_guide_english: editedEnglish
        };
      } else if (contentType === 'devotional') {
        dbUpdateFields = {
          devotional: data.translatedContent,
          devotional_english: editedEnglish
        };
      } else if (contentType.startsWith('facebook-')) {
        const idx = parseInt(contentType.split('-')[1]);
        const posts = Array.isArray(contentItem.facebook_post) 
          ? [...contentItem.facebook_post] 
          : [contentItem.facebook_post];
        posts[idx] = data.translatedContent;
        dbUpdateFields = {
          facebook_post: normalizeToArray(posts),
        };
      } else if (contentType.startsWith('instagram-')) {
        const idx = parseInt(contentType.split('-')[1]);
        const posts = Array.isArray(contentItem.instagram_post)
          ? [...contentItem.instagram_post]
          : [contentItem.instagram_post];
        posts[idx] = data.translatedContent;
        dbUpdateFields = {
          instagram_post: normalizeToArray(posts),
        };
      } else if (contentType.startsWith('tiktok-')) {
        const idx = parseInt(contentType.split('-')[1]);
        const posts = Array.isArray(contentItem.tiktok_post)
          ? [...contentItem.tiktok_post]
          : [contentItem.tiktok_post];
        posts[idx] = data.translatedContent;
        dbUpdateFields = {
          tiktok_post: normalizeToArray(posts),
        };
      } else if (contentType.startsWith('twitter-')) {
        const idx = parseInt(contentType.split('-')[1]);
        const posts = Array.isArray(contentItem.twitter_post)
          ? [...contentItem.twitter_post]
          : [contentItem.twitter_post];
        posts[idx] = data.translatedContent;
        dbUpdateFields = {
          twitter_post: normalizeToArray(posts),
        };
      }

      // Update database with new content
      if (Object.keys(dbUpdateFields).length > 0) {
        const { error: updateError } = await supabase
          .from('generated_content')
          .update(dbUpdateFields)
          .eq('id', contentId)
          .eq('church_id', primaryChurch.id);

        if (updateError) {
          console.error('Database update error after retranslation:', updateError);
          toast({
            variant: "destructive",
            title: "Save failed",
            description: "Translation successful but failed to save to database."
          });
          return;
        }

        // Update local content state
        setContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, ...dbUpdateFields }
            : item
        ));
      }

      toast({
        title: "Content re-translated & saved",
        description: "Your content has been translated and saved successfully."
      });
    } catch (error) {
      console.error('Re-translation error:', error);
      toast({
        variant: "destructive",
        title: "Re-translation failed",
        description: "Failed to translate the content. Please try again."
      });
    } finally {
      setRetranslating(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const changeVariation = (key: string, direction: 'prev' | 'next', maxIndex: number) => {
    setCurrentVariations(prev => {
      const current = prev[key] || 0;
      let newIndex = direction === 'next' ? current + 1 : current - 1;
      if (newIndex < 0) newIndex = maxIndex;
      if (newIndex > maxIndex) newIndex = 0;
      return { ...prev, [key]: newIndex };
    });
  };

  const renderPlatformSection = (
    itemId: string,
    platform: string,
    posts: string[],
    item: any
  ) => {
    const sectionKey = `${itemId}-${platform}`;
    const currentIndex = currentVariations[sectionKey] || 0;
    const currentPost = posts[currentIndex] || "";
    const isExpanded = expandedSections[sectionKey];
    
    // Get English posts for re-translate functionality
    const englishFieldName = `${platform.toLowerCase()}_post_english`;
    const englishPosts = item[englishFieldName];
    const englishPost = englishPosts 
      ? (Array.isArray(englishPosts) ? englishPosts[currentIndex] : englishPosts)
      : null;

    return (
      <Collapsible key={platform} open={isExpanded} onOpenChange={() => toggleSection(sectionKey)}>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                <p className="text-sm font-medium">
                  {platform} {posts.length > 1 && `(${posts.length} variations)`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(currentPost, `${platform} post`);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              {posts.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeVariation(sectionKey, 'prev', posts.length - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    {currentIndex + 1} of {posts.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeVariation(sectionKey, 'next', posts.length - 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <ScrollArea className="max-h-[400px]">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{currentPost}</p>
                </div>
              </ScrollArea>
              {englishPost && primaryChurch?.primary_language !== 'en' && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleRetranslate(
                      englishPost, 
                      `${platform.toLowerCase()}-${currentIndex}`,
                      item.id,
                      primaryChurch?.primary_language || 'en'
                    )}
                    variant="outline"
                    size="sm"
                    disabled={retranslating}
                  >
                    {retranslating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Re-translating...
                      </>
                    ) : (
                      'Re-translate from English'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  const downloadContent = (item: GeneratedContent) => {
    const content = [];
    
    if (item.facebook_post && item.facebook_post.length > 0) {
      const posts = Array.isArray(item.facebook_post) ? item.facebook_post : [item.facebook_post];
      posts.forEach((post, idx) => {
        content.push(`=== FACEBOOK ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}\n`);
      });
    }
    if (item.instagram_post && item.instagram_post.length > 0) {
      const posts = Array.isArray(item.instagram_post) ? item.instagram_post : [item.instagram_post];
      posts.forEach((post, idx) => {
        content.push(`=== INSTAGRAM ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}\n`);
      });
    }
    if (item.tiktok_post && item.tiktok_post.length > 0) {
      const posts = Array.isArray(item.tiktok_post) ? item.tiktok_post : [item.tiktok_post];
      posts.forEach((post, idx) => {
        content.push(`=== TIKTOK ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}\n`);
      });
    }
    if (item.twitter_post && item.twitter_post.length > 0) {
      const posts = Array.isArray(item.twitter_post) ? item.twitter_post : [item.twitter_post];
      posts.forEach((post, idx) => {
        content.push(`=== TWITTER/X ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}\n`);
      });
    }
    if (item.bible_study_guide) {
      content.push(`=== BIBLE STUDY GUIDE ${item.output_language && item.output_language !== 'en' ? `(${item.output_language.toUpperCase()})` : ''} ===\n${item.bible_study_guide}\n`);
    }
    if (item.devotional) {
      content.push(`=== DAILY DEVOTIONAL ===\n${item.devotional}\n`);
    }

    const blob = new Blob([content.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${new Date(item.generated_at).toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContent = content.filter(item => {
    const query = searchQuery.toLowerCase();
    const fbPosts = Array.isArray(item.facebook_post) ? item.facebook_post : [item.facebook_post];
    const igPosts = Array.isArray(item.instagram_post) ? item.instagram_post : [item.instagram_post];
    
    return item.devotional?.toLowerCase().includes(query) ||
      item.bible_study_guide?.toLowerCase().includes(query) ||
      fbPosts.some(post => post?.toLowerCase().includes(query)) ||
      igPosts.some(post => post?.toLowerCase().includes(query));
  });

  if (loading || churchLoading || isLoading) {
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
          <h1 className="text-4xl font-playfair font-bold mb-2">Content Library</h1>
          <p className="text-muted-foreground">View and manage your past generated content</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredContent.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No content matches your search" : "No content generated yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-playfair">
                        {new Date(item.generated_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <div className="flex gap-2">
                        {(item.platforms as string[]).map((platform) => (
                          <Badge key={platform} variant="secondary" className="capitalize">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadContent(item)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteContent(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.devotional && (
                    <Collapsible
                      open={expandedSections[`${item.id}-devotional`]}
                      onOpenChange={() => toggleSection(`${item.id}-devotional`)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <ChevronDown 
                                className={`w-4 h-4 transition-transform ${
                                  expandedSections[`${item.id}-devotional`] ? 'rotate-180' : ''
                                }`}
                              />
                              <p className="text-sm font-medium">Daily Devotional</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.devotional!, "Daily devotional");
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <div className="bg-muted p-4 rounded-lg">
                              <ScrollArea className="h-[300px]">
                                <p className="text-sm whitespace-pre-wrap pr-4">{item.devotional}</p>
                              </ScrollArea>
                            </div>
                            {(item as any).devotional_english && primaryChurch?.primary_language !== 'en' && (
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={() => handleRetranslate(
                                    (item as any).devotional_english, 
                                    'devotional',
                                    item.id,
                                    primaryChurch?.primary_language || 'en'
                                  )}
                                  variant="outline"
                                  size="sm"
                                  disabled={retranslating}
                                >
                                  {retranslating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                      Re-translating...
                                    </>
                                  ) : (
                                    'Re-translate from English'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}

                  {item.facebook_post && item.facebook_post.length > 0 && (() => {
                    const postsArray = Array.isArray(item.facebook_post) ? item.facebook_post : [item.facebook_post];
                    const posts = postsArray.filter((p): p is string => typeof p === "string" && p.length > 0);
                    if (posts.length === 0) return null;
                    return renderPlatformSection(item.id, "Facebook", posts, item);
                  })()}

                  {item.instagram_post && item.instagram_post.length > 0 && (() => {
                    const postsArray = Array.isArray(item.instagram_post) ? item.instagram_post : [item.instagram_post];
                    const posts = postsArray.filter((p): p is string => typeof p === "string" && p.length > 0);
                    if (posts.length === 0) return null;
                    return renderPlatformSection(item.id, "Instagram", posts, item);
                  })()}

                  {item.tiktok_post && item.tiktok_post.length > 0 && (() => {
                    const postsArray = Array.isArray(item.tiktok_post) ? item.tiktok_post : [item.tiktok_post];
                    const posts = postsArray.filter((p): p is string => typeof p === "string" && p.length > 0);
                    if (posts.length === 0) return null;
                    return renderPlatformSection(item.id, "TikTok", posts, item);
                  })()}

                  {item.twitter_post && item.twitter_post.length > 0 && (() => {
                    const postsArray = Array.isArray(item.twitter_post) ? item.twitter_post : [item.twitter_post];
                    const posts = postsArray.filter((p): p is string => typeof p === "string" && p.length > 0);
                    if (posts.length === 0) return null;
                    return renderPlatformSection(item.id, "Twitter/X", posts, item);
                  })()}

                  {item.bible_study_guide && (
                    <Collapsible
                      open={expandedSections[`${item.id}-bible-study`]}
                      onOpenChange={() => toggleSection(`${item.id}-bible-study`)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <ChevronDown 
                                className={`w-4 h-4 transition-transform ${
                                  expandedSections[`${item.id}-bible-study`] ? 'rotate-180' : ''
                                }`} 
                              />
                              <p className="text-sm font-medium">
                                Bible Study Guide
                                {item.output_language && item.output_language !== 'en' && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({item.output_language.toUpperCase()})
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.bible_study_guide!, "Bible Study Guide");
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <ScrollArea className="h-[400px]">
                              <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg prose-p:mb-4">
                                <ReactMarkdown>{cleanBibleStudyFormatting(item.bible_study_guide)}</ReactMarkdown>
                              </div>
                            </ScrollArea>
                            {(item as any).bible_study_guide_english && primaryChurch?.primary_language !== 'en' && (
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={() => handleRetranslate(
                                    (item as any).bible_study_guide_english, 
                                    'bibleStudy',
                                    item.id,
                                    primaryChurch?.primary_language || 'en'
                                  )}
                                  variant="outline"
                                  size="sm"
                                  disabled={retranslating}
                                >
                                  {retranslating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                      Re-translating...
                                    </>
                                  ) : (
                                    'Re-translate from English'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Library;
