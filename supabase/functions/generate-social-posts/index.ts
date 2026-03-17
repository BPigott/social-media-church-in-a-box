import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateText, translateMultiple } from '../_shared/translate.ts';
import { validateInput, validateGeneratedContent } from '../_shared/content-safety.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const LANGUAGE_NAMES = {
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
const CONTENT_SAFETY_ENABLED = false;

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
`
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('=== FUNCTION START ===');
    console.log('Request method:', req.method);
    const contentLength = req.headers.get('content-length');
    console.log('Content length:', contentLength ? `${contentLength} bytes (${Math.round(parseInt(contentLength) / 1024)}KB)` : 'unknown');
    
    // Check request size limit (Supabase Edge Functions have a 6MB limit)
    if (contentLength && parseInt(contentLength) > 6 * 1024 * 1024) {
      console.error('Request too large:', contentLength, 'bytes');
      return new Response(JSON.stringify({
        error: 'Request too large. Please reduce the size of your transcript or content.'
      }), {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    
    console.log('=== PARSING REQUEST BODY ===');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
      console.log('Request body keys:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid request body. Please ensure the request contains valid JSON.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const { transcript, styleGuide, platforms: rawPlatforms, customCTA, churchId, postsPerPlatform = 1, speakerName, socialHandles, contentTypes = [
      'social_media'
    ], outputLanguages = ['en'], primaryLanguage = 'en' } = requestBody;
    
    // Normalize platforms to always be an array
    const platforms = Array.isArray(rawPlatforms) ? rawPlatforms : (rawPlatforms ? [rawPlatforms] : []);
    
    // Debug logging for request validation
    console.log('=== REQUEST VALIDATION DEBUG ===');
    console.log('Content Types:', contentTypes);
    console.log('Raw Platforms:', rawPlatforms);
    console.log('Normalized Platforms:', platforms);
    console.log('Platforms type:', typeof platforms);
    console.log('Platforms is array:', Array.isArray(platforms));
    console.log('Platforms length:', platforms.length);
    console.log('Has transcript:', !!transcript, 'Length:', transcript?.length || 0);
    console.log('Has CTA:', !!customCTA, 'Length:', customCTA?.length || 0);
    
    // Get language names from codes
    const languageNames = outputLanguages.map(code => LANGUAGE_NAMES[code] || code);
    // Debug logging for translation
    console.log('=== TRANSLATION DEBUG ===');
    console.log('Output Languages:', outputLanguages);
    console.log('Primary Language:', primaryLanguage);
    console.log('Language Names:', languageNames);
    console.log('Will translate?', primaryLanguage !== 'en' || outputLanguages.length > 1);
    // Validate input based on content types
    const hasSocialMedia = contentTypes.includes('social_media');
    const hasBibleStudy = contentTypes.includes('bible_study');
    const hasDevotional = contentTypes.includes('devotional');
    const hasPodcastDescription = contentTypes.includes('podcast_description');
    console.log('Content type flags:', { hasSocialMedia, hasBibleStudy, hasDevotional, hasPodcastDescription });

    if (!hasSocialMedia && !hasBibleStudy && !hasDevotional && !hasPodcastDescription) {
      console.error('VALIDATION FAILED: No content types selected');
      return new Response(JSON.stringify({
        error: 'Please select at least one content type to generate.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // For social media, validate platforms
    // Since platforms is normalized to always be an array, just check length
    const hasValidPlatforms = platforms.length > 0;
    console.log('Platform validation:', { hasSocialMedia, hasValidPlatforms, platforms, platformsLength: platforms.length });
    
    if (hasSocialMedia && !hasValidPlatforms) {
      console.error('VALIDATION FAILED: Social media selected but no valid platforms provided');
      console.error('Platforms value:', platforms);
      console.error('Platforms length:', platforms.length);
      return new Response(JSON.stringify({
        error: 'Please select at least one platform for social media posts.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate content source - need either transcript or customCTA
    const hasTranscript = transcript && transcript.trim().length >= 100;
    const hasCTA = customCTA && customCTA.trim().length >= 10;
    console.log('Content source validation:', { hasTranscript, hasCTA, transcriptLength: transcript?.length || 0, ctaLength: customCTA?.length || 0 });
    
    if (!hasTranscript && !hasCTA) {
      console.error('VALIDATION FAILED: No valid content source (transcript or CTA)');
      return new Response(JSON.stringify({
        error: 'Please provide either a sermon transcript (100+ words) or call-to-action/event information (10+ words).'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (CONTENT_SAFETY_ENABLED) {
      // Validate input content for inappropriate material
      if (transcript) {
        const transcriptValidation = validateInput(transcript);
        if (!transcriptValidation.isSafe) {
          return new Response(JSON.stringify({
            error: `Your sermon transcript contains inappropriate content: ${transcriptValidation.violations.join(', ')}. Please review and remove inappropriate content before generating.`
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (customCTA) {
        const ctaValidation = validateInput(customCTA);
        if (!ctaValidation.isSafe) {
          return new Response(JSON.stringify({
            error: `Your event/announcement contains inappropriate content: ${ctaValidation.violations.join(', ')}. Please review and remove inappropriate content before generating.`
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (speakerName) {
        const speakerValidation = validateInput(speakerName);
        if (!speakerValidation.isSafe) {
          console.error('VALIDATION FAILED: Speaker name contains inappropriate content');
          return new Response(JSON.stringify({
            error: `Speaker name contains inappropriate content. Please use an appropriate name.`
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
    } else {
      console.warn('⚠️ Content safety input validation disabled for testing');
    }
    
    console.log('=== ALL VALIDATIONS PASSED ===');
    console.log('All content safety checks passed');
    console.log('Proceeding to content generation...');
    console.log('Generating content for church:', churchId);
    console.log('Content types:', contentTypes);
    console.log('Output languages:', outputLanguages);
    console.log('Primary language:', primaryLanguage);
    console.log('Has transcript:', hasTranscript, 'Length:', transcript?.length || 0);
    console.log('Has CTA:', hasCTA, 'Length:', customCTA?.length || 0);
    console.log('Style guide length:', styleGuide?.length || 0);
    console.log('Custom CTA:', customCTA || 'None');
    console.log('Speaker name:', speakerName || 'Not provided');
    console.log('Platforms:', platforms);
    console.log('Posts per platform:', postsPerPlatform);
    
    console.log('=== BUILDING PROMPTS ===');
    let selectedGuidelines = '';
    let systemPrompt = '';
    let userPrompt = '';
    
    try {
      // Build platform-specific guidelines (only for social media)
      console.log('Building platform guidelines...');
      selectedGuidelines = hasSocialMedia && platforms ? platforms.map((platform)=>PLATFORM_GUIDELINES[platform]).join('\n\n') : '';
      console.log('Platform guidelines length:', selectedGuidelines.length);
      
      console.log('Constructing system prompt...');
      systemPrompt = `You are an expert church communications specialist. Create engaging content that captures the essence of sermons and church events while maintaining the church's unique voice and style.

