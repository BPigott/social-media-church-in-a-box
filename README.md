# Social Media Church in a Box

An AI-powered content generation platform for churches, creating social media posts, devotionals, and Bible study guides from sermon transcripts.

## Features

- **AI-Powered Content Generation**: Uses Claude 4.5 Haiku to generate contextually relevant content
- **Multiple Content Types**:
  - Social media posts (Facebook, Instagram, TikTok, Twitter/X)
  - Daily devotionals
  - Comprehensive Bible study guides
- **Multi-language Support**: Generate content in 15+ languages with English reference versions
- **Style Guide Generation**: Automatically analyzes your church's communication style
- **Platform-Specific Optimization**: Content tailored to each social media platform's best practices
- **Dual-Language Display**: Edit and retranslate content with side-by-side comparison

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **AI**: Anthropic Claude 4.5 Haiku via direct API integration
- **Translation**: Google Translate API
- **Web Scraping**: Firecrawl API for church website analysis

## Prerequisites

- Node.js 18+ and npm
- Supabase CLI (`npm install -g supabase`)
- Anthropic API key (get from [console.anthropic.com](https://console.anthropic.com))
- Optional: Firecrawl API key (for website scraping)
- Optional: Google Cloud Service Account (for translations)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/BPigott/church-content-craft.git
cd church-content-craft
npm install
```

### 2. Start Supabase Locally

```bash
npx supabase start
```

This will output your local credentials. Save these for the next step.

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Use local Supabase for development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<your_local_anon_key>
```

### 4. Set Edge Function Secrets

```bash
# Required for AI content generation
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-... --local

# Optional: For website scraping
supabase secrets set FIRECRAWL_API_KEY=fc-... --local

# Optional: For translations
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' --local
```

### 5. Restart Supabase (to load secrets)

```bash
npx supabase stop
npx supabase start
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## Production Deployment

### 1. Link to Your Supabase Project

```bash
supabase link --project-ref <your-project-id>
```

### 2. Push Database Migrations

```bash
supabase db push
```

### 3. Set Production Secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
supabase secrets set FIRECRAWL_API_KEY=fc-...
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy
```

### 5. Deploy Frontend

Build and deploy your frontend to your preferred hosting platform (Vercel, Netlify, etc.):

```bash
npm run build
```

Update production environment variables to point to your production Supabase instance.

## Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase client & types
│   ├── pages/          # Page components
│   └── types/          # TypeScript type definitions
├── supabase/
│   ├── functions/      # Edge Functions (AI generation, scraping, translation)
│   └── migrations/     # Database schema migrations
└── public/             # Static assets
```

## Key Edge Functions

- **generate-social-posts**: Generates social media content, devotionals, and Bible studies
- **generate-style-guide**: Analyzes church content to create communication style guide
- **retranslate-content**: Re-translates edited English content to target language
- **scrape-church-website**: Extracts content from church websites for context

## Cost Considerations

### Anthropic Claude 4.5 Haiku Pricing
- Input: $1 per million tokens
- Output: $5 per million tokens

Typical costs per generation:
- Style guide: $0.015-0.05
- Social posts: $0.008-0.03
- Bible study: $0.01-0.04

## Support & Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Project Repository](https://github.com/BPigott/church-content-craft)

## License

This project is proprietary software developed for church content creation.

---

Built with ❤️ for church communications teams everywhere
