import { useEffect, useState, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Copy, Download, Upload, CheckCircle2, ChevronDown } from "lucide-react";
import type { Platform } from "@/types/database";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from "react-markdown";
import MDEditor from '@uiw/react-md-editor';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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

// Dual Language Display Component
interface DualLanguageDisplayProps {
  foreignContent: string;
  englishContent: string;
  contentType: string;
  languageName: string;
  onRetranslate: (editedEnglish: string, contentType: string) => void;
  retranslating: boolean;
}

const DualLanguageDisplay: React.FC<DualLanguageDisplayProps> = ({
  foreignContent,
  englishContent,
  contentType,
  languageName,
  onRetranslate,
  retranslating
}) => {
  const [editedEnglish, setEditedEnglish] = useState(englishContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnglishExpanded, setIsEnglishExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Primary: Foreign Language (Full Width) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">
            {languageName} Version
          </Label>
          <span className="text-xs text-muted-foreground">Read-only</span>
        </div>
        <ScrollArea className="border rounded-lg max-h-[600px]">
          <div className="prose prose-sm max-w-none p-6">
            <ReactMarkdown>{foreignContent}</ReactMarkdown>
          </div>
        </ScrollArea>
      </div>

      {/* Secondary: English Reference (Collapsible) */}
      <Collapsible open={isEnglishExpanded} onOpenChange={setIsEnglishExpanded}>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isEnglishExpanded ? 'rotate-180' : ''
                  }`}
                />
                <span className="text-sm font-medium">English Reference</span>
                <span className="text-xs text-muted-foreground">
                  {isEnglishExpanded ? '(Click to hide)' : '(Click to view)'}
                </span>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              {isEditing ? (
                <div className="min-h-[300px]">
                  <MDEditor
                    value={editedEnglish}
                    onChange={(val) => setEditedEnglish(val || '')}
                    height={300}
                    preview="edit"
                  />
                </div>
              ) : (
                <ScrollArea className="border rounded-lg max-h-[500px]">
                  <div className="prose prose-sm max-w-none p-6 prose-p:mb-4">
                    <ReactMarkdown>{editedEnglish}</ReactMarkdown>
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2 justify-end">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedEnglish(englishContent);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onRetranslate(editedEnglish, contentType);
                        setIsEditing(false);
                      }}
                      disabled={retranslating}
                    >
                      {retranslating ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        'Save & Re-translate'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

const Dashboard = () => {
  const {
    user,
    loading
  } = useAuth();
  const {
    primaryChurch,
    loading: churchLoading
  } = useChurch(user?.id);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

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

  // Helper function to count words in text
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to get length indicator
  const getLengthIndicator = (text: string, platform: string) => {
    const charCount = text.length;
    const wordCount = countWords(text);
    switch (platform) {
      case 'facebook':
        if (wordCount >= 40 && wordCount <= 80) {
          return {
            status: '✅',
            color: 'text-green-600',
            message: `${wordCount} words (Ideal: 40-80)`
          };
        } else if (wordCount > 80 && wordCount <= 100) {
          return {
            status: '⚠️',
            color: 'text-yellow-600',
            message: `${wordCount} words (Recommended: 40-80)`
          };
        } else {
          return {
            status: '❌',
            color: 'text-red-600',
            message: `${wordCount} words (Target: 40-80)`
          };
        }
      case 'instagram':
        const firstLine = text.split('\n')[0];
        const firstLineLength = firstLine.length;
        if (firstLineLength <= 125 && charCount <= 200) {
          return {
            status: '✅',
            color: 'text-green-600',
            message: `First line: ${firstLineLength} chars (Ideal)`
          };
        } else if (firstLineLength <= 125) {
          return {
            status: '⚠️',
            color: 'text-yellow-600',
            message: `First line: ${firstLineLength} chars (caption longer than ideal)`
          };
        } else {
          return {
            status: '❌',
            color: 'text-red-600',
            message: `First line: ${firstLineLength} chars (Target: <125)`
          };
        }
      case 'tiktok':
        if (charCount <= 150) {
          return {
            status: '✅',
            color: 'text-green-600',
            message: `${charCount} chars (Perfect)`
          };
        } else if (charCount <= 180) {
          return {
            status: '⚠️',
            color: 'text-yellow-600',
            message: `${charCount} chars (Target: <150)`
          };
        } else {
          return {
            status: '❌',
            color: 'text-red-600',
            message: `${charCount} chars (Too long)`
          };
        }
      case 'twitter':
        if (charCount <= 260) {
          return {
            status: '✅',
            color: 'text-green-600',
            message: `${charCount} chars (Good for retweets)`
          };
        } else if (charCount <= 280) {
          return {
            status: '⚠️',
            color: 'text-yellow-600',
            message: `${charCount} chars (At limit)`
          };
        } else {
          return {
            status: '❌',
            color: 'text-red-600',
            message: `${charCount} chars (Over 280 limit!)`
          };
        }
      default:
        return {
          status: '',
          color: '',
          message: `${charCount} characters`
        };
    }
  };
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook', 'instagram', 'tiktok', 'twitter']);
  const [customCTA, setCustomCTA] = useState("");
  const [postsPerPlatform, setPostsPerPlatform] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeVariations, setActiveVariations] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | 'twitter'>('facebook');

  // New state for enhanced features
  const [contentTypes, setContentTypes] = useState<('social_media' | 'bible_study' | 'devotional')[]>(['social_media']);
  const [outputLanguages, setOutputLanguages] = useState<string[]>(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [bibleStudySelected, setBibleStudySelected] = useState(false);
  const [socialMediaSelected, setSocialMediaSelected] = useState(true);
  const [devotionalSelected, setDevotionalSelected] = useState(false);
  const [retranslating, setRetranslating] = useState(false);

  // Editing state for inline content editing
  const [editingContent, setEditingContent] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  // Translation version tracker to force re-render of foreign language collapsibles
  const [translationVersion, setTranslationVersion] = useState(0);

  const hasNonEnglishLanguages = outputLanguages.some(code => code !== 'en');

  // Get English source for retranslation
  // If primary language is English, use the edited/displayed content as the English source
  // Otherwise, use the stored English reference version
  const englishBibleSource = (() => {
    if (primaryLanguage === 'en') {
      return (editedContent['bibleStudyGuide'] ?? generatedContent?.bibleStudyGuide ?? '') as string;
    }
    return (generatedContent?.englishVersions?.bibleStudyGuide ??
            generatedContent?.bibleStudyGuide ??
            '') as string;
  })();

  const englishDevotionalSource = (() => {
    if (primaryLanguage === 'en') {
      return (editedContent['devotional'] ?? generatedContent?.devotional ?? '') as string;
    }
    return (generatedContent?.englishVersions?.devotional ??
            generatedContent?.devotional ??
            '') as string;
  })();

  const canRetranslateBible = hasNonEnglishLanguages && englishBibleSource.trim().length > 0;
  const canRetranslateDevotional = hasNonEnglishLanguages && englishDevotionalSource.trim().length > 0;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Initialize active social platform and set editing mode for English content when content is generated
  useEffect(() => {
    if (generatedContent && !retranslating) {
      // Sync output languages and primary language from loaded content
      // Check both camelCase and snake_case field names for compatibility
      const outputLangs = generatedContent.outputLanguages || generatedContent.output_languages;
      const primaryLang = generatedContent.primaryLanguage || generatedContent.primary_language;

      if (outputLangs && Array.isArray(outputLangs)) {
        console.log('Syncing outputLanguages from generatedContent:', outputLangs);
        setOutputLanguages(outputLangs);
      }
      if (primaryLang) {
        console.log('Syncing primaryLanguage from generatedContent:', primaryLang);
        setPrimaryLanguage(primaryLang);
      }

      const defaultPlatform = generatedContent.facebook ? 'facebook' :
                             generatedContent.instagram ? 'instagram' :
                             generatedContent.tiktok ? 'tiktok' :
                             generatedContent.twitter ? 'twitter' : null;

      if (defaultPlatform) {
        setActiveSocialPlatform(defaultPlatform as 'facebook' | 'instagram' | 'tiktok' | 'twitter');
      }

      // Auto-enable editing mode for all English content (MDEditor by default)
      if (primaryLanguage === 'en') {
        const newEditingState: Record<string, boolean> = {};
        
        // Set social media posts to editing mode
        ['facebook', 'instagram', 'tiktok', 'twitter'].forEach(platform => {
          if (generatedContent[platform]) {
            const posts = Array.isArray(generatedContent[platform]) ? generatedContent[platform] : [generatedContent[platform]];
            posts.forEach((_: any, idx: number) => {
              newEditingState[`${platform}-${idx}`] = true;
            });
          }
        });

        // Set Bible study and devotional to editing mode
        if (generatedContent.bibleStudyGuide) {
          newEditingState['bibleStudyGuide'] = true;
        }
        if (generatedContent.devotional) {
          newEditingState['devotional'] = true;
        }

        setEditingContent(newEditingState);

        // Initialize edited content with current content
        // Only initialize if editedContent is empty to prevent overwriting user edits during re-translation
        if (Object.keys(editedContent).length === 0) {
          const newEditedContent: Record<string, string> = {};
          Object.keys(newEditingState).forEach(key => {
            if (key === 'bibleStudyGuide') {
              newEditedContent[key] = generatedContent.bibleStudyGuide || '';
            } else if (key === 'devotional') {
              newEditedContent[key] = generatedContent.devotional || '';
            } else if (key.includes('-')) {
              const [platform, idxStr] = key.split('-');
              const idx = parseInt(idxStr);
              const posts = Array.isArray(generatedContent[platform]) ? generatedContent[platform] : [generatedContent[platform]];
              newEditedContent[key] = posts[idx] || '';
            }
          });
          setEditedContent(newEditedContent);
        }
      }
    }
  }, [generatedContent, primaryLanguage, retranslating]);
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
          description: "Transcript loaded successfully."
        });
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        // Word documents - use mammoth to extract text
        toast({
          title: "Processing document...",
          description: "Extracting text from Word document."
        });
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({
          arrayBuffer
        });
        setTranscriptText(result.value);
        toast({
          title: "Document processed",
          description: "Text extracted successfully from Word document."
        });
      } else if (fileExtension === 'pdf') {
        // PDF files - extract text using PDF.js
        console.log('🔵 PDF processing started');
        toast({
          title: "Processing PDF...",
          description: "Extracting text from PDF document."
        });
        const arrayBuffer = await file.arrayBuffer();
        console.log('🔵 PDF arrayBuffer created, size:', arrayBuffer.byteLength);
        
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer
        }).promise;
        console.log('🔵 PDF loaded, pages:', pdf.numPages);
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          console.log(`🔵 Page ${i} extracted, length:`, pageText.length);
          fullText += pageText + "\n\n";
        }
        
        console.log('🔵 Full text extracted, total length:', fullText.length);
        const trimmedText = fullText.trim();
        console.log('🔵 Trimmed text length:', trimmedText.length);
        console.log('🔵 First 200 chars:', trimmedText.substring(0, 200));
        
        // Check if PDF is empty or scanned (no extractable text)
        if (!trimmedText || trimmedText.length < 50) {
          console.log('❌ PDF has insufficient text (<50 chars)');
          toast({
            variant: "destructive",
            title: "No text found in PDF",
            description: "This PDF appears to be scanned or contains only images. Please upload a PDF with selectable text, or try converting it using OCR software first."
          });
          setTranscriptFile(null);
          setTranscriptText("");
          return;
        }
        
        console.log('✅ PDF text extraction successful');
        setTranscriptText(trimmedText);
        toast({
          title: "PDF processed",
          description: `Text extracted successfully from ${pdf.numPages} page(s).`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: "Please upload a .txt, .pdf, .docx, or .doc file."
        });
        setTranscriptFile(null);
      }
    } catch (error) {
      console.error('❌ Error processing file:', error);
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorTitle = "Error processing file";
      let errorDescription = "Failed to read file content.";
      
      if (error instanceof Error) {
        // Password-protected PDF
        if (error.message.includes('password')) {
          errorTitle = "Password-protected PDF";
          errorDescription = "This PDF is password-protected. Please unlock it and try again.";
        }
        // Corrupted or invalid PDF
        else if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
          errorTitle = "Invalid PDF file";
          errorDescription = "This PDF file appears to be corrupted. Try re-exporting it and upload again.";
        }
        // Generic error with actual message
        else {
          errorDescription = error.message;
        }
      }
      
      console.log('🔔 Showing error toast:', errorTitle, errorDescription);
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription
      });
      setTranscriptFile(null);
      setTranscriptText("");
    }
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const input = document.getElementById('transcript-upload') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        input.files = dataTransfer.files;
        handleFileUpload({
          target: input
        } as any);
      }
    }
  };
  const handlePlatformToggle = (platform: Platform) => {
    setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  const handleContentTypeToggle = (type: 'social_media' | 'bible_study' | 'devotional') => {
    setContentTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];

      // Update individual state flags
      if (type === 'social_media') {
        setSocialMediaSelected(newTypes.includes('social_media'));
        // Auto-select all platforms when social_media is enabled
        if (newTypes.includes('social_media') && platforms.length === 0) {
          setPlatforms(['facebook', 'instagram', 'tiktok', 'twitter']);
        }
      } else if (type === 'bible_study') {
        setBibleStudySelected(newTypes.includes('bible_study'));
      } else if (type === 'devotional') {
        setDevotionalSelected(newTypes.includes('devotional'));
      }

      return newTypes;
    });
  };

  const handleStartEdit = (contentKey: string, currentContent: string) => {
    setEditingContent(prev => ({ ...prev, [contentKey]: true }));
    setEditedContent(prev => ({ ...prev, [contentKey]: currentContent }));
  };

  const handleCancelEdit = (contentKey: string) => {
    setEditingContent(prev => ({ ...prev, [contentKey]: false }));
    setEditedContent(prev => {
      const updated = { ...prev };
      delete updated[contentKey];
      return updated;
    });
  };

  const handleSaveEdit = async (contentKey: string) => {
    const newContent = editedContent[contentKey];
    if (!newContent) return;

    // Update the generatedContent state with the edited value
    setGeneratedContent((prev: any) => {
      const updated = { ...prev };

      // Parse the contentKey to determine what to update
      if (contentKey === 'devotional') {
        updated.devotional = newContent;
      } else if (contentKey === 'bibleStudyGuide') {
        updated.bibleStudyGuide = newContent;
      } else if (contentKey.startsWith('facebook-')) {
        const idx = parseInt(contentKey.split('-')[1]);
        const posts = Array.isArray(updated.facebook) ? [...updated.facebook] : [updated.facebook];
        posts[idx] = newContent;
        updated.facebook = posts;
      } else if (contentKey.startsWith('instagram-')) {
        const idx = parseInt(contentKey.split('-')[1]);
        const posts = Array.isArray(updated.instagram) ? [...updated.instagram] : [updated.instagram];
        posts[idx] = newContent;
        updated.instagram = posts;
      } else if (contentKey.startsWith('tiktok-')) {
        const idx = parseInt(contentKey.split('-')[1]);
        const posts = Array.isArray(updated.tiktok) ? [...updated.tiktok] : [updated.tiktok];
        posts[idx] = newContent;
        updated.tiktok = posts;
      } else if (contentKey.startsWith('twitter-')) {
        const idx = parseInt(contentKey.split('-')[1]);
        const posts = Array.isArray(updated.twitter) ? [...updated.twitter] : [updated.twitter];
        posts[idx] = newContent;
        updated.twitter = posts;
      }

      return updated;
    });

    // Save to database if we have an ID
    if (generatedContent?.id && primaryChurch) {
      try {
        let dbUpdateFields: any = {};
        const normalizeToArray = (post: string | string[] | null) => {
          if (!post) return null;
          return Array.isArray(post) ? post : [post];
        };

        if (contentKey === 'bibleStudyGuide') {
          dbUpdateFields = { bible_study_guide: newContent };
        } else if (contentKey === 'devotional') {
          dbUpdateFields = { devotional: newContent };
        } else if (contentKey.startsWith('facebook-')) {
          const idx = parseInt(contentKey.split('-')[1]);
          const currentPosts = Array.isArray(generatedContent.facebook)
            ? [...generatedContent.facebook]
            : [generatedContent.facebook];
          currentPosts[idx] = newContent;
          dbUpdateFields = { facebook_post: normalizeToArray(currentPosts) };
        } else if (contentKey.startsWith('instagram-')) {
          const idx = parseInt(contentKey.split('-')[1]);
          const currentPosts = Array.isArray(generatedContent.instagram)
            ? [...generatedContent.instagram]
            : [generatedContent.instagram];
          currentPosts[idx] = newContent;
          dbUpdateFields = { instagram_post: normalizeToArray(currentPosts) };
        } else if (contentKey.startsWith('tiktok-')) {
          const idx = parseInt(contentKey.split('-')[1]);
          const currentPosts = Array.isArray(generatedContent.tiktok)
            ? [...generatedContent.tiktok]
            : [generatedContent.tiktok];
          currentPosts[idx] = newContent;
          dbUpdateFields = { tiktok_post: normalizeToArray(currentPosts) };
        } else if (contentKey.startsWith('twitter-')) {
          const idx = parseInt(contentKey.split('-')[1]);
          const currentPosts = Array.isArray(generatedContent.twitter)
            ? [...generatedContent.twitter]
            : [generatedContent.twitter];
          currentPosts[idx] = newContent;
          dbUpdateFields = { twitter_post: normalizeToArray(currentPosts) };
        }

        if (Object.keys(dbUpdateFields).length > 0) {
          const { error: updateError } = await supabase
            .from('generated_content')
            .update(dbUpdateFields)
            .eq('id', generatedContent.id)
            .eq('church_id', primaryChurch.id);

          if (updateError) {
            console.error('Database update error:', updateError);
            toast({
              variant: "destructive",
              title: "Save failed",
              description: "Changes saved locally but failed to save to library."
            });
          } else {
            toast({
              title: "Content saved to library",
              description: "Your changes have been saved to the library."
            });
          }
        }
      } catch (error) {
        console.error('Save error:', error);
        toast({
          variant: "destructive",
          title: "Save failed",
          description: "Failed to save changes to library."
        });
      }
    } else {
      toast({
        title: "Content updated",
        description: "Your edits have been saved locally."
      });
    }

    // Clear editing state
    setEditingContent(prev => ({ ...prev, [contentKey]: false }));
  };

  // Helper functions for multi-language support
  const handleLanguageToggle = (languageCode: string) => {
    if (languageCode === 'en') {
      // English must always be included
      return;
    }

    setOutputLanguages(prev => {
      const isCurrentlySelected = prev.includes(languageCode);
      
      if (isCurrentlySelected) {
        // Remove language (but keep English)
        const newLanguages = prev.filter(lang => lang !== languageCode);
        // If removed language was primary, set English as primary
        if (primaryLanguage === languageCode) {
          setPrimaryLanguage('en');
        }
        return newLanguages;
      } else {
        // Add language if under limit of 3
        if (prev.length >= 3) {
          return prev; // Don't add if already at limit
        }
        return [...prev, languageCode];
      }
    });
  };

  const handlePrimaryLanguageChange = (languageCode: string) => {
    if (outputLanguages.includes(languageCode)) {
      setPrimaryLanguage(languageCode);
    }
  };

  const handleRetranslate = async (englishSource: string, contentType: string) => {
    if (!primaryChurch) return;

    const normalizeToArray = (post: string | string[] | null | undefined) => {
      if (!post) return null;
      return Array.isArray(post) ? post : [post];
    };

    const updateCollection = (existing: string | string[] | null | undefined, index: number, value: string) => {
      if (Array.isArray(existing)) {
        const arr = [...existing];
        arr[index] = value;
        return arr;
      }
      if (existing === null || existing === undefined) {
        if (index === 0) {
          return value;
        }
        const arr: string[] = [];
        arr[index] = value;
        return arr;
      }
      if (index === 0) {
        return value;
      }
      const arr: string[] = [];
      arr[0] = existing;
      arr[index] = value;
      return arr;
    };

    const nonEnglishLanguages = outputLanguages
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
      .map(code => code.trim())
      .filter((code, index, self) => code !== 'en' && self.indexOf(code) === index);

    setRetranslating(true);

    try {
      // STEP 1: Save the English content to database FIRST (before translation)
      // This ensures the edited English is persisted even if translation fails
      if (generatedContent?.id) {
        let englishSaveFields: any = {};

        if (contentType === 'bibleStudy') {
          // If primary language is English, save to main field; otherwise save to English reference field
          if (primaryLanguage === 'en') {
            englishSaveFields = {
              bible_study_guide: englishSource
            };
          } else {
            englishSaveFields = {
              bible_study_guide_english: englishSource
            };
          }
        } else if (contentType === 'devotional') {
          if (primaryLanguage === 'en') {
            englishSaveFields = {
              devotional: englishSource
            };
          } else {
            englishSaveFields = {
              devotional_english: englishSource
            };
          }
        } else if (contentType.startsWith('facebook-') ||
                   contentType.startsWith('instagram-') ||
                   contentType.startsWith('tiktok-') ||
                   contentType.startsWith('twitter-')) {
          const [platform, indexString] = contentType.split('-');
          const idx = parseInt(indexString, 10);
          const platformKey = platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter';
          const platformColumnMap = {
            facebook: 'facebook_post',
            instagram: 'instagram_post',
            tiktok: 'tiktok_post',
            twitter: 'twitter_post'
          } as const;
          const platformColumn = platformColumnMap[platformKey];

          if (primaryLanguage === 'en') {
            const currentPosts = generatedContent[platformKey];
            englishSaveFields = {
              [platformColumn]: normalizeToArray(updateCollection(currentPosts, idx, englishSource))
            };
          } else {
            const currentEnglishPosts = generatedContent.englishVersions?.[platformKey];
            englishSaveFields = {
              [`${platformColumn}_english`]: normalizeToArray(updateCollection(currentEnglishPosts, idx, englishSource))
            };
          }
        }

        if (Object.keys(englishSaveFields).length > 0) {
          const { error: saveError } = await supabase
            .from('generated_content')
            .update(englishSaveFields)
            .eq('id', generatedContent.id)
            .eq('church_id', primaryChurch.id);

          if (saveError) {
            console.error('Failed to save English content:', saveError);
            toast({
              variant: "destructive",
              title: "Save failed",
              description: "Failed to save your edited English content. Please try again."
            });
            setRetranslating(false);
            return;
          }

          // Update local state with saved English content
          setGeneratedContent((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const englishVersions = { ...(prev?.englishVersions || {}) };

            if (contentType === 'bibleStudy') {
              if (primaryLanguage === 'en') {
                updated.bibleStudyGuide = englishSource;
                delete englishVersions.bibleStudyGuide;
              } else {
                englishVersions.bibleStudyGuide = englishSource;
              }
            } else if (contentType === 'devotional') {
              if (primaryLanguage === 'en') {
                updated.devotional = englishSource;
                delete englishVersions.devotional;
              } else {
                englishVersions.devotional = englishSource;
              }
            } else if (contentType.startsWith('facebook-') ||
                       contentType.startsWith('instagram-') ||
                       contentType.startsWith('tiktok-') ||
                       contentType.startsWith('twitter-')) {
              const [platform, indexString] = contentType.split('-');
              const idx = parseInt(indexString, 10);
              const platformKey = platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter';

              if (primaryLanguage === 'en') {
                updated[platformKey] = updateCollection(updated[platformKey], idx, englishSource);
                delete englishVersions[platformKey];
              } else {
                englishVersions[platformKey] = updateCollection(englishVersions[platformKey], idx, englishSource);
              }
            }

            updated.englishVersions = Object.keys(englishVersions).length > 0 ? englishVersions : null;
            return updated;
          });

          // Also update editedContent to preserve the edits in the MDEditor
          setEditedContent((prev: Record<string, string>) => {
            const updated = { ...prev };

            if (contentType === 'bibleStudy') {
              updated['bibleStudyGuide'] = englishSource;
            } else if (contentType === 'devotional') {
              updated['devotional'] = englishSource;
            } else if (contentType.startsWith('facebook-') ||
                       contentType.startsWith('instagram-') ||
                       contentType.startsWith('tiktok-') ||
                       contentType.startsWith('twitter-')) {
              updated[contentType] = englishSource;
            }

            return updated;
          });
        }
      }

      // STEP 2: Call translation API with the saved English content
      console.log('=== RETRANSLATE DEBUG ===');
      console.log('outputLanguages:', outputLanguages);
      console.log('nonEnglishLanguages:', nonEnglishLanguages);
      console.log('primaryLanguage:', primaryLanguage);
      console.log('englishSource length:', englishSource?.length || 0);
      console.log('contentType:', contentType);

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
        ? data.translatedContents as Record<string, string>
        : (data?.translatedContent && data?.targetLanguage
            ? { [data.targetLanguage as string]: data.translatedContent as string }
            : {});

      console.log('translatedContents:', translatedContents);
      console.log('translatedContents keys:', Object.keys(translatedContents));

      // Validate that we got translations back
      if (Object.keys(translatedContents).length === 0) {
        throw new Error('Translation returned no results. Check that you have multiple languages selected and that your content has been generated with those languages.');
      }

      // STEP 3: Save translations to database
      let dbUpdateFields: any = {};

      setGeneratedContent((prev: any) => {
        if (!prev) return prev;

        const updated = { ...prev };
        const englishVersions = { ...(prev?.englishVersions || {}) };
        const existingMultiLanguage = prev?.multiLanguageVersions || null;
        const multiLanguageVersions: Record<string, any> = existingMultiLanguage
          ? Object.entries(existingMultiLanguage).reduce((acc: Record<string, any>, [lang, content]) => {
              acc[lang] = { ...(content as Record<string, any>) };
              return acc;
            }, {})
          : {};

        if (contentType === 'bibleStudy') {
          // Only store English reference version if primary language is NOT English
          if (primaryLanguage !== 'en') {
            englishVersions.bibleStudyGuide = englishSource;
          } else {
            delete englishVersions.bibleStudyGuide;
          }

          Object.entries(translatedContents).forEach(([lang, translated]) => {
            const languageContent = { ...(multiLanguageVersions[lang] || {}) };
            languageContent.bibleStudyGuide = translated;
            multiLanguageVersions[lang] = languageContent;

            if (lang === primaryLanguage) {
              updated.bibleStudyGuide = translated;
            }
          });

          dbUpdateFields = {
            bible_study_guide: updated.bibleStudyGuide,
            multi_language_versions: Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null
          };

          // Only include English reference field if primary language is not English
          if (primaryLanguage !== 'en') {
            dbUpdateFields.bible_study_guide_english = englishSource;
          }
        } else if (contentType === 'devotional') {
          // Only store English reference version if primary language is NOT English
          if (primaryLanguage !== 'en') {
            englishVersions.devotional = englishSource;
          } else {
            delete englishVersions.devotional;
          }

          Object.entries(translatedContents).forEach(([lang, translated]) => {
            const languageContent = { ...(multiLanguageVersions[lang] || {}) };
            languageContent.devotional = translated;
            multiLanguageVersions[lang] = languageContent;

            if (lang === primaryLanguage) {
              updated.devotional = translated;
            }
          });

          dbUpdateFields = {
            devotional: updated.devotional,
            multi_language_versions: Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null
          };

          // Only include English reference field if primary language is not English
          if (primaryLanguage !== 'en') {
            dbUpdateFields.devotional_english = englishSource;
          }
        } else if (contentType.startsWith('facebook-') ||
                   contentType.startsWith('instagram-') ||
                   contentType.startsWith('tiktok-') ||
                   contentType.startsWith('twitter-')) {
          const [platform, indexString] = contentType.split('-');
          const idx = parseInt(indexString, 10);
          const platformKey = platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter';

          // Only store English reference version if primary language is NOT English
          if (primaryLanguage !== 'en') {
            englishVersions[platformKey] = updateCollection(englishVersions[platformKey], idx, englishSource);
          } else {
            delete englishVersions[platformKey];
          }

          Object.entries(translatedContents).forEach(([lang, translated]) => {
            const languageContent = { ...(multiLanguageVersions[lang] || {}) };
            languageContent[platformKey] = updateCollection(languageContent[platformKey], idx, translated);
            multiLanguageVersions[lang] = languageContent;

            if (lang === primaryLanguage) {
              updated[platformKey] = updateCollection(updated[platformKey], idx, translated);
            }
          });

          const platformColumnMap = {
            facebook: 'facebook_post',
            instagram: 'instagram_post',
            tiktok: 'tiktok_post',
            twitter: 'twitter_post'
          } as const;

          const platformColumn = platformColumnMap[platformKey];

          dbUpdateFields = {
            [platformColumn]: normalizeToArray(updated[platformKey]),
            multi_language_versions: Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null
          };

          // Only include English reference field if primary language is not English
          if (primaryLanguage !== 'en') {
            dbUpdateFields[`${platformColumn}_english`] = normalizeToArray(englishVersions[platformKey]);
          }
        }

        updated.englishVersions = Object.keys(englishVersions).length > 0 ? englishVersions : null;
        updated.multiLanguageVersions = Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null;

        return updated;
      });

      if (Object.keys(dbUpdateFields).length > 0 && generatedContent?.id) {
        const { error: updateError } = await supabase
          .from('generated_content')
          .update(dbUpdateFields)
          .eq('id', generatedContent.id)
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
      }

      toast({
        title: "Content re-translated & saved",
        description: "Your edited English content has been translated and saved successfully."
      });

      // Increment translation version to force re-render of foreign language collapsibles
      setTranslationVersion(prev => prev + 1);
    } catch (error) {
      console.error('Re-translation error:', error);
      toast({
        variant: "destructive",
        title: "Re-translation failed",
        description: "Failed to translate the edited content. Please try again."
      });
    } finally {
      setRetranslating(false);
    }
  };

  const handleGenerate = async () => {
    if (!primaryChurch) {
      toast({
        variant: "destructive",
        title: "No church profile",
        description: "Please complete your church onboarding first."
      });
      navigate("/onboarding");
      return;
    }

    // Enhanced validation
    if (contentTypes.length === 0) {
      toast({
        variant: "destructive",
        title: "No content type selected",
        description: "Please select at least one content type to generate."
      });
      return;
    }

    const hasTranscript = transcriptText.trim().length >= 100;
    const hasCTA = customCTA.trim().length >= 10;
    
    if (!hasTranscript && !hasCTA) {
      toast({
        variant: "destructive",
        title: "No content source",
        description: "Please provide either a sermon transcript (100+ words) or call-to-action/event information (10+ words)."
      });
      return;
    }

    if (contentTypes.includes('social_media') && platforms.length === 0) {
      toast({
        variant: "destructive",
        title: "No platforms selected",
        description: "Please select at least one platform for social media posts."
      });
      return;
    }
    setGenerating(true);
    try {
      // Step 1: Fetch style guide
      const {
        data: styleGuideData,
        error: styleGuideError
      } = await supabase.from('style_guides').select('guide_content').eq('church_id', primaryChurch.id).single();
      if (styleGuideError) {
        console.error('Style guide fetch error:', styleGuideError);
        throw new Error('Failed to fetch style guide');
      }

      // Step 2: Generate content
      const requestBody = {
        transcript: transcriptText || null,
        styleGuide: styleGuideData.guide_content,
        platforms: contentTypes.includes('social_media') ? platforms : [],
        customCTA,
        churchId: primaryChurch.id,
        postsPerPlatform,
        speakerName: speakerName.trim() || null,
        socialHandles: primaryChurch.social_handles || {},
        contentTypes,
        outputLanguages,
        primaryLanguage
      };

      console.log('=== FRONTEND REQUEST ===');
      console.log('Output Languages:', outputLanguages);
      console.log('Primary Language:', primaryLanguage);
      console.log('Content Types:', contentTypes);
      console.log('Custom CTA:', customCTA);
      console.log('Full Request Body:', requestBody);

      const {
        data,
        error
      } = await supabase.functions.invoke('generate-social-posts', {
        body: requestBody
      });
      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      console.log('=== FRONTEND RESPONSE ===');
      console.log('Data received:', data);
      console.log('Has englishVersions?', !!data.englishVersions);
      console.log('Translation Error?', data.translationError);

      // Step 3: Save generated content to database
      // Convert single posts to arrays for consistency
      const normalizeToArray = (post: string | string[] | null | undefined) => {
        if (!post) return null;
        return Array.isArray(post) ? post : [post];
      };
      const {
        error: insertError
      } = await supabase.from('generated_content').insert({
        church_id: primaryChurch.id,
        sermon_transcript_id: null,
        platforms: contentTypes.includes('social_media') ? platforms : [],
        custom_cta: customCTA || null,
        posts_per_platform: postsPerPlatform,
        facebook_post: normalizeToArray(data.facebook),
        facebook_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.facebook) : null,
        instagram_post: normalizeToArray(data.instagram),
        instagram_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.instagram) : null,
        tiktok_post: normalizeToArray(data.tiktok),
        tiktok_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.tiktok) : null,
        twitter_post: normalizeToArray(data.twitter),
        twitter_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.twitter) : null,
        devotional: data.devotional || 'Generated devotional content',
        devotional_english: data.englishVersions?.devotional || null,
        bible_study_guide: data.bibleStudyGuide || null,
        bible_study_guide_english: data.englishVersions?.bibleStudyGuide || null,
        output_language: primaryLanguage,
        content_types: contentTypes,
        output_languages: outputLanguages
      });
      if (insertError) {
        console.error('Content save error:', insertError);
        console.error('Insert data:', {
          church_id: primaryChurch.id,
          sermon_transcript_id: null,
          platforms: contentTypes.includes('social_media') ? platforms : [],
          custom_cta: customCTA || null,
          posts_per_platform: postsPerPlatform,
          facebook_post: normalizeToArray(data.facebook),
          facebook_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.facebook) : null,
          instagram_post: normalizeToArray(data.instagram),
          instagram_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.instagram) : null,
          tiktok_post: normalizeToArray(data.tiktok),
          tiktok_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.tiktok) : null,
          twitter_post: normalizeToArray(data.twitter),
          twitter_post_english: data.englishVersions ? normalizeToArray(data.englishVersions.twitter) : null,
          devotional: data.devotional || 'Generated devotional content',
          devotional_english: data.englishVersions?.devotional || null,
          bible_study_guide: data.bibleStudyGuide || null,
          bible_study_guide_english: data.englishVersions?.bibleStudyGuide || null,
          output_language: primaryLanguage,
          content_types: contentTypes,
          output_languages: outputLanguages
        });
        throw new Error(`Failed to save generated content: ${insertError.message}`);
      }

      // Merge API response with metadata so useEffect can sync language state
      setGeneratedContent({
        ...data,
        output_languages: outputLanguages,
        output_language: primaryLanguage,
        content_types: contentTypes
      });

      toast({
        title: "Content generated!",
        description: `Your ${contentTypes.includes('social_media') ? 'social media posts' : ''}${contentTypes.includes('social_media') && (contentTypes.includes('bible_study') || contentTypes.includes('devotional')) ? ', ' : ''}${contentTypes.includes('bible_study') ? 'Bible study guide' : ''}${contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? ', and ' : ''}${contentTypes.includes('devotional') ? 'daily devotional' : ''} are ready.`
      });
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate content"
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
      description: `${label} copied to clipboard.`
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
        return postsArray.map((post, idx) => `=== ${platformName} (Variation ${idx + 1}) ===\n${post}\n\nCharacters: ${post.length}\n`).join('\n\n');
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
    if (generatedContent.bibleStudyGuide) {
      content.push(`=== BIBLE STUDY GUIDE ===\n${generatedContent.bibleStudyGuide}\n`);
    }
    if (generatedContent.devotional) {
      content.push(`=== DAILY DEVOTIONAL ===\n${generatedContent.devotional}\n`);
    }
    const blob = new Blob([content.join('\n\n')], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${primaryChurch?.name || 'church'}-content-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBibleStudy = (bibleStudyContent: string) => {
    const blob = new Blob([bibleStudyContent], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${primaryChurch?.name || 'church'}-bible-study-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (loading || churchLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>;
  }
  return <>
      <Navigation />
      <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold mb-2">
            Welcome back, {primaryChurch?.name}!
          </h1>
          <p className="text-muted-foreground">Generate social media content and Bible study guides from your sermon transcripts or events</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-playfair">Content Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div className="space-y-3">
                <Label>What would you like to generate?</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="social-media" 
                      checked={contentTypes.includes('social_media')}
                      onCheckedChange={() => handleContentTypeToggle('social_media')}
                    />
                    <Label htmlFor="social-media">Social Media Posts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bible-study" 
                      checked={contentTypes.includes('bible_study')}
                      onCheckedChange={() => handleContentTypeToggle('bible_study')}
                    />
                    <Label htmlFor="bible-study">Bible Study Guide</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="devotional" 
                      checked={contentTypes.includes('devotional')}
                      onCheckedChange={() => handleContentTypeToggle('devotional')}
                    />
                    <Label htmlFor="devotional">Daily Devotional</Label>
                  </div>
                </div>
              </div>

              {/* Sermon Upload Section */}
              <div>
                <Label htmlFor="transcript-upload" className="cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground hover:border-primary"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                    <Upload className={`w-10 h-10 mx-auto mb-2 transition-all ${dragActive ? "text-primary scale-110" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium mb-1">
                      {transcriptFile ? transcriptFile.name : <>
                          <span className="font-semibold">Drop sermon file here</span> or click to upload
                        </>}
                    </p>
                    <p className="text-xs text-muted-foreground">TXT, PDF, DOCX, or DOC (Optional)</p>
                    <p className="text-xs text-muted-foreground mt-1">Skip this if generating from announcement/event only</p>
                  </div>
                  <input id="transcript-upload" type="file" accept=".txt,.pdf,.docx,.doc,.md" onChange={handleFileUpload} className="hidden" />
                </Label>
                {primaryChurch?.social_handles && Object.keys(primaryChurch.social_handles).some(k => primaryChurch.social_handles[k as keyof typeof primaryChurch.social_handles]) && <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md mt-4">
                    <p className="font-medium mb-1">Your social handles will be naturally integrated:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(primaryChurch.social_handles).filter(([_, handle]) => handle).map(([platform, handle]) => <span key={platform} className="text-xs">
                            {platform}: @{handle}
                          </span>)}
                    </div>
                  </div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker-name">Who was preaching? (Optional)</Label>
                <Input id="speaker-name" placeholder="e.g., Pastor John, Rob Smith, Sarah Johnson" value={speakerName} onChange={e => setSpeakerName(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Adding the speaker's name helps personalize the content
                </p>
              </div>

              {/* Language Selection - Show when ANY content type is selected */}
              {contentTypes.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Output Languages for All Content (Max 3)</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select up to 3 languages. Content will be generated in English (UK) first, then translated.
                    </p>
                    
                    {/* Language Selection Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                        <div key={code} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`lang-${code}`}
                            checked={outputLanguages.includes(code)}
                            onCheckedChange={() => handleLanguageToggle(code)}
                            disabled={code === 'en' || (!outputLanguages.includes(code) && outputLanguages.length >= 3)}
                          />
                          <Label htmlFor={`lang-${code}`} className="text-sm cursor-pointer">
                            {name} {code === 'en' && '(Always included)'}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {/* Primary Language Selection */}
                    {outputLanguages.length > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="primary-language">Primary Language (displayed first)</Label>
                        <select
                          id="primary-language"
                          value={primaryLanguage}
                          onChange={(e) => handlePrimaryLanguageChange(e.target.value)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          {outputLanguages.map(code => (
                            <option key={code} value={code}>
                              {LANGUAGE_NAMES[code] || code}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Selected Languages Summary */}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <p className="font-medium mb-1">Selected Languages ({outputLanguages.length}/3):</p>
                      <div className="flex flex-wrap gap-2">
                        {outputLanguages.map(code => (
                          <span 
                            key={code} 
                            className={`px-2 py-1 rounded text-xs ${
                              code === primaryLanguage 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted-foreground/10'
                            }`}
                          >
                            {LANGUAGE_NAMES[code] || code} {code === primaryLanguage && '(Primary)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Platform Selection - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-3">
                  <Label>Select Platforms</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['facebook', 'instagram', 'tiktok', 'twitter'] as Platform[]).map(platform => <div key={platform} className="flex items-center space-x-2">
                        <Checkbox id={platform} checked={platforms.includes(platform)} onCheckedChange={() => handlePlatformToggle(platform)} />
                        <Label htmlFor={platform} className="capitalize cursor-pointer">
                          {platform === 'twitter' ? 'Twitter/X' : platform}
                        </Label>
                      </div>)}
                  </div>
                </div>
              )}

              {/* Posts per Platform - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-2">
                  <Label>Posts per Platform</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generate multiple variations to choose from or schedule throughout the week
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => <Button key={num} type="button" variant={postsPerPlatform === num ? "default" : "outline"} size="sm" onClick={() => setPostsPerPlatform(num)} className="flex-1">
                        {num}
                      </Button>)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="custom-cta">Events, Announcements & Calls-to-Action</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {transcriptText.trim() ? 
                    'Add specific themes, announcements, or calls-to-action to include in your posts. Examples:' :
                    'Required if no sermon uploaded. Include specific events, themes, or messages. Examples:'
                  }
                  <span className="block mt-1 italic">• Birthday celebrations, baptisms, or special events</span>
                  <span className="block italic">• New Alpha course or small group starting</span>
                  <span className="block italic">• Visit our website, register for an event, or volunteer</span>
                  <span className="block italic">• Christmas services, Easter celebrations, prayer nights</span>
                </p>
                <Textarea id="custom-cta" placeholder={transcriptText.trim() ? 
                  "E.g., 'Join us for our new Alpha course starting next Sunday' or 'Celebrating 50 years of ministry this month!'" :
                  "E.g., 'Join us for our Christmas Eve service at 7pm' or 'New Alpha course starting January 15th - register today!'"
                } value={customCTA} onChange={e => setCustomCTA(e.target.value)} rows={4} />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={
                  contentTypes.length === 0 || 
                  (!transcriptText.trim() && !customCTA.trim()) ||
                  (contentTypes.includes('social_media') && platforms.length === 0) ||
                  generating
                } 
                className="w-full" 
                size="lg"
              >
                {generating ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </> : `Generate ${contentTypes.includes('social_media') && contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Content' : contentTypes.includes('social_media') && contentTypes.includes('bible_study') ? 'Social Media & Bible Study' : contentTypes.includes('social_media') && contentTypes.includes('devotional') ? 'Social Media & Devotional' : contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Bible Study & Devotional' : contentTypes.includes('social_media') ? 'Social Media Posts' : contentTypes.includes('bible_study') ? 'Bible Study Guide' : contentTypes.includes('devotional') ? 'Daily Devotional' : 'Content'}`}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-playfair">Generated Content</CardTitle>
                {generatedContent && <Button onClick={downloadAll} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedContent ? <div className="text-center py-12 text-muted-foreground">
                  <p>Your generated content will appear here</p>
                </div> : (() => {
                  // Helper function to render social media platform content
                  const renderSocialPlatform = (platform: string, platformContent: string | string[]) => {
                    const posts = Array.isArray(platformContent) ? platformContent : [platformContent];
                    const activeIdx = activeVariations[platform] || 0;
                    const currentPost = posts[activeIdx];
                    const contentKey = `${platform}-${activeIdx}`;
                    const isEditing = editingContent[contentKey];
                    const displayContent = isEditing ? (editedContent[contentKey] || currentPost) : currentPost;
                    const lengthInfo = getLengthIndicator(displayContent, platform);

                    // Get versions for multi-language display
                    const englishPosts = generatedContent.englishVersions?.[platform];
                    const englishPost = englishPosts ? (Array.isArray(englishPosts) ? englishPosts[activeIdx] : englishPosts) : null;
                    const multiLanguageVersions = generatedContent.multiLanguageVersions || {};
                    const showMultiLanguage = Object.keys(multiLanguageVersions).length > 0 || hasNonEnglishLanguages;

                    // Platform-specific tips
                    const platformTips: Record<string, string> = {
                      facebook: '📘 Facebook works best with 40-80 words and clear paragraph breaks',
                      instagram: '📸 Instagram: Keep first line under 125 characters (what shows before "...more")',
                      tiktok: '🎵 TikTok: Keep it short and punchy - under 150 characters',
                      twitter: '🐦 Twitter/X: Aim for 240-260 characters (leaves room for retweets with comments)'
                    };

                    const englishSource = englishPost || editedContent[contentKey] || displayContent;
                    const canRetranslate = hasNonEnglishLanguages && englishSource && englishSource.trim().length > 0;

                    return (
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-4">
                          {platformTips[platform]}
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
                                  [platform]: Math.max(0, activeIdx - 1)
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
                                  [platform]: Math.min(posts.length - 1, activeIdx + 1)
                                }))}
                                disabled={activeIdx === posts.length - 1}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}

                        {showMultiLanguage ? (
                          <div className="space-y-4">
                            {/* Primary Language Content */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                  {LANGUAGE_NAMES[primaryLanguage] || primaryLanguage} (Primary)
                                </Label>
                                <span className="text-xs text-muted-foreground">Main version</span>
                              </div>
                              <div className="min-h-[400px]">
                                <MDEditor
                                  value={displayContent}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, [contentKey]: val || '' }))}
                                  height={400}
                                  preview="edit"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => copyToClipboard(displayContent, `${platform.charAt(0).toUpperCase() + platform.slice(1)} post (Primary)`)}
                                  variant="outline"
                                  size="sm"
                                >
                                  {copiedItem === `${platform.charAt(0).toUpperCase() + platform.slice(1)} post (Primary)` ? (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                  )}
                                  Copy
                                </Button>
                                {canRetranslate && (
                                  <Button
                                    onClick={() => handleRetranslate(
                                      englishSource, 
                                      `${platform}-${activeIdx}`
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
                                )}
                              </div>
                            </div>

                            {/* Additional Language Versions */}
                            {englishPost && outputLanguages.length > 1 && primaryLanguage !== 'en' && (
                              <Collapsible>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className="w-4 h-4" />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg max-h-[400px]">
                                      <div className="prose prose-sm max-w-none p-4">
                                        <ReactMarkdown>{englishPost}</ReactMarkdown>
                                      </div>
                                    </ScrollArea>
                                    <div className="mt-2 flex justify-end">
                                      <Button
                                        onClick={() => copyToClipboard(englishPost, `English ${platform} post`)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        {copiedItem === `English ${platform} post` ? (
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                        ) : (
                                          <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        Copy English
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Other Language Versions */}
                            {Object.entries(multiLanguageVersions).map(([langCode, langContent]: [string, any]) => {
                              if (langCode === primaryLanguage) return null;
                              const posts = Array.isArray(langContent[platform]) ? langContent[platform] : [langContent[platform]];
                              const post = posts[activeIdx];
                              if (!post) return null;

                              return (
                                <Collapsible key={`${langCode}-${translationVersion}`}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <ChevronDown className="w-4 h-4" />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                      <ScrollArea className="border rounded-lg max-h-[400px]">
                                        <div className="prose prose-sm max-w-none p-4">
                                          <ReactMarkdown>{post}</ReactMarkdown>
                                        </div>
                                      </ScrollArea>
                                      <div className="mt-2 flex justify-end">
                                        <Button
                                          onClick={() => copyToClipboard(post, `${LANGUAGE_NAMES[langCode] || langCode} ${platform} post`)}
                                          variant="outline"
                                          size="sm"
                                        >
                                          {copiedItem === `${LANGUAGE_NAMES[langCode] || langCode} ${platform} post` ? (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                          )}
                                          Copy {LANGUAGE_NAMES[langCode] || langCode}
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            {isEditing ? (
                              <div className="min-h-[400px]">
                                <MDEditor
                                  value={displayContent}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, [contentKey]: val || '' }))}
                                  height={400}
                                  preview="edit"
                                />
                              </div>
                            ) : (
                              <ScrollArea className="border rounded-lg max-h-[500px]">
                                <div className="bg-muted p-4">
                                  <p className="whitespace-pre-wrap">{displayContent}</p>
                                </div>
                              </ScrollArea>
                            )}
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${lengthInfo.color}`}>
                                {lengthInfo.status} {lengthInfo.message} {platform === 'instagram' && `• Total: ${displayContent.length} chars`} {platform !== 'instagram' && platform !== 'tiktok' && platform !== 'twitter' && `• ${displayContent.length} chars`}
                              </p>
                              <div className="flex gap-2">
                                {isEditing ? (
                                  <>
                                    <Button onClick={() => handleCancelEdit(contentKey)} variant="outline" size="sm">
                                      Cancel
                                    </Button>
                                    <Button onClick={() => handleSaveEdit(contentKey)} size="sm">
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button onClick={() => handleStartEdit(contentKey, currentPost)} variant="outline" size="sm">
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => copyToClipboard(displayContent, `${platform.charAt(0).toUpperCase() + platform.slice(1)} post`)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {copiedItem === `${platform.charAt(0).toUpperCase() + platform.slice(1)} post` ? (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                      ) : (
                                        <Copy className="w-4 h-4 mr-2" />
                                      )}
                                      Copy
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  };
                  
                  // Check if any social media platforms exist
                  const hasSocialMedia = generatedContent.facebook || generatedContent.instagram ||
                                        generatedContent.tiktok || generatedContent.twitter;

                  // Set default active social platform
                  const defaultSocialPlatform = generatedContent.facebook ? 'facebook' :
                                               generatedContent.instagram ? 'instagram' :
                                               generatedContent.tiktok ? 'tiktok' : 'twitter';

                  // Determine default main tab
                  const defaultMainTab = hasSocialMedia ? 'social-media' :
                                        generatedContent.bibleStudyGuide ? 'bible-study' : 'summary';

                  return (
                    <Tabs defaultValue={defaultMainTab} className="w-full">
                      <div className="mb-6 overflow-x-auto">
                        <TabsList className="inline-flex w-auto min-w-full">
                          {hasSocialMedia && <TabsTrigger value="social-media">📱 Social Media</TabsTrigger>}
                          {generatedContent.bibleStudyGuide && <TabsTrigger value="bible-study">📖 Bible Study</TabsTrigger>}
                          {generatedContent.devotional && <TabsTrigger value="devotional">🙏 Devotional</TabsTrigger>}
                        </TabsList>
                      </div>

                      {/* Social Media Tab with Platform Sub-navigation */}
                      {hasSocialMedia && (
                        <TabsContent value="social-media">
                          <div className="space-y-4">
                            {/* Platform selector buttons */}
                            <div className="flex gap-2 flex-wrap">
                              {generatedContent.facebook && (
                                <Button
                                  variant={activeSocialPlatform === 'facebook' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveSocialPlatform('facebook')}
                                >
                                  Facebook
                                </Button>
                              )}
                              {generatedContent.instagram && (
                                <Button
                                  variant={activeSocialPlatform === 'instagram' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveSocialPlatform('instagram')}
                                >
                                  Instagram
                                </Button>
                              )}
                              {generatedContent.tiktok && (
                                <Button
                                  variant={activeSocialPlatform === 'tiktok' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveSocialPlatform('tiktok')}
                                >
                                  TikTok
                                </Button>
                              )}
                              {generatedContent.twitter && (
                                <Button
                                  variant={activeSocialPlatform === 'twitter' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setActiveSocialPlatform('twitter')}
                                >
                                  X
                                </Button>
                              )}
                            </div>

                            {/* Active platform content */}
                            <div className="mt-4">
                              {activeSocialPlatform === 'facebook' && generatedContent.facebook && renderSocialPlatform('facebook', generatedContent.facebook)}
                              {activeSocialPlatform === 'instagram' && generatedContent.instagram && renderSocialPlatform('instagram', generatedContent.instagram)}
                              {activeSocialPlatform === 'tiktok' && generatedContent.tiktok && renderSocialPlatform('tiktok', generatedContent.tiktok)}
                              {activeSocialPlatform === 'twitter' && generatedContent.twitter && renderSocialPlatform('twitter', generatedContent.twitter)}
                            </div>
                          </div>
                        </TabsContent>
                      )}

                      {/* Bible Study Tab */}
                      {generatedContent.bibleStudyGuide && (
                    <TabsContent value="bible-study" className="space-y-3">
                      {(generatedContent.multiLanguageVersions && Object.keys(generatedContent.multiLanguageVersions).length > 0) || hasNonEnglishLanguages ? (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">
                            📖 Bible Study Guide - Multi-Language View
                          </div>
                          <div className="space-y-4">
                            {/* Primary Language */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                  {LANGUAGE_NAMES[primaryLanguage] || primaryLanguage} (Primary)
                                </Label>
                                <span className="text-xs text-muted-foreground">Main version</span>
                              </div>
                              <div className="min-h-[600px]">
                                <MDEditor
                                  value={editedContent['bibleStudyGuide'] || generatedContent.bibleStudyGuide}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, bibleStudyGuide: val || '' }))}
                                  height={600}
                                  preview="edit"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => copyToClipboard(editedContent['bibleStudyGuide'] || generatedContent.bibleStudyGuide, "Bible Study Guide")}
                                  variant="outline"
                                  size="sm"
                                >
                                  {copiedItem === "Bible Study Guide" ? (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                  )}
                                  Copy
                                </Button>
                                {canRetranslateBible && (
                                  <Button
                                    onClick={() => handleRetranslate(englishBibleSource, 'bibleStudy')}
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
                                )}
                              </div>
                            </div>

                            {/* English Reference */}
                            {generatedContent.englishVersions?.bibleStudyGuide && primaryLanguage !== 'en' && (
                              <Collapsible>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className="w-4 h-4" />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg max-h-[500px]">
                                      <div className="prose prose-sm max-w-none p-4">
                                        <ReactMarkdown>{cleanBibleStudyFormatting(generatedContent.englishVersions.bibleStudyGuide)}</ReactMarkdown>
                                      </div>
                                    </ScrollArea>
                                    <div className="mt-2 flex justify-end">
                                      <Button
                                        onClick={() => copyToClipboard(generatedContent.englishVersions.bibleStudyGuide, "English Bible Study Guide")}
                                        variant="outline"
                                        size="sm"
                                      >
                                        {copiedItem === "English Bible Study Guide" ? (
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                        ) : (
                                          <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Other Language Versions */}
                            {generatedContent.multiLanguageVersions && Object.entries(generatedContent.multiLanguageVersions).map(([langCode, langContent]: [string, any]) => {
                              if (langCode === primaryLanguage || !langContent.bibleStudyGuide) return null;
                              return (
                                <Collapsible key={`${langCode}-${translationVersion}`}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <ChevronDown className="w-4 h-4" />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                      <ScrollArea className="border rounded-lg max-h-[500px]">
                                        <div className="prose prose-sm max-w-none p-4">
                                          <ReactMarkdown>{cleanBibleStudyFormatting(langContent.bibleStudyGuide)}</ReactMarkdown>
                                        </div>
                                      </ScrollArea>
                                      <div className="mt-2 flex justify-end">
                                        <Button
                                          onClick={() => copyToClipboard(langContent.bibleStudyGuide, `${LANGUAGE_NAMES[langCode] || langCode} Bible Study Guide`)}
                                          variant="outline"
                                          size="sm"
                                        >
                                          {copiedItem === `${LANGUAGE_NAMES[langCode] || langCode} Bible Study Guide` ? (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                          )}
                                          Copy
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">
                            📖 Bible Study Guide
                          </div>
                          {editingContent['bibleStudyGuide'] ? (
                            <MDEditor
                              value={editedContent['bibleStudyGuide'] || generatedContent.bibleStudyGuide}
                              onChange={(val) => setEditedContent(prev => ({ ...prev, bibleStudyGuide: val || '' }))}
                              height={600}
                              preview="edit"
                            />
                          ) : (
                            <ScrollArea className="border rounded-lg max-h-[700px]">
                              <div className="prose prose-sm max-w-none bg-muted p-6 prose-p:mb-4">
                                <ReactMarkdown>{cleanBibleStudyFormatting(generatedContent.bibleStudyGuide)}</ReactMarkdown>
                              </div>
                            </ScrollArea>
                          )}
                        </>
                      )}
                      <div className="flex gap-2">
                        {editingContent['bibleStudyGuide'] ? (
                          <>
                            <Button
                              onClick={() => handleCancelEdit('bibleStudyGuide')}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSaveEdit('bibleStudyGuide')}
                              size="sm"
                              className="flex-1"
                            >
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleStartEdit('bibleStudyGuide', generatedContent.bibleStudyGuide)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => copyToClipboard(generatedContent.bibleStudyGuide, "Bible Study Guide")}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              {copiedItem === "Bible Study Guide" ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              Copy
                            </Button>
                            <Button
                              onClick={() => downloadBibleStudy(generatedContent.bibleStudyGuide)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  )}

                      {/* Devotional Tab */}
                      {generatedContent.devotional && (
                  <TabsContent value="devotional" className="space-y-3">
                    {(() => {
                      const englishDevotional = generatedContent.englishVersions?.devotional;
                      const multiLanguageVersions = generatedContent.multiLanguageVersions || {};
                      const showMultiLanguage = Object.keys(multiLanguageVersions).length > 0 || hasNonEnglishLanguages;

                      if (showMultiLanguage) {
                        return (
                          <div className="space-y-4">
                            {/* Primary Language */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                  {LANGUAGE_NAMES[primaryLanguage] || primaryLanguage} (Primary)
                                </Label>
                                <span className="text-xs text-muted-foreground">Main version</span>
                              </div>
                              <div className="min-h-[500px]">
                                <MDEditor
                                  value={editedContent['devotional'] || generatedContent.devotional}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, devotional: val || '' }))}
                                  height={500}
                                  preview="edit"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => copyToClipboard(editedContent['devotional'] || generatedContent.devotional, "Devotional")}
                                  variant="outline"
                                  size="sm"
                                >
                                  {copiedItem === "Devotional" ? (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                  )}
                                  Copy
                                </Button>
                                {canRetranslateDevotional && (
                                  <Button
                                    onClick={() => handleRetranslate(englishDevotionalSource, 'devotional')}
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
                                )}
                              </div>
                            </div>

                            {/* English Reference */}
                            {englishDevotional && primaryLanguage !== 'en' && (
                              <Collapsible>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className="w-4 h-4" />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg h-[400px] overflow-y-auto">
                                      <div className="prose prose-sm max-w-none p-4">
                                        <ReactMarkdown>{englishDevotional}</ReactMarkdown>
                                      </div>
                                    </ScrollArea>
                                    <div className="mt-2 flex justify-end">
                                      <Button
                                        onClick={() => copyToClipboard(englishDevotional, "English devotional")}
                                        variant="outline"
                                        size="sm"
                                      >
                                        {copiedItem === "English devotional" ? (
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                        ) : (
                                          <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Other Language Versions */}
                            {Object.entries(multiLanguageVersions).map(([langCode, langContent]: [string, any]) => {
                              if (langCode === primaryLanguage || !langContent.devotional) return null;
                              return (
                                <Collapsible key={`${langCode}-${translationVersion}`}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <ChevronDown className="w-4 h-4" />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                      <ScrollArea className="border rounded-lg h-[400px] overflow-y-auto">
                                        <div className="prose prose-sm max-w-none p-4">
                                          <ReactMarkdown>{langContent.devotional}</ReactMarkdown>
                                        </div>
                                      </ScrollArea>
                                      <div className="mt-2 flex justify-end">
                                        <Button
                                          onClick={() => copyToClipboard(langContent.devotional, `${LANGUAGE_NAMES[langCode] || langCode} devotional`)}
                                          variant="outline"
                                          size="sm"
                                        >
                                          {copiedItem === `${LANGUAGE_NAMES[langCode] || langCode} devotional` ? (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                          )}
                                          Copy
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                          </div>
                        );
                      } else {
                        return (
                          <>
                            {editingContent['devotional'] ? (
                              <div className="min-h-[500px]">
                                <MDEditor
                                  value={editedContent['devotional'] || generatedContent.devotional}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, devotional: val || '' }))}
                                  height={500}
                                  preview="edit"
                                />
                              </div>
                            ) : (
                              <ScrollArea className="border rounded-lg max-h-[600px]">
                                <div className="bg-muted p-4">
                                  <p className="whitespace-pre-wrap">{generatedContent.devotional}</p>
                                </div>
                              </ScrollArea>
                            )}
                            <div className="flex gap-2">
                              {editingContent['devotional'] ? (
                                <>
                                  <Button onClick={() => handleCancelEdit('devotional')} variant="outline" size="sm" className="flex-1">
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleSaveEdit('devotional')} size="sm" className="flex-1">
                                    Save
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => handleStartEdit('devotional', generatedContent.devotional)} variant="outline" size="sm" className="flex-1">
                                    Edit
                                  </Button>
                                  <Button onClick={() => copyToClipboard(generatedContent.devotional, "Daily devotional")} variant="outline" size="sm" className="flex-1">
                                    {copiedItem === "Daily devotional" ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    Copy
                                  </Button>
                                </>
                              )}
                            </div>
                          </>
                        );
                      }
                    })()}
                  </TabsContent>
                      )}
                    </Tabs>
                  );
                })()}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>;
};
export default Dashboard;
