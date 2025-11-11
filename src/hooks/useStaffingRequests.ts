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
    const { data, error } = await supabase
      .from('staffing_requests')
      .select('id, created_at, role, start_date, end_date, hotel_id, status, request_type, notes, is_archived, completed_at, hotel:hotels(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staffing requests:', error);
      setAllRequests([]);
    } else if (data) {
      const formattedData = data.map(req => ({
        ...req,
        hotelName: req.hotel?.name || 'N/A',
      }));
      setAllRequests(formattedData);
    }
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

    // Initialize dbUpdates with the provided updates, excluding hotelName and hotel
    const { hotelName, hotel, ...dbUpdates } = updates as any;

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