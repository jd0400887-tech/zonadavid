import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { StaffingRequest } from '../types';

export const useStaffingRequests = () => {
  const { session } = useAuth();
  const [allRequests, setAllRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    // Step 1: Fetch all staffing requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('staffing_requests')
      .select('id, created_at, role, start_date, end_date, hotel_id, status, request_type, notes, is_archived, completed_at, num_of_people, hotel:hotels(name)')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching staffing requests:', requestsError);
      setAllRequests([]);
      setLoading(false);
      return;
    }

    if (!requestsData) {
      setAllRequests([]);
      setLoading(false);
      return;
    }

    const requestIds = requestsData.map(r => r.id);

    // Step 2: Fetch all candidates for the retrieved requests
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('request_candidates')
      .select('request_id')
      .in('request_id', requestIds);

    if (candidatesError) {
      console.error('Error fetching candidates for count:', candidatesError);
      // Continue without candidate count if this fails
    }

    // Step 3: Create a count map
    const candidateCounts = candidatesData?.reduce((acc, curr) => {
      acc[curr.request_id] = (acc[curr.request_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Step 4: Combine data
    const formattedData = requestsData.map(req => ({
      ...req,
      hotelName: req.hotel?.name || 'N/A',
      candidate_count: candidateCounts?.[req.id] || 0, // Add the count
    }));
    
    setAllRequests(formattedData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const activeRequests = useMemo(() => allRequests.filter(r => !r.is_archived), [allRequests]);
  const archivedRequests = useMemo(() => allRequests.filter(r => r.is_archived), [allRequests]);

  const addRequest = async (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName' | 'is_archived'>) => {
    const { error } = await supabase
      .from('staffing_requests')
      .insert([{ ...request, is_archived: false }]);

    if (error) {
      console.error('Error adding staffing request:', error);
      throw error;
    }
    await fetchRequests();
  };

  const updateRequest = async (id: number, updates: Partial<Omit<StaffingRequest, 'hotelName'>>) => {
    const originalRequest = allRequests.find(r => r.id === id);

    // Initialize dbUpdates with the provided updates, excluding fields that don't exist in the table
    const { hotelName, hotel, candidate_count, ...dbUpdates } = updates as any;

    // Check for status change and update history and completed_at timestamp
    if (originalRequest && updates.status && originalRequest.status !== updates.status) {
      // Log the status change history
      const historyEntry = {
        request_id: id,
        changed_by: session?.user?.email,
        change_description: `Estado cambiado de '${originalRequest.status}' a '${updates.status}'`,
      };
      await supabase.from('staffing_request_history').insert([historyEntry]);

      // If the new status marks the request as completed, set the completed_at timestamp
      if (['Completada', 'Completada Parcialmente'].includes(updates.status)) {
        dbUpdates.completed_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('staffing_requests')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating staffing request:', error);
      throw error;
    }
    await fetchRequests();
  };

  const deleteRequest = async (id: number) => {
    const { error } = await supabase
      .from('staffing_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staffing request:', error);
      throw error;
    }
    await fetchRequests();
  };

  const archiveRequest = async (id: number) => {
    setAllRequests(prev => prev.map(r => r.id === id ? { ...r, is_archived: true } : r));
    const { error } = await supabase
      .from('staffing_requests')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving staffing request:', error);
      await fetchRequests(); // Revert optimistic update on error
      throw error;
    }
  };

  const unarchiveRequest = async (id: number) => {
    setAllRequests(prev => prev.map(r => r.id === id ? { ...r, is_archived: false } : r));
    const { error } = await supabase
      .from('staffing_requests')
      .update({ is_archived: false })
      .eq('id', id);

    if (error) {
      console.error('Error unarchiving staffing request:', error);
      await fetchRequests(); // Revert optimistic update on error
      throw error;
    }
  };

  const fetchHistory = useCallback(async (requestId: number) => {
    const { data, error } = await supabase
      .from('staffing_request_history')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching request history:', error);
      return [];
    }
    return data || [];
  }, []);

  return { 
    allRequests, 
    activeRequests, 
    archivedRequests, 
    loading, 
    addRequest, 
    updateRequest, 
    deleteRequest, 
    archiveRequest, 
    unarchiveRequest, 
    fetchHistory 
  };
};