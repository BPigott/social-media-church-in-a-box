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
- Include: Questions, CTAs, or thought-provoking statements
- Hashtags: 1-3 relevant hashtags
- Emojis: Use sparingly for emphasis
`,
  instagram: `
Instagram Guidelines:
- Length: 125-150 characters for captions (first 2 lines are key)
- Tone: Inspirational and visual
- Include: Strong opening line, line breaks for readability
- Hashtags: 5-10 relevant hashtags (can go up to 30)
- Emojis: Use to break up text and add personality
`,
  tiktok: `
TikTok Guidelines:
- Length: Very short and punchy (under 150 characters)
- Tone: Authentic, relatable, conversational
- Include: Trending phrases or challenges when relevant
- Hashtags: 3-5 trending + niche hashtags
- Emojis: Use generously for engagement
`,
  twitter: `
Twitter/X Guidelines:
- Length: 280 characters max (aim for 240-260 for retweets)
- Tone: Concise and impactful
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

    console.log('Generating social posts for church:', churchId, 'platforms:', platforms);

    // Build platform-specific guidelines
    const selectedGuidelines = platforms
      .map((platform: string) => PLATFORM_GUIDELINES[platform as keyof typeof PLATFORM_GUIDELINES])
      .join('\n\n');

    const systemPrompt = `You are an expert social media content creator for churches. Create engaging, platform-specific social media posts that capture the essence of the sermon while maintaining the church's unique voice and style.`;

    const userPrompt = `
# Church Style Guide
${styleGuide}

---

# Sermon Transcript
${transcript}

---

# Custom Instructions
${customCTA || 'None provided'}

---

# Platform Guidelines
${selectedGuidelines}

---

# Task
Generate ONE post for EACH of the following platforms: ${platforms.join(', ')}

Also create an executive summary (under 500 words) that includes:
- Key takeaways from the sermon
- Main teaching points
- Scripture references used
- Practical applications

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
