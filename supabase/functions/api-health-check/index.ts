import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

async function testSupabaseDB(): Promise<HealthCheckResult> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Test basic database query
    const { data, error } = await supabase
      .from('churches')
      .select('id')
      .limit(1);

    if (error) {
      return {
        service: 'Supabase Database',
        status: 'unhealthy',
        message: `Database query failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      service: 'Supabase Database',
      status: 'healthy',
      message: 'Database connection successful',
      details: { queryResult: data },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'Supabase Database',
      status: 'error',
      message: `Connection error: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    };
  }
}

async function testAnthropicAPI(): Promise<HealthCheckResult> {
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return {
        service: 'Anthropic API',
        status: 'unhealthy',
        message: 'API key not configured',
        timestamp: new Date().toISOString()
      };
    }

    // Simple test prompt
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" if you can read this.'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        service: 'Anthropic API',
        status: 'unhealthy',
        message: `HTTP ${response.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      };
    }

    const data = await response.json();
    return {
      service: 'Anthropic API',
      status: 'healthy',
      message: 'API connection successful',
      details: { 
        model: data.model,
        usage: data.usage,
        responsePreview: data.content?.[0]?.text?.substring(0, 100)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'Anthropic API',
      status: 'error',
      message: `Connection error: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    };
  }
}

async function testGoogleTranslateAPI(): Promise<HealthCheckResult> {
  try {
    const credentialsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!credentialsJson) {
      return {
        service: 'Google Translate API',
        status: 'unhealthy',
        message: 'Service account credentials not configured',
        timestamp: new Date().toISOString()
      };
    }

    // Parse credentials
    const credentials = JSON.parse(credentialsJson);
    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      return {
        service: 'Google Translate API',
        status: 'unhealthy',
        message: 'Invalid service account credentials format',
        timestamp: new Date().toISOString()
      };
    }

    return {
      service: 'Google Translate API',
      status: 'healthy',
      message: 'Credentials configured correctly',
      details: { 
        projectId: credentials.project_id,
        clientEmail: credentials.client_email.substring(0, 20) + '...'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'Google Translate API',
      status: 'error',
      message: `Configuration error: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    };
  }
}

async function testFirecrawlAPI(): Promise<HealthCheckResult> {
  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return {
        service: 'Firecrawl API',
        status: 'unhealthy',
        message: 'API key not configured',
        timestamp: new Date().toISOString()
      };
    }

    // Test API key validity with a simple request
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown']
      }),
    });

    if (response.status === 401) {
      return {
        service: 'Firecrawl API',
        status: 'unhealthy',
        message: 'Invalid API key',
        timestamp: new Date().toISOString()
      };
    }

    if (response.status === 402) {
      return {
        service: 'Firecrawl API',
        status: 'unhealthy',
        message: 'API credits exhausted',
        timestamp: new Date().toISOString()
      };
    }

    // Even if the scrape fails, if we get a 200/400 it means auth worked
    if (response.ok || response.status === 400) {
      return {
        service: 'Firecrawl API',
        status: 'healthy',
        message: 'API key valid and authenticated',
        details: { statusCode: response.status },
        timestamp: new Date().toISOString()
      };
    }

    return {
      service: 'Firecrawl API',
      status: 'unhealthy',
      message: `Unexpected response: ${response.status}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'Firecrawl API',
      status: 'error',
      message: `Connection error: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting comprehensive API health check...');
    
    // Run all health checks in parallel
    const [supabaseResult, anthropicResult, googleResult, firecrawlResult] = await Promise.all([
      testSupabaseDB(),
      testAnthropicAPI(),
      testGoogleTranslateAPI(),
      testFirecrawlAPI()
    ]);

    const results = [supabaseResult, anthropicResult, googleResult, firecrawlResult];
    
    // Overall health status
    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 
                         results.some(r => r.status === 'healthy') ? 'partial' : 'unhealthy';

    const healthSummary = {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length,
        errors: results.filter(r => r.status === 'error').length
      }
    };

    console.log('Health check completed:', healthSummary.summary);

    return new Response(JSON.stringify(healthSummary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        overall: 'error',
        message: `Health check failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
