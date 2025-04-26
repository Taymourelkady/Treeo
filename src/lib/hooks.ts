import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { mockdata } from './mockdata';
import type { Profile, AccessLevel } from './types';

export function useMockData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = async <T = any>(sql: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockdata.query<T>(sql);
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { executeQuery, loading, error };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            access_levels (
              name,
              description
            )
          `)
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      }
      
      setLoading(false);
    }

    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
}

export function useAccessLevels() {
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAccessLevels() {
      const { data, error } = await supabase
        .from('access_levels')
        .select('*')
        .order('name');

      if (!error && data) {
        setAccessLevels(data);
      }
      
      setLoading(false);
    }

    getAccessLevels();
  }, []);

  return { accessLevels, loading };
}