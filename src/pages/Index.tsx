import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Sparkles, Settings, Brain, Zap, CheckCircle, Clock, Users, Shield, Palette, BookOpen, Globe, Search, Download, Heart, MessageSquare, Languages, Database } from "lucide-react";
const Index = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8 md:mb-12">
            <img 
              src="/logo.png" 
              alt="ivangel" 
              className="h-48 md:h-64 lg:h-80 w-auto drop-shadow-lg"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Beta</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground leading-tight">
            Complete Church Content &
            <span className="block text-primary mt-2">Multi-Language Ministry Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform sermons into social posts, Bible studies, and devotionals in 14 languages, saving 5+ hours weekly with AI that learns your church's unique voice.
          </p>
          <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Social Media Posts</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Bible Study Guides</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Heart className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Daily Devotionals</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Languages className="w-4 h-4 text-primary flex-shrink-0" />
              <span>14 Languages</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? <Button asChild size="lg" className="text-lg px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-200">
                <Link to="/dashboard">Go to Dashboard →</Link>
              </Button> : <>
                <Button asChild size="lg" className="text-lg px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-200">
                  <Link to="/signup">Start Free 10 Day Trial</Link>
                </Button>
                <Button asChild size="lg" className="text-lg px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>}
          </div>
        </div>
      </div>

      {/* Social Proof Stats Bar */}
      <section className="bg-primary/5 py-8 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">Weekly</div>
              <div className="text-sm text-muted-foreground">Content Updates</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-border"></div>
            <div>
              <div className="text-3xl font-bold text-foreground">14 Languages</div>
              <div className="text-sm text-muted-foreground">Supported</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-border"></div>
            <div>
              <div className="text-3xl font-bold text-foreground">5+ Hours</div>
              <div className="text-sm text-muted-foreground">Saved Per Week</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Core Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-48 md:mt-56 max-w-7xl mx-auto">
          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Social Media Excellence</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Platform-optimised posts for Facebook, Instagram, TikTok, and Twitter with character limits and formatting guidance.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Bible Study Guides</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Comprehensive study materials with discussion questions, application points, and downloadable resources for small groups.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Daily Devotionals</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Short, inspirational content perfect for daily social media posts, newsletters, or spiritual reflection materials.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Languages className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Multi-Language Ministry</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Generate content in up to 14 languages including Spanish, French, Korean, Chinese, Arabic, and more.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Content Library</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Organise, search, and manage all your generated content with real-time editing and easy sharing capabilities.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Globe className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Website Integration</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Automatically analyse your church website to understand your mission, values, and communication style for better content.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Palette className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Your Church's Voice</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI learns your unique style, values, and communication preferences—never generic templates, always authentically you.
            </p>
          </div>

          <div className="text-center space-y-4 p-8 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-playfair font-semibold">Easy Upload</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Support for PDF, DOCX, and TXT files with intelligent text extraction—even works with announcement-only content.
            </p>
          </div>
        </div>

        {/* Content Types Showcase */}
        <div className="mt-48 md:mt-56 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold mb-4">Three Powerful Content Types</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From one sermon, create everything you need to engage your community throughout the week
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-center">Social Media Posts</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Facebook, Instagram, TikTok, and Twitter/X optimisation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Character limit guidance and platform-specific formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>1-3 variations per platform for scheduling flexibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Natural integration of your social media handles</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-center">Bible Study Guides</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive study materials from sermon content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Discussion questions and practical application points</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Formatted for easy printing and small group sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Downloadable as organised text files</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-playfair font-bold text-center">Daily Devotionals</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Short, inspirational content for regular sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Scripture-based reflections and practical application</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Perfect for daily posts, newsletters, or personal reflection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Maintain consistent spiritual engagement with your community</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Multi-Language Ministry Section */}
        <div className="mt-48 md:mt-56 max-w-6xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20">
            <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold mb-6 text-foreground">
              Reach Every Community in Their Own Language
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-4xl mx-auto">
              Break down language barriers and extend your ministry's reach with support for 14 languages. Generate up to 3 languages per session with real-time editing and cultural sensitivity built in.
            </p>
            
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto mb-8">
              <div className="flex gap-3 pb-4 min-w-max text-sm">
                {[
                  "English", "Spanish", "French", "Portuguese", "German", "Korean", "Chinese",
                  "Arabic", "Persian", "Polish", "Ukrainian", "Italian", "Russian", "Japanese"
                ].map((language) => (
                  <div key={language} className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg py-3 px-4 font-medium whitespace-nowrap">
                    {language}
                  </div>
                ))}
              </div>
            </div>

            {/* Tablet+: Grid */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8 text-sm">
              {[
                "English", "Spanish", "French", "Portuguese", "German", "Korean", "Chinese",
                "Arabic", "Persian", "Polish", "Ukrainian", "Italian", "Russian", "Japanese"
              ].map((language) => (
                <div key={language} className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg py-3 px-2 font-medium text-center">
                  {language}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-playfair font-semibold mb-2">Cultural Sensitivity</h4>
                <p className="text-muted-foreground text-sm">Content adapts to cultural nuances and linguistic preferences, not just direct translations</p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-playfair font-semibold mb-2">Real-Time Editing</h4>
                <p className="text-muted-foreground text-sm">Edit English content and instantly re-translate to your target languages with one click</p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-playfair font-semibold mb-2">Ministry Impact</h4>
                <p className="text-muted-foreground text-sm">Serve diverse congregations and expand your outreach to new communities authentically</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-48 md:mt-56 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Settings className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
              </div>
              <h3 className="text-xl font-playfair font-bold">Complete Church Setup</h3>
              <p className="text-muted-foreground text-sm">Enter your church profile, vision statement, service times, and social handles. Optionally share your website for automatic context analysis and style guide enhancement.</p>
            </div>

            <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Brain className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
              </div>
              <h3 className="text-xl font-playfair font-bold">AI Learning & Style Guide</h3>
              <p className="text-muted-foreground text-sm">
                Upload multiple sermons for analysis. Our AI creates a comprehensive style guide capturing your church's unique voice, theology, and communication patterns for authentic content generation.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Zap className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
              </div>
              <h3 className="text-xl font-playfair font-bold">Comprehensive Generation</h3>
              <p className="text-muted-foreground text-sm">
                Generate social media posts, Bible study guides, and devotionals in up to 3 languages simultaneously. Platform optimised with multiple variations and cultural adaptation.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative">
                <Database className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</span>
              </div>
              <h3 className="text-xl font-playfair font-bold">Manage & Deploy</h3>
              <p className="text-muted-foreground text-sm">
                Access your content library with search and organisation tools. Edit content with real-time markdown support, re-translate between languages, and download or copy for easy deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-48 md:mt-56 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold mb-4">Why Churches Choose Our Platform</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed specifically for church leaders, growing congregations, and efficient ministry management
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Ministry Leaders */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-playfair font-bold mb-2">For Ministry Leaders</h3>
                <p className="text-muted-foreground">Empower your leadership team with professional tools</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Save 5+ Hours Weekly</h4>
                    <p className="text-sm text-muted-foreground">Across all content creation: social media, study guides, and devotionals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">No Expertise Required</h4>
                    <p className="text-sm text-muted-foreground">AI handles content strategy, formatting, and optimisation. You focus on ministry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Consistent Quality</h4>
                    <p className="text-sm text-muted-foreground">Professional-quality materials that maintain your authentic voice and theological integrity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Church Growth */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-playfair font-bold mb-2">For Church Growth</h3>
                <p className="text-muted-foreground">Expand your reach and deepen community engagement</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Languages className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Multilingual Outreach</h4>
                    <p className="text-sm text-muted-foreground">Serve diverse communities in their native languages with culturally sensitive content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Platform Optimization</h4>
                    <p className="text-sm text-muted-foreground">Content tailored for each platform's best practices, character limits, and audience behaviour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Extended Impact</h4>
                    <p className="text-sm text-muted-foreground">Transform sermons into multiple content formats for sustained community engagement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Management */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-playfair font-bold mb-2">For Resource Management</h3>
                <p className="text-muted-foreground">Organise, manage, and maximize your content assets</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Comprehensive Library</h4>
                    <p className="text-sm text-muted-foreground">Search, organise, and access all your generated content with powerful management tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Easy Sharing</h4>
                    <p className="text-sm text-muted-foreground">Bulk download, copy-paste ready formats, and seamless integration with your workflow</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Message Integrity</h4>
                    <p className="text-sm text-muted-foreground">Real-time editing and re-translation while preserving your sermon's core message and theological accuracy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-48 md:mt-56 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-12 md:p-16 border border-primary/20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Professional ministry tools that fit your church budget
              </p>
            </div>
            <div className="bg-background rounded-xl shadow-xl p-8 md:p-12 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="text-5xl md:text-6xl font-bold mb-2">
                  £50<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">Unlimited content generation</p>
              </div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Social media posts for all platforms</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Bible study guides and devotionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Up to 14 languages per generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Content library and management tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Real time editing and re-translation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Download in multiple formats (TXT, DOCX, PDF, HTML)</span>
                </li>
              </ul>
              <Button asChild size="lg" className="w-full mb-4 text-lg px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-200">
                <Link to="/signup">Start Free 10 Day Trial</Link>
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-48 md:mt-56 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-4xl font-playfair font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our platform
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How long does content generation take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Typically 2 to 3 minutes. Upload your sermon, select your languages, and receive comprehensive content across all platforms almost instantly. Most churches complete the entire process during their Monday morning coffee.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I edit the generated content?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! You have full editing control with real time markdown support. Edit your English content and re-translate to all languages with one click. Every piece of content is customizable to match your exact needs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Is my sermon content kept private and secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Your content is stored securely and never shared with third parties. We use enterprise grade encryption and comply with UK data protection standards. Your sermons and church information remain completely confidential.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do I need technical skills or social media expertise?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Not at all. Our platform is designed for church leaders, not marketers. Simple 3 step process: upload your sermon, select languages, and download your content. If you can use email, you can use our platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What if the content doesn't match our theology or voice?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI learns your church's unique voice and theological perspective by analyzing your sermons and website. You can review and edit everything before publishing. The more sermons you upload, the better the AI understands your specific style and doctrine.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Which social media platforms do you support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Facebook, Instagram, TikTok, and Twitter/X. Content is optimized for each platform's character limits, formatting, and best practices. You'll receive multiple variations per platform for scheduling flexibility.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I try the platform before committing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Start with a free 10 day trial. Generate unlimited content and explore all features risk free. Experience the time savings firsthand before making any financial commitment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What happens after my trial ends?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Plans start at £50 per month with unlimited content generation. Cancel anytime, no long term contracts required. Continue enjoying the time savings and professional content, or cancel with no questions asked.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="mt-48 md:mt-56 border-t border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h3 className="text-lg font-semibold">IN FOCUS OPERATIONS LIMITED</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're an AI automation consultancy that bridges cutting-edge artificial intelligence 
                with practical business implementation, empowering businesses, churches and charities 
                to harness AI's potential with confidence, understanding, and clarity.
              </p>
              <p className="text-xs text-muted-foreground pt-4">
                © 2025 In Focus Operations Limited | Company No. 16707659 | Registered in England and Wales | Fully insured for professional indemnity
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                This product is currently in beta. Features and functionality may change as we continue to improve the service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;