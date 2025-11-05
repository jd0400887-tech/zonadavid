
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export interface Application {
  id: number;
  created_at: string;
  request_candidate_id: number;
  status: 'pendiente' | 'completada' | 'empleado_creado';
  completed_at: string | null;
  // Joined data from staffing_requests
  candidate_name: string;
  hotel_id: string;
  role: string;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        request_candidate:request_candidates (
          candidate_name,
          request:staffing_requests (
            hotel_id,
            role
          )
        )
      `);

    if (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } else if (data) {
      const formattedData = data.map(app => ({
        ...app,
        candidate_name: app.request_candidate?.candidate_name || 'N/A',
        hotel_id: app.request_candidate?.request?.hotel_id || 'N/A',
        role: app.request_candidate?.request?.role || 'N/A',
      }));
      setApplications(formattedData as Application[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplicationStatus = async (id: number, status: 'pendiente' | 'completada') => {
    const updates: { status: string, completed_at?: string } = { status };
    if (status === 'completada') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
    await fetchApplications();
  };

  return { applications, loading, updateApplicationStatus };
};
