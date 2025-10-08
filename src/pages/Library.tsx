import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedContent } from "@/types/database";

const Library = () => {
  const { user, loading } = useAuth();
  const { primaryChurch, loading: churchLoading } = useChurch(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (primaryChurch?.id) {
      loadContent();
    }
  }, [primaryChurch]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('church_id', primaryChurch?.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setContent(data as unknown as GeneratedContent[] || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading content",
        description: error instanceof Error ? error.message : "Failed to load content",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Deleted",
        description: "Content has been deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting content",
        description: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadContent = (item: GeneratedContent) => {
    const content = [];
    
    if (item.facebook_post) {
      content.push(`=== FACEBOOK ===\n${item.facebook_post}\n`);
    }
    if (item.instagram_post) {
      content.push(`=== INSTAGRAM ===\n${item.instagram_post}\n`);
    }
    if (item.tiktok_post) {
      content.push(`=== TIKTOK ===\n${item.tiktok_post}\n`);
    }
    if (item.twitter_post) {
      content.push(`=== TWITTER/X ===\n${item.twitter_post}\n`);
    }
    if (item.executive_summary) {
      content.push(`=== EXECUTIVE SUMMARY ===\n${item.executive_summary}\n`);
    }

    const blob = new Blob([content.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-posts-${new Date(item.generated_at).toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContent = content.filter(item =>
    item.executive_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.facebook_post?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.instagram_post?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || churchLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold mb-2">Content Library</h1>
          <p className="text-muted-foreground">View and manage your past generated content</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredContent.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No content matches your search" : "No content generated yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-playfair">
                        {new Date(item.generated_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <div className="flex gap-2">
                        {(item.platforms as string[]).map((platform) => (
                          <Badge key={platform} variant="secondary" className="capitalize">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadContent(item)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteContent(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.facebook_post && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Facebook</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.facebook_post!, "Facebook post")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {item.facebook_post.substring(0, 200)}
                        {item.facebook_post.length > 200 && "..."}
                      </p>
                    </div>
                  )}

                  {item.instagram_post && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Instagram</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.instagram_post!, "Instagram post")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {item.instagram_post.substring(0, 200)}
                        {item.instagram_post.length > 200 && "..."}
                      </p>
                    </div>
                  )}

                  {item.executive_summary && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Executive Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {item.executive_summary.substring(0, 150)}
                        {item.executive_summary.length > 150 && "..."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Library;
