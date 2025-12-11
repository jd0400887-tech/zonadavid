
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

  const updateApplicationStatus = async (id: number, status: 'pendiente' | 'completada' | 'empleado_creado') => {
    const updates: { status: string, completed_at?: string } = { status };
    if (status === 'completada' || status === 'empleado_creado') {
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
    // No need to fetch again, just update the local state for speed
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status, completed_at: updates.completed_at || app.completed_at } : app));
  };

  const deleteApplication = async (id: number) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  const addApplication = async (applicationData: { candidate_name: string; hotel_id: string; role: string }) => {
    // Since we are creating a "simple" application, we create a corresponding staffing_request
    // with sensible defaults for fields not present in the form.
    const { data: requestData, error: requestError } = await supabase
      .from('staffing_requests')
      .insert({
        hotel_id: applicationData.hotel_id,
        role: applicationData.role,
        status: 'Pendiente', // Corrected default status
        request_type: 'temporal', // Corrected default request_type
        num_of_people: 1,
        start_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating staffing request:', requestError);
      throw requestError;
    }

    const { data: candidateData, error: candidateError } = await supabase
      .from('request_candidates')
      .insert({
        request_id: requestData.id,
        candidate_name: applicationData.candidate_name,
      })
      .select()
      .single();

    if (candidateError) {
      console.error('Error creating request candidate:', candidateError);
      // Attempt to clean up the created staffing_request
      await supabase.from('staffing_requests').delete().eq('id', requestData.id);
      throw candidateError;
    }

    const { error: applicationError } = await supabase
      .from('applications')
      .insert({
        request_candidate_id: candidateData.id,
        status: 'pendiente',
      });

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      // Attempt to clean up created records
      await supabase.from('request_candidates').delete().eq('id', candidateData.id);
      await supabase.from('staffing_requests').delete().eq('id', requestData.id);
      throw applicationError;
    }

    await fetchApplications(); // Refresh the list
  };

  return { applications, loading, fetchApplications, updateApplicationStatus, deleteApplication, addApplication };
};
