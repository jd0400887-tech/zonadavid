import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export interface PayrollReview {
  id: string;
  employee_id: string;
  review_date: string;
  overtime_hours: number | null;
}

export function usePayrollHistory(from: Date, to: Date) {
  const [history, setHistory] = useState<PayrollReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_review_history')
        .select('*')
        .gte('review_date', from.toISOString())
        .lte('review_date', to.toISOString());

      if (error) {
        console.error('Error fetching payroll history:', error);
        setHistory([]);
      } else {
        setHistory(data as PayrollReview[]);
      }
      setLoading(false);
    };

    if (from && to) {
      fetchHistory();
    }
  }, [from, to]);

  return { history, loading };
}
