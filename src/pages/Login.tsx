import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔐 Login: Starting sign in process...');

    const { data, error } = await signIn(email, password);

    if (error) {
      console.error('❌ Login: Sign in failed:', error.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    console.log('✅ Login: Sign in successful, user ID:', data?.user?.id);

    toast({
      title: "Welcome back!",
      description: "You've been successfully logged in.",
    });

    // Check if user has a church profile
    if (data?.user) {
      console.log('🔍 Login: Checking for user churches...');
      
      const { data: churchesData, error: churchError } = await supabase
        .rpc('get_user_churches', { _user_id: data.user.id });

      if (churchError) {
        console.error('❌ Login: Error fetching churches:', churchError);
      }

      console.log('📊 Login: Found', churchesData?.length || 0, 'churches');

      // Small delay to ensure auth state has propagated
      await new Promise(resolve => setTimeout(resolve, 100));

      if (churchesData && churchesData.length > 0) {
        // User has a church, redirect to dashboard
        console.log('🚀 Login: Redirecting to dashboard with replace...');
        navigate("/dashboard", { replace: true });
      } else {
        // User doesn't have a church, redirect to onboarding
        console.log('🚀 Login: Redirecting to onboarding with replace...');
        navigate("/onboarding", { replace: true });
      }
    } else {
      // Fallback to dashboard if user data is missing
      console.log('⚠️ Login: No user data, redirecting to dashboard...');
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-playfair text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your church account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="pastor@church.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
