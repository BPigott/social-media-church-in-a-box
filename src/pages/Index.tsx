import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Sparkles, Settings, Brain, Zap, CheckCircle, Clock, Users, Shield, Palette } from "lucide-react";
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
            Your weekly sermons contain powerful messages. We help you extend their reach by automatically generating engaging, platform-specific social media content that matches your church's unique voice and brand—saving you hours of work every week.
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

        {/* How It Works */}
        <div className="mt-32 max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Settings className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
              </div>
              <h3 className="text-xl font-playfair font-semibold">Simple Setup</h3>
              <p className="text-muted-foreground text-sm">Tell us about your church, upload previously delivered sermons, and optionally share your website</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Brain className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
              </div>
              <h3 className="text-xl font-playfair font-semibold">AI Learning</h3>
              <p className="text-muted-foreground text-sm">
                Our AI learns your church's voice, values, and communication style
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Zap className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
              </div>
              <h3 className="text-xl font-playfair font-semibold">Quick Generation</h3>
              <p className="text-muted-foreground text-sm">
                Upload any sermon transcript and get tailored posts for all platforms in seconds
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <CheckCircle className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</span>
              </div>
              <h3 className="text-xl font-playfair font-semibold">Review & Post</h3>
              <p className="text-muted-foreground text-sm">
                Review, copy, and post the content across your platforms
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-32 max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-center mb-16">Benefits for Your Church</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">Save Time</h3>
              <p className="text-muted-foreground">
                Spend 5 minutes instead of hours crafting social content every week
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">Consistent Voice</h3>
              <p className="text-muted-foreground">
                Maintain your church's authentic voice across all platforms
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">Reach More People</h3>
              <p className="text-muted-foreground">
                Extend your sermon's impact beyond Sunday morning
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">Platform-Optimized</h3>
              <p className="text-muted-foreground">
                Content tailored to each platform's best practices and character limits
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">No Expertise Needed</h3>
              <p className="text-muted-foreground">
                Our AI handles the social media strategy—you just post
              </p>
            </div>

            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold">Preserve Your Message</h3>
              <p className="text-muted-foreground">
                Keep the heart of your sermon intact while making it social-friendly
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">Upload Sermons</h3>
            <p className="text-muted-foreground">
              Drag and drop sermon transcripts in PDF, DOCX, or TXT format—our AI extracts and analyzes the content
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">AI-Powered Content</h3>
            <p className="text-muted-foreground">
              Generate multiple post variations for Facebook, Instagram, TikTok, and Twitter—each optimized for that platform's audience
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold">Your Church's Voice</h3>
            <p className="text-muted-foreground">
              Content reflects your church's unique style, values, and communication preferences—not generic templates
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;