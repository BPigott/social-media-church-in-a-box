import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper function to check if user has a church with retry logic
  const checkUserChurch = async (userId: string, retries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`🔍 Login: Checking for user churches (attempt ${attempt}/${retries})...`);

      try {
        // Try using the RPC function first
        const { data: churchesData, error: rpcError } = await supabase
          .rpc('get_user_churches', { _user_id: userId });

        if (!rpcError && churchesData) {
          console.log('📊 Login: RPC found', churchesData.length, 'churches');
          return churchesData.length > 0;
        }

        // If RPC fails, fall back to direct query
        console.warn('⚠️ Login: RPC failed, trying direct query...', rpcError?.message);
        const { data: directData, error: directError } = await supabase
          .from('churches')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (!directError && directData) {
          console.log('📊 Login: Direct query found', directData.length, 'churches');
          return directData.length > 0;
        }

        console.error('❌ Login: Both RPC and direct query failed:', directError?.message);

        // If this isn't the last retry, wait before trying again
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // Exponential backoff: 1s, 2s, 3s
          console.log(`⏳ Login: Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error('❌ Login: Exception checking churches:', error);
        if (attempt === retries) {
          throw error;
        }
      }
    }

    // If all retries failed, return false (will redirect to onboarding, which is safer than dashboard)
    console.error('❌ Login: All retries exhausted, defaulting to hasChurch=false');
    return false;
  };

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

    // Check if user has a church profile with retry logic
    if (data?.user) {
      try {
        // Small delay to ensure auth state has propagated
        await new Promise(resolve => setTimeout(resolve, 100));

        const hasChurch = await checkUserChurch(data.user.id);

        if (hasChurch) {
          // User has a church, redirect to dashboard
          console.log('🚀 Login: User has church, redirecting to dashboard...');
          navigate("/dashboard", { replace: true });
        } else {
          // User doesn't have a church, redirect to onboarding
          console.log('🚀 Login: User has no church, redirecting to onboarding...');
          navigate("/onboarding", { replace: true });
        }
      } catch (error) {
        console.error('❌ Login: Critical error checking church status:', error);
        // On critical error, redirect to dashboard and let ProtectedRoute handle it
        console.log('🚀 Login: Defaulting to dashboard due to error...');
        toast({
          variant: "destructive",
          title: "Warning",
          description: "There was an issue loading your church data. Please refresh if you experience issues.",
        });
        navigate("/dashboard", { replace: true });
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
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo orientation="vertical" size={56} showTagline />
        </div>
      <Card className="w-full">
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
    </div>
  );
};

export default Login;
