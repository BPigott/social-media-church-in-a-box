import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Single auth listener + getSession() for the whole app. Without this, every
// hook caller (ProtectedRoute, useSubscription, Sidebar…) mounts its own
// listener, races on initial load, and can briefly report user:null even
// while another instance already has the session — bouncing trial users
// through /upgrade on route changes.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
