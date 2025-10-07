import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { Employee } from '../types';

export function useUserProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', session.user.id) // Assumes a 'user_id' column in your 'employees' table
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        } else {
          setProfile(data as Employee);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session]);

  return { profile, loading };
}
