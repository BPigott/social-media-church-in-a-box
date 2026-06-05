import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { SectionMarker } from "@/components/ui/section-marker";
import { TrialBanner } from "@/components/TrialBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CircleNotch, Copy, Download, Upload, CheckCircle, CaretDown, ArrowCounterClockwise } from "phosphor-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import type { Platform, SermonSeries } from "@/types/database";
import { SeriesSelector } from "@/components/dashboard/SeriesSelector";
import { LanguagePicker } from "@/components/dashboard/LanguagePicker";
import { LANGUAGE_NAMES } from "@/lib/languages";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from "react-markdown";
import MDEditor from '@uiw/react-md-editor';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// localStorage key used by the restore-on-focus effect to skip generations
// that the user has explicitly cleared via "Start Fresh".
const DASHBOARD_CLEARED_AT_KEY = 'ivangel:dashboardClearedAt';

const SOCIAL_PLATFORM_KEYS = ['facebook', 'instagram', 'tiktok', 'twitter'] as const;

// Strip null/non-string entries from social platform arrays so the render path
// never sees nulls. Defends against historical rows in `generations.result` written
// by earlier orchestrator versions that produced sparse arrays when some specialist
// calls failed.
const compactSocialArrays = (obj: Record<string, unknown>): Record<string, unknown> => {
  const out = { ...obj };
  for (const k of SOCIAL_PLATFORM_KEYS) {
    const v = out[k];
    if (Array.isArray(v)) {
      const compact = v.filter((x): x is string => typeof x === 'string' && x.length > 0);
      if (compact.length === 0) delete out[k];
      else out[k] = compact.length === 1 ? compact[0] : compact;
    }
  }
  return out;
};

