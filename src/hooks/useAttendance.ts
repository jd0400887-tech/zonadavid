import { useState, useEffect, useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../utils/supabase';
import type { AttendanceRecord } from '../types';
import { useHotels } from './useHotels';
import { useAuth } from './useAuth'; // Import useAuth

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function useAttendance(dateRange: DateRange, selectedHotelId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { hotels, loading: hotelsLoading } = useHotels();
  const { session } = useAuth(); // Get session from useAuth

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      const { data, error } = await supabase.from('attendance_records').select('*');
      if (error) {
        console.error('Error fetching attendance records:', error);
      } else {
        setAttendanceRecords(data as AttendanceRecord[]);
      }
    };

    fetchAttendanceRecords();
  }, []);

  const addRecord = async (hotelId: string) => {
    const userId = session?.user?.id;
    if (!userId) {
      console.error("User not authenticated. Cannot add attendance record.");
      return;
    }

    const newRecord: Partial<AttendanceRecord> = {
      id: `att-${Date.now()}`,
      hotelId: hotelId,
      employeeId: userId, // Use the actual user ID
      timestamp: new Date().getTime(),
    };
    const { data, error } = await supabase.from('attendance_records').insert([newRecord]).select();
    if (error) {
      console.error('Error adding attendance record:', error);
    } else if (data) {
      setAttendanceRecords(prev => [...prev, ...data as AttendanceRecord[]]);
    }
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      let inDateRange = true;
      if (dateRange.start) {
        inDateRange = recordDate >= startOfDay(dateRange.start);
      }
      if (dateRange.end) {
        inDateRange = inDateRange && recordDate <= endOfDay(dateRange.end);
      }

      const inHotel = selectedHotelId ? record.hotelId === selectedHotelId : true;

      return inDateRange && inHotel;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [attendanceRecords, dateRange, selectedHotelId]);

  const visitsByHotel = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredRecords.forEach(record => {
      counts[record.hotelId] = (counts[record.hotelId] || 0) + 1;
    });

    return Object.entries(counts).map(([hotelId, count]) => ({
      hotel: hotels.find(h => h.id === hotelId),
      count,
    })).filter(item => item.hotel).sort((a, b) => b.count - a.count);

  }, [filteredRecords, hotels]);

  const visitsByDay = useMemo(() => {
    const groups: { [key: string]: AttendanceRecord[] } = {};
    filteredRecords.forEach(record => {
      const day = new Date(record.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(record);
    });
    return groups;
  }, [filteredRecords]);


  return {
    allRecords: attendanceRecords,
    filteredRecords,
    visitsByHotel,
    visitsByDay,
    addRecord,
    hotels,
    hotelsLoading,
  };
}
