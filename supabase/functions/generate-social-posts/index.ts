import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_GUIDELINES = {
  facebook: `
Facebook Guidelines:
- Length: 40-80 words MAXIMUM (count your words before returning - if over 80 words, trim it down)
- Tone: Conversational and engaging
- Structure: Hook → Body → CTA with clear spacing
- Formatting: Use paragraph breaks (double line breaks) for readability
- AVOID: Walls of text - break into 2-3 short paragraphs
- Include: Questions, CTAs, or thought-provoking statements
- Social Handle: If provided, can mention "Find us at facebook.com/[handle]" naturally in content
- Hashtags: 1-3 relevant hashtags
- Emojis: Use sparingly for emphasis
`,
  instagram: `
Instagram Guidelines:
- Length: Keep the FIRST LINE under 125 characters (what appears before '...more' button), total caption can be longer (aim for 150-200 characters total)
- Tone: Inspirational and visual
- Structure: Attention-grabbing opening line → Main content (with breaks) → Hashtags on separate lines
- Formatting: Line breaks are ESSENTIAL - use them liberally between thoughts
- AVOID: Solid blocks of text - use whitespace strategically
- Include: Strong opening line (under 125 characters), generous line breaks for readability
- Social Handle: Use @[handle] naturally in captions when relevant (e.g., "Follow @churchhandle for more")
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
- Social Handle: Can reference @[handle] in caption or suggest "Follow for more content like this"
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
- Social Handle: Can tag @[handle] when relevant, keeps posts more personal
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

    const { transcript, styleGuide, platforms, customCTA, churchId, postsPerPlatform = 1, speakerName, socialHandles } = await req.json();

    // Validate transcript
    if (!transcript || transcript.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: 'Transcript is missing or too short. Please provide a complete sermon transcript.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating social posts for church:', churchId, 'platforms:', platforms);
    console.log('Posts per platform:', postsPerPlatform);
    console.log('Transcript length:', transcript?.length || 0);
    console.log('Style guide length:', styleGuide?.length || 0);
    console.log('Custom CTA:', customCTA || 'None');
    console.log('Speaker name:', speakerName || 'Not provided');

    // Build platform-specific guidelines
    const selectedGuidelines = platforms
      .map((platform: string) => PLATFORM_GUIDELINES[platform as keyof typeof PLATFORM_GUIDELINES])
      .join('\n\n');

    const systemPrompt = `You are an expert social media content creator for churches. Create engaging, platform-specific social media posts that capture the essence of the sermon while maintaining the church's unique voice and style.

CRITICAL: Your response must be ONLY valid JSON with no preamble, explanation, or additional text. Do not write "Here is the JSON:" or any other introduction. Start directly with the opening brace {`;

    const userPrompt = `
# Primary Task Context
Your goal is to create social media posts that capture and communicate the key messages from the sermon transcript provided below. The sermon content must be the primary focus of all posts.

# CRITICAL GROUNDING RULES
- You MUST extract content directly from the sermon transcript below
- DO NOT create generic theological content that "sounds right" or is spiritually appropriate
- DO NOT invent examples, stories, or illustrations that are not in the transcript
- DO NOT cite scripture unless it is explicitly mentioned in the transcript text
- If you reference a point from the sermon, it must be directly traceable to the transcript
- Every claim you make must be found in the actual transcript above

---

# Sermon Transcript
${transcript}

---

# Sermon Speaker
${speakerName ? `This sermon was delivered by ${speakerName}.` : 'Speaker not specified.'}

# Speaker Reference Guidelines
- If speaker name is provided, use it naturally in posts when relevant (e.g., "${speakerName} shared...", "${speakerName} reminded us...")
- If no speaker provided, use generic references ("The speaker...", "We heard...", "This message...")
- Keep speaker references natural and not forced - only mention when it flows well
- In the executive summary, you can mention the speaker once in the opening

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

# Church Social Media Handles
${socialHandles && Object.keys(socialHandles).length > 0 ? 
  Object.entries(socialHandles)
    .filter(([_, handle]) => handle && String(handle).trim())
    .map(([platform, handle]) => `${platform}: @${handle}`)
    .join('\n') || 'None provided'
  : 'None provided'}

# Social Handle Usage Guidelines
- Use handles NATURALLY and SPARINGLY - they should enhance, not dominate the content
- Best practices per platform:
  * Facebook: Can mention page URL in a natural way (e.g., "Learn more at facebook.com/[handle]")
  * Instagram: Use @handle in caption for discoverability, especially in CTAs
  * Twitter: Can tag @handle when relevant, keeps posts more personal
  * TikTok: Reference @handle in video caption for follows
- DO NOT force handle mentions - only use when it flows naturally
- Primary focus should remain on sermon content
- Handles work best in CTAs: "Follow @handle for weekly messages" or "Connect with us @handle"

---

# Task
Create social media posts that capture and communicate the key messages from the SERMON TRANSCRIPT provided above.

CRITICAL REQUIREMENTS:
- Each post MUST quote or closely paraphrase actual content from the sermon transcript above
- Reference ONLY scripture passages that are explicitly mentioned in the transcript
- If the sermon tells a story or illustration, you may reference it - but ONLY if it actually appears in the transcript
- DO NOT create "spiritually appropriate" content - use ONLY what the preacher actually said
- Verify every claim you make can be found in the transcript above
- If "Optional Additions" are provided, weave them naturally AFTER presenting actual sermon content
- DO NOT create posts solely about the optional additions - they should enhance, not replace, sermon content

Generate ${postsPerPlatform} ${postsPerPlatform === 1 ? 'post' : 'different variations'} for EACH of the following platforms: ${platforms.join(', ')}

${postsPerPlatform > 1 ? `
VARIATION REQUIREMENTS:
- Each variation must present the same core message differently
- Use different hooks, structures, or emphasis points
- Vary the opening lines and calls-to-action
- Maintain the church's voice and style across all variations
- Each variation should feel distinct, not just minor word changes
- All variations must follow platform-specific guidelines
` : ''}

Also create an executive summary (400-500 words) that SUMMARIZES the sermon content:
- **THIS IS A SUMMARY, NOT A RETELLING**: Condense the key points, don't narrate through the sermon
- **Structure**: 
  - Opening: One sentence capturing the central theme/message
  - Body: 2-3 paragraphs summarizing the main arguments and insights
  - Closing: Practical application or takeaway
- **Scripture References**: 
  - ONLY cite scripture if it appears explicitly in the transcript
  - If scripture is mentioned, format as: "The sermon referenced [book] [chapter]:[verse]..."
  - If NO scripture is mentioned in the transcript, DO NOT invent or assume any
- **Writing Style**: 
  - Write in third person about what the sermon covered ("The sermon explored...", "The message emphasized...")
  - Be concise and specific - extract the essence, not the details
  - Focus on WHAT was taught, not HOW it was preached
  - Every statement must be traceable to the transcript - no invented theology
- **End with "Key Takeaways:"** followed by 3-5 bullet points summarizing main applications FROM THE SERMON
- **DO NOT**: Write in a sermon style, retell the progression, or create generic theological content that wasn't in the sermon

FINAL VALIDATION:
Before returning your response, verify that:
1. Every social post references actual content from the transcript
2. No scripture is cited unless it appears in the transcript
3. No stories or illustrations are mentioned unless they're in the transcript
4. The executive summary accurately reflects what was actually preached
5. You have not invented any theological points that weren't in the sermon

Return your response as a JSON object with this exact structure:
{
  "facebook": ${postsPerPlatform === 1 ? '"post content for Facebook"' : '["variation 1", "variation 2", ...]'},
  "instagram": ${postsPerPlatform === 1 ? '"post content for Instagram"' : '["variation 1", "variation 2", ...]'},
  "tiktok": ${postsPerPlatform === 1 ? '"post content for TikTok"' : '["variation 1", "variation 2", ...]'},
  "twitter": ${postsPerPlatform === 1 ? '"post content for Twitter"' : '["variation 1", "variation 2", ...]'},
  "executiveSummary": "summary content here (always a single string)"
}

${postsPerPlatform > 1 ? 'IMPORTANT: Return an array of exactly ' + postsPerPlatform + ' variations for each platform.' : 'IMPORTANT: Only include keys for the platforms that were requested.'}

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

FINAL LENGTH CHECK (VALIDATE BEFORE RETURNING):
- Facebook: Count words - must be 40-80 words maximum. If over 80, trim it down.
- Instagram: First line (up to first line break) must be under 125 characters (including any @handles). Total caption aim for 150-200 characters.
- Twitter: Must be under 280 characters total (including @handles).
- TikTok: Must be under 150 characters total (including @handles).
- Social handles count toward character limits - adjust accordingly.
Review each post you generated and revise if any exceed these limits.
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
    const textContent = aiData.content[0].text;
    console.log("Raw AI response preview:", textContent.substring(0, 200));

    // Try to extract and parse JSON from the response
    let generatedContent;
    try {
      // First try direct parsing
      generatedContent = JSON.parse(textContent);
    } catch (directError) {
      console.log("Direct JSON parse failed, attempting extraction...");
      
      // Try to extract JSON from markdown code blocks
      let jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          generatedContent = JSON.parse(jsonMatch[1]);
          console.log("Successfully extracted JSON from markdown code block");
        } catch (mdError) {
          console.error("Markdown JSON extraction failed:", mdError);
        }
      }
      
      // If markdown extraction failed, try to find any JSON object in the text
      if (!generatedContent) {
        jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            generatedContent = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted JSON object from response");
          } catch (extractError) {
            console.error("JSON extraction failed:", extractError);
            console.error("Matched text:", jsonMatch[0].substring(0, 500));
            throw new Error(`Failed to parse AI response as JSON: ${(extractError as Error).message}`);
          }
        } else {
          console.error("No JSON found in response:", textContent.substring(0, 500));
          throw new Error("AI response did not contain valid JSON");
        }
      }
    }

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
