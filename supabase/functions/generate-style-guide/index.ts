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

    console.log('Generating style guide for church:', churchData.name);

    // Build the comprehensive prompt for style guide generation
    const systemPrompt = `You are an expert church communications specialist. Your task is to analyze sermon content and church information to create a comprehensive style guide that captures the unique voice, tone, and branding of the church.`;

    const userPrompt = `
# Church Information Analysis

## Church Details
- Name: ${churchData.name}
- Location: ${churchData.location}
- Denomination: ${churchData.denomination || 'Non-denominational'}
- Vision Statement: ${churchData.vision_statement}
- Contact Email: ${churchData.contact_email}
- Website: ${churchData.website_url || 'Not provided'}

## Service Times
${JSON.stringify(churchData.service_times || [], null, 2)}

## Social Media Handles
${JSON.stringify(churchData.social_handles || {}, null, 2)}

## Key Ministries
${JSON.stringify(churchData.key_ministries || [], null, 2)}

## Sermon Content Sample
${sermonTexts.join('\n\n---SERMON BREAK---\n\n')}

${websiteContent ? `
## Website Content Analysis
Scraped ${websiteContent.pagesScraped} pages from the church website:

${websiteContent.content.slice(0, 10).map((page: any) => `
### ${page.title || 'Untitled Page'}
URL: ${page.url}

${page.markdown.substring(0, 2000)}
`).join('\n\n---PAGE BREAK---\n\n')}
` : ''}

---

Based on the above information, create a comprehensive style guide with the following structure and content:

# [Church Name] Communications Style Guide

## Church Overview
[Include name, location, denomination, vision statement]

## 1. Voice & Tone
Describe the church's communication style (formal/casual, inspirational/practical, traditional/contemporary)

### Primary Voice Characteristics
[List key characteristics]

### Tone Variations by Context
[Describe different contexts]

## 2. Key Themes
Identify recurring theological themes and topics

## 3. Language Preferences
Note specific vocabulary, phrases, or terminology commonly used

## 4. Target Audience
Describe the primary audience based on content and context

## 5. Scripture Usage
How scripture is referenced and applied

## 6. Communication Goals
What the church aims to achieve through its messaging

## 7. Content Pillars
3-5 main content categories that align with the church's mission

## 8. Hashtag Strategy
Suggest 5-7 branded hashtags

## 9. Do's and Don'ts
Specific guidelines for maintaining consistency

FORMATTING REQUIREMENTS:
- Use # for the main title (Church Name Communications Style Guide)
- Use ## for major sections (numbered 1-9 and Church Overview)
- Use ### for subsections within major sections
- Include blank lines between all sections for readability
- Use **bold** for emphasis within text
- Use bullet points (-) for lists
- Maintain consistent spacing throughout the document
`;

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('Calling Anthropic API with Claude 4.5 Sonnet...');

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
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

    console.log('Style guide generated successfully');

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
