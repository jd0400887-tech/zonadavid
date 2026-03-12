import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { Profile } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener perfil:', error.message);
        throw error;
      }

      if (!data) {
        // Si no existe el perfil, devolvemos uno temporal basado en la sesión
        console.info('Perfil no encontrado en BD para el usuario:', userId, '. Usando perfil temporal.');
        return { 
          id: userId, 
          email: email || '', 
          role: 'INSPECTOR', 
          assigned_zone: null,
          permissions: [] 
        } as Profile;
      }
      return data;
    } catch (err) {
      console.warn('Error recuperando perfil, usando fallback:', err);
      return { id: userId, email: email || '', role: 'INSPECTOR', assigned_zone: null, permissions: [] } as Profile;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Función única para actualizar todo el estado de una vez
    const updateAuthState = async (newSession: Session | null) => {
      if (!isMounted) return;
      
      setSession(newSession);
      if (newSession?.user) {
        const userProfile = await fetchProfile(newSession.user.id, newSession.user.email);
        if (isMounted) setProfile(userProfile);
      } else {
        if (isMounted) setProfile(null);
      }
      
      if (isMounted) setLoading(false);
    };

    // Inicialización
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Escuchador de cambios
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const signIn = (email: string, password: string) => 
    supabase.auth.signInWithPassword({ email, password });

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
