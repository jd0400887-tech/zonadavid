import { useState, useEffect, useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../utils/supabase';
import type { AttendanceRecord } from '../types';
import { useHotels } from './useHotels';
import { useUserProfile } from './useUserProfile'; // Import useUserProfile

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function useAttendance(dateRange: DateRange, selectedHotelId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { hotels, loading: hotelsLoading } = useHotels();
  const { profile } = useUserProfile(); // Get user profile

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
    const employeeId = profile?.id;
    if (!employeeId) {
      console.error("User profile not loaded. Cannot add attendance record.");
      throw new Error("No se pudo identificar al usuario.");
    }

    // Check for existing record for the same day
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const { data: existingRecords, error: checkError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employeeId', employeeId)
      .eq('hotelId', hotelId)
      .gte('timestamp', todayStart.toISOString())
      .lte('timestamp', todayEnd.toISOString());

    if (checkError) {
      console.error('Error checking for existing attendance records:', checkError);
      throw new Error('Error al verificar los registros de asistencia.');
    }

    if (existingRecords && existingRecords.length > 0) {
      throw new Error('Ya marcaste ingreso hoy en este hotel');
    }

    // The DB requires a client-generated ID, so we create one.
    const uniqueId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newRecord: Partial<AttendanceRecord> = {
      id: uniqueId,
      hotelId: hotelId,
      employeeId: employeeId, // Use the correct employee profile ID
      timestamp: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('attendance_records').insert([newRecord]).select();
    if (error) {
      console.error('Error adding attendance record:', error);
      throw new Error('No se pudo registrar la asistencia.');
    } else if (data) {
      setAttendanceRecords(prev => [...prev, ...data as AttendanceRecord[]]);
    }
  };

  const filteredRecords = useMemo(() => {
    try {
      return attendanceRecords.filter(record => {
        if (!record.timestamp) return false; // Guard against null/undefined timestamps
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
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error("Error in filteredRecords memo:", error);
      return [];
    }
  }, [attendanceRecords, dateRange, selectedHotelId]);

  const visitsByHotel = useMemo(() => {
    try {
      const counts: { [key: string]: number } = {};
      filteredRecords.forEach(record => {
        counts[record.hotelId] = (counts[record.hotelId] || 0) + 1;
      });

      return Object.entries(counts).map(([hotelId, count]) => ({
        hotel: hotels.find(h => h.id === hotelId),
        count,
      })).filter(item => item.hotel).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error in visitsByHotel memo:", error);
      return [];
    }
  }, [filteredRecords, hotels]);

  const visitsByDay = useMemo(() => {
    try {
      const groups: { [key: string]: AttendanceRecord[] } = {};
      filteredRecords.forEach(record => {
        const day = new Date(record.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[day]) {
          groups[day] = [];
        }
        groups[day].push(record);
      });
      return groups;
    } catch (error) {
      console.error("Error in visitsByDay memo:", error);
      return {};
    }
  }, [filteredRecords]);


  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('attendance_records').delete().eq('id', id);
    if (error) {
      console.error('Error deleting attendance record:', error);
    } else {
      setAttendanceRecords(prev => prev.filter(record => record.id !== id));
    }
  };

  return {
    allRecords: attendanceRecords,
    filteredRecords,
    visitsByHotel,
    visitsByDay,
    addRecord,
    deleteRecord,
    hotels,
    hotelsLoading,
  };
}
