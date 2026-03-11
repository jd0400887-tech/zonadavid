import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  
  return {
    session: context.session,
    profile: context.profile,
    loading: context.loading,
    signIn: context.signIn,
    signOut: context.signOut,
    updateUser: (data: object) => import('../utils/supabase').then(s => s.supabase.auth.updateUser({ data })),
  };
}
