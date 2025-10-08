import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_GUIDELINES = {
  facebook: `
Facebook Guidelines:
- Length: 40-80 words ideal (can go longer for compelling content)
- Tone: Conversational and engaging
- Structure: Hook → Body → CTA with clear spacing
- Formatting: Use paragraph breaks (double line breaks) for readability
- AVOID: Walls of text - break into 2-3 short paragraphs
- Include: Questions, CTAs, or thought-provoking statements
- Hashtags: 1-3 relevant hashtags
- Emojis: Use sparingly for emphasis
`,
  instagram: `
Instagram Guidelines:
- Length: 125-150 characters for captions (first 2 lines are key)
- Tone: Inspirational and visual
- Structure: Attention-grabbing opening line → Main content (with breaks) → Hashtags on separate lines
- Formatting: Line breaks are ESSENTIAL - use them liberally between thoughts
- AVOID: Solid blocks of text - use whitespace strategically
- Include: Strong opening line, generous line breaks for readability
- Hashtags: 5-10 relevant hashtags (can go up to 30) on separate lines
- Emojis: Use to break up text and add personality, use as visual breaks between sections
`,
  tiktok: `
TikTok Guidelines:
- Length: Very short and punchy (under 150 characters)
- Tone: Authentic, relatable, conversational
- Structure: Each line should feel like a separate 'beat'
- Formatting: Use line breaks between thoughts for visual rhythm
- Include: Trending phrases or challenges when relevant
- Hashtags: 3-5 trending + niche hashtags
- Emojis: Use generously for engagement
`,
  twitter: `
Twitter/X Guidelines:
- Length: 280 characters max (aim for 240-260 for retweets)
- Tone: Concise and impactful
- Structure: Hook first line → Supporting point → CTA/Hashtag
- Formatting: Use line breaks to create visual rhythm if longer content
- Include: Strong hook, clear message
- Hashtags: 1-2 hashtags maximum
- Emojis: Use 1-2 for emphasis
`,
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

    const { transcript, styleGuide, platforms, customCTA, churchId } = await req.json();

    // Validate transcript
    if (!transcript || transcript.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: 'Transcript is missing or too short. Please provide a complete sermon transcript.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating social posts for church:', churchId, 'platforms:', platforms);
    console.log('Transcript length:', transcript?.length || 0);
    console.log('Style guide length:', styleGuide?.length || 0);
    console.log('Custom CTA:', customCTA || 'None');

    // Build platform-specific guidelines
    const selectedGuidelines = platforms
      .map((platform: string) => PLATFORM_GUIDELINES[platform as keyof typeof PLATFORM_GUIDELINES])
      .join('\n\n');

    const systemPrompt = `You are an expert social media content creator for churches. Create engaging, platform-specific social media posts that capture the essence of the sermon while maintaining the church's unique voice and style.`;

    const userPrompt = `
# Primary Task Context
Your goal is to create social media posts that capture and communicate the key messages from the sermon transcript provided below. The sermon content must be the primary focus of all posts.

---

# Sermon Transcript
${transcript}

---

# Church Style Guide
${styleGuide}

---

# Platform Guidelines
${selectedGuidelines}

---

# Optional Additions to Include
${customCTA || 'None - focus solely on sermon content'}

Note: If optional additions are provided above, incorporate them as a secondary call-to-action AFTER presenting the sermon's main message. The sermon content should remain the primary focus.

---

# Task
Create social media posts that capture and communicate the key messages from the SERMON TRANSCRIPT provided above.

CRITICAL REQUIREMENTS:
- Each post MUST be based on the sermon content - extract key themes, messages, and takeaways from the transcript
- Reference specific scripture passages mentioned in the sermon (include book, chapter:verse)
- If "Optional Additions" are provided, weave them naturally into sermon-based content as a call-to-action
- DO NOT create posts solely about the optional additions - they should enhance, not replace, sermon content
- The sermon message should be the primary focus; optional additions are supplementary

Generate ONE post for EACH of the following platforms: ${platforms.join(', ')}

Also create an executive summary (400-500 words) that retells the sermon content in a condensed format:
- Write as a mini-sermon: present the core message from the TRANSCRIPT, don't describe it
- MUST include specific scripture passages directly quoted or referenced in the sermon (cite book, chapter:verse in context)
- Flow naturally through the teaching progression as it was actually preached in the transcript
- Quote or paraphrase key statements from the sermon
- End with "Key Takeaways:" followed by 3-5 bullet points summarizing main applications FROM THE SERMON
- Use engaging, accessible language that captures the sermon's essence
- DO NOT create generic theological content - this must reflect the actual sermon provided

Return your response as a JSON object with this exact structure:
{
  "facebook": "post content for Facebook (only if Facebook is in the platforms list)",
  "instagram": "post content for Instagram (only if Instagram is in the platforms list)",
  "tiktok": "post content for TikTok (only if TikTok is in the platforms list)",
  "twitter": "post content for Twitter (only if Twitter is in the platforms list)",
  "executiveSummary": "summary content here"
}

Important:
- Only include keys for the platforms that were requested
- Follow the character limits and guidelines for each platform
- Maintain the church's voice from the style guide
- Include relevant hashtags for each platform
- Make each post unique and optimized for its platform
- Use proper formatting: line breaks, paragraph spacing, and structure
- DO NOT create solid blocks of text - use whitespace strategically
- For Instagram: use line breaks generously (Instagram best practice)
- For Facebook: break into 2-3 paragraphs with spacing
- Each platform post should be visually scannable, not a text wall
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    const generatedContent = JSON.parse(content);

    console.log('Social posts generated successfully');

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-social-posts:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
