import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Profile } from '../types';

type Session = import('@supabase/supabase-js').Session;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Si no hay perfil, creamos uno básico de RECRUITER por defecto
          setProfile({ id: userId, email: '', role: 'RECRUITER', assigned_zone: null });
        } else {
          console.error('Error fetching profile:', error);
        }
        return;
      }
      setProfile(data);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id); // No usamos await aquí para no bloquear
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    profile,
    loading,
    signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    signOut,
    updateUser: (data: object) => supabase.auth.updateUser({ data }),
  };
}
