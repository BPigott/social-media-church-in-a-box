import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Share2, Sparkles } from "lucide-react";
const Index = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground">
            Transform Sermons into
            <span className="block text-primary mt-2">Social Media Mission</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Generate platform-specific social media content from your sermon transcripts in seconds. 
            Tailored to your church's unique voice and brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? <Button asChild size="lg" className="text-lg px-8">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button> : <>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/signup">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">Upload Sermons</h3>
            <p className="text-muted-foreground">
              Simply upload your sermon transcripts and let our AI do the work
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">AI-Powered Generation</h3>
            <p className="text-muted-foreground">
              Generate content optimized for Facebook, Instagram, TikTok, and Twitter
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Share2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">Share Instantly</h3>
            <p className="text-muted-foreground">
              Copy and post across all your social media platforms with one click
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;