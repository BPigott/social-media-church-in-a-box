import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeSlash } from "phosphor-react";
import { passwordResetSchema, getPasswordStrength, passwordRequirements } from "@/lib/passwordValidation";
import type { z } from "zod";

type ResetPasswordFormData = z.infer<typeof passwordResetSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({});

  useEffect(() => {
    // Check if this is a password recovery session
    const checkRecoverySession = async () => {
      try {
        console.log('🔍 ResetPassword: Checking for recovery session...');

        // Check URL hash for recovery token (format: #access_token=...&type=recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenType = hashParams.get('type');
        const hasRecoveryToken = tokenType === 'recovery';

        console.log('📋 ResetPassword: URL hash type:', tokenType);
        console.log('🔑 ResetPassword: Has recovery token:', hasRecoveryToken);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        // Only accept as recovery session if:
        // 1. There's a session AND
        // 2. The URL has type=recovery in the hash
        if (session?.user && hasRecoveryToken) {
          console.log('✅ ResetPassword: Valid recovery session detected');
          setHasRecoverySession(true);
        } else {
          console.log('❌ ResetPassword: No valid recovery session (session:', !!session?.user, ', recovery token:', hasRecoveryToken, ')');
          setHasRecoverySession(false);
        }
      } catch (error) {
        console.error("❌ ResetPassword: Error checking session:", error);
        setHasRecoverySession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    // Initial check
    checkRecoverySession();

    // Listen for auth state changes (in case session is set up asynchronously from email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 ResetPassword: Auth state changed:', event);

      // Only accept PASSWORD_RECOVERY events, not regular logins
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ ResetPassword: PASSWORD_RECOVERY event received');
        setHasRecoverySession(true);
        setCheckingSession(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 ResetPassword: User signed out');
        setHasRecoverySession(false);
      }
      // Ignore other auth events (SIGNED_IN, TOKEN_REFRESHED, etc.)
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = passwordResetSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ResetPasswordFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(formData.password);

      if (error) {
        if (error.message.includes("session") || error.message.includes("recovery")) {
          toast({
            variant: "destructive",
            title: "Link expired",
            description: "This password reset link has expired. Please request a new one.",
          });
          navigate("/forgot-password");
          return;
        }
        throw error;
      }

      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully.",
      });

      // Instead of signing out, navigate to settings where user can manage their account
      // This provides a better UX - user is already authenticated after password reset
      navigate("/settings?tab=account", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error resetting password",
        description: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Checking reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-playfair text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please request a new password reset link from the login page.
            </p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full"
            >
              Request New Reset Link
            </Button>
            <div className="mt-4 text-center text-sm">
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
              >
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-playfair text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-destructive" : ""}
                  placeholder="Enter your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.strength === 100 ? "text-green-600" : 
                      passwordStrength.strength >= 70 ? "text-yellow-600" : 
                      "text-destructive"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p className="font-medium">Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {passwordRequirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                  placeholder="Confirm your new password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

