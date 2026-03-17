import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateText } from '../_shared/translate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { englishContent, targetLanguage, targetLanguages, contentType } = await req.json();

    console.log('=== RETRANSLATE EDGE FUNCTION DEBUG ===');
    console.log('Received parameters:', {
      hasEnglishContent: !!englishContent,
      englishContentLength: englishContent?.length || 0,
      targetLanguage: targetLanguage,
      targetLanguages: targetLanguages,
      targetLanguagesType: typeof targetLanguages,
      targetLanguagesIsArray: Array.isArray(targetLanguages),
      contentType: contentType
    });

    if (!englishContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: englishContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestedLanguages: string[] = Array.isArray(targetLanguages)
      ? targetLanguages
      : (targetLanguage ? [targetLanguage] : []);
    const languagesToTranslate = requestedLanguages
      .filter((lang) => typeof lang === 'string' && lang.trim().length > 0)
      .map((lang) => lang.trim())
      .filter((lang, index, self) => lang !== 'en' && self.indexOf(lang) === index);

    console.log('Processed languages:', {
      requestedLanguages: requestedLanguages,
      languagesToTranslate: languagesToTranslate
    });

    if (languagesToTranslate.length === 0) {
      console.error('WARNING: languagesToTranslate is empty!');
      console.log('requestedLanguages was:', requestedLanguages);
      console.log('targetLanguages was:', targetLanguages);
      console.log('targetLanguage was:', targetLanguage);
      console.log('Re-translate called with no non-English target languages. Returning source content.');
      return new Response(
        JSON.stringify({
          translatedContents: {},
          translatedContent: englishContent,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Re-translating ${contentType} from English to:`, languagesToTranslate);
    console.log(`Content length: ${englishContent.length} characters`);

    const translationResults = await Promise.all(
      languagesToTranslate.map(async (language) => {
        const translatedContent = await translateText(
          englishContent,
          language,
          'en'
        );

        console.log(`Translation to ${language} completed. Length: ${translatedContent.length} characters`);
        return [language, translatedContent] as const;
      })
    );

    const translatedContents = Object.fromEntries(translationResults);

    const responseBody: Record<string, unknown> = {
      translatedContents,
    };

    if (languagesToTranslate.length === 1) {
      const onlyLanguage = languagesToTranslate[0];
      responseBody.translatedContent = translatedContents[onlyLanguage];
      responseBody.targetLanguage = onlyLanguage;
    } else {
      responseBody.targetLanguages = languagesToTranslate;
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Re-translation error:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Internal server error',
        details: 'Failed to translate content. Please check your Google Translate API configuration.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
