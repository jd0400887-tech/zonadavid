import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { StaffingRequest } from '../types';

export const useStaffingRequests = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staffing_requests')
      .select('*, hotel:hotels(name)');

    if (error) {
      console.error('Error fetching staffing requests:', error);
    } else if (data) {
      const formattedData = data.map(req => ({
        ...req,
        hotelName: req.hotel?.name || 'N/A',
      }));
      setRequests(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('staffing_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staffing_requests' },
        (payload) => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const addRequest = async (request: Omit<StaffingRequest, 'id' | 'created_at' | 'hotelName'>) => {
    const { error } = await supabase
      .from('staffing_requests')
      .insert([request]);

    if (error) {
      console.error('Error adding staffing request:', error);
    }
  };

  const updateRequest = async (id: number, updates: Partial<Omit<StaffingRequest, 'hotelName'>>) => {
    const originalRequest = requests.find(r => r.id === id);

    // Log history if status changed before updating the request
    if (originalRequest && updates.status && originalRequest.status !== updates.status) {
      const historyEntry = {
        request_id: id,
        changed_by: session?.user?.email,
        change_description: `Estado cambiado de '${originalRequest.status}' a '${updates.status}'`,
      };
      await supabase.from('staffing_request_history').insert([historyEntry]);
    }

    const { error } = await supabase
      .from('staffing_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating staffing request:', error);
    }
  };

  const deleteRequest = async (id: number) => {
    const { error } = await supabase
      .from('staffing_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staffing request:', error);
    } else {
      setRequests(prev => prev.filter(req => req.id !== id));
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

  return { requests, loading, addRequest, updateRequest, deleteRequest, fetchHistory };
};