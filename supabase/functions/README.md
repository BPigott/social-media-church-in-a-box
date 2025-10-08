# Supabase Edge Functions - Setup Guide

## Overview

This project uses Supabase Edge Functions with **Claude 4.5 Sonnet** (via Anthropic API) for AI-powered content generation.

## Functions

1. **generate-style-guide** - Analyzes church data and sermons to create a unique communication style guide
2. **generate-social-posts** - Generates platform-specific social media content from sermon transcripts
3. **scrape-church-website** - Scrapes church website content for additional context

## Required Environment Variables

### ANTHROPIC_API_KEY

Both `generate-style-guide` and `generate-social-posts` functions require an Anthropic API key.

**To set up:**

1. Get your Anthropic API key from: https://console.anthropic.com/
2. Set the secret in Supabase:

```bash
# Using Supabase CLI
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Or via Supabase Dashboard:
# 1. Go to your project dashboard
# 2. Settings > Edge Functions > Secrets
# 3. Add new secret: ANTHROPIC_API_KEY
```

### Verify Secrets

To verify your secrets are set correctly:

```bash
supabase secrets list
```

## Model Configuration

Both functions are configured to use:
- **Model**: `claude-sonnet-4-20250514` (Claude 4.5 Sonnet)
- **Max Tokens**: 8192
- **Temperature**: 0.7

## API Endpoints

The functions call the Anthropic API directly:
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **API Version**: `2023-06-01`

## Error Handling

The functions handle common API errors:
- **429** - Rate limit exceeded (retry after a moment)
- **402/403** - API key issue or credit limit reached
- **500** - Internal server errors

## Local Development

To test functions locally:

```bash
# Start Supabase locally
supabase start

# Set local secrets
supabase secrets set ANTHROPIC_API_KEY=your-key-here --local

# Invoke function locally
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-style-guide' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"churchData": {...}, "sermonTexts": [...]}'
```

## Deployment

Deploy functions to production:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-style-guide
supabase functions deploy generate-social-posts
```

## Cost Considerations

Claude 4.5 Sonnet pricing (as of 2025):
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

Typical usage per generation:
- Style guide: ~5,000-10,000 input tokens, ~2,000-4,000 output tokens
- Social posts: ~3,000-8,000 input tokens, ~1,000-2,000 output tokens

**Cost estimate**: $0.05-0.15 per style guide generation, $0.02-0.10 per social post generation

## Troubleshooting

### "ANTHROPIC_API_KEY not configured" error
- Verify the secret is set: `supabase secrets list`
- Ensure you've deployed after setting the secret
- Check the API key is valid in Anthropic console

### Rate limit errors
- Anthropic has rate limits based on your plan tier
- Implement exponential backoff in client code if needed
- Consider upgrading your Anthropic plan for higher limits

### Response format issues
- Claude returns responses in Anthropic's message format
- The content is accessed via `response.content[0].text`
- JSON extraction is handled automatically if Claude wraps responses in markdown code blocks

## Migration from Gemini

This codebase was previously using Google Gemini 2.5 Flash via the Lovable AI Gateway. Key changes:

1. **API Endpoint**: Changed from Lovable gateway to direct Anthropic API
2. **Authentication**: Now uses `x-api-key` header instead of `Authorization: Bearer`
3. **Response Format**: Changed from OpenAI-compatible format to Anthropic Messages API format
4. **Model Name**: Changed from `google/gemini-2.5-flash` to `claude-sonnet-4-20250514`
5. **Environment Variable**: Changed from `LOVABLE_API_KEY` to `ANTHROPIC_API_KEY`

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/messages_post)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