const sanitiseGenerationResult = (result: unknown): unknown => {
  if (!result || typeof result !== 'object') return result;
  let out = compactSocialArrays(result as Record<string, unknown>);
  const english = out.englishVersions;
  if (english && typeof english === 'object') {
    out = { ...out, englishVersions: compactSocialArrays(english as Record<string, unknown>) };
  }
  const multi = out.multiLanguageVersions;
  if (multi && typeof multi === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [lang, v] of Object.entries(multi)) {
      cleaned[lang] = v && typeof v === 'object' ? compactSocialArrays(v as Record<string, unknown>) : v;
    }
    out = { ...out, multiLanguageVersions: cleaned };
  }
  return out;
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
  const [contentTypes, setContentTypes] = useState<('social_media' | 'bible_study' | 'devotional' | 'podcast_description')[]>(['social_media']);
  const [outputLanguages, setOutputLanguages] = useState<string[]>(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [retranslating, setRetranslating] = useState(false);

  // Sermon series state
  const [seriesList, setSeriesList] = useState<SermonSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [seriesWeekNumber, setSeriesWeekNumber] = useState<number | null>(null);

  // Generation mode state
  const [generationMode, setGenerationMode] = useState<'sermon' | 'event'>('sermon');
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [signupLink, setSignupLink] = useState("");

  // Editing state for inline content editing
  const [editingContent, setEditingContent] = useState<Record<string, boolean>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  // Translation version tracker to force re-render of foreign language collapsibles
  const [translationVersion, setTranslationVersion] = useState(0);

  // Ref to track if initial platform has been set (to prevent resetting during re-translation)
  const initialPlatformSetRef = useRef(false);

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

  // Auth redirects are handled by ProtectedRoute in App.tsx.
  // A duplicate redirect here would race with transient TOKEN_REFRESHED events
  // on tab focus and unmount the Dashboard, wiping generatedContent.

  // Fetch sermon series for the current church
  useEffect(() => {
    if (!primaryChurch?.id) return;
    const fetchSeries = async () => {
      const { data, error } = await supabase
        .from('sermon_series')
        .select('*')
        .eq('church_id', primaryChurch.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setSeriesList(data as unknown as SermonSeries[]);
      }
    };
    fetchSeries();
  }, [primaryChurch?.id]);

  // Restore the last completed generation so content survives tab switches and refreshes.
  // Also re-runs on visibilitychange as a belt-and-suspenders fallback in case Supabase
  // auth events briefly nulled user?.id during a token refresh.
  const restoringRef = useRef(false);
  useEffect(() => {
    const restoreIfNeeded = async () => {
      const uid = user?.id;
      if (!uid) return;
      if (generatedContent) return;
      if (restoringRef.current) return;
      restoringRef.current = true;
      try {
        const clearedAt = (() => {
          try { return localStorage.getItem(DASHBOARD_CLEARED_AT_KEY); } catch { return null; }
        })();
        let query = supabase
          .from('generations')
          .select('result')
          .eq('user_id', uid)
          .eq('status', 'completed');
        if (clearedAt) query = query.gt('created_at', clearedAt);
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          console.warn('Dashboard: restore query failed', error.message);
          return;
        }
        if (data?.result) {
          setGeneratedContent(sanitiseGenerationResult(data.result));
        }
      } finally {
        restoringRef.current = false;
      }
    };

    restoreIfNeeded();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        restoreIfNeeded();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, generatedContent]);

  // Sync languages and set editing mode for English content when content is generated
  useEffect(() => {
    if (generatedContent) {
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
        if (generatedContent.podcastDescription) {
          newEditingState['podcastDescription'] = true;
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
            } else if (key === 'podcastDescription') {
              newEditedContent[key] = generatedContent.podcastDescription || '';
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
  }, [generatedContent, primaryLanguage]);

  // Separate useEffect to set initial active platform ONCE (prevents tab switching during re-translation)
  useEffect(() => {
    if (generatedContent && !initialPlatformSetRef.current) {
      const defaultPlatform = generatedContent.facebook ? 'facebook' :
                             generatedContent.instagram ? 'instagram' :
                             generatedContent.tiktok ? 'tiktok' :
                             generatedContent.twitter ? 'twitter' : null;

      if (defaultPlatform) {
        setActiveSocialPlatform(defaultPlatform as 'facebook' | 'instagram' | 'tiktok' | 'twitter');
        initialPlatformSetRef.current = true;
      }
    }
  }, [generatedContent]);

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
      
      const errorMessage = (error && typeof error === 'object' && 'message' in error) 
        ? String(error.message) 
        : (typeof error === 'string' ? error : '');
      
      if (errorMessage) {
        // Password-protected PDF
        if (errorMessage.includes('password')) {
          errorTitle = "Password-protected PDF";
          errorDescription = "This PDF is password-protected. Please unlock it and try again.";
        }
        // Corrupted or invalid PDF
        else if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
          errorTitle = "Invalid PDF file";
          errorDescription = "This PDF file appears to be corrupted. Try re-exporting it and upload again.";
        }
        // Generic error with actual message
        else {
          errorDescription = errorMessage;
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

  const handleContentTypeToggle = (type: 'social_media' | 'bible_study' | 'devotional' | 'podcast_description') => {
    setContentTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];

      // Auto-select all platforms when social_media is toggled on for the first time
      if (type === 'social_media' && newTypes.includes('social_media') && platforms.length === 0) {
        setPlatforms(['facebook', 'instagram', 'tiktok', 'twitter']);
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
      } else if (contentKey === 'podcastDescription') {
        updated.podcastDescription = newContent;
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
        } else if (contentKey === 'podcastDescription') {
          dbUpdateFields = { podcast_description: newContent };
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
        } else if (contentType === 'podcast_description') {
          if (primaryLanguage === 'en') {
            englishSaveFields = {
              podcast_description: englishSource
            };
          } else {
            englishSaveFields = {
              podcast_description_english: englishSource
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
            } else if (contentType === 'podcast_description') {
              if (primaryLanguage === 'en') {
                updated.podcastDescription = englishSource;
                delete englishVersions.podcastDescription;
              } else {
                englishVersions.podcastDescription = englishSource;
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
            } else if (contentType === 'podcast_description') {
              updated['podcastDescription'] = englishSource;
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
        } else if (contentType === 'podcast_description') {
          // Only store English reference version if primary language is NOT English
          if (primaryLanguage !== 'en') {
            englishVersions.podcastDescription = englishSource;
          } else {
            delete englishVersions.podcastDescription;
          }

          Object.entries(translatedContents).forEach(([lang, translated]) => {
            const languageContent = { ...(multiLanguageVersions[lang] || {}) };
            languageContent.podcastDescription = translated;
            multiLanguageVersions[lang] = languageContent;

            if (lang === primaryLanguage) {
              updated.podcastDescription = translated;
            }
          });

          dbUpdateFields = {
            podcast_description: updated.podcastDescription,
            multi_language_versions: Object.keys(multiLanguageVersions).length > 0 ? multiLanguageVersions : null
          };

          // Only include English reference field if primary language is not English
          if (primaryLanguage !== 'en') {
            dbUpdateFields.podcast_description_english = englishSource;
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

  const handleStartFresh = () => {
    // Clear all generated content and reset form. Persist a dismissal timestamp
    // so the restore-on-focus effect does not repopulate the cleared content.
    try {
      localStorage.setItem(DASHBOARD_CLEARED_AT_KEY, new Date().toISOString());
    } catch { /* localStorage unavailable */ }

    setGeneratedContent(null);
    setTranscriptText('');
    setTranscriptFile(null);
    setCustomCTA('');
    setEditedContent({});
    setEditingContent({});
    setTranslationVersion(0);
    initialPlatformSetRef.current = false;

    toast({
      title: "Dashboard cleared",
      description: "Ready to generate new content!"
    });
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

    if (generationMode === 'event') {
      if (!eventName.trim()) {
        toast({
          variant: "destructive",
          title: "Event name required",
          description: "Please provide an event name to generate promotional content."
        });
        return;
      }
    } else {
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
        idempotency_key: crypto.randomUUID(),
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
        primaryLanguage,
        seriesName: generationMode === 'sermon' && selectedSeriesId ? seriesList.find(s => s.id === selectedSeriesId)?.name || null : null,
        seriesDescription: generationMode === 'sermon' && selectedSeriesId ? seriesList.find(s => s.id === selectedSeriesId)?.description || null : null,
        seriesWeekNumber: generationMode === 'sermon' ? seriesWeekNumber || null : null,
        seriesTotalWeeks: generationMode === 'sermon' && selectedSeriesId ? seriesList.find(s => s.id === selectedSeriesId)?.total_weeks || null : null,
        generationMode,
        eventDetails: generationMode === 'event' ? {
          eventName: eventName.trim(),
          eventDate: eventDate || null,
          eventLocation: eventLocation.trim() || null,
          eventDescription: eventDescription.trim() || null,
          signupLink: signupLink.trim() || null,
        } : null,
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
        // Ensure error is always an Error instance to avoid instanceof issues
        const errorObj = (error && typeof error === 'object' && 'message' in error)
          ? new Error(String(error.message))
          : new Error(typeof error === 'string' ? error : 'Failed to generate content');
        throw errorObj;
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
      // Save event to church_events table if in event mode
      let savedEventId: string | null = null;
      if (generationMode === 'event' && eventName.trim()) {
        const { data: eventData, error: eventError } = await supabase
          .from('church_events')
          .insert({
            church_id: primaryChurch.id,
            event_name: eventName.trim(),
            event_date: eventDate || null,
            event_location: eventLocation.trim() || null,
            event_description: eventDescription.trim() || null,
            signup_link: signupLink.trim() || null,
          })
          .select('id')
          .single();
        if (eventError) {
          console.error('Event save error:', eventError);
        } else {
          savedEventId = eventData.id;
        }
      }

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
        podcast_description: data.podcastDescription || null,
        podcast_description_english: data.englishVersions?.podcastDescription || null,
        sermon_series_id: generationMode === 'sermon' ? selectedSeriesId || null : null,
        series_week_number: generationMode === 'sermon' ? seriesWeekNumber || null : null,
        church_event_id: savedEventId,
        generation_mode: generationMode,
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
          podcast_description: data.podcastDescription || null,
          podcast_description_english: data.englishVersions?.podcastDescription || null,
          sermon_series_id: generationMode === 'sermon' ? selectedSeriesId || null : null,
          series_week_number: generationMode === 'sermon' ? seriesWeekNumber || null : null,
          church_event_id: savedEventId,
          generation_mode: generationMode,
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
        description: `Your ${[
          contentTypes.includes('social_media') ? 'social media posts' : '',
          contentTypes.includes('bible_study') ? 'Bible study guide' : '',
          contentTypes.includes('devotional') ? 'daily devotional' : '',
          contentTypes.includes('podcast_description') ? 'podcast description' : ''
        ].filter(Boolean).join(', ')} are ready.`
      });
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      const errorMessage = (error && typeof error === 'object' && 'message' in error) 
        ? String(error.message) 
        : (typeof error === 'string' ? error : "Failed to generate content");
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: errorMessage
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
  const buildAllContentSections = () => {
    const sections: string[] = [];
    const formatPosts = (posts: string | string[], platformName: string) => {
      const postsArray = Array.isArray(posts) ? posts : [posts];
      if (postsArray.length === 1) {
        return `=== ${platformName} ===\n${postsArray[0]}\n`;
      } else {
        return postsArray.map((post, idx) => `=== ${platformName} (Variation ${idx + 1}) ===\n${post}\n`).join('\n\n');
      }
    };
    if (generatedContent.facebook) sections.push(formatPosts(generatedContent.facebook, 'FACEBOOK'));
    if (generatedContent.instagram) sections.push(formatPosts(generatedContent.instagram, 'INSTAGRAM'));
    if (generatedContent.tiktok) sections.push(formatPosts(generatedContent.tiktok, 'TIKTOK'));
    if (generatedContent.twitter) sections.push(formatPosts(generatedContent.twitter, 'TWITTER/X'));
    if (generatedContent.bibleStudyGuide) sections.push(`=== BIBLE STUDY GUIDE ===\n${generatedContent.bibleStudyGuide}`);
    if (generatedContent.devotional) sections.push(`=== DAILY DEVOTIONAL ===\n${generatedContent.devotional}`);
    if (generatedContent.podcastDescription) sections.push(`=== PODCAST DESCRIPTION ===\n${generatedContent.podcastDescription}`);
    return sections;
  };

  const downloadAll = async (format: 'txt' | 'docx' | 'pdf' | 'html' = 'txt') => {
    const filenameBase = `${primaryChurch?.name || 'church'}-content-${new Date().toISOString().split('T')[0]}`;
    const sections = buildAllContentSections();

    if (format === 'txt') {
      const blob = new Blob([sections.join('\n\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'html') {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filenameBase}</title></head><body>${sections
        .map(s => `<section><pre style="white-space:pre-wrap;">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre></section>`)
        .join('<hr/>')}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'docx') {
      const paragraphs: Paragraph[] = [];
      sections.forEach(section => {
        section.split('\n').forEach(line => {
          paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
        });
        paragraphs.push(new Paragraph(''));
      });
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth() - 72; // 1in margins
      const marginLeft = 36;
      let y = 48; // top margin
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
      doc.save(`${filenameBase}.pdf`);
      return;
    }
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
  return (
    <AppShell>
      <TrialBanner />
      <div className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <div className="mb-2 h-[3px] w-10 rounded bg-primary" />
          <h1 className="font-playfair text-3xl font-bold text-foreground md:text-4xl">
            Welcome back, <span className="font-bold">{primaryChurch?.name ?? "friend"}</span>
          </h1>
          <p className="mt-1 italic text-muted-foreground">
            Let's turn Sunday's message into a full week of content.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* Create content panel */}
          <Card className="border-t-4 border-t-primary shadow-tactile">
            <CardHeader>
              <SectionMarker numeral="01" title="Create content" tone="primary" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What would you like to generate?</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "social_media", label: "Social posts" },
                    { key: "bible_study", label: "Bible study" },
                    { key: "devotional", label: "Devotional" },
                    { key: "podcast_description", label: "Podcast" },
                  ] as const).map(({ key, label }) => {
                    const on = contentTypes.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => handleContentTypeToggle(key)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          on
                            ? "border-primary bg-primary font-semibold text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generation Mode Toggle */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What are you creating from?</p>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  {([
                    { key: "sermon", label: "Sermon" },
                    { key: "event", label: "Future event" },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGenerationMode(key)}
                      className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                        generationMode === key
                          ? "bg-card font-semibold text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Details Fields - Only in Event Mode */}
              {generationMode === 'event' && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Event Details</Label>
                        <p className="text-xs text-muted-foreground mt-1">Fill in the details of the event you want to promote</p>
                      </div>
                      <div>
                        <Label htmlFor="event-name">Event Name *</Label>
                        <Input
                          id="event-name"
                          placeholder="e.g., Christmas Eve Service, Alpha Course, Youth Camp"
                          value={eventName}
                          onChange={e => setEventName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="event-date">Date & Time</Label>
                          <Input
                            id="event-date"
                            type="datetime-local"
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="event-location">Location</Label>
                          <Input
                            id="event-location"
                            placeholder="e.g., Main Hall, Church Campus"
                            value={eventLocation}
                            onChange={e => setEventLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="event-description">Event Description</Label>
                        <Textarea
                          id="event-description"
                          placeholder="What is this event about? Who is it for? What can people expect?"
                          value={eventDescription}
                          onChange={e => setEventDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-link">Sign-up / Registration Link</Label>
                        <Input
                          id="signup-link"
                          type="url"
                          placeholder="https://..."
                          value={signupLink}
                          onChange={e => setSignupLink(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sermon Upload Section - Only in Sermon Mode */}
              {generationMode === 'sermon' && <div>
                <Label htmlFor="transcript-upload" className="cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground hover:border-primary"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                    <Upload size={40} className={`mx-auto mb-2 transition-all ${dragActive ? "text-primary scale-110" : "text-muted-foreground"}`} />
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
              </div>}

              {/* Speaker Name - Only in Sermon Mode */}
              {generationMode === 'sermon' && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="speaker-name">Who was preaching? (Optional)</Label>
                      <Input id="speaker-name" placeholder="e.g., Pastor John, Rob Smith, Sarah Johnson" value={speakerName} onChange={e => setSpeakerName(e.target.value)} />
                      <p className="text-xs text-muted-foreground">
                        Adding the speaker's name helps personalise the content
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sermon Series Selection - Only in Sermon Mode */}
              {generationMode === 'sermon' && primaryChurch && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <SeriesSelector
                      churchId={primaryChurch.id}
                      seriesList={seriesList}
                      selectedSeriesId={selectedSeriesId}
                      seriesWeekNumber={seriesWeekNumber}
                      onSeriesChange={setSelectedSeriesId}
                      onWeekNumberChange={setSeriesWeekNumber}
                      onSeriesCreated={(series) => setSeriesList((prev) => [series, ...prev])}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Additional Context / CTA Section */}
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="custom-cta" className="text-base font-semibold">
                        {generationMode === 'event' ? 'Additional Context (Optional)' : 'Events, Announcements & Calls-to-Action'}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2 mb-3">
                        {generationMode === 'event' ?
                          'Add any extra context to include alongside the event details above. Examples:' :
                          transcriptText.trim() ?
                            'Add specific themes, announcements, or calls-to-action to include in your posts. Examples:' :
                            'Required if no sermon uploaded. Include specific events, themes, or messages. Examples:'
                        }
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-3 ml-4">
                        {generationMode === 'event' ? (
                          <>
                            <li className="list-disc">Special guests or speakers attending</li>
                            <li className="list-disc">What to bring or how to prepare</li>
                            <li className="list-disc">Related events or follow-up activities</li>
                          </>
                        ) : (
                          <>
                            <li className="list-disc">Birthday celebrations, baptisms, or special events</li>
                            <li className="list-disc">New Alpha course or small group starting</li>
                            <li className="list-disc">Visit our website, register for an event, or volunteer</li>
                            <li className="list-disc">Christmas services, Easter celebrations, prayer nights</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <Textarea
                      id="custom-cta"
                      placeholder={generationMode === 'event' ?
                        "E.g., 'Childcare will be provided' or 'Refreshments served afterwards'" :
                        transcriptText.trim() ?
                          "E.g., 'Join us for our new Alpha course starting next Sunday' or 'Celebrating 50 years of ministry this month!'" :
                          "E.g., 'Join us for our Christmas Eve service at 7pm' or 'New Alpha course starting January 15th - register today!'"
                      }
                      value={customCTA}
                      onChange={e => setCustomCTA(e.target.value)}
                      rows={generationMode === 'event' ? 2 : 4}
                      className="font-medium"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Language Selection - Show when ANY content type is selected */}
              {contentTypes.length > 0 && (
                <LanguagePicker
                  outputLanguages={outputLanguages}
                  primaryLanguage={primaryLanguage}
                  onToggle={handleLanguageToggle}
                  onPrimaryChange={handlePrimaryLanguageChange}
                />
              )}

              {/* Platform Selection - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Social platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {(['facebook', 'instagram', 'tiktok', 'twitter'] as Platform[]).map(platform => {
                      const on = platforms.includes(platform);
                      const label = platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1);
                      return (
                        <button
                          key={platform}
                          type="button"
                          aria-pressed={on}
                          onClick={() => handlePlatformToggle(platform)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                            on
                              ? "border-primary bg-primary font-semibold text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts per Platform - Only show if Social Media is selected */}
              {contentTypes.includes('social_media') && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posts per platform</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPostsPerPlatform(num)}
                        className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                          postsPerPlatform === num
                            ? "border-foreground bg-foreground font-semibold text-background"
                            : "border-border text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={
                  contentTypes.length === 0 ||
                  (generationMode === 'sermon' && !transcriptText.trim() && !customCTA.trim()) ||
                  (generationMode === 'event' && !eventName.trim()) ||
                  (contentTypes.includes('social_media') && platforms.length === 0) ||
                  generating
                }
                className="w-full"
                size="lg"
              >
                {generating ? <>
                    <CircleNotch size={16} className="mr-2 animate-spin" />
                    Generating...
                  </> : generationMode === 'event' ? 'Generate Event Content' : `Generate ${contentTypes.includes('social_media') && contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Content' : contentTypes.includes('social_media') && contentTypes.includes('bible_study') ? 'Social Media & Bible Study' : contentTypes.includes('social_media') && contentTypes.includes('devotional') ? 'Social Media & Devotional' : contentTypes.includes('bible_study') && contentTypes.includes('devotional') ? 'Bible Study & Devotional' : contentTypes.includes('social_media') ? 'Social Media Posts' : contentTypes.includes('bible_study') ? 'Bible Study Guide' : contentTypes.includes('devotional') ? 'Daily Devotional' : 'Content'}`}
              </Button>
            </CardContent>
          </Card>

          {/* Your content panel */}
          <Card className="border-t-4 border-t-secondary shadow-tactile">
            <CardHeader>
              <div className="flex items-center justify-between">
                <SectionMarker numeral="02" title="Your content" tone="secondary" className="mb-0" />
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button onClick={handleStartFresh} variant="outline" size="sm">
                      <ArrowCounterClockwise size={16} className="mr-2" />
                      Start Fresh
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download size={16} className="mr-2" />
                          Download All
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadAll('txt')}>Text (.txt)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadAll('docx')}>Word (.docx)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadAll('pdf')}>PDF (.pdf)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadAll('html')}>HTML (.html)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
                    const displayContent = (isEditing ? (editedContent[contentKey] || currentPost) : currentPost) ?? '';
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

                    const englishSource = editedContent[contentKey] || englishPost || displayContent;
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
                                    <CheckCircle size={16} className="mr-2" />
                                  ) : (
                                    <Copy size={16} className="mr-2" />
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
                                        <CircleNotch size={12} className="mr-2 animate-spin" />
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
                                      <CaretDown size={16} />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg h-[400px]">
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
                                          <CheckCircle size={16} className="mr-2" />
                                        ) : (
                                          <Copy size={16} className="mr-2" />
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
                                        <CaretDown size={16} />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg h-[400px]">
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
                                            <CheckCircle size={16} className="mr-2" />
                                          ) : (
                                            <Copy size={16} className="mr-2" />
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
                              <ScrollArea className="border rounded-lg h-[500px]">
                                <div className="bg-muted p-4">
                                  <p className="whitespace-pre-wrap">{displayContent}</p>
                                </div>
                              </ScrollArea>
                            )}
                            <div className="flex items-center justify-end">
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
                                        <CheckCircle size={16} className="mr-2" />
                                      ) : (
                                        <Copy size={16} className="mr-2" />
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
                          {generatedContent.podcastDescription && <TabsTrigger value="podcast-description">🎙️ Podcast</TabsTrigger>}
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
                                    <CheckCircle size={16} className="mr-2" />
                                  ) : (
                                    <Copy size={16} className="mr-2" />
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
                                        <CircleNotch size={12} className="mr-2 animate-spin" />
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
                                      <CaretDown size={16} />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg h-[500px]">
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
                                          <CheckCircle size={16} className="mr-2" />
                                        ) : (
                                          <Copy size={16} className="mr-2" />
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
                                        <CaretDown size={16} />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                      <ScrollArea className="border rounded-lg h-[500px]">
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
                                            <CheckCircle size={16} className="mr-2" />
                                          ) : (
                                            <Copy size={16} className="mr-2" />
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
                            <ScrollArea className="border rounded-lg h-[700px]">
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
                              {copiedItem === "Bible Study Guide" ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                              Copy
                            </Button>
                            <Button
                              onClick={() => downloadBibleStudy(generatedContent.bibleStudyGuide)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Download size={16} className="mr-2" />
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
                                    <CheckCircle size={16} className="mr-2" />
                                  ) : (
                                    <Copy size={16} className="mr-2" />
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
                                        <CircleNotch size={12} className="mr-2 animate-spin" />
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
                                      <CaretDown size={16} />
                                      <span className="text-sm font-medium">English Reference</span>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                    <ScrollArea className="border rounded-lg h-[400px]">
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
                                          <CheckCircle size={16} className="mr-2" />
                                        ) : (
                                          <Copy size={16} className="mr-2" />
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
                                        <CaretDown size={16} />
                                        <span className="text-sm font-medium">{LANGUAGE_NAMES[langCode] || langCode}</span>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="p-4 border-l-2 border-muted-foreground/20 ml-4">
                                      <ScrollArea className="border rounded-lg h-[400px]">
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
                                            <CheckCircle size={16} className="mr-2" />
                                          ) : (
                                            <Copy size={16} className="mr-2" />
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
                              <ScrollArea className="border rounded-lg h-[600px]">
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
                                    {copiedItem === "Daily devotional" ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
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

                      {/* Podcast Description Tab */}
                      {generatedContent.podcastDescription && (
                  <TabsContent value="podcast-description" className="space-y-3">
                    {(() => {
                      const englishPodcast = generatedContent.englishVersions?.podcastDescription;
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
                                  value={editedContent['podcastDescription'] || generatedContent.podcastDescription}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, podcastDescription: val || '' }))}
                                  height={500}
                                  preview="edit"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(editedContent['podcastDescription'] || generatedContent.podcastDescription, "Podcast description")}
                                >
                                  {copiedItem === "Podcast description" ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                                  Copy
                                </Button>
                              </div>
                            </div>

                            {/* English version (if primary is not English) */}
                            {primaryLanguage !== 'en' && englishPodcast && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold">English (Original)</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRetranslate(englishPodcast, 'podcast_description')}
                                      disabled={retranslating}
                                    >
                                      <ArrowCounterClockwise size={14} className={`mr-1 ${retranslating ? 'animate-spin' : ''}`} />
                                      Re-translate
                                    </Button>
                                  </div>
                                </div>
                                <ScrollArea className="border rounded-lg h-[300px]">
                                  <div className="bg-muted/50 p-4">
                                    <ReactMarkdown>{englishPodcast}</ReactMarkdown>
                                  </div>
                                </ScrollArea>
                                <div className="flex justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(englishPodcast, "English podcast description")}
                                  >
                                    {copiedItem === "English podcast description" ? (
                                      <CheckCircle size={16} className="mr-2" />
                                    ) : (
                                      <Copy size={16} className="mr-2" />
                                    )}
                                    Copy English
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Other language versions */}
                            {Object.entries(multiLanguageVersions).map(([langCode, langContent]: [string, any]) => {
                              if (langCode === primaryLanguage || !langContent.podcastDescription) return null;
                              return (
                                <div key={langCode} className="space-y-2">
                                  <Label className="text-sm font-semibold">
                                    {LANGUAGE_NAMES[langCode] || langCode}
                                  </Label>
                                  <ScrollArea className="border rounded-lg h-[300px]">
                                    <div className="bg-muted/50 p-4">
                                      <ReactMarkdown>{langContent.podcastDescription}</ReactMarkdown>
                                    </div>
                                  </ScrollArea>
                                  <div className="flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyToClipboard(langContent.podcastDescription, `${LANGUAGE_NAMES[langCode] || langCode} podcast description`)}
                                    >
                                      {copiedItem === `${LANGUAGE_NAMES[langCode] || langCode} podcast description` ? (
                                        <CheckCircle size={16} className="mr-2" />
                                      ) : (
                                        <Copy size={16} className="mr-2" />
                                      )}
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } else {
                        return (
                          <>
                            {editingContent['podcastDescription'] ? (
                              <div className="min-h-[500px]">
                                <MDEditor
                                  value={editedContent['podcastDescription'] || generatedContent.podcastDescription}
                                  onChange={(val) => setEditedContent(prev => ({ ...prev, podcastDescription: val || '' }))}
                                  height={500}
                                  preview="edit"
                                />
                              </div>
                            ) : (
                              <ScrollArea className="border rounded-lg h-[600px]">
                                <div className="bg-muted p-4">
                                  <p className="whitespace-pre-wrap">{generatedContent.podcastDescription}</p>
                                </div>
                              </ScrollArea>
                            )}
                            <div className="flex gap-2">
                              {editingContent['podcastDescription'] ? (
                                <>
                                  <Button onClick={() => handleCancelEdit('podcastDescription')} variant="outline" size="sm" className="flex-1">
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleSaveEdit('podcastDescription')} size="sm" className="flex-1">
                                    Save
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => handleStartEdit('podcastDescription', generatedContent.podcastDescription)} variant="outline" size="sm" className="flex-1">
                                    Edit
                                  </Button>
                                  <Button onClick={() => copyToClipboard(generatedContent.podcastDescription, "Podcast description")} variant="outline" size="sm" className="flex-1">
                                    {copiedItem === "Podcast description" ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
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
    </AppShell>
  );
};
export default Dashboard;
