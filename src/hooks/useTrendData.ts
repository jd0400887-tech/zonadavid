import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns';

export const useTrendData = () => {
  const [hotelTrend, setHotelTrend] = useState<number[]>([]);
  const [payrollTrend, setPayrollTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true);
      const today = new Date();
      const startDate = format(subDays(today, 48), 'yyyy-MM-dd'); // 7 weeks ago

      const { data, error } = await supabase
        .from('daily_stats')
        .select('date, pending_hotels, pending_payrolls')
        .gte('date', startDate);

      if (error) {
        console.error('Error fetching trend data:', error);
        setLoading(false);
        return;
      }

      const weeklyHotel: number[] = [];
      const weeklyPayroll: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });

        const weekData = data.filter(d => {
          const recordDate = new Date(d.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });

        if (weekData.length > 0) {
          const lastRecordOfWeek = weekData.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
          });
          weeklyHotel.push(lastRecordOfWeek.pending_hotels);
          weeklyPayroll.push(lastRecordOfWeek.pending_payrolls);
        } else {
          const lastKnownRecord = data.filter(d => new Date(d.date) < weekStart)
                                      .reduce((latest, current) => new Date(current.date) > new Date(latest.date) ? current : latest, null);
          weeklyHotel.push(lastKnownRecord ? lastKnownRecord.pending_hotels : 0);
          weeklyPayroll.push(lastKnownRecord ? lastKnownRecord.pending_payrolls : 0);
        }
      }

      setHotelTrend(weeklyHotel);
      setPayrollTrend(weeklyPayroll);
      setLoading(false);
    };

    fetchTrendData();
  }, []);

  return { hotelTrend, payrollTrend, loading };
};
