import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { websiteUrl } = await req.json();
    
    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: 'Website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured in Edge Function environment');

      return new Response(
        JSON.stringify({ 
          error: 'Website scraping is temporarily unavailable in local development',
          details: 'Firecrawl API key not accessible in Edge Function environment. This is normal in local development mode.',
          suggestion: 'You can skip website scraping for now and manually add church context to your style guide.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting website crawl for:', websiteUrl);
    
    // Start the crawl job
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        limit: 10,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Firecrawl API error:', crawlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to start website crawl',
          details: errorText
        }),
        { status: crawlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const crawlData = await crawlResponse.json();
    const jobId = crawlData.id;
    
    if (!jobId) {
      console.error('No job ID returned from Firecrawl');
      return new Response(
        JSON.stringify({ error: 'Failed to get crawl job ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Crawl job started with ID:', jobId);

    // Poll for results (max 90 seconds)
    const maxAttempts = 30;
    const pollInterval = 3000; // 3 seconds
    let attempts = 0;
    let crawlComplete = false;
    let finalData: any = null;

    while (attempts < maxAttempts && !crawlComplete) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Error checking crawl status:', statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      const completed = statusData.completed || 0;
      const total = statusData.total || 0;
      console.log(`Crawl status (attempt ${attempts}): ${statusData.status}${total > 0 ? ` (${completed}/${total} pages)` : ''}`);

      if (statusData.status === 'completed') {
        crawlComplete = true;
        finalData = statusData;
      } else if (statusData.status === 'failed') {
        return new Response(
          JSON.stringify({ error: 'Crawl job failed', details: statusData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!crawlComplete || !finalData) {
      return new Response(
        JSON.stringify({ error: 'Crawl timed out - website may be too large or slow' }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully scraped ${finalData.data?.length || 0} pages`);

    // Extract and structure the content
    const scrapedContent = {
      url: websiteUrl,
      pagesScraped: finalData.data?.length || 0,
      content: finalData.data?.map((page: any) => ({
        url: page.metadata?.sourceURL || page.url,
        title: page.metadata?.title || '',
        markdown: page.markdown || '',
      })) || [],
      scrapedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ success: true, data: scrapedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-church-website function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape website',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
