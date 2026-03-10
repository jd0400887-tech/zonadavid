import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { Employee } from '../types';

/**
 * HOOK OPTIMIZADO: 
 * Eliminamos la consulta fallida a la tabla 'employees' que causaba el error 406.
 * Ahora este hook simplemente retorna null de forma segura para no romper la App antigua.
 */
export function useUserProfile() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mantenemos la estructura para no romper componentes que lo usen,
  // pero ya no hacemos la consulta fallida a Supabase.
  return { profile: null, loading: false };
}