CRITICAL CONTENT SAFETY GUARDRAILS:
- ABSOLUTELY PROHIBITED: Any erotic, sexual, or explicit content of any kind
- ABSOLUTELY PROHIBITED: Racist, discriminatory, or hateful language or references
- ABSOLUTELY PROHIBITED: References to gambling, betting, casinos, or gambling-related activities
- ABSOLUTELY PROHIBITED: Blasphemous, irreverent, or mocking references to God, Jesus, the Holy Spirit, Scripture, or sacred matters
- ABSOLUTELY PROHIBITED: Violence, profanity, or offensive language
- REQUIRED: All content must be respectful, appropriate for a church audience, and aligned with Christian values
- REQUIRED: If you encounter any input that could lead to inappropriate content, focus on positive, edifying alternatives instead
- REQUIRED: All references to Scripture must be respectful and accurate
- REQUIRED: Maintain a tone that honors God and encourages the faith community

If any input material contains inappropriate content, you must:
1. Filter it out completely
2. Refuse to generate content based on that material
3. Focus only on wholesome, faith-building content

CRITICAL WRITING GUIDELINES:
- Write in a natural, conversational tone that avoids AI-like patterns
- Vary sentence structure and length for natural flow
- Use straightforward, clear language
- Avoid overly complex sentence constructions

DASH USAGE RULES:
- Avoid using em dashes (—) and en dashes (–) for parenthetical remarks, explanations, or asides
- Instead of dashes for parenthetical information, use commas, parentheses, or restructure sentences
- Instead of dashes to introduce explanations, use colons or create separate sentences
- Only use dashes in compound words (e.g., "well-known," "state-of-the-art") where grammatically necessary

PREFERRED PUNCTUATION STRATEGIES:
- Use commas to set off non-essential information
- Use periods to create clear, separate sentences rather than complex constructions
- Use colons to introduce lists or explanations
- Use parentheses sparingly for truly parenthetical remarks
- Structure sentences to flow naturally without requiring heavy punctuation breaks

EXAMPLES OF NATURAL VS. AI-LIKE WRITING:
- Instead of: "The solution — which took months to develop — finally worked"
- Write: "The solution, which took months to develop, finally worked"

- Instead of: "We need three things — time, money, and patience"
- Write: "We need three things: time, money, and patience"

- Instead of: "The project was successful — beyond our expectations"
- Write: "The project was successful. It exceeded our expectations."

CRITICAL WRITING RULE - DASH PROHIBITION:
- ABSOLUTELY FORBIDDEN: Using em dashes (—) or en dashes (–) for explanations, clarifications, or parenthetical remarks
- MANDATORY ALTERNATIVE: Use colons for explanations, commas for parentheticals, separate sentences when appropriate
- EXAMPLE OF FORBIDDEN PATTERN: "series—a season" (WRONG)
- CORRECT ALTERNATIVES: "series: a season" OR "series. It's a season"
- Before generating ANY content, mentally check: "Would I use a dash here? If yes, use colon or comma instead"

