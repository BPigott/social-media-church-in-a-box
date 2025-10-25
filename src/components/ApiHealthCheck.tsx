import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database, Brain, Globe, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'error' | 'loading';
  message: string;
  details?: any;
  timestamp: string;
}

interface HealthSummary {
  overall: 'healthy' | 'partial' | 'unhealthy' | 'loading';
  timestamp: string;
  services: HealthStatus[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    errors: number;
  };
}

const ApiHealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-health-check');
      
      if (error) {
        setHealthData({
          overall: 'error',
          timestamp: new Date().toISOString(),
          services: [{
            service: 'Health Check Function',
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
          }],
          summary: { total: 1, healthy: 0, unhealthy: 0, errors: 1 }
        });
      } else {
        setHealthData(data);
      }
      setLastCheck(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
      setHealthData({
        overall: 'error',
        timestamp: new Date().toISOString(),
        services: [{
          service: 'Connection',
          status: 'error',
          message: 'Failed to connect to health check service',
          timestamp: new Date().toISOString()
        }],
        summary: { total: 1, healthy: 0, unhealthy: 0, errors: 1 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'unhealthy': return <Badge variant="destructive">Unhealthy</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Loading</Badge>;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 border-green-200 bg-green-50';
      case 'partial': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'unhealthy': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Database')) return <Database className="w-5 h-5" />;
    if (serviceName.includes('Anthropic')) return <Brain className="w-5 h-5" />;
    if (serviceName.includes('Google')) return <Globe className="w-5 h-5" />;
    if (serviceName.includes('Firecrawl')) return <Search className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  if (!healthData && loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Checking API Health...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card className={`border-2 ${getOverallStatusColor(healthData?.overall || 'loading')}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(healthData?.overall || 'loading')}
                System Health Status
              </CardTitle>
              <CardDescription>
                {lastCheck ? `Last checked: ${lastCheck.toLocaleTimeString()}` : 'Checking...'}
              </CardDescription>
            </div>
            <Button 
              onClick={checkHealth} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        {healthData && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{healthData.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Services</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{healthData.summary.healthy}</div>
                <div className="text-sm text-muted-foreground">Healthy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {healthData.summary.unhealthy}
                </div>
                <div className="text-sm text-muted-foreground">Issues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{healthData.summary.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Individual Service Status */}
      {healthData?.services && (
        <div className="grid gap-3">
          {healthData.services.map((service, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(service.service)}
                    <div>
                      <div className="font-medium">{service.service}</div>
                      <div className="text-sm text-muted-foreground">{service.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(service.status)}
                    {getStatusIcon(service.status)}
                  </div>
                </div>
                {service.details && (
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(service.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What This Means</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Supabase Database:</strong> Core data storage - should always be healthy</p>
          <p><strong>Anthropic API:</strong> AI content generation for sermons, devotionals, and social posts</p>
          <p><strong>Google Translate API:</strong> Multi-language content translation</p>
          <p><strong>Firecrawl API:</strong> Website scraping for church context</p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              <strong>Note:</strong> Some API issues in local development are normal. 
              The system will work with partial API availability.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiHealthCheck;
