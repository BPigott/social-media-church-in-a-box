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
      console.log('⏸️ useChurch [' + new Date().toISOString() + ']: No userId, resetting state');
      setUserChurches([]);
      setPrimaryChurch(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function fetchChurches() {
      try {
        console.log('🔄 useChurch [' + new Date().toISOString() + ']: Starting fetch for user:', userId);
        
        // CRITICAL: Set loading to true at the start of fetch
        setLoading(true);
        setError(null);

        // Get user's churches using security definer function
        const { data: churchesData, error: churchesError } = await supabase
          .rpc('get_user_churches', { _user_id: userId });

        if (churchesError) throw churchesError;

        console.log('📊 useChurch [' + new Date().toISOString() + ']: Found', churchesData?.length || 0, 'churches');
        setUserChurches(churchesData || []);

        // If user has at least one church, fetch the primary one
        if (churchesData && churchesData.length > 0) {
          const { data: churchData, error: churchError } = await supabase
            .from('churches')
            .select('*')
            .eq('id', churchesData[0].church_id)
            .maybeSingle();

          if (churchError) throw churchError;
          
          if (churchData) {
            console.log('✅ useChurch [' + new Date().toISOString() + ']: Primary church loaded:', churchData.name);
            setPrimaryChurch(churchData as unknown as Church);
          } else {
            console.log('⚠️ useChurch [' + new Date().toISOString() + ']: Church ID found but church data is null');
            setPrimaryChurch(null);
          }
        } else {
          console.log('ℹ️ useChurch [' + new Date().toISOString() + ']: No churches found for user');
          setPrimaryChurch(null);
        }
      } catch (err) {
        console.error('❌ useChurch [' + new Date().toISOString() + ']: Error fetching churches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch churches');
      } finally {
        console.log('🏁 useChurch [' + new Date().toISOString() + ']: Fetch complete, setting loading to false');
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
