import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateText, translateMultiple } from '../_shared/translate.ts';
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
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    const { transcript, styleGuide, platforms, customCTA, churchId, postsPerPlatform = 1, speakerName, socialHandles, contentTypes = [
      'social_media'
    ], outputLanguages = ['en'], primaryLanguage = 'en' } = await req.json();
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
    if (!hasSocialMedia && !hasBibleStudy && !hasDevotional) {
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
    if (hasSocialMedia && (!platforms || platforms.length === 0)) {
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
    if (!hasTranscript && !hasCTA) {
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
    // Build platform-specific guidelines (only for social media)
    const selectedGuidelines = hasSocialMedia && platforms ? platforms.map((platform)=>PLATFORM_GUIDELINES[platform]).join('\n\n') : '';
    const systemPrompt = `You are an expert church communications specialist. Create engaging content that captures the essence of sermons and church events while maintaining the church's unique voice and style.

CRITICAL: Your response must be ONLY valid JSON with no preamble, explanation, or additional text. Do not write "Here is the JSON:" or any other introduction. Start directly with the opening brace {`;
    const userPrompt = `
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

${hasBibleStudy ? `
# Bible Study Guide Generation Requirements
${hasTranscript ? `
- Extract ALL scripture references from the sermon transcript
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
- Structure: Title → Anchor Verse → Hook (Story) → Truth → Practice → Reflection → Prayer
- Make it personal, practical, and Spirit-expectant
- Focus on moving from information to encounter with Jesus
` : `
- Create a devotional based on the event/announcement following the Blended Approach style guide
- Find the spiritual connection and practical application
- Structure: Title → Anchor Verse → Hook (Story) → Truth → Practice → Reflection → Prayer
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

**Prayer**
[Short, first-person prayer the user can adopt as their own]

TONE: Warm, relational (not "religious"), accessible language, story-driven, practical, hopeful
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
}

${hasSocialMedia ? 'IMPORTANT: Only include keys for the platforms that were requested.' : ''}
${hasBibleStudy ? 'IMPORTANT: The Bible Study Guide must be complete and properly formatted.' : ''}
${hasDevotional ? 'IMPORTANT: The devotional must be complete and follow the Blended Approach format exactly.' : ''}

${hasSocialMedia ? `
FINAL LENGTH CHECK (VALIDATE BEFORE RETURNING):
- Facebook: Count words - must be 40-80 words maximum
- Instagram: First line must be under 125 characters
- Twitter: Must be under 280 characters total
- TikTok: Must be under 150 characters total
- Social handles count toward character limits
` : ''}

${hasBibleStudy ? `
FINAL VALIDATION (CHECK BEFORE RETURNING):
- Verify ALL text is in UK English spelling
- Confirm no hashtags or asterisks used for emphasis
- Ensure clean markdown formatting with proper spacing
- Use natural, clear UK English that translates well
` : ''}

${hasDevotional ? `
FINAL DEVOTIONAL VALIDATION (CHECK BEFORE RETURNING):
- Verify devotional follows exact Blended Approach structure
- Ensure anchor verse is included with proper NIV citation
- Confirm practical action is specific and doable today
- Check that reflection question cuts to the heart
- Verify prayer is personal and adoptable
- Use warm, relational tone throughout
` : ''}
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
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
            throw new Error(`Failed to parse AI response as JSON: ${extractError.message}`);
          }
        } else {
          console.error("No JSON found in response:", textContent.substring(0, 500));
          throw new Error("AI response did not contain valid JSON");
        }
      }
    }
    console.log('Content generated successfully in UK English');
    
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
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
