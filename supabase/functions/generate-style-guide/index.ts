import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { churchData, sermonTexts, websiteContent } = await req.json();

    // Validate required data
    if (!churchData || !churchData.name) {
      throw new Error('Church data is required');
    }

    if (!sermonTexts || !Array.isArray(sermonTexts) || sermonTexts.length === 0) {
      throw new Error('At least one sermon text is required');
    }

    console.log('Generating style guide for church:', churchData.name);
    console.log('Sermon texts count:', sermonTexts.length);
    console.log('Website content provided:', !!websiteContent);

    // Build the comprehensive prompt for style guide generation
    const systemPrompt = `You are an expert church communications specialist. Your task is to analyze sermon content and church information to create a comprehensive style guide that captures the unique voice, tone, and branding of the church.`;

    const userPrompt = `
# Church Information Analysis

## Church Details
- Name: ${churchData.name || 'Unknown'}
- Location: ${churchData.location || 'Not specified'}
- Denomination: ${churchData.denomination || 'Non-denominational'}
- Vision Statement: ${churchData.vision_statement || 'Not provided'}
- Contact Email: ${churchData.contact_email || 'Not provided'}
- Website: ${churchData.website_url || 'Not provided'}

## Service Times
${JSON.stringify(churchData.service_times || [], null, 2)}

## Social Media Handles
${JSON.stringify(churchData.social_handles || {}, null, 2)}

## Key Ministries
${JSON.stringify(churchData.key_ministries || [], null, 2)}

## Sermon Content Sample
${sermonTexts.join('\n\n---SERMON BREAK---\n\n')}

${websiteContent && websiteContent.content && Array.isArray(websiteContent.content) ? `
## Website Content Analysis
Scraped ${websiteContent.pagesScraped || websiteContent.content.length} pages from the church website:

${websiteContent.content.slice(0, 10).map((page: any) => `
### ${page.title || 'Untitled Page'}
URL: ${page.url || 'Unknown URL'}

${(page.markdown || '').substring(0, 2000)}
`).join('\n\n---PAGE BREAK---\n\n')}
` : ''}

---

Create a comprehensive style guide following this structure:

# [Church Name] Communications Style Guide

## Church Overview
## 1. Voice & Tone
### Primary Voice Characteristics
### Tone Variations by Context
## 2. Key Themes
## 3. Language Preferences
## 4. Target Audience
## 5. Scripture Usage
## 6. Communication Goals
## 7. Content Pillars
## 8. Hashtag Strategy
## 9. Do's and Don'ts

FORMATTING RULES:
- Use # for main title, ## for sections, ### for subsections
- Blank lines between all sections
- **bold** for emphasis, bullet points (-) for lists
`;

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('Calling Anthropic API with Claude 4.5 Haiku...');

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6144,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402 || aiResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'API key issue or credit limit reached. Please check your Anthropic account.' }),
          { status: aiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Anthropic API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const styleGuide = aiData.content[0].text;

    console.log('Style guide generated successfully, length:', styleGuide.length);

    return new Response(
      JSON.stringify({ styleGuide }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-style-guide:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