CRITICAL: Your response must be ONLY valid JSON with no preamble, explanation, or additional text. Do not write "Here is the JSON:" or any other introduction. Start directly with the opening brace {`;
      
      console.log('System prompt constructed, length:', systemPrompt.length);
      console.log('Constructing user prompt...');
      userPrompt = `
# CRITICAL: MANDATORY WRITING RULES (READ FIRST)

**ABSOLUTE DASH PROHIBITION:**
- NEVER use em dashes (—) or en dashes (–) for ANY purpose except compound words
- NEVER use dashes for explanations, clarifications, parenthetical remarks, or asides
- This is a HARD RULE: If you write a dash, you have FAILED the task

**YOU MUST USE THESE ALTERNATIVES:**
- Explanations/clarifications after a phrase: Use colon (:) or separate sentence
  - WRONG: "our Advent series—a season about waiting"
  - CORRECT: "our Advent series: a season about waiting" OR "our Advent series. It's a season about waiting"
- Parenthetical information: Use commas or parentheses
  - WRONG: "The solution — which took months — finally worked"
  - CORRECT: "The solution, which took months, finally worked"
- Lists/explanations: Use colons
  - WRONG: "We need three things — time, money, patience"
  - CORRECT: "We need three things: time, money, patience"

**FINAL CHECK: Before returning JSON, scan EVERY piece of text for em dashes (—) and en dashes (–). If you find ANY, rewrite that section without dashes.**

---

# Content Generation Task
${hasTranscript ? 'Generate content based on the sermon transcript provided below.' : 'Generate content based on the church event/announcement information provided below.'}
${hasSocialMedia ? 'Create social media posts optimized for each platform.' : ''}
${hasBibleStudy ? 'Create a comprehensive Bible Study Guide with scripture references and discussion questions.' : ''}
${hasDevotional ? 'Create a daily devotional following the Blended Approach style guide.' : ''}

# Content Source
${hasTranscript ? `
## Sermon Transcript
${transcript}

## Sermon Speaker
${speakerName ? `This sermon was delivered by ${speakerName}.` : 'Speaker not specified.'}
` : `
## Event/Announcement Information
${customCTA}
`}

---

# Church Style Guide
${styleGuide}

---

${hasSocialMedia ? `
# Platform Guidelines
${selectedGuidelines}

---

# Social Media Generation Requirements
${hasTranscript ? `
- Extract content directly from the sermon transcript above
- DO NOT create generic theological content that "sounds right"
- DO NOT invent examples, stories, or illustrations not in the transcript
- DO NOT cite scripture unless explicitly mentioned in the transcript
- Every claim must be traceable to the actual transcript
` : `
- Build content around the event/announcement information provided
- Use the church style guide to maintain authentic voice and tone
- Create engaging posts that promote the event/announcement
- Focus on the key message and call-to-action
`}

Generate ${postsPerPlatform} ${postsPerPlatform === 1 ? 'post' : 'different variations'} for EACH of the following platforms: ${platforms?.join(', ') || 'N/A'}

${postsPerPlatform > 1 ? `
VARIATION REQUIREMENTS:
- Each variation must present the same core message differently
- Use different hooks, structures, or emphasis points
- Vary the opening lines and calls-to-action
- Maintain the church's voice and style across all variations
- Each variation should feel distinct, not just minor word changes
- All variations must follow platform-specific guidelines
` : ''}

Also create an executive summary (400-500 words) that SUMMARIZES the ${hasTranscript ? 'sermon content' : 'event/announcement'}:
- **Structure**: Opening theme → Main points → Practical application
- **Scripture References**: ${hasTranscript ? 'ONLY cite scripture if it appears explicitly in the transcript' : 'Include relevant scripture if appropriate for the event'}
- **Writing Style**: Write in third person about what was covered
- **End with "Key Takeaways:"** followed by 3-5 bullet points
` : ''}

---

# MANDATORY WRITING REQUIREMENTS (CRITICAL - MUST FOLLOW)

**ABSOLUTE PROHIBITION ON DASHES:**
- NEVER use em dashes (—) or en dashes (–) for parenthetical remarks, explanations, clarifications, or asides
- NEVER use dashes to introduce explanations, definitions, or additional context
- This applies to ALL content: social media posts, summaries, Bible studies, devotionals, everything
- If you catch yourself about to write a dash, STOP and use one of these alternatives instead

**REQUIRED ALTERNATIVES TO DASHES:**
- For explanations/clarifications: Use colons (:) or create separate sentences
  - Instead of: "Our Advent series—a season about waiting"
  - Write: "Our Advent series: a season about waiting" OR "Our Advent series. It's a season about waiting"
- For parenthetical information: Use commas, parentheses, or restructure
  - Instead of: "The solution — which took months — finally worked"
  - Write: "The solution, which took months, finally worked"
- For lists/explanations: Use colons
  - Instead of: "We need three things — time, money, patience"
  - Write: "We need three things: time, money, patience"

**ADDITIONAL WRITING REQUIREMENTS:**
- Write in natural, conversational tone
- Vary sentence structure and length
- Use straightforward, clear language
- Avoid overly complex constructions requiring heavy punctuation

**VALIDATION:**
Before returning your JSON response, review EVERY piece of content and verify:
- Zero em dashes (—) used anywhere
- Zero en dashes (–) used for explanations/clarifications
- All parenthetical information uses commas or parentheses
- All explanations use colons or separate sentences

---

# Critical Writing Guidelines

Before writing your content, do your planning work in <content_planning> tags inside your thinking block (if your model supports thinking blocks):
- Analyze the content request to understand the type of writing needed (informational, persuasive, creative, etc.)
- Identify specific areas where AI writing patterns (especially dashes) might naturally occur in this type of content
- Plan alternative sentence structures and punctuation strategies you'll use instead
- Outline your overall approach to structure and tone

**Dash Usage Rules:**
- Avoid using em dashes (—) and en dashes (–) for parenthetical remarks, explanations, or asides
- Instead of dashes for parenthetical information, use commas, parentheses, or restructure sentences
- Instead of dashes to introduce explanations, use colons or create separate sentences
- Only use dashes in compound words (e.g., "well-known," "state-of-the-art") where grammatically necessary

**Preferred Punctuation Strategies:**
- Use commas to set off non-essential information
- Use periods to create clear, separate sentences rather than complex constructions
- Use colons to introduce lists or explanations
- Use parentheses sparingly for truly parenthetical remarks
- Structure sentences to flow naturally without requiring heavy punctuation breaks

**Examples of Natural vs. AI-like Writing:**
- Instead of: "The solution — which took months to develop — finally worked"
- Write: "The solution, which took months to develop, finally worked"

- Instead of: "We need three things — time, money, and patience"
- Write: "We need three things: time, money, and patience"

- Instead of: "The project was successful — beyond our expectations"
- Write: "The project was successful. It exceeded our expectations."

**Additional Requirements:**
- Write in a natural, conversational tone
- Vary sentence structure and length
- Use straightforward, clear language
- Avoid overly complex sentence constructions that require multiple punctuation breaks
- Ensure smooth flow between ideas

**Output Format:**
Your final response should contain only the requested content, written according to the guidelines above. Do not include explanations, commentary, or any markup in your final output, and do not duplicate or rehash any of the planning work you did in the thinking block.

---

${hasBibleStudy ? `
# Bible Study Guide Generation Requirements
${hasTranscript ? `
- Extract the TOP 3 most emphasized scripture references from the sermon transcript
- Focus on the primary passages that form the foundation of the sermon message
- Prioritize passages that received the most explanation or application time
- For each scripture, provide the NIV translation
- Create 5 discussion questions designed for ~10 minutes each
- Focus questions on application, not just comprehension
- Include practical next steps
` : `
- Use the event/announcement as the basis for the study
- Include relevant scripture passages that relate to the event theme
- Create discussion questions that help people engage with the event's message
- Focus on practical application and community building
`}

Generate the Bible Study Guide in UK English spelling.

IMPORTANT:
- ALL content must be generated in UK English spelling (colour, realise, centre, etc.)
- Content will be translated to selected languages automatically if needed
- Focus on clear, natural UK English that translates well

BIBLE STUDY GUIDE FORMAT:
# Bible Study Guide

## Summary
[2-3 paragraph summary of the ${hasTranscript ? 'sermon\'s main message' : 'event\'s key themes'}]

## Scripture References
[List all scriptures with book/chapter/verse]

### [Scripture Reference 1]
**[Book Chapter:Verse]** (NIV)
[Full text of verse(s) in NIV translation]

[Repeat for each scripture reference]

## Reflection Questions
1. [Question designed for 10-minute discussion]
2. [Question designed for 10-minute discussion]
3. [Question designed for 10-minute discussion]
4. [Question designed for 10-minute discussion]
5. [Question designed for 10-minute discussion]

## Application
[Practical takeaways and action steps]

FORMATTING REQUIREMENTS:
- Use clean markdown formatting with # headers only
- Do NOT use hashtags (# symbols for anything other than markdown headers)
- Do NOT use asterisks for emphasis (**bold** or *italic*)
- Do NOT use social media formatting
- Use plain text with proper paragraph breaks
- Ensure all content is properly spaced and readable
` : ''}

${hasDevotional ? `
# Daily Devotional Generation Requirements
${hasTranscript ? `
- Create a devotional based on the sermon transcript following the Blended Approach style guide
- Extract the core spiritual truth from the sermon
- Structure: Title → Anchor Verse → Hook (Story) → Truth → Practice → Reflection
- Make it personal, practical, and Spirit-expectant
- Focus on moving from information to encounter with Jesus
` : `
- Create a devotional based on the event/announcement following the Blended Approach style guide
- Find the spiritual connection and practical application
- Structure: Title → Anchor Verse → Hook (Story) → Truth → Practice → Reflection
- Make it relatable to the event's theme and purpose
`}

Generate the Daily Devotional in UK English spelling following the Blended Approach format.

DEVOTIONAL FORMAT REQUIREMENTS:
# [Engaging Title]

**[Anchor Verse]** (Bible Reference)
[Full verse text in NIV]

**The Hook (Personal Story/Observation)**
[100-word personal story or everyday observation that relates to the main point]

**The Truth**
[Clear explanation of the spiritual truth and why it matters - based on sermon content]

**The Practice**
[One specific, actionable spiritual discipline for today - make it concrete and doable]

**Reflection**
[Single sharp question that cuts to the heart]

TONE: Warm, relational (not "religious"), accessible language, story-driven, practical, hopeful
` : ''}

${hasPodcastDescription ? `
# Podcast Episode Description Generation Requirements
${hasTranscript ? `
- Create a podcast episode description (150-250 words) based on the sermon transcript
- Extract the core message and key talking points from the sermon
` : `
- Create a podcast episode description (150-250 words) based on the event/announcement
- Highlight the key themes and why listeners should tune in
`}

Generate the Podcast Episode Description in UK English spelling with this structure:

PODCAST DESCRIPTION FORMAT REQUIREMENTS:
**Episode Title:** [Compelling episode title that hooks listeners]

**Episode Description:**
[Opening hook/teaser sentence that creates curiosity - 1-2 sentences]

[Key topics and themes covered in this episode - 2-3 sentences summarising what listeners will learn or be challenged by]

[Call-to-listen: why this episode matters and what listeners will take away - 1-2 sentences]

**Tags:** [3-5 relevant podcast tags, comma-separated]

TONE: Conversational, inviting, accessible. Write as if describing the episode to a friend. Avoid churchy jargon.
LENGTH: 150-250 words total for the description section.
` : ''}

---

# Church Social Media Handles
${socialHandles && Object.keys(socialHandles).length > 0 ? Object.entries(socialHandles).filter(([_, handle])=>handle && String(handle).trim()).map(([platform, handle])=>`${platform}: @${handle}`).join('\n') || 'None provided' : 'None provided'}

# Social Handle Usage Guidelines
- Use handles NATURALLY and SPARINGLY - they should enhance, not dominate the content
- Best practices per platform:
  * Facebook: Can mention page URL in a natural way
  * Instagram: Use @handle in caption for discoverability
  * Twitter: Can tag @handle when relevant
  * TikTok: Reference @handle in video caption for follows
- DO NOT force handle mentions - only use when it flows naturally
- Primary focus should remain on ${hasTranscript ? 'sermon content' : 'event content'}

---

${customCTA && customCTA.trim() ? `
# Call-to-Action Integration
IMPORTANT: The following call-to-action/announcement MUST be incorporated into the social media posts:

"${customCTA}"

## CTA Integration Guidelines:
- **Facebook**: Naturally weave the CTA into the post body or include as a compelling closing statement. The CTA should feel like an organic part of the message, not an afterthought.
- **Instagram**: Include the CTA in the caption before hashtags, or suggest it as a first comment. Make it visual and engaging.
- **Twitter/X**: Keep concise - if character limit is tight, prioritize the CTA over other details. Make every character count.
- **TikTok**: End with a punchy, action-oriented CTA. Keep it short and direct.
- **Balance**: If there's sermon content, blend it with the CTA naturally. Don't let either feel forced or disconnected.
- **Urgency**: If the CTA has time-sensitive information (dates, deadlines), make that clear and prominent.
- **Action Words**: Use strong action verbs (Join, Register, Celebrate, Discover, Come, Experience).

${hasTranscript ? '- The sermon content provides the "why" - the CTA provides the "what next"' : '- The CTA is your primary content - make it compelling and clear'}

---
` : ''}


# Response Format
Return your response as a JSON object with this exact structure:
{
  ${hasSocialMedia ? `
  "facebook": ${postsPerPlatform === 1 ? '"post content for Facebook"' : '["variation 1", "variation 2", ...]'},
  "instagram": ${postsPerPlatform === 1 ? '"post content for Instagram"' : '["variation 1", "variation 2", ...]'},
  "tiktok": ${postsPerPlatform === 1 ? '"post content for TikTok"' : '["variation 1", "variation 2", ...]'},
  "twitter": ${postsPerPlatform === 1 ? '"post content for Twitter"' : '["variation 1", "variation 2", ...]'},
  "executiveSummary": "summary content here (always a single string)",
  ` : ''}
  ${hasBibleStudy ? `"bibleStudyGuide": "complete Bible study guide content (always a single string)",` : ''}
  ${hasDevotional ? `"devotional": "complete daily devotional content following Blended Approach format (always a single string)",` : ''}
  ${hasPodcastDescription ? `"podcastDescription": "complete podcast episode description (always a single string)",` : ''}
}

${hasSocialMedia ? 'IMPORTANT: Only include keys for the platforms that were requested.' : ''}
${hasBibleStudy ? 'IMPORTANT: The Bible Study Guide must be complete and properly formatted.' : ''}
${hasDevotional ? 'IMPORTANT: The devotional must be complete and follow the Blended Approach format exactly.' : ''}
${hasPodcastDescription ? 'IMPORTANT: The podcast description must be 150-250 words and include episode title, description, and tags.' : ''}

${hasSocialMedia ? `
FINAL LENGTH CHECK (VALIDATE BEFORE RETURNING):
- Facebook: Count words - must be 40-80 words maximum
- Instagram: First line must be under 125 characters
- Twitter: Must be under 280 characters total
- TikTok: Must be under 150 characters total
- Social handles count toward character limits

FINAL WRITING STYLE CHECK (VALIDATE BEFORE RETURNING):
- MANDATORY: Scan every word of every post and verify ZERO em dashes (—) or en dashes (–) exist
- If you find ANY dash, you MUST rewrite that sentence without it
- Common dash patterns to check: "word—explanation", "phrase—clarification", "thing—additional info"
- Replace with: colons (:) for explanations, commas for parentheticals, periods for separate sentences
- Ensure natural sentence flow without heavy punctuation breaks
- Confirm conversational, natural tone throughout
` : ''}

${hasBibleStudy ? `
FINAL VALIDATION (CHECK BEFORE RETURNING):
- Verify ALL text is in UK English spelling
- Confirm no hashtags or asterisks used for emphasis
- Ensure clean markdown formatting with proper spacing
- Use natural, clear UK English that translates well
- MANDATORY: Search entire content for em dashes (—) and en dashes (–). If ANY found, rewrite those sentences
- Common patterns to fix: "word—explanation", "phrase—clarification" → replace with colon or separate sentence
- Ensure natural sentence flow and conversational tone
- Check that punctuation follows guidelines (commas for parentheticals, colons for lists, periods for clarity)
` : ''}

${hasDevotional ? `
FINAL DEVOTIONAL VALIDATION (CHECK BEFORE RETURNING):
- Verify devotional follows exact Blended Approach structure
- Ensure anchor verse is included with proper NIV citation
- Confirm practical action is specific and doable today
- Check that reflection question cuts to the heart
- Verify prayer is personal and adoptable
- Use warm, relational tone throughout
- MANDATORY: Search entire devotional for em dashes (—) and en dashes (–). If ANY found, rewrite those sentences
- Common patterns to fix: "word—explanation", "phrase—clarification" → replace with colon or separate sentence
- Ensure natural sentence flow and conversational tone throughout
- Check that punctuation follows guidelines (commas for parentheticals, colons for lists, periods for clarity)
` : ''}

${hasPodcastDescription ? `
FINAL PODCAST DESCRIPTION VALIDATION (CHECK BEFORE RETURNING):
- Verify description is 150-250 words
- Ensure episode title is compelling and specific
- Confirm description includes hook, key topics, and call-to-listen
- Check tags are relevant and concise
- MANDATORY: Search entire description for em dashes (—) and en dashes (–). If ANY found, rewrite those sentences
- Use conversational, accessible tone throughout
` : ''}
`;

      console.log('User prompt constructed, length:', userPrompt.length);
      console.log('=== PROMPT CONSTRUCTION COMPLETE ===');
      console.log('System prompt length:', systemPrompt.length, 'characters');
      console.log('User prompt length:', userPrompt.length, 'characters');
      console.log('Total prompt size:', (systemPrompt.length + userPrompt.length), 'characters');
    } catch (promptError) {
      console.error('=== ERROR CONSTRUCTING PROMPTS ===');
      console.error('Error type:', promptError instanceof Error ? promptError.constructor.name : typeof promptError);
      console.error('Error message:', promptError instanceof Error ? promptError.message : String(promptError));
      console.error('Error stack:', promptError instanceof Error ? promptError.stack : 'No stack trace');
      return new Response(JSON.stringify({
        error: 'Failed to construct prompts. Please try again or contact support if the issue persists.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('=== CHECKING API KEY ===');
    console.log('Checking for ANTHROPIC_API_KEY...');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured in environment variables');
      return new Response(JSON.stringify({
        error: 'Service configuration error: AI API key not found. Please contact support.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('ANTHROPIC_API_KEY found, proceeding...');
    console.log('Calling Anthropic API with Claude 4.5 Haiku...');
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16384,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7
      })
    });
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a moment.'
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (aiResponse.status === 402 || aiResponse.status === 403) {
        return new Response(JSON.stringify({
          error: 'API key issue or credit limit reached. Please check your Anthropic account.'
        }), {
          status: aiResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      throw new Error(`Anthropic API error: ${aiResponse.status}`);
    }
    const aiData = await aiResponse.json();
    
    // Check if response was truncated
    if (aiData.stop_reason === 'max_tokens') {
      console.warn('⚠️ WARNING: AI response was truncated at max_tokens limit. This should not happen with max_tokens: 16384.');
      console.warn('Response may be incomplete. Consider splitting content generation or reducing content size.');
    }
    
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
      // If markdown extraction failed, try to find JSON object with balanced braces
      if (!generatedContent) {
        // Find the first opening brace
        const firstBrace = textContent.indexOf('{');
        if (firstBrace !== -1) {
          // Try to find the matching closing brace by counting braces
          let braceCount = 0;
          let jsonStart = firstBrace;
          let jsonEnd = -1;
          
          for (let i = firstBrace; i < textContent.length; i++) {
            if (textContent[i] === '{') {
              braceCount++;
            } else if (textContent[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
          }
          
          if (jsonEnd > jsonStart) {
            const jsonCandidate = textContent.substring(jsonStart, jsonEnd);
            try {
              generatedContent = JSON.parse(jsonCandidate);
              console.log("Successfully extracted JSON object from response");
            } catch (extractError) {
              console.error("JSON extraction failed:", extractError);
              // Log more context around the error position
              const errorPos = extractError.message.match(/position (\d+)/);
              if (errorPos) {
                const pos = parseInt(errorPos[1]);
                const start = Math.max(0, pos - 200);
                const end = Math.min(jsonCandidate.length, pos + 200);
                console.error("Error context:", jsonCandidate.substring(start, end));
                console.error("Full matched text length:", jsonCandidate.length);
              } else {
                console.error("Matched text (first 1000 chars):", jsonCandidate.substring(0, 1000));
              }
              throw new Error(`Failed to parse AI response as JSON: ${extractError.message}`);
            }
          } else {
            console.error("Could not find matching closing brace for JSON object");
            console.error("Response preview:", textContent.substring(0, 1000));
            throw new Error("AI response contains incomplete JSON (missing closing brace)");
          }
        } else {
          console.error("No JSON found in response:", textContent.substring(0, 500));
          throw new Error("AI response did not contain valid JSON");
        }
      }
    }
    console.log('Content generated successfully in UK English');
    
    // Validate generated content for safety
    if (CONTENT_SAFETY_ENABLED) {
      console.log('Validating generated content for safety...');
      const contentToValidate = [
        ...(hasSocialMedia ? [
          generatedContent.facebook,
          generatedContent.instagram,
          generatedContent.tiktok,
          generatedContent.twitter,
          generatedContent.executiveSummary
        ].filter(Boolean) : []),
        ...(hasBibleStudy ? [generatedContent.bibleStudyGuide].filter(Boolean) : []),
        ...(hasDevotional ? [generatedContent.devotional].filter(Boolean) : []),
        ...(hasPodcastDescription ? [generatedContent.podcastDescription].filter(Boolean) : []),
      ];

      for (const content of contentToValidate) {
        const validation = validateGeneratedContent(content);
        if (!validation.isSafe) {
          console.error('SAFETY VIOLATION DETECTED:', validation.violations);
          throw new Error(`Generated content contains inappropriate material: ${validation.violations.join(', ')}. Content generation blocked.`);
        }
      }
      console.log('Content validation passed - all content is safe');
    } else {
      console.warn('⚠️ Skipping generated content safety validation (disabled for testing)');
    }
    
    // Store the original UK English versions
    // Only include fields that were actually requested
    const englishContent: Record<string, any> = {};
    
    if (hasSocialMedia) {
      if (generatedContent.facebook) englishContent.facebook = generatedContent.facebook;
      if (generatedContent.instagram) englishContent.instagram = generatedContent.instagram;
      if (generatedContent.tiktok) englishContent.tiktok = generatedContent.tiktok;
      if (generatedContent.twitter) englishContent.twitter = generatedContent.twitter;
      if (generatedContent.executiveSummary) englishContent.executiveSummary = generatedContent.executiveSummary;
    }
    
    if (hasBibleStudy && generatedContent.bibleStudyGuide) {
      englishContent.bibleStudyGuide = generatedContent.bibleStudyGuide;
    }
    
    if (hasDevotional && generatedContent.devotional) {
      englishContent.devotional = generatedContent.devotional;
    }

    if (hasPodcastDescription && generatedContent.podcastDescription) {
      englishContent.podcastDescription = generatedContent.podcastDescription;
    }

    // Create response structure with content in all requested languages
    const multiLanguageContent: Record<string, any> = {};
    
    // Handle multi-language translation
    const nonEnglishLanguages = outputLanguages.filter(lang => lang !== 'en');
    
    if (nonEnglishLanguages.length > 0) {
      console.log(`=== STARTING PARALLEL TRANSLATION TO ${nonEnglishLanguages.length} LANGUAGES ===`);
      console.log('Target languages:', nonEnglishLanguages);
      
      try {
        // Create promises for parallel translation to all languages
        const translationPromises = nonEnglishLanguages.map(async (targetLang) => {
          console.log(`Starting translation to ${LANGUAGE_NAMES[targetLang] || targetLang}...`);

          const translatedContent: Record<string, any> = {};

          // Translate social media posts
          if (hasSocialMedia && platforms) {
            for (const platform of platforms){
              const platformContent = generatedContent[platform];
              if (platformContent) {
                try {
                  if (Array.isArray(platformContent)) {
                    translatedContent[platform] = await translateMultiple(platformContent, targetLang);
                  } else {
                    translatedContent[platform] = await translateText(platformContent, targetLang);
                  }
                } catch (translateError) {
                  console.error(`Error translating ${platform} to ${targetLang}:`, translateError);
                  // If translation fails for one platform, keep going
                  translatedContent[platform] = platformContent;
                }
              }
            }
            // Translate executive summary if present
            if (generatedContent.executiveSummary) {
              try {
                translatedContent.executiveSummary = await translateText(generatedContent.executiveSummary, targetLang);
              } catch (translateError) {
                console.error(`Error translating executive summary to ${targetLang}:`, translateError);
                translatedContent.executiveSummary = generatedContent.executiveSummary;
              }
            }
          }

          // Translate Bible study
          if (hasBibleStudy && generatedContent.bibleStudyGuide) {
            try {
              translatedContent.bibleStudyGuide = await translateText(generatedContent.bibleStudyGuide, targetLang);
            } catch (translateError) {
              console.error(`Error translating Bible study to ${targetLang}:`, translateError);
              translatedContent.bibleStudyGuide = generatedContent.bibleStudyGuide;
            }
          }

          // Translate devotional
          if (hasDevotional && generatedContent.devotional) {
            try {
              translatedContent.devotional = await translateText(generatedContent.devotional, targetLang);
            } catch (translateError) {
              console.error(`Error translating devotional to ${targetLang}:`, translateError);
              translatedContent.devotional = generatedContent.devotional;
            }
          }

          // Translate podcast description
          if (hasPodcastDescription && generatedContent.podcastDescription) {
            try {
              translatedContent.podcastDescription = await translateText(generatedContent.podcastDescription, targetLang);
            } catch (translateError) {
              console.error(`Error translating podcast description to ${targetLang}:`, translateError);
              translatedContent.podcastDescription = generatedContent.podcastDescription;
            }
          }

          return { language: targetLang, content: translatedContent };
        });

        // Execute all translations in parallel
        const translationResults = await Promise.all(translationPromises);
        
        // Store translated content by language
        for (const result of translationResults) {
          multiLanguageContent[result.language] = result.content;
        }
        
        console.log('=== ALL PARALLEL TRANSLATIONS COMPLETED SUCCESSFULLY ===');
        
      } catch (translateError) {
        console.error('=== PARALLEL TRANSLATION ERROR ===');
        console.error('Error type:', translateError instanceof Error ? translateError.constructor.name : typeof translateError);
        console.error('Error message:', translateError instanceof Error ? translateError.message : String(translateError));
        console.error('Full error:', translateError);
        
        // If translation fails, return English content with error note
        return new Response(JSON.stringify({
          ...englishContent,
          englishVersions: null,
          multiLanguageVersions: null,
          translationError: `Multi-language translation failed: ${translateError instanceof Error ? translateError.message : 'Unknown error'}. Returning English content only.`
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      console.log('=== NO TRANSLATION NEEDED (Only English selected) ===');
    }

    // Return content structured by primary language
    const responseContent = primaryLanguage === 'en' 
      ? englishContent 
      : multiLanguageContent[primaryLanguage] || englishContent;

    // Validate that we have at least one content field
    const hasContent = Object.keys(responseContent).some(key => {
      const value = responseContent[key];
      return value !== null && value !== undefined && (typeof value === 'string' || Array.isArray(value));
    });

    if (!hasContent) {
      console.error('No content generated - responseContent is empty or invalid');
      throw new Error('Failed to generate any content. Please check your input and try again.');
    }

    // Clean up responseContent to remove undefined/null values before stringifying
    const cleanResponseContent: Record<string, any> = {};
    for (const [key, value] of Object.entries(responseContent)) {
      if (value !== null && value !== undefined) {
        cleanResponseContent[key] = value;
      }
    }

    return new Response(JSON.stringify({
      ...cleanResponseContent,
      englishVersions: (primaryLanguage !== 'en' || outputLanguages.length > 1) ? englishContent : null,
      multiLanguageVersions: nonEnglishLanguages.length > 0 ? multiLanguageContent : null,
      outputLanguages,
      primaryLanguage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('=== ERROR IN generate-social-posts ===');
    console.error('Error occurred at:', new Date().toISOString());
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Try to stringify the error object
    try {
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (stringifyError) {
      console.error('Could not stringify error:', stringifyError);
    }
    
    // Return a user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('API key');
    
    return new Response(JSON.stringify({
      error: isConfigError ? 'Service configuration error. Please contact support.' : errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }), {
      status: isConfigError ? 400 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
