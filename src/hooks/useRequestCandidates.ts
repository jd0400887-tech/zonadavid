
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { RequestCandidate } from '../types';

export const useRequestCandidates = (requestId: number | null) => {
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    if (!requestId) {
      setCandidates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('request_candidates')
      .select(`
        *,
        existing_employee:employees (name)
      `)
      .eq('request_id', requestId);

    if (error) {
      console.error('Error fetching request candidates:', error);
      setCandidates([]);
    } else if (data) {
      const formattedData = data.map(rc => ({
        ...rc,
        existing_employee_name: rc.existing_employee?.name || null, // Add employee name if existing
      }));
      setCandidates(formattedData as RequestCandidate[]);
    }
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const addCandidate = async (newCandidate: Omit<RequestCandidate, 'id' | 'status'>) => {
    const { error } = await supabase
      .from('request_candidates')
      .insert([{ ...newCandidate, status: 'Asignado' }]);

    if (error) {
      console.error('Error adding candidate:', error);
      throw error;
    }
    await fetchCandidates();
  };

  const updateCandidateStatus = async (candidateId: number, newStatus: RequestCandidate['status']) => {
    const { data: updatedCandidate, error } = await supabase
      .from('request_candidates')
      .update({ status: newStatus })
      .eq('id', candidateId)
      .select(); // Select the updated row to get its data

    if (error) {
      console.error('Error updating candidate status:', error);
      throw error;
    }

    // If status changed to 'Llegó' for a new candidate, create a pending application
    if (newStatus === 'Llegó' && updatedCandidate && updatedCandidate[0].candidate_name) {
      const { error: applicationError } = await supabase
        .from('applications')
        .insert([{ request_candidate_id: updatedCandidate[0].id, status: 'pendiente' }]);

      if (applicationError) {
        console.error('Error creating pending application:', applicationError);
        // Decide if this should block the status update or just log
      }
    }

    await fetchCandidates();
  };

  const deleteCandidate = async (candidateId: number) => {
    const { error } = await supabase
      .from('request_candidates')
      .delete()
      .eq('id', candidateId);

    if (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
    await fetchCandidates();
  };

  return { candidates, loading, addCandidate, updateCandidateStatus, deleteCandidate };
};
