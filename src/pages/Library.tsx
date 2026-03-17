import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { TrialBanner } from "@/components/TrialBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Trash, MagnifyingGlass, CaretDown, CaretLeft, CaretRight, CircleNotch } from "phosphor-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
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

  const handleRetranslate = async (englishSource: string, contentType: string, contentId: string) => {
    if (!primaryChurch) return;

    const contentItem = content.find(c => c.id === contentId);
    if (!contentItem) return;

    const ensureArray = (value: string | string[] | null | undefined): string[] => {
      if (Array.isArray(value)) return [...value];
      if (typeof value === 'string' && value.length > 0) return [value];
      return [];
    };

    const existingMultiLanguage = (contentItem as any).multi_language_versions;
    const multiLanguageVersions: Record<string, any> = existingMultiLanguage && typeof existingMultiLanguage === 'object'
      ? Object.entries(existingMultiLanguage as Record<string, any>).reduce((acc: Record<string, any>, [lang, data]) => {
          acc[lang] = { ...(data as Record<string, any>) };
          return acc;
        }, {})
      : {};

    const outputLanguages = Array.isArray((contentItem as any).output_languages)
      ? ((contentItem as any).output_languages as string[])
      : [];

    const nonEnglishLanguages = outputLanguages
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
      .map(code => code.trim())
      .filter((code, index, self) => code !== 'en' && self.indexOf(code) === index);

    const primaryLanguage =
      typeof (contentItem as any).output_language === 'string'
        ? (contentItem as any).output_language
        : (primaryChurch.primary_language || 'en');

    setRetranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'retranslate-content',
        {
          body: {
            englishContent: englishSource,
            targetLanguage: primaryLanguage,
            targetLanguages: nonEnglishLanguages,
            contentType
          }
        }
      );

      if (error) throw error;

      const translatedContents: Record<string, string> = data?.translatedContents
        ? (data.translatedContents as Record<string, string>)
        : (data?.translatedContent && data?.targetLanguage
            ? { [data.targetLanguage as string]: data.translatedContent as string }
            : {});

      const updatedItem: any = { ...contentItem };
      let dbUpdateFields: any = {};

      if (contentType === 'bibleStudy') {
        updatedItem.bible_study_guide_english = englishSource;

        if (primaryLanguage === 'en') {
          updatedItem.bible_study_guide = englishSource;
        }

        Object.entries(translatedContents).forEach(([lang, translated]) => {
          const languageContent = { ...(multiLanguageVersions[lang] || {}) };
          languageContent.bibleStudyGuide = translated;
          multiLanguageVersions[lang] = languageContent;

          if (lang === primaryLanguage) {
            updatedItem.bible_study_guide = translated;
          }
        });

        updatedItem.multi_language_versions =
          Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null;

        dbUpdateFields = {
          bible_study_guide: updatedItem.bible_study_guide,
          bible_study_guide_english: englishSource,
          multi_language_versions: updatedItem.multi_language_versions
        };
      } else if (contentType === 'devotional') {
        updatedItem.devotional_english = englishSource;

        if (primaryLanguage === 'en') {
          updatedItem.devotional = englishSource;
        }

        Object.entries(translatedContents).forEach(([lang, translated]) => {
          const languageContent = { ...(multiLanguageVersions[lang] || {}) };
          languageContent.devotional = translated;
          multiLanguageVersions[lang] = languageContent;

          if (lang === primaryLanguage) {
            updatedItem.devotional = translated;
          }
        });

        updatedItem.multi_language_versions =
          Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null;

        dbUpdateFields = {
          devotional: updatedItem.devotional,
          devotional_english: englishSource,
          multi_language_versions: updatedItem.multi_language_versions
        };
      } else if (contentType.startsWith('facebook-') ||
                 contentType.startsWith('instagram-') ||
                 contentType.startsWith('tiktok-') ||
                 contentType.startsWith('twitter-')) {
        const [platformKey, indexString] = contentType.split('-');
        const idx = parseInt(indexString, 10);

        const platformField = `${platformKey}_post`;
        const englishField = `${platformKey}_post_english`;

        const currentPrimaryPosts = ensureArray((contentItem as any)[platformField]);
        if (primaryLanguage === 'en') {
          currentPrimaryPosts[idx] = englishSource;
        }

        const primaryTranslation = translatedContents[primaryLanguage];
        if (primaryLanguage !== 'en' && primaryTranslation) {
          currentPrimaryPosts[idx] = primaryTranslation;
        }
        updatedItem[platformField] = currentPrimaryPosts;

        const currentEnglishPosts = ensureArray((contentItem as any)[englishField]);
        currentEnglishPosts[idx] = englishSource;
        updatedItem[englishField] = currentEnglishPosts;

        Object.entries(translatedContents).forEach(([lang, translated]) => {
          const languageContent = { ...(multiLanguageVersions[lang] || {}) };
          const existing = ensureArray(languageContent[platformKey]);
          existing[idx] = translated;
          languageContent[platformKey] = existing;
          multiLanguageVersions[lang] = languageContent;
        });

        updatedItem.multi_language_versions =
          Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null;

        dbUpdateFields = {
          [platformField]: currentPrimaryPosts,
          [englishField]: currentEnglishPosts.length > 0 ? currentEnglishPosts : null,
          multi_language_versions: updatedItem.multi_language_versions
        };
      }

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

        setContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, ...updatedItem }
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

  const toggleSection = (key: string, isOpen?: boolean) => {
    setExpandedSections(prev => ({ 
      ...prev, 
      [key]: isOpen !== undefined ? isOpen : !prev[key] 
    }));
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
    
    // Language metadata for re-translate functionality
    const englishFieldName = `${platform.toLowerCase()}_post_english`;
    const englishPosts = item[englishFieldName];
    const englishPost = englishPosts 
      ? (Array.isArray(englishPosts) ? englishPosts[currentIndex] : englishPosts)
      : null;
    const outputLanguages = Array.isArray(item.output_languages) ? item.output_languages : [];
    const hasNonEnglishLanguages = outputLanguages.some((lang: string) => typeof lang === 'string' && lang !== 'en');
    const primaryLanguage = typeof item.output_language === 'string' ? item.output_language : 'en';
    const englishSource = englishPost || (primaryLanguage === 'en' ? currentPost : '');
    const canRetranslate = hasNonEnglishLanguages && englishSource && englishSource.trim().length > 0;

    return (
      <Collapsible key={platform} open={isExpanded} onOpenChange={(open) => toggleSection(sectionKey, open)}>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <CaretDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                <Copy size={16} />
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
                    <CaretLeft size={16} />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    {currentIndex + 1} of {posts.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeVariation(sectionKey, 'next', posts.length - 1)}
                  >
                    <CaretRight size={16} />
                  </Button>
                </div>
              )}
              <ScrollArea className="max-h-[400px]">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{currentPost}</p>
                </div>
              </ScrollArea>
              {(englishPost || canRetranslate) && (
                <div className="flex justify-end gap-2">
                  {englishPost && (
                    <Button
                      onClick={() => copyToClipboard(englishPost, `English ${platform} post`)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy size={16} className="mr-2" />
                      Copy English
                    </Button>
                  )}
                  {canRetranslate && (
                    <Button
                      onClick={() => handleRetranslate(
                        englishSource, 
                        `${platform.toLowerCase()}-${currentIndex}`,
                        item.id
                      )}
                      variant="outline"
                      size="sm"
                      disabled={retranslating}
                    >
                      {retranslating ? (
                        <>
                          <CircleNotch size={12} className="mr-2 animate-spin" />
                          Re-translating...
                        </>
                      ) : (
                        'Re-translate from English'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  const buildItemSections = (item: GeneratedContent) => {
    const content: string[] = [];
    if (item.facebook_post && item.facebook_post.length > 0) {
      const posts = Array.isArray(item.facebook_post) ? item.facebook_post : [item.facebook_post];
      posts.forEach((post, idx) => {
        content.push(`=== FACEBOOK ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}`);
      });
    }
    if (item.instagram_post && item.instagram_post.length > 0) {
      const posts = Array.isArray(item.instagram_post) ? item.instagram_post : [item.instagram_post];
      posts.forEach((post, idx) => {
        content.push(`=== INSTAGRAM ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}`);
      });
    }
    if (item.tiktok_post && item.tiktok_post.length > 0) {
      const posts = Array.isArray(item.tiktok_post) ? item.tiktok_post : [item.tiktok_post];
      posts.forEach((post, idx) => {
        content.push(`=== TIKTOK ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}`);
      });
    }
    if (item.twitter_post && item.twitter_post.length > 0) {
      const posts = Array.isArray(item.twitter_post) ? item.twitter_post : [item.twitter_post];
      posts.forEach((post, idx) => {
        content.push(`=== TWITTER/X ${posts.length > 1 ? `(Variation ${idx + 1})` : ''} ===\n${post}`);
      });
    }
    if (item.bible_study_guide) {
      content.push(`=== BIBLE STUDY GUIDE ${item.output_language && item.output_language !== 'en' ? `(${String(item.output_language).toUpperCase()})` : ''} ===\n${item.bible_study_guide}`);
    }
    if (item.devotional) {
      content.push(`=== DAILY DEVOTIONAL ===\n${item.devotional}`);
    }
    return content;
  };

  const downloadContent = async (item: GeneratedContent, format: 'txt' | 'docx' | 'pdf' | 'html' = 'txt') => {
    const base = `content-${new Date(item.generated_at).toISOString().split('T')[0]}`;
    const sections = buildItemSections(item);

    if (format === 'txt') {
      const blob = new Blob([sections.join('\n\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'html') {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${base}</title></head><body>${sections
        .map(s => `<section><pre style="white-space:pre-wrap;">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre></section>`)
        .join('<hr/>')}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'docx') {
      const paragraphs: Paragraph[] = [];
      sections.forEach(section => {
        section.split('\n').forEach(line => paragraphs.push(new Paragraph({ children: [new TextRun(line)] })));
        paragraphs.push(new Paragraph(''));
      });
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth() - 72;
      const marginLeft = 36;
      let y = 48;
      sections.forEach((section, idx) => {
        const lines = doc.splitTextToSize(section, pageWidth);
        lines.forEach(line => {
          if (y > doc.internal.pageSize.getHeight() - 48) {
            doc.addPage();
            y = 48;
          }
          doc.text(line, marginLeft, y);
          y += 16;
        });
        if (idx < sections.length - 1) {
          if (y > doc.internal.pageSize.getHeight() - 48) {
            doc.addPage();
            y = 48;
          }
          y += 8;
        }
      });
      doc.save(`${base}.pdf`);
      return;
    }
  };

  const filteredContent = content.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Helper function to check if text contains query
    const containsQuery = (text: string | null | undefined): boolean => {
      return text ? text.toLowerCase().includes(query) : false;
    };
    
    // Helper function to check arrays of posts
    const postsContainQuery = (posts: string[] | string | null | undefined): boolean => {
      if (!posts) return false;
      const postArray = Array.isArray(posts) ? posts : [posts];
      return postArray.some(post => containsQuery(post));
    };
    
    // Search across all content fields including custom_cta (themes/keywords)
    return containsQuery(item.custom_cta) ||
      containsQuery(item.devotional) ||
      containsQuery(item.bible_study_guide) ||
      postsContainQuery(item.facebook_post) ||
      postsContainQuery(item.instagram_post) ||
      postsContainQuery(item.tiktok_post) ||
      postsContainQuery(item.twitter_post) ||
      // Also search in English versions for completeness
      postsContainQuery((item as any).facebook_post_english) ||
      postsContainQuery((item as any).instagram_post_english) ||
      postsContainQuery((item as any).tiktok_post_english) ||
      postsContainQuery((item as any).twitter_post_english) ||
      containsQuery((item as any).devotional_english) ||
      containsQuery((item as any).bible_study_guide_english);
  });

  // Group content by date
  const groupContentByDate = (items: typeof filteredContent) => {
    const groups: Record<string, typeof filteredContent> = {};
    items.forEach(item => {
      const date = new Date(item.generated_at);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  };

  const contentByDate = groupContentByDate(filteredContent);
  // Sort items within each date group by time (most recent first)
  Object.keys(contentByDate).forEach(dateKey => {
    contentByDate[dateKey].sort((a, b) => {
      return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
    });
  });
  const sortedDates = Object.keys(contentByDate).sort((a, b) => {
    // Sort by the most recent item in each date group
    const dateA = contentByDate[a][0].generated_at;
    const dateB = contentByDate[b][0].generated_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
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
      <TrialBanner />
      <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold mb-2">Content Library</h1>
          <p className="text-muted-foreground">View and manage your past generated content</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by keywords, themes, or content (e.g., 'Advent', 'Easter', 'prayer')..."
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
            {sortedDates.map((dateKey) => {
              const dateItems = contentByDate[dateKey];
              const dateItem = dateItems[0];
              const dateObj = new Date(dateItem.generated_at);
              const dateDisplay = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const groupKey = `date-${dateKey}`;
              const isExpanded = expandedSections[groupKey] ?? false;

              return (
                <Collapsible
                  key={dateKey}
                  open={isExpanded}
                  onOpenChange={(open) => toggleSection(groupKey, open)}
                >
                  <Card>
                    <CardHeader>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CaretDown 
                              size={20}
                              className={`transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                            <div>
                              <CardTitle className="text-xl font-playfair text-left">
                                {dateDisplay}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {dateItems.length} {dateItems.length === 1 ? 'generation' : 'generations'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <div className="space-y-4 px-6 pb-6">
                        {dateItems.map((item) => {
                          const timestamp = new Date(item.generated_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                          
                          return (
                            <Card key={item.id} className="border-l-4 border-l-primary">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <CardTitle className="text-lg font-semibold">
                                        {timestamp}
                                      </CardTitle>
                                    </div>
                                    <div className="flex gap-2">
                                      {(item.platforms as string[]).map((platform) => (
                                        <Badge key={platform} variant="secondary" className="capitalize">
                                          {platform}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Download size={16} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => downloadContent(item, 'txt')}>Text (.txt)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadContent(item, 'docx')}>Word (.docx)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadContent(item, 'pdf')}>PDF (.pdf)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadContent(item, 'html')}>HTML (.html)</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteContent(item.id)}
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                  {item.devotional && (
                    <Collapsible
                      open={expandedSections[`${item.id}-devotional`] ?? false}
                      onOpenChange={(open) => toggleSection(`${item.id}-devotional`, open)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <CaretDown 
                              size={16}
                              className={`transition-transform ${
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
                              <Copy size={16} />
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
                            {(() => {
                              const outputLanguages = Array.isArray(item.output_languages) ? item.output_languages : [];
                              const hasNonEnglish = outputLanguages.some((lang: string) => typeof lang === 'string' && lang !== 'en');
                              const primaryLanguage = typeof item.output_language === 'string' ? item.output_language : 'en';
                              const englishDevotionalSource =
                                (item as any).devotional_english ||
                                (primaryLanguage === 'en' ? item.devotional : '');
                              if (!hasNonEnglish || !englishDevotionalSource || !englishDevotionalSource.trim()) {
                                return null;
                              }
                              return (
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    onClick={() => handleRetranslate(
                                      englishDevotionalSource, 
                                      'devotional',
                                      item.id
                                    )}
                                    variant="outline"
                                    size="sm"
                                    disabled={retranslating}
                                  >
                                    {retranslating ? (
                                      <>
                                        <CircleNotch size={12} className="mr-2 animate-spin" />
                                        Re-translating...
                                      </>
                                    ) : (
                                      'Re-translate from English'
                                    )}
                                  </Button>
                                </div>
                              );
                            })()}
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
                      open={expandedSections[`${item.id}-bible-study`] ?? false}
                      onOpenChange={(open) => toggleSection(`${item.id}-bible-study`, open)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <CaretDown 
                                size={16}
                                className={`transition-transform ${
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
                              <Copy size={16} />
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
                            {(() => {
                              const outputLanguages = Array.isArray(item.output_languages) ? item.output_languages : [];
                              const hasNonEnglish = outputLanguages.some((lang: string) => typeof lang === 'string' && lang !== 'en');
                              const primaryLanguage = typeof item.output_language === 'string' ? item.output_language : 'en';
                              const englishBibleSource =
                                (item as any).bible_study_guide_english ||
                                (primaryLanguage === 'en' ? item.bible_study_guide : '');
                              if (!hasNonEnglish || !englishBibleSource || !englishBibleSource.trim()) {
                                return null;
                              }
                              return (
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    onClick={() => handleRetranslate(
                                      englishBibleSource, 
                                      'bibleStudy',
                                      item.id
                                    )}
                                    variant="outline"
                                    size="sm"
                                    disabled={retranslating}
                                  >
                                    {retranslating ? (
                                      <>
                                        <CircleNotch size={12} className="mr-2 animate-spin" />
                                        Re-translating...
                                      </>
                                    ) : (
                                      'Re-translate from English'
                                    )}
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Library;
