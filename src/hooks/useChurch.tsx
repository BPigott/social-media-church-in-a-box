import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Church, UserChurch } from "@/types/database";

/**
 * Hook to get user's church information
 */
export function useChurch(userId: string | undefined) {
  const [userChurches, setUserChurches] = useState<UserChurch[]>([]);
  const [primaryChurch, setPrimaryChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchChurches() {
      try {
        // Get user's churches using security definer function
        const { data: churchesData, error: churchesError } = await supabase
          .rpc('get_user_churches', { _user_id: userId });

        if (churchesError) throw churchesError;

        setUserChurches(churchesData || []);

        // If user has at least one church, fetch the primary one
        if (churchesData && churchesData.length > 0) {
          const { data: churchData, error: churchError } = await supabase
            .from('churches')
            .select('*')
            .eq('id', churchesData[0].church_id)
            .single();

          if (churchError) throw churchError;
          setPrimaryChurch(churchData as unknown as Church);
        }
      } catch (err) {
        console.error('Error fetching churches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch churches');
      } finally {
        setLoading(false);
      }
    }

    fetchChurches();
  }, [userId]);

  return {
    userChurches,
    primaryChurch,
    loading,
    error,
    hasChurch: userChurches.length > 0,
  };
}
