import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to manage authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only clear user on explicit sign-out. Transient null sessions
        // during TOKEN_REFRESHED on tab focus should not unmount the app.
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
        }
        setLoading(false);

        // On first sign-in, ensure a trial subscription exists
        if (event === 'SIGNED_IN' && session) {
          supabase.functions.invoke('create-trial').catch(console.error);

          // Check trial expiry: if trial ends within 3 days and no reminder sent, send email
          setTimeout(async () => {
            try {
              const { data: sub } = await supabase
                .from('subscriptions')
                .select('status, trial_ends_at, trial_reminder_sent_at')
                .eq('user_id', session.user.id)
                .single();

              if (
                sub?.status === 'trialing' &&
                sub.trial_ends_at &&
                sub.trial_reminder_sent_at === null &&
                new Date(sub.trial_ends_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              ) {
                await supabase.functions.invoke('send-email', {
                  body: { type: 'trial_expiring', user_ids: [session.user.id] },
                });
                await supabase
                  .from('subscriptions')
                  .update({ trial_reminder_sent_at: new Date().toISOString() })
                  .eq('user_id', session.user.id);
              }
            } catch (err) {
              console.error('Trial expiry check failed:', err);
            }
          }, 2000); // short delay to let create-trial complete first
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
  };
}
