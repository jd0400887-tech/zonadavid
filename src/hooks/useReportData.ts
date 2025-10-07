import { useMemo } from 'react';
import { useEmployees } from './useEmployees';
import { useHotels } from './useHotels';
import { useAttendance } from './useAttendance';
import { differenceInDays, subDays } from 'date-fns';

// A function to calculate stats for a given period
const calculatePeriodStats = (
  allRecords: any[], 
  allEmployees: any[], 
  allHotels: any[], 
  start: Date, 
  end: Date
) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Filter records for the given period
  const periodRecords = allRecords.filter(r => r.timestamp >= startTime && r.timestamp <= endTime);
  
  // --- Basic Stats ---
  const visits = periodRecords.length;
  const newEmployees = allEmployees.filter(e => {
    const idTimestamp = parseInt(e.id.split('-')[1]);
    return !isNaN(idTimestamp) && idTimestamp >= startTime && idTimestamp <= endTime;
  }).length;

  // --- Grouping and Ranking ---
  const hotelCityMap = new Map(allHotels.map(h => [h.id, h.city]));

  const visitsByHotel = periodRecords.reduce((acc, record) => {
    acc[record.hotelId] = (acc[record.hotelId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hotelRanking = allHotels.map(hotel => ({
    id: hotel.id,
    name: hotel.name,
    visits: visitsByHotel[hotel.id] || 0,
  })).sort((a, b) => b.visits - a.visits);

  const visitsByCity = periodRecords.reduce((acc, record) => {
    const city = hotelCityMap.get(record.hotelId) || 'Sin Ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    visits,
    newEmployees,
    hotelRanking,
    visitsByCity: Object.entries(visitsByCity).map(([name, value]) => ({ name, value })),
  };
};


export const useReportData = (startDate: string | null, endDate: string | null) => {
  const { employees, loading: employeesLoading } = useEmployees();
  const { hotels, loading: hotelsLoading } = useHotels();
  // Fetch all records to be filtered locally
  const { allRecords, loading: attendanceLoading } = useAttendance({ start: null, end: null });

  const loading = employeesLoading || hotelsLoading || attendanceLoading;

  const reportData = useMemo(() => {
    if (loading || !startDate || !endDate) {
      return { currentPeriod: null, previousPeriod: null, activeEmployees: 0, blacklistedEmployees: 0, totalHotels: 0 };
    }

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    
    // Calculate previous period
    const periodDuration = differenceInDays(currentEnd, currentStart);
    const previousStart = subDays(currentStart, periodDuration + 1);
    const previousEnd = subDays(currentEnd, periodDuration + 1);

    const currentPeriodStats = calculatePeriodStats(allRecords, employees, hotels, currentStart, currentEnd);
    const previousPeriodStats = calculatePeriodStats(allRecords, employees, hotels, previousStart, previousEnd);

    // We can also add overall stats that are not period-dependent
    const activeEmployees = employees.filter(e => e.isActive).length;
    const blacklistedEmployees = employees.filter(e => e.isBlacklisted).length;
    const totalHotels = hotels.length;

    return {
      currentPeriod: currentPeriodStats,
      previousPeriod: previousPeriodStats,
      activeEmployees,
      blacklistedEmployees,
      totalHotels,
    };

  }, [loading, startDate, endDate, employees, hotels, allRecords]);

  return {
    data: reportData,
    loading,
  };
};
