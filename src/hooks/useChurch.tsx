import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Church, UserChurch } from "@/types/database";

// In-memory cache for church data (survives component re-renders but not page refreshes)
const churchCache = new Map<string, { userChurches: UserChurch[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clears the church cache for a specific user (or all users if no userId provided)
 * Call this after creating/updating church data to force a refresh
 */
export function clearChurchCache(userId?: string) {
  if (userId) {
    churchCache.delete(userId);
    console.log('🗑️ Cleared church cache for user:', userId);
  } else {
    churchCache.clear();
    console.log('🗑️ Cleared all church cache');
  }
}

/**
 * Hook to get user's church information with retry logic and caching
 */
export function useChurch(userId: string | undefined) {
  const [userChurches, setUserChurches] = useState<UserChurch[]>([]);
  const [primaryChurch, setPrimaryChurch] = useState<Church | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | undefined>(undefined);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Effective loading: true if we're fetching OR if userId changed but we haven't fetched yet
  const loading = fetchLoading || (!!userId && lastFetchedUserId !== userId);

  useEffect(() => {
    if (!userId) {
      console.log('⏸️ useChurch [' + new Date().toISOString() + ']: No userId, resetting state');
      setUserChurches([]);
      setPrimaryChurch(null);
      setError(null);
      setFetchLoading(false);
      setLastFetchedUserId(undefined);
      retryCount.current = 0;
      return;
    }

    // Check cache first
    const cached = churchCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('💾 useChurch [' + new Date().toISOString() + ']: Using cached data for user:', userId);
      setUserChurches(cached.userChurches);
      setFetchLoading(false);
      setLastFetchedUserId(userId);
      setError(null);

      // Still fetch primary church if needed
      if (cached.userChurches.length > 0) {
        fetchPrimaryChurch(cached.userChurches[0].church_id);
      }
      return;
    }

    async function fetchPrimaryChurch(churchId: string) {
      try {
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .select('*')
          .eq('id', churchId)
          .maybeSingle();

        if (churchError) throw churchError;

        if (churchData) {
          console.log('✅ useChurch [' + new Date().toISOString() + ']: Primary church loaded:', churchData.name);
          setPrimaryChurch(churchData as unknown as Church);
        } else {
          console.log('⚠️ useChurch [' + new Date().toISOString() + ']: Church ID found but church data is null');
          setPrimaryChurch(null);
        }
      } catch (err) {
        console.error('❌ useChurch [' + new Date().toISOString() + ']: Error fetching primary church:', err);
      }
    }

    async function fetchChurches(attempt: number = 1) {
      try {
        console.log(`🔄 useChurch [${new Date().toISOString()}]: Starting fetch for user: ${userId} (attempt ${attempt}/${maxRetries})`);

        // CRITICAL: Set loading to true at the start of fetch
        setFetchLoading(true);
        setError(null);

        // Get user's churches using security definer function
        const { data: churchesData, error: churchesError } = await supabase
          .rpc('get_user_churches', { _user_id: userId });

        if (churchesError) {
          // If RPC fails, try direct query as fallback
          console.warn('⚠️ useChurch: RPC failed, trying direct query...', churchesError.message);
          const { data: directData, error: directError } = await supabase
            .from('churches')
            .select(`
              id,
              user_id,
              name
            `)
            .eq('user_id', userId);

          if (directError) throw directError;

          // Transform direct query result to match UserChurch format
          const transformedData = directData?.map(church => ({
            church_id: church.id,
            user_id: church.user_id,
            church_name: church.name
          })) || [];

          console.log('📊 useChurch [' + new Date().toISOString() + ']: Direct query found', transformedData.length, 'churches');
          setUserChurches(transformedData);

          // Cache the result
          churchCache.set(userId, { userChurches: transformedData, timestamp: Date.now() });

          // Fetch primary church details
          if (transformedData.length > 0) {
            await fetchPrimaryChurch(transformedData[0].church_id);
          }
        } else {
          console.log('📊 useChurch [' + new Date().toISOString() + ']: Found', churchesData?.length || 0, 'churches');
          setUserChurches(churchesData || []);

          // Cache the result
          churchCache.set(userId, { userChurches: churchesData || [], timestamp: Date.now() });

          // If user has at least one church, fetch the primary one
          if (churchesData && churchesData.length > 0) {
            await fetchPrimaryChurch(churchesData[0].church_id);
          } else {
            console.log('ℹ️ useChurch [' + new Date().toISOString() + ']: No churches found for user');
            setPrimaryChurch(null);
          }
        }

        // Reset retry count on success
        retryCount.current = 0;
      } catch (err) {
        console.error(`❌ useChurch [${new Date().toISOString()}]: Error fetching churches (attempt ${attempt}):`, err);

        const errorObj = err instanceof Error ? err : new Error('Failed to fetch churches');

        // Retry logic with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          console.log(`⏳ useChurch: Retrying in ${delay}ms...`);

          setTimeout(() => {
            retryCount.current = attempt;
            fetchChurches(attempt + 1);
          }, delay);
        } else {
          console.error('❌ useChurch: All retries exhausted');
          setError(errorObj);
          setFetchLoading(false);
          setLastFetchedUserId(userId);
        }
        return;
      } finally {
        if (attempt === maxRetries || retryCount.current === 0) {
          console.log('🏁 useChurch [' + new Date().toISOString() + ']: Fetch complete, setting loading to false');
          setFetchLoading(false);
          setLastFetchedUserId(userId);
        }
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
