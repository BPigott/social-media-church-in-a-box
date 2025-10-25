import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { englishContent, targetLanguage, contentType } = await req.json();

    if (!englishContent || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: englishContent and targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetLanguage === 'en') {
      // No translation needed
      return new Response(
        JSON.stringify({ translatedContent: englishContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Re-translating ${contentType} from English to ${targetLanguage}`);
    console.log(`Content length: ${englishContent.length} characters`);

    // Translate the edited English content
    const translatedContent = await translateText(
      englishContent,
      targetLanguage,
      'en'
    );

    console.log(`Translation completed. New length: ${translatedContent.length} characters`);

    return new Response(
      JSON.stringify({ translatedContent }),
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
