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
          (async () => {
            try {
              await supabase.functions.invoke('create-trial');

              // Atomic: update only if all conditions are met
              const { data: claimed, error: claimErr } = await supabase
                .from('subscriptions')
                .update({ trial_reminder_sent_at: new Date().toISOString() })
                .eq('user_id', session.user.id)
                .eq('status', 'trialing')
                .is('trial_reminder_sent_at', null)
                .lte('trial_ends_at', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
                .not('trial_ends_at', 'is', null)
                .select('id');
              if (claimErr) throw claimErr;

              // Only send email if this request won the race (update modified a row)
              if (claimed && claimed.length > 0) {
                await supabase.functions.invoke('send-email', {
                  body: { type: 'trial_expiring', user_ids: [session.user.id] },
                });
              }
            } catch (err) {
              console.error('Sign-in setup failed:', err);
            }
          })();
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
